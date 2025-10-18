// src/models/Gamification.ts
import { Schema, model, Types } from "mongoose";

interface Achievement {
  title: string;
  description: string;
  achievedOn: Date;
}

interface Gamification {
  userId: Types.ObjectId;
  currentStreak: number;
  longestStreak: number;
  totalTrades: number;
  achievements: Achievement[];
  level: number;
  points: number;
}

const AchievementSchema = new Schema<Achievement>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  achievedOn: { type: Date, default: Date.now },
});

const GamificationSchema = new Schema<Gamification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalTrades: { type: Number, default: 0 },
    achievements: { type: [AchievementSchema], default: [] },
    level: { type: Number, default: 1 },
    points: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const GamificationModel = model<Gamification>("Gamification", GamificationSchema);
