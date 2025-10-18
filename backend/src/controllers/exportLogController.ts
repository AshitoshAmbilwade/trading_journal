import { Request, Response } from "express";
import { ExportLogModel } from "../models/ExportLog.js";

interface AuthRequest extends Request {
  user?: any;
}

// ✅ Create Export Log
export const createExportLog = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { exportType, fileName, fileSize } = req.body;
    if (!exportType) return res.status(400).json({ message: "exportType is required" });

    const log = await ExportLogModel.create({
      userId: req.user._id,
      exportType,
      fileName,
      fileSize,
    });

    res.status(201).json({ log });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Error creating export log" });
  }
};

// ✅ Get All Export Logs for Current User
export const getExportLogs = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const logs = await ExportLogModel.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ logs });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Error fetching export logs" });
  }
};

// ✅ Delete Single Log
export const deleteExportLog = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const log = await ExportLogModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!log) return res.status(404).json({ message: "Log not found" });

    res.status(200).json({ message: "Export log deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Error deleting export log" });
  }
};
