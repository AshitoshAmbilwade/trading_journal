// src/routes/payments.ts
import express, { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Razorpay from "razorpay";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { UserModel } from "../models/User.js";

interface AuthRequest extends Request {
  user?: { id: string; [key: string]: any };
}

const router = express.Router();

// helper so subscription is never null
function ensureSubscription(user: any) {
  if (!user.subscription) {
    user.subscription = {
      status: "inactive",
      billingProvider: "razorpay",
      razorpaySubscriptionId: null,
      razorpayPaymentIds: [],
      plan: undefined,
      currentPeriodEnd: null,
      createdAt: new Date(),
      metadata: {},
    };
  }
  if (!user.subscription.metadata || typeof user.subscription.metadata !== "object") {
    user.subscription.metadata = {};
  }
  return user.subscription;
}

/**
 * Mapping from frontend plan key -> Razorpay Subscription Link URL
 * (legacy payment-link flow if you still want to use it)
 */
const PLAN_LINKS: Record<string, string | undefined> = {
  prime_monthly: process.env.RZP_LINK_PRIME_MONTHLY,
  prime_annual: process.env.RZP_LINK_PRIME_ANNUAL,
  ultraprime_monthly: process.env.RZP_LINK_ULTRAPRIME_MONTHLY,
  ultraprime_annual: process.env.RZP_LINK_ULTRAPRIME_ANNUAL,
};

type PlanKey =
  | "prime_monthly"
  | "prime_annual"
  | "ultraprime_monthly"
  | "ultraprime_annual";

interface PlanConfig {
  key: PlanKey;
  razorpayPlanId?: string;
  label: string;
  tier: "Premium" | "UltraPremium";
  billingInterval: "monthly" | "annual";
  // number of billing cycles Razorpay will run before marking subscription completed
  totalCount: number;
}

/**
 * IMPORTANT:
 *  - Razorpay REQUIRES total_count >= 1
 *  - If you want “until cancelled”, just set a large number
 *    (12 years is more than enough for annual).
 */
const PLAN_CONFIGS: Record<PlanKey, PlanConfig> = {
  prime_monthly: {
    key: "prime_monthly",
    razorpayPlanId: process.env.RZP_PLAN_PRIME_MONTHLY_ID,
    label: "Prime — Monthly",
    tier: "Premium",
    billingInterval: "monthly",
    totalCount: 12, // 12 months
  },
  prime_annual: {
    key: "prime_annual",
    razorpayPlanId: process.env.RZP_PLAN_PRIME_ANNUAL_ID,
    label: "Prime — Annual",
    tier: "Premium",
    billingInterval: "annual",
    totalCount: 12, // 12 years => won't show Completed after 1st charge
  },
  ultraprime_monthly: {
    key: "ultraprime_monthly",
    razorpayPlanId: process.env.RZP_PLAN_ULTRAPRIME_MONTHLY_ID,
    label: "UltraPrime — Monthly",
    tier: "UltraPremium",
    billingInterval: "monthly",
    totalCount: 12,
  },
  ultraprime_annual: {
    key: "ultraprime_annual",
    razorpayPlanId: process.env.RZP_PLAN_ULTRAPRIME_ANNUAL_ID,
    label: "UltraPrime — Annual",
    tier: "UltraPremium",
    billingInterval: "annual",
    totalCount: 12,
  },
};

// Razorpay instance (for Subscriptions API flow)
const RZP_KEY_ID = process.env.RZP_KEY_ID;
const RZP_KEY_SECRET = process.env.RZP_KEY_SECRET;

// use any to avoid tight typing issues
let razorpay: any = null;
if (RZP_KEY_ID && RZP_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: RZP_KEY_ID,
    key_secret: RZP_KEY_SECRET,
  });
} else {
  console.warn(
    "[payments] RZP_KEY_ID or RZP_KEY_SECRET is missing. Razorpay Subscriptions API will not work."
  );
}

/**
 * GET /api/payments/subscription-link
 * (kept for rzp.io subscription link flow if you ever want it)
 */
router.get(
  "/subscription-link",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    console.info("[payments] GET /subscription-link", {
      userId: req.user?.id,
      query: req.query,
    });

    if (!req.user?.id) {
      res.status(401).json({ ok: false, error: "Unauthorized: please log in first" });
      return;
    }

    const { plan } = req.query;
    if (!plan || typeof plan !== "string") {
      res.status(400).json({ ok: false, error: "Missing or invalid plan parameter" });
      return;
    }

    const planKey = plan as keyof typeof PLAN_LINKS;
    const url = PLAN_LINKS[planKey];

    if (!url) {
      res.status(400).json({
        ok: false,
        error: "Unknown plan key or subscription link not configured",
      });
      return;
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({ ok: false, error: "User not found" });
      return;
    }

    const subDoc = ensureSubscription(user);
    subDoc.metadata.pendingPlanKey = planKey; // e.g. "ultraprime_monthly"
    user.markModified("subscription");
    await user.save();

    console.info("[payments] subscription-link: stored pendingPlanKey", {
      userId: req.user.id,
      planKey,
    });

    res.json({
      ok: true,
      plan: planKey,
      url,
    });
  })
);

