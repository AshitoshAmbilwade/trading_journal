// src/controllers/aiController.ts
import type { Request, Response } from "express";
import { AISummaryModel } from "../models/AISummary.js";
import { Types } from "mongoose";

interface AuthRequest extends Request {
  user?: any;
}

// Create a new AI summary (protected)
export const createAISummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { period, dateRange, summaryText, plusPoints, minusPoints, aiSuggestions } = req.body;

    if (!period || !dateRange || !summaryText) {
      return res.status(400).json({ message: "period, dateRange and summaryText are required" });
    }

    const payload = {
      userId: new Types.ObjectId(req.user._id),
      period,
      dateRange: {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
      },
      summaryText,
      plusPoints: plusPoints || [],
      minusPoints: minusPoints || [],
      aiSuggestions: aiSuggestions || [],
    };

    const created = await AISummaryModel.create(payload);
    res.status(201).json({ aiSummary: created });
  } catch (err: any) {
    console.error("createAISummary error:", err);
    res.status(500).json({ message: err.message || "Error creating AI summary" });
  }
};

// Get all AI summaries for the current user (protected)
export const listAISummaries = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const summaries = await AISummaryModel.find({ userId: new Types.ObjectId(req.user._id) })
      .sort({ generatedAt: -1 })
      .lean();

    res.status(200).json({ summaries });
  } catch (err: any) {
    console.error("listAISummaries error:", err);
    res.status(500).json({ message: err.message || "Error fetching AI summaries" });
  }
};

// Get a single AI summary by id (protected)
export const getAISummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "id is required" });

    const summary = await AISummaryModel.findOne({
      _id: id,
      userId: new Types.ObjectId(req.user._id),
    });

    if (!summary) return res.status(404).json({ message: "AI summary not found" });

    res.status(200).json({ aiSummary: summary });
  } catch (err: any) {
    console.error("getAISummary error:", err);
    res.status(500).json({ message: err.message || "Error fetching AI summary" });
  }
};

// Delete AI summary by id (protected)
export const deleteAISummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "id is required" });

    const deleted = await AISummaryModel.findOneAndDelete({
      _id: id,
      userId: new Types.ObjectId(req.user._id),
    });

    if (!deleted) return res.status(404).json({ message: "AI summary not found" });

    res.status(200).json({ message: "AI summary deleted" });
  } catch (err: any) {
    console.error("deleteAISummary error:", err);
    res.status(500).json({ message: err.message || "Error deleting AI summary" });
  }
};
