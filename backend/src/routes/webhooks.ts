// src/routes/webhooks.ts
import express from "express";
import crypto from "crypto";
import { UserModel } from "../models/User.js";

const router = express.Router();

type Tier = "Free" | "Premium" | "UltraPremium";

/* ---------------- helpers ---------------- */

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

// 🔑 SINGLE SOURCE OF TRUTH FOR END DATE
function syncCurrentPeriodEnd(subDoc: any, subscriptionEntity: any) {
  if (subscriptionEntity?.current_end) {
    subDoc.currentPeriodEnd = new Date(subscriptionEntity.current_end * 1000);
    return true;
  }
  return false;
}

interface PlanMeta {
  tier: Tier;
  planLabel: string;
}

function mapPlanFromKey(planKey?: string | null): PlanMeta | null {
  if (!planKey) return null;
  switch (planKey) {
    case "prime_monthly":
      return { tier: "Premium", planLabel: "Prime — Monthly" };
    case "prime_annual":
      return { tier: "Premium", planLabel: "Prime — Annual" };
    case "ultraprime_monthly":
      return { tier: "UltraPremium", planLabel: "UltraPrime — Monthly" };
    case "ultraprime_annual":
      return { tier: "UltraPremium", planLabel: "UltraPrime — Annual" };
    default:
      return null;
  }
}

function mapPlanFromId(planId?: string | null): PlanMeta | null {
  if (!planId) return null;

  if (planId === process.env.RZP_PLAN_PRIME_MONTHLY_ID)
    return { tier: "Premium", planLabel: "Prime — Monthly" };
  if (planId === process.env.RZP_PLAN_PRIME_ANNUAL_ID)
    return { tier: "Premium", planLabel: "Prime — Annual" };
  if (planId === process.env.RZP_PLAN_ULTRAPRIME_MONTHLY_ID)
    return { tier: "UltraPremium", planLabel: "UltraPrime — Monthly" };
  if (planId === process.env.RZP_PLAN_ULTRAPRIME_ANNUAL_ID)
    return { tier: "UltraPremium", planLabel: "UltraPrime — Annual" };

  return null;
}

function verifySignature(secret: string, rawBody: Buffer, signature: string) {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "utf8"),
      Buffer.from(expected, "utf8")
    );
  } catch {
    return false;
  }
}

function applyPlanToSubscription(
  subDoc: any,
  planMeta: PlanMeta | null,
  invoiceEntity: any,
  subscriptionEntity: any
) {
  if (!planMeta) return;

  const amountPaise =
    subscriptionEntity?.plan?.item?.amount ??
    subscriptionEntity?.plan?.amount ??
    invoiceEntity?.amount ??
    0;

  const baseAmount = amountPaise ? amountPaise / 100 : subDoc.plan?.baseAmount ?? 0;

  subDoc.plan = {
    name: planMeta.planLabel,
    baseAmount,
    gstPercent: subDoc.plan?.gstPercent ?? 0,
    totalAmount: subDoc.plan?.totalAmount ?? baseAmount,
    currency: "INR",
  };
}

/* ---------------- webhook ---------------- */

router.post(
  "/razorpay",
  express.raw({ type: "*/*" }),
  async (req, res) => {
    const secret = process.env.RZP_WEBHOOK_SECRET;
    const signature = (req.headers["x-razorpay-signature"] as string) || "";

    if (!secret || !signature) {
      return res.status(400).send("Missing signature/secret");
    }

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body));

    if (!verifySignature(secret, rawBody, signature)) {
      return res.status(401).send("Invalid signature");
    }

    const payload = JSON.parse(rawBody.toString());
    const event = payload.event;

    try {
      const invoiceEntity = payload.payload?.invoice?.entity;
      const paymentEntity = payload.payload?.payment?.entity;
      const subscriptionEntity = payload.payload?.subscription?.entity;

      const subId =
        subscriptionEntity?.id ||
        invoiceEntity?.subscription_id ||
        paymentEntity?.subscription_id ||
        null;

      const paymentId =
        paymentEntity?.id || invoiceEntity?.payment_id || null;

      const planId =
        subscriptionEntity?.plan_id ||
        subscriptionEntity?.plan?.id ||
        invoiceEntity?.plan_id ||
        null;

      const customerId =
        subscriptionEntity?.customer_id ||
        invoiceEntity?.customer_id ||
        paymentEntity?.customer_id ||
        null;

      let user =
        subId
          ? await UserModel.findOne({ "subscription.razorpaySubscriptionId": subId })
          : null;

      if (!user && customerId) {
        user = await UserModel.findOne({
          "subscription.metadata.razorpayCustomerId": customerId,
        });
      }

      if (!user) return res.json({ ok: true });

      const subDoc = ensureSubscription(user);

      if (subId) subDoc.razorpaySubscriptionId = subId;
      if (customerId) subDoc.metadata.razorpayCustomerId = customerId;

      const pendingKey = subDoc.metadata?.pendingPlanKey;
      let planMeta = pendingKey ? mapPlanFromKey(pendingKey) : mapPlanFromId(planId);

      /* ---- CREATED / ACTIVATED ---- */
      if (event === "subscription.created" || event === "subscription.activated") {
        subDoc.status = "active";
        applyPlanToSubscription(subDoc, planMeta, invoiceEntity, subscriptionEntity);
        syncCurrentPeriodEnd(subDoc, subscriptionEntity);
        delete subDoc.metadata?.pendingPlanKey;
        user.markModified("subscription");
        await user.save();
        return res.json({ ok: true });
      }

      /* ---- PAYMENT SUCCESS ---- */
      if (
        event === "subscription.charged" ||
        event === "subscription.charged_successfully" ||
        event === "invoice.paid" ||
        event === "payment.captured"
      ) {
        subDoc.status = "active";
        if (paymentId && !subDoc.razorpayPaymentIds.includes(paymentId)) {
          subDoc.razorpayPaymentIds.push(paymentId);
        }
        if (planMeta) {
          user.tier = planMeta.tier;
          applyPlanToSubscription(subDoc, planMeta, invoiceEntity, subscriptionEntity);
        }
        syncCurrentPeriodEnd(subDoc, subscriptionEntity);
        delete subDoc.metadata?.pendingPlanKey;
        user.markModified("subscription");
        await user.save();
        return res.json({ ok: true });
      }

      /* ---- FAILED ---- */
      if (event === "subscription.charged_unsuccessfully" || event === "payment.failed") {
        subDoc.status = "past_due";
        user.markModified("subscription");
        await user.save();
        return res.json({ ok: true });
      }

      /* ---- CANCELLED / EXPIRED ---- */
      if (
        event === "subscription.cancelled" ||
        event === "subscription.completed" ||
        event === "subscription.expired"
      ) {
        subDoc.status = "cancelled";
        if (subscriptionEntity?.ended_at) {
          subDoc.currentPeriodEnd = new Date(subscriptionEntity.ended_at * 1000);
        }
        user.tier = "Free";
        user.markModified("subscription");
        await user.save();
        return res.json({ ok: true });
      }

      return res.json({ ok: true });
    } catch (err) {
      console.error("[webhooks] error", err);
      return res.status(500).send("server error");
    }
  }
);

export default router;
