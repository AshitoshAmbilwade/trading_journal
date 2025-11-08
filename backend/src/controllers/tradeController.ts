import type { Request, Response } from "express";
import { TradeModel } from "../models/Trade.js";
import { Types, isValidObjectId } from "mongoose";

// Type for authenticated request
interface AuthRequest extends Request {
  user?: any;
  file?: Express.Multer.File;
}

/**
 * Extract Cloudinary URL (or uploaded file URL)
 */
const extractImageUrl = (req: AuthRequest): string => {
  if (req.file) {
    const f: any = req.file;
    return (
      f.path ||
      f.secure_url ||
      f.location ||
      f.url ||
      f.filename ||
      ""
    );
  }
  if (req.body?.image && typeof req.body.image === "string") {
    return req.body.image;
  }
  return "";
};

/**
 * Convert fields to correct types and sanitize input
 */
const sanitizeTradeBody = (body: any) => {
  const t: any = { ...body };

  // Convert numbers
  ["quantity", "entryPrice", "exitPrice", "brokerage"].forEach((f) => {
    if (t[f] !== undefined && t[f] !== null && t[f] !== "") {
      t[f] = Number(t[f]);
    }
  });

  // Convert dates
  ["tradeDate", "entryDate", "exitDate"].forEach((f) => {
    if (t[f]) t[f] = new Date(t[f]);
  });

  // Remove any unwanted fields
  delete t.images; // legacy

  return t;
};

/**
 * Auto calculate PnL (Buy/Sell logic)
 */
const calculatePnl = (type: "Buy" | "Sell", entryPrice: number, exitPrice: number, qty: number, brokerage = 0) => {
  if (!entryPrice || !exitPrice || !qty) return 0;
  const gross =
    type === "Buy"
      ? (exitPrice - entryPrice) * qty
      : (entryPrice - exitPrice) * qty;
  return Number((gross - brokerage).toFixed(2));
};

/**
 * Free tier limit enforcement (optional)
 */
const checkTierLimit = async (user: any) => {
  if (user?.tier === "Free") {
    const count = await TradeModel.countDocuments({ userId: new Types.ObjectId(user._id) });
    if (count >= 50) throw new Error("Free tier limit reached. Upgrade to Premium to add more trades.");
  }
};

// ===============================
// CREATE TRADE
// ===============================
export const createTrade = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    await checkTierLimit(req.user);

    const imageUrl = extractImageUrl(req);
    const data = sanitizeTradeBody(req.body);

    const entryPrice = Number(data.entryPrice || 0);
    const exitPrice = Number(data.exitPrice || 0);
    const qty = Number(data.quantity || 0);
    const brokerage = Number(data.brokerage || 0);

    // Compute PnL
    const pnl = calculatePnl(data.type, entryPrice, exitPrice, qty, brokerage);

    const trade = await TradeModel.create({
      ...data,
      userId: new Types.ObjectId(req.user._id),
      image: imageUrl,
      pnl,
    });

    return res.status(201).json({ trade });
  } catch (err: any) {
    console.error("Create Trade Error:", err);
    return res.status(400).json({ message: err.message || "Error creating trade" });
  }
};

// ===============================
// GET ALL TRADES
// ===============================
export const getTrades = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const trades = await TradeModel.find({ userId: req.user._id }).sort({ tradeDate: -1 });
    return res.status(200).json({ trades });
  } catch (err: any) {
    console.error("Get Trades Error:", err);
    return res.status(500).json({ message: err.message || "Error fetching trades" });
  }
};

// ===============================
// GET SINGLE TRADE
// ===============================
export const getTrade = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid ID" });

    const trade = await TradeModel.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!trade) return res.status(404).json({ message: "Trade not found" });
    return res.status(200).json({ trade });
  } catch (err: any) {
    console.error("Get Trade Error:", err);
    return res.status(500).json({ message: err.message || "Error fetching trade" });
  }
};

// ===============================
// UPDATE TRADE
// ===============================
export const updateTrade = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid ID" });

    const trade = await TradeModel.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!trade) return res.status(404).json({ message: "Trade not found" });

    const data = sanitizeTradeBody(req.body);
    const newImageUrl = extractImageUrl(req);
    if (newImageUrl) data.image = newImageUrl;

    // Recalculate PnL if prices or qty changed
    const entryPrice = data.entryPrice ?? trade.entryPrice;
    const exitPrice = data.exitPrice ?? trade.exitPrice;
    const qty = data.quantity ?? trade.quantity;
    const brokerage = data.brokerage ?? trade.brokerage;
    const type = data.type ?? trade.type;
    data.pnl = calculatePnl(type, entryPrice, exitPrice, qty, brokerage);

    const updated = await TradeModel.findByIdAndUpdate(trade._id, { $set: data }, { new: true, runValidators: true });

    return res.status(200).json({ trade: updated });
  } catch (err: any) {
    console.error("Update Trade Error:", err);
    return res.status(500).json({ message: err.message || "Error updating trade" });
  }
};

// ===============================
// DELETE TRADE
// ===============================
export const deleteTrade = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid ID" });

    const trade = await TradeModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!trade) return res.status(404).json({ message: "Trade not found" });
    return res.status(200).json({ message: "Trade deleted successfully" });
  } catch (err: any) {
    console.error("Delete Trade Error:", err);
    return res.status(500).json({ message: err.message || "Error deleting trade" });
  }
};
