import type { Request, Response } from "express";
import { Types } from "mongoose";
import {TradeModel}  from "../models/Trade.js";

/**
 * Analytics Controller
 * - Handles performance metrics, charts, and trade distributions
 * - Pure numeric analytics — no AI involved here
 */

// Helper: safely parse ISO date
const parseDate = (v?: string) => {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

// 🎯 1. SUMMARY ANALYTICS
// GET /api/analytics/summary
export const getSummary = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id || (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { from, to, segment, tradeType, symbol } = req.query as any;

    const match: any = { userId: new Types.ObjectId(userId) };

    const fromDate = parseDate(from);
    const toDate = parseDate(to);

    if (fromDate || toDate) {
      match.tradeDate = {};
      if (fromDate) match.tradeDate.$gte = fromDate;
      if (toDate) match.tradeDate.$lte = toDate;
    }

    if (segment) match.segment = String(segment);
    if (tradeType) match.tradeType = String(tradeType);
    if (symbol) match.symbol = { $regex: new RegExp(symbol, "i") };

    const [stats] = await TradeModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalTrades: { $sum: 1 },
          totalPnl: { $sum: { $ifNull: ["$pnl", 0] } },
          avgPnl: { $avg: { $ifNull: ["$pnl", 0] } },
          winCount: { $sum: { $cond: [{ $gte: ["$pnl", 0] }, 1, 0] } },
          lossCount: { $sum: { $cond: [{ $lt: ["$pnl", 0] }, 1, 0] } },
          largestWin: { $max: "$pnl" },
          largestLoss: { $min: "$pnl" },
        },
      },
      {
        $project: {
          _id: 0,
          totalTrades: 1,
          totalPnl: { $ifNull: ["$totalPnl", 0] },
          avgPnl: { $ifNull: ["$avgPnl", 0] },
          winRate: {
            $cond: [
              { $eq: ["$totalTrades", 0] },
              0,
              { $divide: ["$winCount", "$totalTrades"] },
            ],
          },
          largestWin: 1,
          largestLoss: 1,
        },
      },
    ]);

    return res.json(
      stats || {
        totalTrades: 0,
        totalPnl: 0,
        avgPnl: 0,
        winRate: 0,
        largestWin: 0,
        largestLoss: 0,
      }
    );
  } catch (err) {
    console.error("[Analytics] getSummary error:", err);
    res.status(500).json({ message: "Server error", error: (err as any).message });
  }
};

// 🎯 2. TIMESERIES ANALYTICS (for future use)
// GET /api/analytics/timeseries?interval=daily|weekly|monthly
export const getTimeSeries = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id || (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { interval = "daily", from, to } = req.query as any;
    const match: any = { userId: new Types.ObjectId(userId) };

    const fromDate = parseDate(from);
    const toDate = parseDate(to);
    if (fromDate || toDate) {
      match.tradeDate = {};
      if (fromDate) match.tradeDate.$gte = fromDate;
      if (toDate) match.tradeDate.$lte = toDate;
    }

    let dateFormat = "%Y-%m-%d"; // daily
    if (interval === "weekly") dateFormat = "%Y-%U"; // week number
    if (interval === "monthly") dateFormat = "%Y-%m";

    const data = await TradeModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$tradeDate" } },
          totalTrades: { $sum: 1 },
          totalPnl: { $sum: "$pnl" },
          avgPnl: { $avg: "$pnl" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.json(data);
  } catch (err) {
    console.error("[Analytics] getTimeSeries error:", err);
    res.status(500).json({ message: "Server error", error: (err as any).message });
  }
};

// 🎯 3. DISTRIBUTION ANALYTICS (future)
// GET /api/analytics/distribution?by=segment|tradeType|strategy
export const getDistribution = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id || (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { by = "segment" } = req.query as any;
    const allowed = ["segment", "tradeType", "strategy", "type"];
    if (!allowed.includes(by))
      return res.status(400).json({ message: "Invalid 'by' parameter" });

    const data = await TradeModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: `$${by}`,
          count: { $sum: 1 },
          totalPnl: { $sum: "$pnl" },
          avgPnl: { $avg: "$pnl" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return res.json(data);
  } catch (err) {
    console.error("[Analytics] getDistribution error:", err);
    res.status(500).json({ message: "Server error", error: (err as any).message });
  }
};
