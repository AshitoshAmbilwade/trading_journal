// src/api/payments.ts
import { fetchApi } from "../utils/apiHandler";
export type PlanKey =
  | "prime_monthly"
  | "prime_annual"
  | "ultraprime_monthly"
  | "ultraprime_annual";

export type Tier = "Free" | "Premium" | "UltraPremium";

interface SubscriptionLinkResponse {
  ok: boolean;
  plan: PlanKey;
  url: string;
}

interface CreateSubscriptionResponse {
  ok: boolean;
  plan: PlanKey;
  tier: Exclude<Tier, "Free">;
  subscriptionId: string;
  razorpayKeyId: string | null;
  subscription: any;
}

export const paymentsApi = {
  getSubscriptionLink: (plan: PlanKey) =>
    fetchApi<SubscriptionLinkResponse>({
      url: `/payments/subscription-link?plan=${plan}`,
      method: "GET",
    }),

  // ✅ send plan in query + body (defensive)
  createSubscription: (plan: PlanKey) =>
    fetchApi<CreateSubscriptionResponse>({
      url: `/payments/create-subscription?plan=${plan}`,
      method: "POST",
      body: { plan }, // even if this fails, query still works
    }),
};
