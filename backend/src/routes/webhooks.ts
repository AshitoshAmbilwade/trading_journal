// src/routes/webhooks.ts
import express from "express";
import crypto from "crypto";
import { UserModel } from "../models/User.js";

const router = express.Router();

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

// helper: timing-safe compare for signatures
function verifySignature(secret: string, bodyBuffer: Buffer, signature: string) {
  const expected = crypto.createHmac("sha256", secret).update(bodyBuffer).digest("hex");
  try {
    const sigBuf = Buffer.from(signature, "utf8");
    const expBuf = Buffer.from(expected, "utf8");
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch (e) {
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

  const event = payload.event;
  try {
    // normalize ids from payloads
    const invoiceEntity = payload.payload?.invoice?.entity;
    const paymentEntity = payload.payload?.payment?.entity;
    const subscriptionEntity = payload.payload?.subscription?.entity;

    const subId = subscriptionEntity?.id || invoiceEntity?.subscription_id || null;
    const paymentId = paymentEntity?.id || invoiceEntity?.payment_id || null;

    if (!subId && !paymentId) {
      // nothing to do for events without ids
      console.info("Webhook: no subId or paymentId in payload for event", event);
      return res.json({ ok: true, note: "no relevant id" });
    }

    // find user by subId
    const user = subId ? await UserModel.findOne({ "subscription.razorpaySubscriptionId": subId }) : null;
    // fallback: if no user but paymentId, try to find by paymentId (searching users is heavier; optional)
    // const userByPayment = !user && paymentId ? await UserModel.findOne({ "subscription.razorpayPaymentIds": paymentId }) : null;
    // const targetUser = user || userByPayment;

    if (user) {
      const subDoc = ensureSubscription(user);

      // handle success events
      if (event === "subscription.charged_successfully" || event === "invoice.paid" || event === "payment.captured" || event === "order.paid") {
        subDoc.status = "active";

        // idempotent push
        if (paymentId && !subDoc.razorpayPaymentIds?.includes(paymentId)) {
          subDoc.razorpayPaymentIds = subDoc.razorpayPaymentIds || [];
          subDoc.razorpayPaymentIds.push(paymentId);
        }

        const nextAttempt = invoiceEntity?.next_payment_attempt;
        if (nextAttempt) subDoc.currentPeriodEnd = new Date(nextAttempt * 1000);
        else {
          const fallback = new Date(); fallback.setMonth(fallback.getMonth() + 1);
          subDoc.currentPeriodEnd = subDoc.currentPeriodEnd || fallback;
        }

        // minimal metadata update (avoid saving raw huge payloads)
        subDoc.metadata = subDoc.metadata || {};
        subDoc.metadata.lastInvoice = invoiceEntity?.id || null;
        await user.save();
        console.info("Webhook: activated subscription for user", String(user._id), "event", event);
        return res.json({ ok: true });
      }

      // handle failed payments
      if (event === "subscription.charged_unsuccessfully" || event === "payment.failed") {
        subDoc.status = "past_due";
        await user.save();
        console.info("Webhook: marked past_due for user", String(user._id), "event", event);
        return res.json({ ok: true });
      }

      // handle cancelled
      if (event === "subscription.cancelled") {
        subDoc.status = "cancelled";
        subDoc.currentPeriodEnd = new Date();
        await user.save();
        console.info("Webhook: cancelled subscription for user", String(user._id));
        return res.json({ ok: true });
      }
    } else {
      // If we don't find a user, log for manual reconciliation
      console.warn("Webhook: user not found for subId", subId, "paymentId", paymentId, "event", event);
      // Optionally queue for manual handling or save to a reconciliation collection
      return res.json({ ok: true, note: "user not found" });
    }
  } catch (err) {
    console.error("webhook handler error", err);
    return res.status(500).send("server error");
  }
});

export default router;
