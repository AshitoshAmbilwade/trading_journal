// src/routes/payments.ts
import express, { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { UserModel } from "../models/User.js";

// Type for request that has user attached by auth middleware
interface AuthRequest extends Request {
  user?: { id: string; [key: string]: any };
}

const router = express.Router();

/**
 * We are using Razorpay Subscription Links (hosted on Razorpay),
 * so the backend does NOT create subscriptions anymore.
 *
 * Instead, we expose a small auth-protected endpoint that:
 *  - checks the user is logged in
 *  - records which plan they chose (pendingPlanKey)
 *  - returns the correct Razorpay subscription link (rzp.io URL) for that plan
 */

// Mapping from frontend plan key -> Razorpay Subscription Link URL
// Make sure these are set in your Railway/Vercel env.
const PLAN_LINKS: Record<string, string | undefined> = {
  prime_monthly: process.env.RZP_LINK_PRIME_MONTHLY,
  prime_annual: process.env.RZP_LINK_PRIME_ANNUAL,
  ultraprime_monthly: process.env.RZP_LINK_ULTRAPRIME_MONTHLY,
  ultraprime_annual: process.env.RZP_LINK_ULTRAPRIME_ANNUAL,
};

/**
 * GET /api/payments/subscription-link?plan=prime_monthly|prime_annual|ultraprime_monthly|ultraprime_annual
 *
 * - Requires authentication (authMiddleware)
 * - Saves the chosen plan on the user.subscription.metadata.pendingPlanKey
 * - Returns the subscription link URL for the requested plan
 */
router.get(
  "/subscription-link",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
    // Ensure we have a logged-in user
    const userId = req.user?.id;
    if (!userId) {
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

    // Load user and record the "pending plan" choice
    const user = await UserModel.findById(userId);

    if (!user) {
      res.status(404).json({ ok: false, error: "User not found" });
      return;
    }

    // Ensure subscription object exists
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

    // Save which plan they are about to buy
    (user.subscription.metadata as any).pendingPlanKey = planKey;

    await user.save();

    // Optionally log this (for debugging)
    console.info("User", userId, "requested subscription link for", planKey);

    res.json({
      ok: true,
      plan: planKey,
      url,
    });
  })
);

export default router;
