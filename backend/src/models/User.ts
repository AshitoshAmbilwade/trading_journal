// src/models/User.ts
import { Schema, model, Document } from "mongoose";

export type Tier = "Free" | "Premium" | "UltraPremium";
export type SubscriptionStatus = "inactive" | "trial" | "active" | "past_due" | "cancelled";
export type BillingProvider = "razorpay" | "stripe" | "manual";

export interface SubscriptionPlan {
  name: string;
  baseAmount: number;
  gstPercent: number;
  totalAmount: number;
  currency: string;
}

export interface SubscriptionMeta {
  // we use this for Razorpay flow
  pendingPlanKey?: string; // "prime_monthly" | "prime_annual" | "ultraprime_monthly" | "ultraprime_annual"
  lastInvoice?: string | null;
  [key: string]: any;
}

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
    plan?: SubscriptionPlan;
    currentPeriodEnd?: Date | null;
    trialEndsAt?: Date | null;
    createdAt?: Date;
    metadata?: SubscriptionMeta;
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

    // ❗️IMPORTANT: removed `index: true` + `sparse: true` to avoid duplicate index warning.
    // We define the index once on UserSchema below.
    razorpaySubscriptionId: { type: String },

    razorpayPaymentIds: [{ type: String }],
    plan: { type: SubscriptionPlanSchema },
    currentPeriodEnd: { type: Date, default: null },
    trialEndsAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },

    // can store pendingPlanKey, lastInvoice, etc.
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

    // subscription default must not be null
    subscription: {
      type: SubscriptionSchema,
      default: {
        status: "inactive",
        billingProvider: "razorpay",
        razorpayPaymentIds: [],
        createdAt: new Date(),
        metadata: {},
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

// single canonical index for subscription id (no duplicate)
UserSchema.index(
  { "subscription.razorpaySubscriptionId": 1 },
  { sparse: true }
);

export const UserModel = model<IUserDocument>("User", UserSchema);
