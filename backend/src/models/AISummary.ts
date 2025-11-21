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

  // unified stats (weekly or monthly)
  stats?: any;

  rawResponse?: string;
  status: "draft" | "ready" | "failed";

  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
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
      default: "Generating summary...",
    },

    plusPoints: { type: [String], default: [] },
    minusPoints: { type: [String], default: [] },
    aiSuggestions: { type: [String], default: [] },

    model: { type: String, default: null },

    inputSnapshot: { type: Schema.Types.Mixed, default: {} },

    // unified stats container (weeklyStats / monthlyStats)
    stats: { type: Schema.Types.Mixed, default: {} },

    rawResponse: { type: String, default: "" },

    status: {
      type: String,
      enum: ["draft", "ready", "failed"],
      default: "draft",
    },

    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

/** IMPORTANT for future scaling */
AISummarySchema.index({ userId: 1, type: 1, generatedAt: -1 });
AISummarySchema.index({ tradeId: 1 });
AISummarySchema.index({ type: 1 });

export const AISummaryModel = model<AISummary>("AISummary", AISummarySchema);
