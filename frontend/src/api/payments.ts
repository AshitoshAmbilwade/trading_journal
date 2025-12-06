// src/api/payments.ts
import { fetchApi } from "../utils/apiHandler";

// Match the keys we used in backend PLAN_LINKS
export type PlanKey =
  | "prime_monthly"
  | "prime_annual"
  | "ultraprime_monthly"
  | "ultraprime_annual";

interface SubscriptionLinkResponse {
  ok: boolean;
  plan: PlanKey;
  url: string;
}

/**
 * Payments API wrapper.
 * We are using Razorpay Subscription Links, so:
 * - No "create-subscription" from frontend
 * - No "verify payment" from frontend
 * - Only: ask backend for the correct subscription link,
 *   which is protected by auth middleware.
 */
export const paymentsApi = {
  /**
   * Get Razorpay Subscription Link URL for a given plan.
   * Backend route: GET /payments/subscription-link?plan=...
   *
   * - Requires user to be authenticated (401 if not)
   * - Returns: { ok: true, plan, url }
   */
  getSubscriptionLink: (plan: PlanKey) =>
    fetchApi<SubscriptionLinkResponse>({
      url: `/payments/subscription-link?plan=${plan}`,
      method: "GET",
    }),
};
