// src/models/Trade.ts
import { Schema, model, Types } from "mongoose";

interface Trade {
  userId: Types.ObjectId;
  symbol: string;
  type: "Buy" | "Sell";
  quantity: number;
  price: number;
  pnl: number;
  strategy?: string;
  notes?: string;
  tradeDate: Date;
  source: "manual" | "broker" | "importCSV";
  broker?: string;
  images?: string[]; // array of URLs
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
    strategy: { type: String },
    notes: { type: String },
    tradeDate: { type: Date, default: Date.now },
    source: { type: String, enum: ["manual", "broker", "importCSV"], default: "manual" },
    broker: { type: String },
    images: { type: [String], default: [] },
    aiAnalysis: {
      summary: String,
      plusPoints: [String],
      minusPoints: [String],
    },
  },
  { timestamps: true }
);

export const TradeModel = model<Trade>("Trade", TradeSchema);
