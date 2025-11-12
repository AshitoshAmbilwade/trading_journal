// src/models/Strategy.ts
import { Schema, model, Types, Document } from "mongoose";

export interface IStrategy extends Document {
  userId: Types.ObjectId;
  name: string;
  entryCriteria: string[];
  sltpCriteria: string[];
  managementRules: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MAX_CRITERIA = 200; // safety cap per array

const StrategySchema = new Schema<IStrategy>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    entryCriteria: { type: [String], default: [], validate: [(v: string[]) => v.length <= MAX_CRITERIA, "Too many entry criteria"] },
    sltpCriteria: { type: [String], default: [], validate: [(v: string[]) => v.length <= MAX_CRITERIA, "Too many SL/TP criteria"] },
    managementRules: { type: [String], default: [], validate: [(v: string[]) => v.length <= MAX_CRITERIA, "Too many management rules"] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Unique strategy name per user (case-insensitive)
StrategySchema.index(
  { userId: 1, name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

export const StrategyModel = model<IStrategy>("Strategy", StrategySchema);
export default StrategyModel;
