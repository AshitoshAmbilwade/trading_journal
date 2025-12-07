"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { paymentsApi, PlanKey } from "@/api/payments";

type BillingPeriod = "monthly" | "annual";
type Tier = "Free" | "Premium" | "UltraPremium";

interface PricingSectionProps {
  userTier: Tier; // from backend: "Free" | "Premium" | "UltraPremium"
  isAuthenticated: boolean; // true if user is logged in
  onRequireLogin?: () => void; // optional callback to open login modal, etc.
}

// ---- Razorpay global type (for TS) ----
declare global {
  interface Window {
    Razorpay?: any;
  }
}

// --- Feature lists ---
const PRO_FEATURES: string[] = [
  "4 weekly AI summaries (4x)",
  "1 monthly AI summary",
  "AI performance analysis",
  "Priority support",
  "Unlimited journaling",
  "Advanced dashboard",
  "Basic goals",
  "CSV/Excel import",
  "Basic PDF/CSV export",
  "Monthly email report",
  "Limited AI insights",
];

const ELITE_FEATURES: string[] = [
  "Everything in Pro",
  "Trade Sync (Zerodha/Upstox/Angel, etc.)",
  "Daily AI summaries",
  "Unlimited AI reports",
  "Advanced goals & habit tracking",
  "Priority support",
  "Faster AI processing",
];

// --- Plan config: maps card + billing -> label, price and backend plan key ---
const PLAN_CONFIG: {
  pro: {
    monthly: { label: string; price: string; planKey: PlanKey };
    annual: { label: string; price: string; planKey: PlanKey };
  };
  elite: {
    monthly: { label: string; price: string; planKey: PlanKey };
    annual: { label: string; price: string; planKey: PlanKey };
  };
} = {
  pro: {
    monthly: {
      label: "₹499/mo",
      planKey: "prime_monthly",
      price: "₹499/mo",
    },
    annual: {
      label: "₹4,999/yr",
      planKey: "prime_annual",
      price: "₹4,999/yr",
    },
  },
  elite: {
    monthly: {
      label: "₹1,299/mo",
      planKey: "ultraprime_monthly",
      price: "₹1,299/mo",
    },
    annual: {
      label: "₹12,999/yr",
      planKey: "ultraprime_annual",
      price: "₹12,999/yr",
    },
  },
};

// Simple pricing card inspired by your example (UI only, no CheckoutSheet)
interface SimplePricingCardProps {
  title: string;
  subtitle?: string;
  price: string;
  billingPeriod: BillingPeriod;
  features: string[];
  buttonLabel: string;
  disabled?: boolean;
  highlight?: boolean;
  onClick?: () => void;
}

function SimplePricingCard({
  title,
  subtitle,
  price,
  billingPeriod,
  features,
  buttonLabel,
  disabled = false,
  highlight = false,
  onClick,
}: SimplePricingCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white shadow-sm overflow-hidden flex flex-col",
        "min-w-[300px] max-w-[360px] w-full",
        highlight ? "border-black shadow-md" : "border-[#D9D9D9]"
      )}
      role="group"
    >
      {/* Header */}
      <div className="relative px-4 pt-4 pb-3 bg-[#F8F8F8]">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-gray-500 mt-1 leading-tight">
                {subtitle}
              </p>
            )}
          </div>
          {highlight && (
            <span className="inline-flex items-center rounded-full bg-black px-2 py-0.5 text-[10px] font-medium text-white">
              Most Popular
            </span>
          )}
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-medium text-black leading-tight">
              {price}
            </span>
            <span className="text-xs text-gray-500">
              {billingPeriod === "monthly" ? "/month" : "/year"}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-gray-600">
            {billingPeriod === "monthly"
              ? "Billed every month"
              : "Billed every year"}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 flex-1 min-h-[150px]">
        <ul className="space-y-3 text-sm">
          {features.map((f, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <CheckIcon className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
              <span className="text-sm text-gray-700 leading-tight">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div
        className="px-4 py-3"
        style={{
          background: "#F8F8F8",
          borderTop: "1px solid #E6E6E6",
        }}
      >
        <Button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "w-full h-10 rounded-md text-sm",
            disabled
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-black text-white hover:brightness-95"
          )}
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}

