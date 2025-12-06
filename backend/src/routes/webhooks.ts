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
  return user.subscription;
}

// ---- PLAN META TYPES ----
interface PlanMeta {
  tier: Tier;
  planLabel: string;
}

/**
 * Map from plan_key (coming from Razorpay notes.plan_key) -> tier + label.
 *
 * We expect you to configure Subscription Links in Razorpay with Notes:
 * - plan_key = "prime_monthly"
 * - plan_key = "prime_annual"
 * - plan_key = "ultraprime_monthly"
 * - plan_key = "ultraprime_annual"
 */
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

/**
 * Fallback: map from Razorpay plan.id (or plan_id) to our meta
 * using env variables (for when plan_id is present).
 */
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
function verifySignature(secret: string, bodyBuffer: Buffer, signature: string) {
  const expected = crypto.createHmac("sha256", secret).update(bodyBuffer).digest("hex");
  try {
    const sigBuf = Buffer.from(signature, "utf8");
    const expBuf = Buffer.from(expected, "utf8");
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

router.post("/razorpay", express.raw({ type: "*/*" }), async (req, res) => {
  const secret = process.env.RZP_WEBHOOK_SECRET;
  const signature = (req.headers["x-razorpay-signature"] as string) || "";
  const bodyBuffer = req.body as Buffer;

  if (!signature || !secret) {
    console.warn("Webhook: missing signature or secret");
    return res.status(400).send("Missing signature/secret");
  }

  if (!verifySignature(secret, bodyBuffer, signature)) {
    console.warn("Webhook: invalid signature");
    return res.status(401).send("Invalid signature");
  }

  let payload: any;
  try {
    payload = JSON.parse(bodyBuffer.toString());
  } catch (err) {
    console.error("webhook: invalid json", err);
    return res.status(400).send("Invalid JSON");
  }

  const event = payload.event as string;

  try {
    const invoiceEntity = payload.payload?.invoice?.entity;
    const paymentEntity = payload.payload?.payment?.entity;
    const subscriptionEntity = payload.payload?.subscription?.entity;

    // IDs
    const subId: string | null =
      subscriptionEntity?.id ||
      invoiceEntity?.subscription_id ||
      paymentEntity?.subscription_id ||
      null;

    const paymentId: string | null =
      paymentEntity?.id || invoiceEntity?.payment_id || null;

    // Try to get plan id and plan key (from notes)
    const planId: string | null =
      subscriptionEntity?.plan_id ||
      subscriptionEntity?.plan?.id ||
      invoiceEntity?.plan_id ||
      invoiceEntity?.plan?.id ||
      null;

    const planKeyFromNotes: string | null =
      subscriptionEntity?.notes?.plan_key ||
      invoiceEntity?.notes?.plan_key ||
      paymentEntity?.notes?.plan_key ||
      null;

    // Customer email
    const customerEmail: string | null =
      subscriptionEntity?.customer_details?.email ||
      invoiceEntity?.customer_details?.email ||
      paymentEntity?.email ||
      null;

    // Debug logs (keep them while testing; you can remove later)
    console.log("RZP Webhook event:", event);
    console.log("  subId:", subId);
    console.log("  paymentId:", paymentId);
    console.log("  planId:", planId);
    console.log("  planKeyFromNotes:", planKeyFromNotes);
    console.log("  customerEmail:", customerEmail);

    // If we have absolutely no identifiers, nothing to do
    if (!subId && !paymentId && !customerEmail) {
      console.info("Webhook: no subId/paymentId/email in payload for event", event);
      return res.json({ ok: true, note: "no relevant id" });
    }

    // --- Find user: first by subscriptionId, then by email ---
    let user =
      subId
        ? await UserModel.findOne({
            "subscription.razorpaySubscriptionId": subId,
          })
        : null;

    if (!user && customerEmail) {
      user = await UserModel.findOne({
        email: customerEmail.toLowerCase(),
      });
    }

    if (!user) {
      console.warn(
        "Webhook: user not found for subId",
        subId,
        "paymentId",
        paymentId,
        "email",
        customerEmail,
        "event",
        event
      );
      return res.json({ ok: true, note: "user not found" });
    }

    const subDoc = ensureSubscription(user);
    if (subId && !subDoc.razorpaySubscriptionId) {
      subDoc.razorpaySubscriptionId = subId;
    }

    // --- Decide which plan meta to use (plan_key > planId) ---
    let planMeta: PlanMeta | null = null;

    // 1) Prefer plan_key from notes (subscription links)
    if (planKeyFromNotes) {
      planMeta = mapPlanFromKey(planKeyFromNotes);
    }

    // 2) Fallback to env-mapped planId
    if (!planMeta && planId) {
      planMeta = mapPlanFromId(planId);
    }

    // ---- Handle subscription created / activated ----
    if (event === "subscription.activated" || event === "subscription.created") {
      subDoc.status = "active";

      if (planMeta) {
        user.tier = planMeta.tier;
        subDoc.plan = {
          name: planMeta.planLabel,
          baseAmount: subDoc.plan?.baseAmount ?? 0,
          gstPercent: subDoc.plan?.gstPercent ?? 0,
          totalAmount: subDoc.plan?.totalAmount ?? 0,
          currency: subDoc.plan?.currency ?? "INR",
        };
      }

      if (subscriptionEntity?.current_end) {
        subDoc.currentPeriodEnd = new Date(subscriptionEntity.current_end * 1000);
      }

      user.subscriptionStart =
        user.subscriptionStart ||
        new Date(subscriptionEntity?.current_start * 1000 || Date.now());
      user.subscriptionEnd = null;

      await user.save();
      console.info("Webhook: subscription created/activated for user", String(user._id));
      return res.json({ ok: true });
    }

    // ---- Handle success payment / charge events ----
    if (
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
        subDoc.plan = {
          name: planMeta.planLabel,
          baseAmount: subDoc.plan?.baseAmount ?? 0,
          gstPercent: subDoc.plan?.gstPercent ?? 0,
          totalAmount: subDoc.plan?.totalAmount ?? 0,
          currency: subDoc.plan?.currency ?? "INR",
        };
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

      await user.save();
      console.info(
        "Webhook: payment success / subscription active for user",
        String(user._id),
        "event",
        event
      );
      return res.json({ ok: true });
    }

    // ---- Handle failed payments ----
    if (event === "subscription.charged_unsuccessfully" || event === "payment.failed") {
      subDoc.status = "past_due";
      await user.save();
      console.info("Webhook: marked past_due for user", String(user._id), "event", event);
      return res.json({ ok: true });
    }

    // ---- Handle cancelled ----
    if (event === "subscription.cancelled") {
      subDoc.status = "cancelled";
      subDoc.currentPeriodEnd = new Date();
      user.subscriptionEnd = new Date();
      user.tier = "Free";
      await user.save();
      console.info("Webhook: cancelled subscription for user", String(user._id));
      return res.json({ ok: true });
    }

    // ---- Unhandled event types ----
    console.info("Webhook: event ignored", event);
    return res.json({ ok: true, note: "event ignored" });
  } catch (err) {
    console.error("webhook handler error", err);
    return res.status(500).send("server error");
  }
});

export default router;
