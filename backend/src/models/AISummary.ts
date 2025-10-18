// src/models/AISummary.ts
import { Schema, model, Types } from "mongoose";

interface AISummary {
  userId: Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  summary: string;
  plusPoints: string[];
  minusPoints: string[];
  createdAt: Date;
}

const AISummarySchema = new Schema<AISummary>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    summary: { type: String, required: true },
    plusPoints: { type: [String], default: [] },
    minusPoints: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const AISummaryModel = model<AISummary>("AISummary", AISummarySchema);
