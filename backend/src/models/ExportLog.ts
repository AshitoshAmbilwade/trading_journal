// src/models/ExportLog.ts
import { Schema, model, Types } from "mongoose";

interface ExportLog {
  userId: Types.ObjectId;
  exportType: "PDF" | "CSV" | "Excel";
  fileName: string;
  period: "daily" | "weekly" | "monthly" | "custom";
  totalTrades: number;
  generatedAt: Date;
  aiIncluded?: boolean;
}

const ExportLogSchema = new Schema<ExportLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    exportType: { type: String, enum: ["PDF", "CSV", "Excel"], required: true },
    fileName: { type: String, required: true },
    period: { type: String, enum: ["daily", "weekly", "monthly", "custom"], required: true },
    totalTrades: { type: Number, required: true },
    generatedAt: { type: Date, default: Date.now },
    aiIncluded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ExportLogModel = model<ExportLog>("ExportLog", ExportLogSchema);
