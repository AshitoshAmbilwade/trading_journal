// src/models/User.ts
import { Schema, model, Document } from "mongoose";

export type Tier = "Free" | "Premium" | "UltraPremium";
export type SubscriptionStatus =
  | "inactive"
  | "trial"
  | "active"
  | "past_due"
  | "cancelled";
export type BillingProvider = "razorpay" | "stripe" | "manual";

/* ---------------- Types ---------------- */

export interface SubscriptionPlan {
  name: string;
  baseAmount: number;
  gstPercent: number;
  totalAmount: number;
  currency: string;
}

export interface SubscriptionMeta {
  // Razorpay flow helpers
  pendingPlanKey?: string;
  lastInvoice?: string | null;
  [key: string]: any;
}

export interface IUser {
  name: string;
  email: string;
  password: string;
  number?: string;

  tier: Tier;

  /**
   * @deprecated
   * ❌ DO NOT USE
   * Legacy fields kept temporarily for backward compatibility.
   * Use `subscription.currentPeriodEnd` instead.
   */
  subscriptionStart?: Date | null;

  /**
   * @deprecated
   * ❌ DO NOT USE
   * Legacy fields kept temporarily for backward compatibility.
   * Use `subscription.currentPeriodEnd` instead.
   */
  subscriptionEnd?: Date | null;

  /**
   * ✅ SINGLE SOURCE OF TRUTH FOR BILLING
   */
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

  brokerAccounts?: {
    type: string;
    brokerId: string;
    token: string;
  }[];

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {}

/* ---------------- Schemas ---------------- */

// ---- Plan Subschema ----
const SubscriptionPlanSchema = new Schema(
  {
    name: String,
    baseAmount: Number,
    gstPercent: Number,
    totalAmount: Number,
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

    razorpaySubscriptionId: { type: String },
    razorpayPaymentIds: { type: [String], default: [] },

    plan: { type: SubscriptionPlanSchema },

    /**
     * ✅ CANONICAL END DATE
     * Frontend + backend must rely ONLY on this
     */
    currentPeriodEnd: { type: Date, default: null },

    trialEndsAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },

    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

// ---- Broker Subschema ----
const BrokerAccountSchema = new Schema(
  {
    type: String,
    brokerId: String,
    token: String,
  },
  { _id: false }
);

// ---- User Schema ----
const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    password: { type: String, required: true },
    number: { type: String },

    tier: {
      type: String,
      enum: ["Free", "Premium", "UltraPremium"],
      default: "Free",
    },

    // ❌ Legacy – deprecated (do not use)
    subscriptionStart: { type: Date, default: null },
    subscriptionEnd: { type: Date, default: null },

    // ✅ Billing source of truth
    subscription: {
      type: SubscriptionSchema,
      default: {
        status: "inactive",
        billingProvider: "razorpay",
        razorpayPaymentIds: [],
        metadata: {},
      },
    },

    brokerAccounts: { type: [BrokerAccountSchema], default: [] },
    timezone: { type: String, default: null },
    currency: { type: String, default: "INR" },
  },
  { timestamps: true }
);

/* ---------------- Indexes ---------------- */

UserSchema.index({ tier: 1 });
UserSchema.index(
  { "subscription.razorpaySubscriptionId": 1 },
  { sparse: true }
);

export const UserModel = model<IUserDocument>("User", UserSchema);
