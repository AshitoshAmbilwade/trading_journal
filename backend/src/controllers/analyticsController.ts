import type { Request, Response } from "express";
import { Types } from "mongoose";
import { TradeModel } from "../models/Trade.js";

/**
 * Analytics controller (keeps aggregations) + added getTrades endpoint
 */

// safe parse ISO-ish dates
const parseDate = (v?: string) => {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

/**
 * Build match object from request for general filters.
 * dateField: which date field to use for the from/to filter (default: tradeDate)
 */
function buildMatch(req: Request, dateField = "tradeDate") {
  const userId = (req as any).user?._id || (req as any).user?.id;
  const q = (req.query as any) || {};
  const match: any = {};
  if (userId) match.userId = new Types.ObjectId(userId);

  const fromDate = parseDate(q.from);
  const toDate = parseDate(q.to);
  if (fromDate || toDate) {
    match[dateField] = {};
    if (fromDate) match[dateField].$gte = fromDate;
    if (toDate) match[dateField].$lte = toDate;
  }

  if (q.segment) match.segment = String(q.segment);
  if (q.tradeType) match.tradeType = String(q.tradeType);
  if (q.strategy) match.strategy = String(q.strategy);
  if (q.symbol) match.symbol = { $regex: new RegExp(String(q.symbol), "i") };
  if (q.direction) match.direction = String(q.direction);
  if (q.session) match.session = String(q.session);
  if (q.broker) match.broker = { $regex: new RegExp(String(q.broker), "i") };

  return match;
}

// -------------------- NEW: GET RAW TRADES --------------------
export const getTrades = async (req: Request, res: Response) => {
  try {
    const match = buildMatch(req, "entryDate");
    const q = (req.query as any) || {};
    const limit = q.limit ? Math.max(1, Math.min(1000, Number(q.limit))) : undefined;
    const skip = q.skip ? Math.max(0, Number(q.skip)) : undefined;

    const query = TradeModel.find(match).sort({ entryDate: 1 });
    if (typeof skip === "number") query.skip(skip);
    if (typeof limit === "number") query.limit(limit);

    const trades = await query.lean().exec();
    return res.json(trades);
  } catch (err) {
    console.error("[Analytics] getTrades error:", err);
    return res.status(500).json({ message: "Error fetching trades", error: err });
  }
};

// -------------------- 1) SUMMARY --------------------
export const getSummary = async (req: Request, res: Response) => {
  try {
    const match = buildMatch(req);

    const pipeline: any[] = [
      { $match: match },
      {
        $group: {
          _id: null,
          totalTrades: { $sum: 1 },
          totalPnl: { $sum: "$pnl" },
          avgPnl: { $avg: "$pnl" },
          winCount: { $sum: { $cond: [{ $gt: ["$pnl", 0] }, 1, 0] } },
          lossCount: { $sum: { $cond: [{ $lt: ["$pnl", 0] }, 1, 0] } },
          largestWin: { $max: "$pnl" },
          largestLoss: { $min: "$pnl" },
        },
      },
      {
        $project: {
          _id: 0,
          totalTrades: 1,
          totalPnl: { $round: ["$totalPnl", 2] },
          avgPnl: { $round: ["$avgPnl", 2] },
          largestWin: { $round: ["$largestWin", 2] },
          largestLoss: { $round: ["$largestLoss", 2] },
          winRate: {
            $cond: [
              { $eq: ["$totalTrades", 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ["$winCount", "$totalTrades"] }, 100] }, 2] },
            ],
          },
        },
      },
    ];

    const [stats] = await TradeModel.aggregate(pipeline);
    res.json(
      stats || {
        totalTrades: 0,
        totalPnl: 0,
        avgPnl: 0,
        largestWin: 0,
        largestLoss: 0,
        winRate: 0,
      }
    );
  } catch (err) {
    console.error("[Analytics] getSummary error:", err);
    res.status(500).json({ message: "Error computing summary", error: err });
  }
};

// -------------------- 2) TIME SERIES --------------------
export const getTimeSeries = async (req: Request, res: Response) => {
  try {
    const match = buildMatch(req);
    const { interval = "daily" } = req.query as any;

    const format =
      interval === "monthly"
        ? "%Y-%m"
        : interval === "weekly"
        ? "%Y-%U"
        : "%Y-%m-%d";

    const pipeline: any[] = [
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format, date: "$tradeDate" } },
          totalTrades: { $sum: 1 },
          totalPnl: { $sum: "$pnl" },
          avgPnl: { $avg: "$pnl" },
        },
      },
      {
        $project: {
          _id: 0,
          period: "$_id",
          totalTrades: 1,
          totalPnl: { $round: ["$totalPnl", 2] },
          avgPnl: { $round: ["$avgPnl", 2] },
        },
      },
      { $sort: { period: 1 } },
    ];

    const result = await TradeModel.aggregate(pipeline);
    res.json(result);
  } catch (err) {
    console.error("[Analytics] getTimeSeries error:", err);
    res.status(500).json({ message: "Error computing time series", error: err });
  }
};

// -------------------- 3) DISTRIBUTION --------------------
export const getDistribution = async (req: Request, res: Response) => {
  try {
    const match = buildMatch(req);
    const { by = "segment" } = req.query as any;

    const allowed = ["segment", "tradeType", "strategy", "type", "session"];
    if (!allowed.includes(by)) {
      return res.status(400).json({ message: "Invalid 'by' parameter" });
    }

    // Predefined tradeType buckets for consistent ordering
    const TRADE_TYPES = ["intraday", "positional", "investment", "swing", "scalping"];

    const pipeline: any[] = [
      { $match: match },
      {
        $group: {
          _id: `$${by}`,
          count: { $sum: 1 },
          totalPnl: { $sum: { $ifNull: ["$pnl", 0] } },
          avgPnl: { $avg: "$pnl" },
          winCount: { $sum: { $cond: [{ $gt: ["$pnl", 0] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 1,
          count: 1,
          totalPnl: { $round: ["$totalPnl", 2] },
          avgPnl: { $round: ["$avgPnl", 2] },
          winRate: {
            $cond: [
              { $eq: ["$count", 0] },
              0,
              { $round: [{ $multiply: [{ $divide: ["$winCount", "$count"] }, 100] }, 2] },
            ],
          },
        },
      },
    ];

    const aggResult = await TradeModel.aggregate(pipeline);

    // Ensure all tradeType buckets exist if grouping by tradeType
    if (by === "tradeType") {
      const map = new Map<string, any>();
      aggResult.forEach((r: any) => map.set(String(r._id ?? "Unknown"), r));

      const filled = TRADE_TYPES.map((tt) => {
        const found = map.get(tt);
        return (
          found || {
            _id: tt,
            count: 0,
            totalPnl: 0,
            avgPnl: 0,
            winRate: 0,
          }
        );
      });

      // Append unknown ones if any
      aggResult.forEach((r: any) => {
        const key = String(r._id ?? "Unknown");
        if (!TRADE_TYPES.includes(key)) filled.push(r);
      });

      return res.json(filled);
    }

    res.json(aggResult);
  } catch (err) {
    console.error("[Analytics] getDistribution error:", err);
    res.status(500).json({ message: "Error computing distribution", error: err });
  }
};
