// src/models/User.ts
import { Schema, model, Types } from "mongoose";

interface User {
  name: string;
  email: string;
  password: string;
  number: string;
  tier: "Free" | "Premium" | "UltraPremium";
  subscriptionStart?: Date;
  subscriptionEnd?: Date;
  brokerAccounts?: { type: string; brokerId: string; token: string }[];
  timezone?: string | null;    // optional IANA timezone (e.g. "Asia/Kolkata")
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<User>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    number: { type: String },
    tier: { type: String, enum: ["Free", "Premium", "UltraPremium"], default: "Free" },
    subscriptionStart: Date,
    subscriptionEnd: Date,
    brokerAccounts: [
      {
        type: { type: String },
        brokerId: { type: String },
        token: { type: String },
      },
    ],
    // New optional timezone (store IANA names). Null means "unset / UTC-default".
    timezone: { type: String, default: null },
  },
  { timestamps: true }
);

// keep email index (unique already set) and add optional index for tier lookup
UserSchema.index({ tier: 1 });

export const UserModel = model<User>("User", UserSchema);
