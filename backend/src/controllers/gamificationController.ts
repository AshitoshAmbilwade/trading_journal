import { Request, Response } from "express";
import { GamificationModel } from "../models/Gamification.js";

interface AuthRequest extends Request {
  user?: any;
}

// ✅ Get Gamification Data
export const getGamification = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const data = await GamificationModel.findOne({ userId: req.user._id });
    res.status(200).json({ data });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Error fetching gamification data" });
  }
};

// ✅ Update Gamification Data (increment points, streak, or achievements)
export const updateGamification = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const updates = req.body; // e.g., { points: 10, streak: 1, achievements: ["First Trade"] }

    const data = await GamificationModel.findOneAndUpdate(
      { userId: req.user._id },
      { $inc: { points: updates.points || 0, streak: updates.streak || 0 }, $addToSet: { achievements: { $each: updates.achievements || [] } } },
      { new: true, upsert: true } // create if doesn't exist
    );

    res.status(200).json({ data });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Error updating gamification data" });
  }
};
