"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown } from "lucide-react";
import { paymentsApi } from "@/api/payments";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

const plans = [
  {
    name: "Free",
    price: "₹0",
    highlight: false,
    icon: <Check className="w-5 h-5 text-green-500" />,
    features: [
      "Basic trade journal",
      "Dashboard & analytics",
      "Manual trade entry",
      "CSV Import (limited)",
      "Basic filters",
    ],
    button: "Current Plan",
    disabled: true,
  },
  {
    name: "Premium",
    price: "₹500/mo",
    highlight: true,
    icon: <Sparkles className="w-5 h-5 text-yellow-500" />,
    features: [
      "Advanced analytics",
      "Smart AI summaries",
      "Unlimited CSV Imports",
      "Export Reports (PDF/CSV)",
      "Email Weekly Reports",
    ],
    planKey: "premium",
  },
  {
    name: "Ultra Premium",
    price: "₹999/mo",
    highlight: false,
    icon: <Crown className="w-5 h-5 text-purple-600" />,
    features: [
      "Everything in Premium",
      "Trade sync (Brokers)",
      "Trading Lab (Goals)",
      "Strategy Radar AI+",
      "Early Access Features",
    ],
    planKey: "ultra",
  },
];

export default function PricingSection() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const loadRazorpay = () =>
    new Promise<void>((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.body.appendChild(script);
    });

  const handleSubscribe = async (planKey: string) => {
    try {
      setLoadingPlan(planKey);

      await loadRazorpay();

      // 1. Create subscription
      const { subscription } = await paymentsApi.createSubscription();

      if (!subscription?.id) throw new Error("Failed to create subscription");

      // 2. Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RZP_KEY_ID,
        subscription_id: subscription.id,
        name: "Trading Journal",
        description: `Activate ${planKey} plan`,
        theme: { color: "#000" },
        handler: async function (response: any) {
          await paymentsApi.verifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_signature: response.razorpay_signature,
          });

          alert("🎉 Subscription Activated!");
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Subscribe error:", err);
      alert("Payment failed. Try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-12">
      <h2 className="text-3xl font-bold text-center mb-10">
        Choose Your Plan
      </h2>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`border rounded-xl shadow-sm ${
              plan.highlight
                ? "border-yellow-500 shadow-yellow-300/30 scale-[1.02]"
                : ""
            }`}
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                {plan.icon}
                <CardTitle className="text-xl">{plan.name}</CardTitle>
              </div>
              <p className="text-3xl font-semibold">{plan.price}</p>
            </CardHeader>

            <CardContent>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.name === "Free" ? (
                <Button disabled className="w-full">
                  Current Plan
                </Button>
              ) : (
                <Button
                  className="w-full bg-black text-white hover:bg-neutral-800"
                  disabled={loadingPlan === plan.planKey}
                  onClick={() => handleSubscribe(plan.planKey!)}
                >
                  {loadingPlan === plan.planKey
                    ? "Processing..."
                    : `Choose ${plan.name}`}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
