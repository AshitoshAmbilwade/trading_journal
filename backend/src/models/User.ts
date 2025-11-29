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
  // legacy (you already had)
  subscriptionStart?: Date | null;
  subscriptionEnd?: Date | null;

  // single embedded subscription document (preferred for billing)
  subscription?: {
    status: SubscriptionStatus;
    billingProvider?: BillingProvider;
    razorpaySubscriptionId?: string | null;
    // push all successful payment ids here (razorpay_payment_id)
    razorpayPaymentIds?: string[];
    // plan breakdown stored here for accounting; amounts in rupees (not paise)
    plan?: {
      name: string;
      baseAmount: number; // e.g. 500 (rupees)
      gstPercent: number; // e.g. 18
      totalAmount: number; // e.g. 590 (rupees) — base + GST
      currency: string; // e.g. "INR"
    };
    currentPeriodEnd?: Date | null; // when the paid period ends
    trialEndsAt?: Date | null;
    createdAt?: Date;
    metadata?: Record<string, any>;
  };

  // user preferences
  timezone?: string | null; // IANA timezone
  currency?: string; // user's preferred currency code e.g. "INR"

  // broker accounts (unchanged)
  brokerAccounts?: { type: string; brokerId: string; token: string }[];

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {}

const SubscriptionPlanSchema = new Schema(
  {
    name: { type: String },
    baseAmount: { type: Number }, // rupees
    gstPercent: { type: Number },
    totalAmount: { type: Number }, // rupees
    currency: { type: String, default: "INR" },
  },
  { _id: false }
);

const SubscriptionSchema = new Schema(
  {
    status: { type: String, enum: ["inactive", "trial", "active", "past_due", "cancelled"], default: "inactive" },
    billingProvider: { type: String, enum: ["razorpay", "stripe", "manual"], default: "razorpay" },
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

const BrokerAccountSchema = new Schema(
  {
    type: { type: String },
    brokerId: { type: String },
    token: { type: String },
  },
  { _id: false }
);

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    number: { type: String },
    tier: { type: String, enum: ["Free", "Premium", "UltraPremium"], default: "Free" },
    subscriptionStart: { type: Date, default: null },
    subscriptionEnd: { type: Date, default: null },
    subscription: { type: SubscriptionSchema, default: null },
    brokerAccounts: { type: [BrokerAccountSchema], default: [] },
    timezone: { type: String, default: null },
    currency: { type: String, default: "INR" },
  },
  { timestamps: true }
);

// Helpful indexes
UserSchema.index({ tier: 1 });
UserSchema.index({ "subscription.razorpaySubscriptionId": 1 }, { sparse: true });

export const UserModel = model<IUserDocument>("User", UserSchema);
