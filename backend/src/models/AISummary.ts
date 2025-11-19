// src/models/AISummary.ts
import { Schema, model, Types } from "mongoose";

export interface AISummary {
  userId: Types.ObjectId;
  tradeId?: Types.ObjectId | null;  
  type: "trade" | "daily" | "weekly" | "monthly";
  dateRange?: {
    start: Date;
    end: Date;
  };
  summaryText: string;
  plusPoints: string[];
  minusPoints: string[];
  aiSuggestions?: string[];
  model?: string;
  inputSnapshot?: any;
  status: "draft" | "ready" | "failed";
  generatedAt: Date;
  // Add these missing fields from your controller
  rawResponse?: string;
  weeklyStats?: any;
}

const AISummarySchema = new Schema<AISummary>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tradeId: { type: Schema.Types.ObjectId, ref: "Trade", default: null },
    type: {
      type: String,
      enum: ["trade", "daily", "weekly", "monthly"],
      required: true,
    },
    dateRange: {
      start: { type: Date },
      end: { type: Date },
    },
    summaryText: { 
      type: String, 
      required: true,
      default: "Generating summary..." // Add default value
    },
    plusPoints: { type: [String], default: [] },
    minusPoints: { type: [String], default: [] },
    aiSuggestions: { type: [String], default: [] },
    model: { type: String, default: null },
    inputSnapshot: { type: Schema.Types.Mixed, default: {} },
    // Add missing fields
    rawResponse: { type: String, default: "" },
    weeklyStats: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["draft", "ready", "failed"],
      default: "draft", // Change default to draft
    },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const AISummaryModel = model<AISummary>("AISummary", AISummarySchema);