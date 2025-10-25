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
  },
  { timestamps: true }
);

export const UserModel = model<User>("User", UserSchema);
