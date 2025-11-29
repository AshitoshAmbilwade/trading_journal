// src/api/payments.ts
import { fetchApi } from "../utils/apiHandler";

export const paymentsApi = {
  /**
   * Creates a new Razorpay subscription for the authenticated user.
   * Backend must have POST /payments/create-subscription
   */
  createSubscription: () =>
    fetchApi<{ subscription: { id: string } }>({
      url: "/payments/create-subscription",
      method: "POST",
    }),

  /**
   * After Razorpay checkout success callback (handler),
   * verify the signature + payment on backend.
   */
  verifyPayment: (data: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }) =>
    fetchApi<{ ok: boolean; userId?: string }>({
      url: "/payments/verify",
      method: "POST",
      data,
    }),
};
