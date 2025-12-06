// src/routes/payments.ts
import express, { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
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
 * (set these in your backend .env)
 *
 *  RZP_LINK_PRIME_MONTHLY
 *  RZP_LINK_PRIME_ANNUAL
 *  RZP_LINK_ULTRAPRIME_MONTHLY
 *  RZP_LINK_ULTRAPRIME_ANNUAL
 */
const PLAN_LINKS: Record<string, string | undefined> = {
  prime_monthly: process.env.RZP_LINK_PRIME_MONTHLY,
  prime_annual: process.env.RZP_LINK_PRIME_ANNUAL,
  ultraprime_monthly: process.env.RZP_LINK_ULTRAPRIME_MONTHLY,
  ultraprime_annual: process.env.RZP_LINK_ULTRAPRIME_ANNUAL,
};

/**
 * GET /api/payments/subscription-link?plan=prime_monthly|prime_annual|ultraprime_monthly|ultraprime_annual
 *
 * - Requires authentication
 * - Saves the selected plan key into user.subscription.metadata.pendingPlanKey
 * - Returns the correct Razorpay subscription link URL (rzp.io)
 */
router.get(
  "/subscription-link",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
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

    // 🔑 Fetch user and store pending plan key
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      res.status(404).json({ ok: false, error: "User not found" });
      return;
    }

    const subDoc = ensureSubscription(user);
    subDoc.metadata.pendingPlanKey = planKey; // e.g. "ultraprime_monthly"
    await user.save();

    console.info("User", req.user.id, "requested subscription link for", planKey);

    res.json({
      ok: true,
      plan: planKey,
      url,
    });
  })
);

export default router;
