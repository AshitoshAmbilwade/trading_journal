// src/controllers/tradeController.ts
import type { Request, Response } from "express";
import { TradeModel } from "../models/Trade.js";
import { Types } from "mongoose";

// Extend Request to include user from auth middleware
interface AuthRequest extends Request {
  user?: any;
}

// Helper to check user tier for limits
const checkTierLimit = async (user: any) => {
  if (user.tier === "Free") {
    const tradeCount = await TradeModel.countDocuments({ userId: new Types.ObjectId(user._id) });
    if (tradeCount >= 50) throw new Error("Free tier limit reached. Upgrade to Premium to add more trades.");
  }
  // Premium/UltraPremium: unlimited
};

// Create Trade
export const createTrade = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    await checkTierLimit(req.user);

    // Use the request body as new trade data
    const tradeData = { ...req.body, userId: new Types.ObjectId(req.user._id) };
    console.log("Trade Data:", tradeData); // debug

    const trade = await TradeModel.create(tradeData); // create a new trade

    res.status(201).json({ trade });
  } catch (err: any) {
    console.error(err); // log the error
    res.status(400).json({ message: err.message || "Error creating trade" });
  }
};


// Get All Trades
export const getTrades = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const trades = await TradeModel.find({ userId: new Types.ObjectId(req.user._id) }).sort({ tradeDate: -1 });
    res.status(200).json({ trades });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Error fetching trades" });
  }
};

// Get Single Trade
export const getTrade = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const trade = await TradeModel.findOne({ _id: req.params.id, userId: new Types.ObjectId(req.user._id) });
    if (!trade) return res.status(404).json({ message: "Trade not found" });

    res.status(200).json({ trade });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Error fetching trade" });
  }
};

// Update Trade
export const updateTrade = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const trade = await TradeModel.findOneAndUpdate(
      { _id: req.params.id, userId: new Types.ObjectId(req.user._id) },
      { $set: req.body },
      { new: true }
    );

    if (!trade) return res.status(404).json({ message: "Trade not found" });

    res.status(200).json({ trade });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Error updating trade" });
  }
};

// Delete Trade
export const deleteTrade = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const trade = await TradeModel.findOneAndDelete({ _id: req.params.id, userId: new Types.ObjectId(req.user._id) });
    if (!trade) return res.status(404).json({ message: "Trade not found" });

    res.status(200).json({ message: "Trade deleted" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Error deleting trade" });
  }
};