/**
 * POST /api/payments/create-subscription
 *
 * Body (preferred): { plan: "prime_monthly" | ... }
 * OR Query fallback : /create-subscription?plan=prime_monthly
 *
 * - Ensures a Razorpay Customer exists (with email/phone)
 * - Creates a subscription linked to that customer
 * - Saves pendingPlanKey + subscription id in user.subscription
 */
router.post(
  "/create-subscription",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    console.info("[payments] POST /create-subscription hit", {
      userId: req.user?.id,
      body: req.body,
      query: req.query,
    });

    if (!req.user?.id) {
      res.status(401).json({ ok: false, error: "Unauthorized: please log in first" });
      return;
    }

    if (!razorpay) {
      res.status(500).json({
        ok: false,
        error: "Razorpay configuration missing on server",
      });
      return;
    }

    // Robust body handling
    const body = (req.body || {}) as { plan?: string };
    const planFromBody = body.plan;
    const planFromQuery =
      typeof req.query.plan === "string" ? (req.query.plan as string) : undefined;

    const plan = planFromBody || planFromQuery;

    if (!plan || typeof plan !== "string") {
      console.warn("[payments] create-subscription: missing plan", {
        body,
        query: req.query,
      });
      res.status(400).json({ ok: false, error: "Missing or invalid plan parameter" });
      return;
    }

    const planKey = plan as PlanKey;
    const config = PLAN_CONFIGS[planKey];

    if (!config) {
      res.status(400).json({ ok: false, error: "Unknown plan key" });
      return;
    }

    if (!config.razorpayPlanId) {
      res.status(500).json({
        ok: false,
        error: "Razorpay plan id not configured on server for this plan",
      });
      return;
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({ ok: false, error: "User not found" });
      return;
    }

    // ✅ NEW: block creating a new subscription if current one is still active and not ended
    const existingSub = (user as any).subscription;
    const now = new Date();
    if (
      existingSub &&
      existingSub.status === "active" &&
      existingSub.currentPeriodEnd &&
      new Date(existingSub.currentPeriodEnd) > now
    ) {
      console.info("[payments] user already has active subscription, blocking new one", {
        userId: String(user._id),
        currentPlan: existingSub.plan?.name,
        currentPeriodEnd: existingSub.currentPeriodEnd,
      });

      res.status(400).json({
        ok: false,
        error:
          "You already have an active subscription. You can change plan after the current period ends.",
        currentPlan: existingSub.plan?.name || null,
        currentPeriodEnd: existingSub.currentPeriodEnd,
      });
      return;
    }

    const subDoc = ensureSubscription(user);

    // 1️⃣ Ensure we have / reuse a Razorpay Customer
    let customerId: string | undefined =
      (subDoc.metadata && (subDoc.metadata as any).razorpayCustomerId) || undefined;

    try {
      if (!customerId) {
        const customer = await razorpay.customers.create({
          name: user.name,
          email: user.email,
          contact: (user as any).number,
          fail_existing: "0",
          notes: {
            app_user_id: String(user._id),
            app_email: user.email,
          },
        } as any);

        customerId = customer.id;
        subDoc.metadata = subDoc.metadata || {};
        (subDoc.metadata as any).razorpayCustomerId = customerId;
        (subDoc.metadata as any).email = user.email; // extra bridge
        console.info("[payments] Created Razorpay customer", {
          userId: String(user._id),
          customerId,
        });
      } else {
        console.info("[payments] Reusing Razorpay customer", {
          userId: String(user._id),
          customerId,
        });
      }
    } catch (err) {
      console.error("Error creating/reusing Razorpay customer:", err);
      res.status(500).json({
        ok: false,
        error: "Failed to create customer in Razorpay",
      });
      return;
    }

    // 2️⃣ Build subscription payload (ALWAYS send total_count >= 1)
    const payload: any = {
      plan_id: config.razorpayPlanId,
      customer_id: customerId,
      customer_notify: 1,
      total_count: config.totalCount, // <– important
      notes: {
        app_user_id: String(user._id),
        app_plan_key: planKey,
        app_plan_label: config.label,
        app_tier: config.tier,
        app_email: user.email,
      },
    };

    // 3️⃣ Create subscription in Razorpay linked to that customer
    const subscription = await razorpay.subscriptions.create(payload as any);

    // Always store latest subscription id and pending plan
    subDoc.metadata.pendingPlanKey = planKey;
    subDoc.metadata.lastCreatedSubscriptionId = subscription.id;
    subDoc.razorpaySubscriptionId = subscription.id;

    user.markModified("subscription");
    await user.save();

    console.info("[payments] Created Razorpay subscription", {
      userId: String(user._id),
      planKey,
      customerId,
      subscriptionId: subscription.id,
    });

    res.json({
      ok: true,
      plan: planKey,
      tier: config.tier,
      subscriptionId: subscription.id,
      razorpayKeyId: RZP_KEY_ID,
      subscription,
    });
  })
);

export default router;
