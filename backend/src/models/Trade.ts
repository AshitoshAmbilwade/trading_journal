// src/models/Trade.ts
import { Schema, model, Types, Document } from "mongoose";

export interface Trade extends Document {
  userId: Types.ObjectId;
  symbol: string;
  type: "Buy" | "Sell";
  quantity: number;
  price: number;
  pnl: number;

  session?: "morning" | "mid" | "last";
  segment?: "equity" | "future" | "forex" | "option" | "commodity" | "currency" | "crypto";
  tradeType?: "intraday" | "positional" | "investment" | "swing" | "scalping";
  chartTimeframe?: string;
  strategy?: string;
  direction?: "Long" | "Short";
  entryCondition?:
    | "revenge"
    | "last entry"
    | "good"
    | "fomo"
    | "entry without confirmation"
    | "early entry"
    | "accurate entry";
  exitCondition?:
    | "accurate"
    | "early"
    | "fear"
    | "sl hit"
    | "target hit"
    | "trailing sl hit";

  entryDate?: Date;
  entryNote?: string;
  exitDate?: Date;
  exitNote?: string;
  brokerage?: number;
  remark?: string;
  notes?: string;
  tradeDate: Date;
  source: "manual" | "broker" | "importCSV";
  broker?: string;

  // SINGLE image URL (Cloudinary). Use empty string as default.
  image?: string;

  aiAnalysis?: {
    summary: string;
    plusPoints: string[];
    minusPoints: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const TradeSchema = new Schema<Trade>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    symbol: { type: String, required: true },
    type: { type: String, enum: ["Buy", "Sell"], required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    pnl: { type: Number, required: true },

    session: { type: String, enum: ["morning", "mid", "last"] },
    segment: {
      type: String,
      enum: ["equity", "future", "forex", "option", "commodity", "currency", "crypto"],
    },
    tradeType: {
      type: String,
      enum: ["intraday", "positional", "investment", "swing", "scalping"],
    },
    chartTimeframe: { type: String },
    strategy: { type: String },
    direction: { type: String, enum: ["Long", "Short"] },
    entryCondition: {
      type: String,
      enum: [
        "revenge",
        "last entry",
        "good",
        "fomo",
        "entry without confirmation",
        "early entry",
        "accurate entry",
      ],
    },
    exitCondition: {
      type: String,
      enum: ["accurate", "early", "fear", "sl hit", "target hit", "trailing sl hit"],
    },
    entryDate: { type: Date },
    entryNote: { type: String },
    exitDate: { type: Date },
    exitNote: { type: String },
    brokerage: { type: Number },
    remark: { type: String },
    notes: { type: String },
    tradeDate: { type: Date, default: Date.now },
    source: { type: String, enum: ["manual", "broker", "importCSV"], default: "manual" },
    broker: { type: String },

    // SINGLE image URL (Cloudinary)
    image: { type: String, default: "" },

    aiAnalysis: {
      summary: { type: String, default: "" },
      plusPoints: { type: [String], default: [] },
      minusPoints: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

export const TradeModel = model<Trade>("Trade", TradeSchema);
