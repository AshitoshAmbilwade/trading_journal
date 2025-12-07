// src/routes/webhooks.ts
import express from "express";
import crypto from "crypto";
import { UserModel } from "../models/User.js";

const router = express.Router();

type Tier = "Free" | "Premium" | "UltraPremium";

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

interface PlanMeta {
  tier: Tier;
  planLabel: string;
}

// Map our internal frontend plan keys -> tier + label
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

// Fallback: map from Razorpay plan.id if you configured envs
function mapPlanFromId(planId?: string | null): PlanMeta | null {
  if (!planId) return null;

  const primeMonthly = process.env.RZP_PLAN_PRIME_MONTHLY_ID;
  const primeAnnual = process.env.RZP_PLAN_PRIME_ANNUAL_ID;
  const ultraMonthly = process.env.RZP_PLAN_ULTRAPRIME_MONTHLY_ID;
  const ultraAnnual = process.env.RZP_PLAN_ULTRAPRIME_ANNUAL_ID;

  if (planId === primeMonthly) {
    return { tier: "Premium", planLabel: "Prime — Monthly" };
  }
  if (planId === primeAnnual) {
    return { tier: "Premium", planLabel: "Prime — Annual" };
  }
  if (planId === ultraMonthly) {
    return { tier: "UltraPremium", planLabel: "UltraPrime — Monthly" };
  }
  if (planId === ultraAnnual) {
    return { tier: "UltraPremium", planLabel: "UltraPrime — Annual" };
  }

  return null;
}

