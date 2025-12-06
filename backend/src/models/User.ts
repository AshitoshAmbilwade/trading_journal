// src/models/User.ts
import { Schema, model, Types, Document } from "mongoose";

export type Tier = "Free" | "Premium" | "UltraPremium";
export type SubscriptionStatus = "inactive" | "trial" | "active" | "past_due" | "cancelled";
export type BillingProvider = "razorpay" | "stripe" | "manual";

export interface IUser {
  name: string;
  email: string;
  password: string;
  number?: string;

  tier: Tier;

  subscriptionStart?: Date | null;
  subscriptionEnd?: Date | null;

  subscription?: {
    status: SubscriptionStatus;
    billingProvider?: BillingProvider;
    razorpaySubscriptionId?: string | null;
    razorpayPaymentIds?: string[];
    plan?: {
      name: string;
      baseAmount: number;
      gstPercent: number;
      totalAmount: number;
      currency: string;
    };
    currentPeriodEnd?: Date | null;
    trialEndsAt?: Date | null;
    createdAt?: Date;
    metadata?: Record<string, any>;
  };

  timezone?: string | null;
  currency?: string;

  brokerAccounts?: { type: string; brokerId: string; token: string }[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {}

// ---- Plan Subschema ----
const SubscriptionPlanSchema = new Schema(
  {
    name: { type: String },
    baseAmount: { type: Number },
    gstPercent: { type: Number },
    totalAmount: { type: Number },
    currency: { type: String, default: "INR" },
  },
  { _id: false }
);

// ---- Subscription Subschema ----
const SubscriptionSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["inactive", "trial", "active", "past_due", "cancelled"],
      default: "inactive",
    },
    billingProvider: {
      type: String,
      enum: ["razorpay", "stripe", "manual"],
      default: "razorpay",
    },
    razorpaySubscriptionId: { type: String, index: true, sparse: true },
    razorpayPaymentIds: [{ type: String }],
    plan: { type: SubscriptionPlanSchema },
    currentPeriodEnd: { type: Date, default: null },
    trialEndsAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

// ---- Broker Subschema ----
const BrokerAccountSchema = new Schema(
  {
    type: { type: String },
    brokerId: { type: String },
    token: { type: String },
  },
  { _id: false }
);

// ---- User Schema ----
const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    number: { type: String },

    tier: { type: String, enum: ["Free", "Premium", "UltraPremium"], default: "Free" },

    subscriptionStart: { type: Date, default: null },
    subscriptionEnd: { type: Date, default: null },

    // FIXED: subscription default must not be null
    subscription: {
      type: SubscriptionSchema,
      default: {
        status: "inactive",
        billingProvider: "razorpay",
        razorpayPaymentIds: [],
        createdAt: new Date(),
      },
    },

    brokerAccounts: { type: [BrokerAccountSchema], default: [] },
    timezone: { type: String, default: null },
    currency: { type: String, default: "INR" },
  },
  { timestamps: true }
);

// Indexes
UserSchema.index({ tier: 1 });
UserSchema.index({ "subscription.razorpaySubscriptionId": 1 }, { sparse: true });

export const UserModel = model<IUserDocument>("User", UserSchema);
