// src/routes/payments.ts
import express, { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";

// ⬇️ IMPORT YOUR AUTH MIDDLEWARE (same as you used earlier)
import { authMiddleware } from "../middleware/authMiddleware.js";

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
 *  - returns the correct Razorpay subscription link (rzp.io URL) for a given plan
 *
 * This guarantees:
 *  - NO payment can start if the user is not authenticated
 *  - After payment, the webhook (webhooks.ts) will map the Razorpay subscription
 *    to this same user via email / subscription id and update user.tier, etc.
 */

// Mapping from frontend plan key -> Razorpay Subscription Link URL
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
 * - Returns the subscription link URL for the requested plan
 * - If not logged in -> 401
 * - If invalid/missing plan -> 400
 */
router.get(
  "/subscription-link",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
    // Ensure we have a logged-in user
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

    // Optionally you could log which user requested which plan
    // console.info("User", req.user.id, "requested subscription link for", planKey);

    res.json({
      ok: true,
      plan: planKey,
      url,
    });
  })
);

export default router;
