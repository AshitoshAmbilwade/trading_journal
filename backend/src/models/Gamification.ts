// src/models/Gamification.ts
import { Schema, model, Types } from "mongoose";

interface Gamification {
  userId: Types.ObjectId;
  streaks: { type: "journaling" | "profitableTrades"; count: number; lastUpdated: Date }[];
  achievements: { title: string; description: string; dateEarned: Date }[];
}

const GamificationSchema = new Schema<Gamification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    streaks: [
      {
        type: { type: String, enum: ["journaling", "profitableTrades"] },
        count: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now },
      },
    ],
    achievements: [
      {
        title: String,
        description: String,
        dateEarned: Date,
      },
    ],
  },
  { timestamps: true }
);

export const GamificationModel = model<Gamification>("Gamification", GamificationSchema);
