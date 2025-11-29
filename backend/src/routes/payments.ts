// src/routes/payments.ts
import express, { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import { razorpay } from "../utils/razorpay.js";
import { UserModel } from "../models/User.js";

const router = express.Router();
const toPaise = (rupees: number) => Math.round(rupees * 100);

router.post(
  "/create-subscription",
  asyncHandler(async (req: Request & { user?: any }, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    // fetch user and check if existing active/pending subscription exists
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ ok: false, error: "User not found" });
      return;
    }

    // avoid creating multiple subscriptions accidentally
    const existingSubId = user.subscription?.razorpaySubscriptionId;
    const existingStatus = user.subscription?.status;
    if (existingSubId && (existingStatus === "inactive" || existingStatus === "active" || existingStatus === "trial")) {
      // if already active or pending, return existing subscription id to frontend
      res.json({ ok: true, subscription: { id: existingSubId, note: "existing" } });
      return;
    }

    // Validate plan amounts on server side (single source of truth)
    const baseAmount = 500;
    const gstPercent = 18;
    const totalAmount = +(baseAmount * (1 + gstPercent / 100)).toFixed(2); // 590

    try {
      // Option: create a Plan in Razorpay dashboard and use plan_id here for cleaner behavior
      // For now create subscription directly using 'amount'
      const options: any = {
        amount: toPaise(totalAmount),
        currency: "INR",
        total_count: 0,
        start_at: Math.floor(Date.now() / 1000) + 10,
        customer_notify: 1,
        notes: { userId: String(userId), planName: "Premium Monthly" },
      };

      const subscription = await razorpay.subscriptions.create(options);

      // store only minimal raw data
      user.subscription = {
        status: "inactive",
        billingProvider: "razorpay",
        razorpaySubscriptionId: subscription.id,
        razorpayPaymentIds: [],
        plan: {
          name: "Premium Monthly",
          baseAmount,
          gstPercent,
          totalAmount,
          currency: "INR",
        },
        currentPeriodEnd: null,
        createdAt: new Date(),
        metadata: { createdAt: new Date(), subscriptionCreated: true },
      };

      await user.save();

      res.json({ ok: true, subscription });
      return;
    } catch (err: any) {
      console.error("create-subscription error:", err);
      res.status(500).json({ ok: false, error: err?.message || "Server error" });
      return;
    }
  })
);

export default router;
