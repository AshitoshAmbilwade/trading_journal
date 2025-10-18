// src/models/ExportLog.ts
import { Schema, model, Types } from "mongoose";

interface ExportLog {
  userId: Types.ObjectId;
  type: "PDF" | "CSV";
  filters: any;
  createdAt: Date;
}

const ExportLogSchema = new Schema<ExportLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["PDF", "CSV"], required: true },
    filters: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const ExportLogModel = model<ExportLog>("ExportLog", ExportLogSchema);
