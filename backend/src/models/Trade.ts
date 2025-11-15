// models/Trade.ts
import { Schema, model, Types, Document } from "mongoose";

export interface Trade extends Document {
  userId: Types.ObjectId;
  symbol: string;
  type?: "Buy" | "Sell";
  quantity: number;

  entryPrice: number;
  exitPrice?: number | null;
  pnl?: number;

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

  image?: string;

  aiAnalysis?: {
    summary: string;
    plusPoints: string[];
    minusPoints: string[];
  };

  // flexible place for extra imported fields
  customFields?: Map<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

const TradeSchema = new Schema<Trade>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    symbol: { type: String, required: true },
    type: { type: String, enum: ["Buy", "Sell"] }, // optional now
    quantity: { type: Number, required: true, min: 1 },

    entryPrice: { type: Number, required: true },
    exitPrice: { type: Number, default: null },
    pnl: { type: Number, default: 0 },

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
    brokerage: { type: Number, default: 0 },
    remark: { type: String },
    notes: { type: String },
    tradeDate: { type: Date, default: Date.now },
    source: { type: String, enum: ["manual", "broker", "importCSV"], default: "manual" },
    broker: { type: String },

    image: { type: String, default: "" },

    aiAnalysis: {
      summary: { type: String, default: "" },
      plusPoints: { type: [String], default: [] },
      minusPoints: { type: [String], default: [] },
    },

    // Flexible storage for any additional fields from CSV imports
    customFields: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

/**
 * PNL calculation:
 * - Only calculate when entryPrice, exitPrice and quantity are present and numeric.
 * - Use brokerage if provided.
 * - Keep calculation safe against strings/nulls.
 */
TradeSchema.pre("save", function (next) {
  try {
    const hasEntry = this.entryPrice !== undefined && this.entryPrice !== null && !Number.isNaN(Number(this.entryPrice));
    const hasExit = this.exitPrice !== undefined && this.exitPrice !== null && !Number.isNaN(Number(this.exitPrice));
    const hasQty = this.quantity !== undefined && this.quantity !== null && !Number.isNaN(Number(this.quantity));

    if (hasEntry && hasExit && hasQty) {
      const entry = Number(this.entryPrice);
      const exit = Number(this.exitPrice);
      const qty = Number(this.quantity);

      const gross = (this.type === "Buy") ? (exit - entry) * qty : (entry - exit) * qty;
      const brokerage = (this as any).brokerage ?? 0;
      this.pnl = Number((gross - Number(brokerage)).toFixed(2));
    }
  } catch (err) {
    // don't block save for unexpected calculation errors; log if you want
    // console.error("PNL calc error", err);
  }
  next();
});

// Indexes for queries/analytics
TradeSchema.index({ userId: 1, tradeDate: -1 });
TradeSchema.index({ strategy: 1 });
TradeSchema.index({ segment: 1 });
TradeSchema.index({ tradeType: 1 });

export const TradeModel = model<Trade>("Trade", TradeSchema);