// helper: timing-safe compare for signatures
function verifySignature(secret: string, rawBody: Buffer, signature: string) {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    const sigBuf = Buffer.from(signature, "utf8");
    const expBuf = Buffer.from(expected, "utf8");
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

// helper: fill plan object on subscription
function applyPlanToSubscription(
  subDoc: any,
  planMeta: PlanMeta | null,
  invoiceEntity: any,
  subscriptionEntity: any
) {
  if (!planMeta) return;

  const planAmountPaise =
    subscriptionEntity?.plan?.item?.amount ??
    subscriptionEntity?.plan?.amount ??
    invoiceEntity?.amount ??
    0;

  const baseAmount = planAmountPaise
    ? planAmountPaise / 100
    : subDoc.plan?.baseAmount ?? 0;

  subDoc.plan = {
    name: planMeta.planLabel,
    baseAmount,
    gstPercent: subDoc.plan?.gstPercent ?? 0,
    totalAmount: subDoc.plan?.totalAmount ?? baseAmount,
    currency: subDoc.plan?.currency ?? "INR",
  };
}

router.post(
  "/razorpay",
  // raw body to verify Razorpay signature
  express.raw({ type: "*/*" }),
  async (req, res) => {
    console.info("[webhooks] /webhooks/razorpay hit", {
      time: new Date().toISOString(),
      headers: req.headers,
    });

    const secret = process.env.RZP_WEBHOOK_SECRET;
    const signature = (req.headers["x-razorpay-signature"] as string) || "";

    if (!signature || !secret) {
      console.warn("[webhooks] missing signature or secret");
      return res.status(400).send("Missing signature/secret");
    }

    const body: any = req.body;

    let rawBodyBuffer: Buffer;
    let payload: any;

    try {
      if (Buffer.isBuffer(body)) {
        rawBodyBuffer = body;
        payload = JSON.parse(body.toString());
      } else if (typeof body === "string") {
        rawBodyBuffer = Buffer.from(body);
        payload = JSON.parse(body);
      } else {
        const str = JSON.stringify(body);
        rawBodyBuffer = Buffer.from(str);
        payload = body;
      }
    } catch (err) {
      console.error("[webhooks] invalid json", err);
      return res.status(400).send("Invalid JSON");
    }

    if (!verifySignature(secret, rawBodyBuffer, signature)) {
      console.warn("[webhooks] invalid signature");
      return res.status(401).send("Invalid signature");
    }

    const event = payload.event as string;
    console.info("[webhooks] event received", event);

    try {
      const invoiceEntity = payload.payload?.invoice?.entity;
      const paymentEntity = payload.payload?.payment?.entity;
      const subscriptionEntity = payload.payload?.subscription?.entity;

      const subId: string | null =
        subscriptionEntity?.id ||
        invoiceEntity?.subscription_id ||
        paymentEntity?.subscription_id ||
        null;

      const paymentId: string | null =
        paymentEntity?.id || invoiceEntity?.payment_id || null;

      const planId: string | null =
        subscriptionEntity?.plan_id ||
        subscriptionEntity?.plan?.id ||
        invoiceEntity?.plan_id ||
        invoiceEntity?.plan?.id ||
        null;

      const customerEmail: string | null =
        subscriptionEntity?.customer_details?.email ||
        invoiceEntity?.customer_details?.email ||
        paymentEntity?.email ||
        null;

      const customerId: string | null =
        subscriptionEntity?.customer_id ||
        invoiceEntity?.customer_id ||
        paymentEntity?.customer_id ||
        null;

      console.log("[webhooks] extracted identifiers", {
        event,
        subId,
        paymentId,
        planId,
        customerEmail,
        customerId,
      });

      if (!subId && !paymentId && !customerEmail && !customerId) {
        console.info(
          "[webhooks] no subId/paymentId/email/customerId in payload for event",
          event
        );
        return res.json({ ok: true, note: "no relevant id" });
      }

      // --- Find user: subscriptionId -> customerId -> email ---
      let user =
        subId
          ? await UserModel.findOne({
              "subscription.razorpaySubscriptionId": subId,
            })
          : null;

      if (!user && customerId) {
        user = await UserModel.findOne({
          "subscription.metadata.razorpayCustomerId": customerId,
        });
      }

      if (!user && customerEmail) {
        user = await UserModel.findOne({ email: customerEmail.toLowerCase() });
      }

      if (!user) {
        console.warn("[webhooks] user not found", {
          subId,
          paymentId,
          customerEmail,
          customerId,
          event,
        });
        return res.json({ ok: true, note: "user not found" });
      }

      const subDoc = ensureSubscription(user);

      // Always store / update subscription id when we see it
      if (subId && subDoc.razorpaySubscriptionId !== subId) {
        if (
          subDoc.razorpaySubscriptionId &&
          subDoc.razorpaySubscriptionId !== subId
        ) {
          console.warn("[webhooks] subscriptionId changed for user", {
            userId: String(user._id),
            old: subDoc.razorpaySubscriptionId,
            new: subId,
          });
          subDoc.metadata = subDoc.metadata || {};
          (subDoc.metadata as any).previousSubscriptionId =
            subDoc.razorpaySubscriptionId;
        }
        subDoc.razorpaySubscriptionId = subId;
      }

      // Also sync customerId into metadata if present
      if (customerId) {
        subDoc.metadata = subDoc.metadata || {};
        (subDoc.metadata as any).razorpayCustomerId = customerId;
      }

      // ---- Decide plan meta: pendingPlanKey > planId fallback ----
      const pendingPlanKey =
        (subDoc.metadata && (subDoc.metadata as any).pendingPlanKey) || null;

      let planMeta: PlanMeta | null = null;

      if (pendingPlanKey) {
        planMeta = mapPlanFromKey(pendingPlanKey);
      }

      if (!planMeta && planId) {
        planMeta = mapPlanFromId(planId);
      }

      console.log("[webhooks] plan resolution", {
        pendingPlanKey,
        planId,
        planMeta,
      });

      // ---- Handle subscription created / activated ----
      if (event === "subscription.activated" || event === "subscription.created") {
        subDoc.status = "active";

        if (planMeta) {
          user.tier = planMeta.tier;
          applyPlanToSubscription(subDoc, planMeta, invoiceEntity, subscriptionEntity);
        }

        if (subscriptionEntity?.current_end) {
          subDoc.currentPeriodEnd = new Date(
            subscriptionEntity.current_end * 1000
          );
        }

        const currentStartTs =
          subscriptionEntity?.current_start ||
          subscriptionEntity?.start_at ||
          subscriptionEntity?.created_at;

        if (!user.subscriptionStart) {
          user.subscriptionStart = currentStartTs
            ? new Date(currentStartTs * 1000)
            : new Date();
        }
        user.subscriptionEnd = null;

        if (subDoc.metadata && (subDoc.metadata as any).pendingPlanKey) {
          delete (subDoc.metadata as any).pendingPlanKey;
        }

        user.markModified("subscription");
        await user.save();
        console.info("[webhooks] subscription created/activated", {
          userId: String(user._id),
          tier: user.tier,
          status: subDoc.status,
        });
        return res.json({ ok: true });
      }

      // ---- Handle success payment / charge events ----
      if (
        event === "subscription.charged" ||
        event === "subscription.charged_successfully" ||
        event === "invoice.paid" ||
        event === "payment.captured" ||
        event === "order.paid"
      ) {
        subDoc.status = "active";

        if (paymentId) {
          subDoc.razorpayPaymentIds = subDoc.razorpayPaymentIds || [];
          if (!subDoc.razorpayPaymentIds.includes(paymentId)) {
            subDoc.razorpayPaymentIds.push(paymentId);
          }
        }

        if (planMeta) {
          user.tier = planMeta.tier;
          applyPlanToSubscription(subDoc, planMeta, invoiceEntity, subscriptionEntity);
        }

        const nextAttempt = invoiceEntity?.next_payment_attempt;
        if (nextAttempt) {
          subDoc.currentPeriodEnd = new Date(nextAttempt * 1000);
        } else if (subscriptionEntity?.current_end) {
          subDoc.currentPeriodEnd = new Date(
            subscriptionEntity.current_end * 1000
          );
        } else if (!subDoc.currentPeriodEnd) {
          const fallback = new Date();
          fallback.setMonth(fallback.getMonth() + 1);
          subDoc.currentPeriodEnd = fallback;
        }

        subDoc.metadata = subDoc.metadata || {};
        subDoc.metadata.lastInvoice = invoiceEntity?.id || null;

        if (subDoc.metadata && (subDoc.metadata as any).pendingPlanKey) {
          delete (subDoc.metadata as any).pendingPlanKey;
        }

        user.markModified("subscription");
        await user.save();
        console.info("[webhooks] payment success / subscription active", {
          userId: String(user._id),
          tier: user.tier,
          status: subDoc.status,
          event,
        });
        return res.json({ ok: true });
      }

      // ---- Handle failed payments ----
      if (
        event === "subscription.charged_unsuccessfully" ||
        event === "payment.failed"
      ) {
        subDoc.status = "past_due";
        user.markModified("subscription");
        await user.save();
        console.info("[webhooks] marked past_due", {
          userId: String(user._id),
          event,
        });
        return res.json({ ok: true });
      }

      // ---- Handle cancelled ----
      if (event === "subscription.cancelled") {
        subDoc.status = "cancelled";
        subDoc.currentPeriodEnd = new Date();
        user.subscriptionEnd = new Date();
        user.tier = "Free";
        user.markModified("subscription");
        await user.save();
        console.info("[webhooks] subscription cancelled", {
          userId: String(user._id),
        });
        return res.json({ ok: true });
      }

      // ---- Handle completed / expired (end of subscription) ----
      if (event === "subscription.completed" || event === "subscription.expired") {
        subDoc.status = "cancelled";
        const endedAt = subscriptionEntity?.ended_at
          ? new Date(subscriptionEntity.ended_at * 1000)
          : new Date();
        subDoc.currentPeriodEnd = endedAt;
        user.subscriptionEnd = endedAt;
        user.tier = "Free";
        user.markModified("subscription");
        await user.save();
        console.info("[webhooks] subscription completed/expired", {
          userId: String(user._id),
        });
        return res.json({ ok: true });
      }

      console.info("[webhooks] event ignored", event);
      return res.json({ ok: true, note: "event ignored" });
    } catch (err) {
      console.error("[webhooks] handler error", err);
      return res.status(500).send("server error");
    }
  }
);

export default router;
