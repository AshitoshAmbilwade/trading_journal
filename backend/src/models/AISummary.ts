// src/models/AISummary.ts
import { Schema, model, Types } from "mongoose";

interface AISummary {
  userId: Types.ObjectId;
  period: "daily" | "weekly" | "monthly";
  dateRange: {
    start: Date;
    end: Date;
  };
  summaryText: string;
  plusPoints: string[];
  minusPoints: string[];
  aiSuggestions?: string[];
  generatedAt: Date;
}

const AISummarySchema = new Schema<AISummary>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    period: { type: String, enum: ["daily", "weekly", "monthly"], required: true },
    dateRange: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    summaryText: { type: String, required: true },
    plusPoints: { type: [String], default: [] },
    minusPoints: { type: [String], default: [] },
    aiSuggestions: { type: [String], default: [] },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const AISummaryModel = model<AISummary>("AISummary", AISummarySchema);