const PricingSection: React.FC<PricingSectionProps> = ({
  userTier,
  isAuthenticated,
  onRequireLogin,
}) => {
  const [billingPeriod, setBillingPeriod] =
    React.useState<BillingPeriod>("monthly");
  const [loadingPlan, setLoadingPlan] = React.useState<PlanKey | null>(null);

  const toggleBilling = () => {
    setBillingPeriod((prev) => (prev === "monthly" ? "annual" : "monthly"));
  };

  // Decide button states based on user tier
  const isProCurrent = userTier === "Premium";
  const isEliteCurrent = userTier === "UltraPremium";

  const handleSubscribe = async (card: "pro" | "elite") => {
    // Enforce login at UI level (backend will also enforce)
    if (!isAuthenticated) {
      if (onRequireLogin) onRequireLogin();
      else alert("Please log in to start a subscription.");
      return;
    }

    if (typeof window === "undefined") {
      alert("Payment can only be started in the browser.");
      return;
    }

    if (!window.Razorpay) {
      alert(
        "Razorpay SDK not loaded. Please check script include: https://checkout.razorpay.com/v1/checkout.js"
      );
      return;
    }

    const planConfig =
      card === "pro"
        ? PLAN_CONFIG.pro[billingPeriod]
        : PLAN_CONFIG.elite[billingPeriod];

    const planKey = planConfig.planKey;

    try {
      setLoadingPlan(planKey);

      // Call backend to create Razorpay subscription
      const res = await paymentsApi.createSubscription(planKey);

      if (!res.ok || !res.subscriptionId || !res.razorpayKeyId) {
        console.error("Failed to create subscription:", res);
        alert("Unable to start payment. Please try again.");
        return;
      }

      const options = {
        key: res.razorpayKeyId,
        subscription_id: res.subscriptionId,
        name: "TradeReportz",
        description: `Subscription – ${card === "pro" ? "Pro" : "Elite"} plan`,
        // optional: logo / image
        // image: "/logo.png",
        handler: function (_response: any) {
          // Razorpay payment success (front-end side)
          // Actual tier/status update is handled by webhook in backend.
          alert(
            "Payment successful! Your subscription will be activated shortly."
          );
          // Optionally: redirect to dashboard or success page
          // window.location.href = "/dashboard";
        },
        modal: {
          ondismiss: function () {
            // user closed the Razorpay modal
            console.log("Razorpay Checkout closed");
          },
        },
        // You can also add prefill, theme, notes if you want
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Error creating subscription:", err);
      alert("Something went wrong while connecting to payment. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  // Decide button labels & disabled state
  const getProButtonState = () => {
    if (isProCurrent) {
      return { label: "Current Plan", disabled: true };
    }
    if (isEliteCurrent) {
      return { label: "Downgrade not available", disabled: true };
    }
    if (loadingPlan === PLAN_CONFIG.pro[billingPeriod].planKey) {
      return { label: "Processing...", disabled: true };
    }
    return { label: "Choose Pro", disabled: false };
  };

  const getEliteButtonState = () => {
    if (isEliteCurrent) {
      return { label: "Current Plan", disabled: true };
    }
    if (loadingPlan === PLAN_CONFIG.elite[billingPeriod].planKey) {
      return { label: "Processing...", disabled: true };
    }
    return { label: "Choose Elite", disabled: false };
  };

  const proButton = getProButtonState();
  const eliteButton = getEliteButtonState();

  const proPrice =
    billingPeriod === "monthly"
      ? PLAN_CONFIG.pro.monthly.price
      : PLAN_CONFIG.pro.annual.price;

  const elitePrice =
    billingPeriod === "monthly"
      ? PLAN_CONFIG.elite.monthly.price
      : PLAN_CONFIG.elite.annual.price;

  return (
    <section className="w-full py-10">
      <div className="mx-auto max-w-5xl px-4">
        {/* Heading */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            Choose your trading co-pilot
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Start with Pro for part-time traders or Elite for serious,
            automation-first traders.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="text-xs text-gray-600">Monthly</span>
          <Switch
            checked={billingPeriod === "annual"}
            onCheckedChange={toggleBilling}
          />
          <span className="text-xs text-gray-900 font-medium">Annual</span>
          <span className="ml-2 rounded-full bg-black/5 px-2 py-0.5 text-[10px] text-gray-700">
            {billingPeriod === "annual"
              ? "Save more with yearly"
              : "Switch to yearly to save"}
          </span>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2 justify-items-center">
          {/* Pro / Prime */}
          <SimplePricingCard
            title="Pro"
            subtitle="Best for part-time or beginner traders"
            price={proPrice}
            billingPeriod={billingPeriod}
            features={PRO_FEATURES}
            buttonLabel={proButton.label}
            disabled={proButton.disabled}
            highlight={userTier === "Free" || userTier === "Premium"}
            onClick={
              proButton.disabled ? undefined : () => handleSubscribe("pro")
            }
          />

          {/* Elite / UltraPrime */}
          <SimplePricingCard
            title="Elite"
            subtitle="For serious traders who want automation"
            price={elitePrice}
            billingPeriod={billingPeriod}
            features={ELITE_FEATURES}
            buttonLabel={eliteButton.label}
            disabled={eliteButton.disabled}
            highlight={userTier === "UltraPremium"}
            onClick={
              eliteButton.disabled ? undefined : () => handleSubscribe("elite")
            }
          />
        </div>

        {/* Optional info text */}
        <p className="mt-6 text-center text-[11px] text-gray-500">
          All plans are auto-recurring via Razorpay. You can cancel anytime
          from your billing settings.
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
