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

router.post(
  "/razorpay",
  // we *try* to get the raw body, but we'll also be robust if some JSON parser already ran
  express.raw({ type: "*/*" }),
  async (req, res) => {
    const secret = process.env.RZP_WEBHOOK_SECRET;
    const signature = (req.headers["x-razorpay-signature"] as string) || "";

    if (!signature || !secret) {
      console.warn("Webhook: missing signature or secret");
      return res.status(400).send("Missing signature/secret");
    }

    const body: any = req.body;

    let rawBodyBuffer: Buffer;
    let payload: any;

    try {
      if (Buffer.isBuffer(body)) {
        // Ideal case: raw buffer
        rawBodyBuffer = body;
        payload = JSON.parse(body.toString());
      } else if (typeof body === "string") {
        // If some middleware gave us a string
        rawBodyBuffer = Buffer.from(body);
        payload = JSON.parse(body);
      } else {
        // Already parsed JSON object (Express/BodyParser ran before us)
        const str = JSON.stringify(body);
        rawBodyBuffer = Buffer.from(str);
        payload = body;
      }
    } catch (err) {
      console.error("webhook: invalid json", err);
      return res.status(400).send("Invalid JSON");
    }

    // ✅ FIX: now we always pass a Buffer to crypto, no more "Received an instance of Object"
    if (!verifySignature(secret, rawBodyBuffer, signature)) {
      console.warn("Webhook: invalid signature");
      return res.status(401).send("Invalid signature");
    }

    const event = payload.event as string;

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

      console.log("RZP Webhook event:", event);
      console.log("  subId:", subId);
      console.log("  paymentId:", paymentId);
      console.log("  planId:", planId);
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
        user = await UserModel.findOne({ email: customerEmail.toLowerCase() });
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

      // Always store subscription id when we see it
      if (subId && !subDoc.razorpaySubscriptionId) {
        subDoc.razorpaySubscriptionId = subId;
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

      console.log("  pendingPlanKey:", pendingPlanKey);
      console.log("  resolved planMeta:", planMeta);

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

        // Once subscription is active, we no longer need pendingPlanKey
        if (subDoc.metadata && (subDoc.metadata as any).pendingPlanKey) {
          delete (subDoc.metadata as any).pendingPlanKey;
        }

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
          subDoc.currentPeriodEnd = new Date(subscriptionEntity.current_end * 1000);
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

      console.info("Webhook: event ignored", event);
      return res.json({ ok: true, note: "event ignored" });
    } catch (err) {
      console.error("webhook handler error", err);
      return res.status(500).send("server error");
    }
  }
);

export default router;
