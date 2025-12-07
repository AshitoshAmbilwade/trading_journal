"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { paymentsApi, PlanKey } from "@/api/payments";
import { PaymentSuccessModal } from "../payment/PaymentSuccessModal";

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
const FREE_FEATURES: string[] = [
  "Manual trade journaling",
  "Basic dashboard & stats",
  "Limited AI summaries",
  "Limited trade history",
  "Ads supported experience",
];

const PRO_FEATURES: string[] = [
  "4 weekly AI summaries (4x)",
  "1 monthly AI summary",
  "AI performance analysis",
  "Unlimited journaling",
  "Advanced dashboard",
  "Goals & basic habit tracking",
  "CSV/Excel import",
  "PDF/CSV export",
  "Monthly email report",
  "Ad-free experience",
];

const ELITE_FEATURES: string[] = [
  "Everything in Pro",
  "Trade Sync (Zerodha / Upstox / Angel, etc.)",
  "Daily AI summaries",
  "Unlimited AI reports",
  "Advanced goals & habit tracking",
  "Priority support",
  "Faster AI processing",
  "Ad-free experience",
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

// Simple pricing card
interface SimplePricingCardProps {
  title: string;
  subtitle?: string;
  price: string;
  billingPeriod?: BillingPeriod;
  features: string[];
  buttonLabel: string;
  disabled?: boolean;
  highlight?: boolean;
  tag?: string;
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
  tag,
  onClick,
}: SimplePricingCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col",
        "min-w-[260px] max-w-[340px] w-full",
        highlight ? "border-black shadow-md scale-[1.01]" : "border-[#D9D9D9]"
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
          {tag && (
            <span className="inline-flex items-center rounded-full bg-black px-2 py-0.5 text-[10px] font-medium text-white">
              {tag}
            </span>
          )}
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-medium text-black leading-tight">
              {price}
            </span>
            {billingPeriod && (
              <span className="text-xs text-gray-500">
                {billingPeriod === "monthly" ? "/month" : "/year"}
              </span>
            )}
          </div>
          {billingPeriod && (
            <p className="mt-1 text-[11px] text-gray-600">
              {billingPeriod === "monthly"
                ? "Billed every month"
                : "Billed every year"}
            </p>
          )}
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
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const router = useRouter();

  const toggleBilling = () => {
    setBillingPeriod((prev) => (prev === "monthly" ? "annual" : "monthly"));
  };

  const isProCurrent = userTier === "Premium";
  const isEliteCurrent = userTier === "UltraPremium";

  const handleSubscribe = async (card: "pro" | "elite") => {
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
        description: `Subscription – ${
          card === "pro" ? "Pro (Prime)" : "Elite (UltraPrime)"
        }`,
        handler: function (_response: any) {
          // Payment successful on Razorpay side.
          // Backend final activation is via webhook.
          setShowSuccessModal(true);
        },
        modal: {
          ondismiss: function () {
            console.log("Razorpay Checkout closed");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Error creating subscription:", err);
      alert(
        "Something went wrong while connecting to payment. Please try again."
      );
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

  // Free plan button state
  const freeButtonLabel =
    userTier === "Free" ? "Current Plan" : "Included in all accounts";
  const freeButtonDisabled = true; // you can’t “buy” free here

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push("/dashboard");
  };

  return (
    <>
      {/* Dark background wrapper */}
      <section className="w-full py-10 bg-black/80 text-white">
        <div className="mx-auto max-w-6xl px-4">
          {/* Heading */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              Choose your trading co-pilot
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              Free for getting started. Pro and Elite unlock serious,
              automation-first trading.
            </p>
          </div>

          {/* Billing toggle (only relevant for paid plans) */}
          <div className="mb-8 flex items-center justify-center gap-3">
            <span className="text-xs text-gray-300">Monthly</span>
            <Switch
              checked={billingPeriod === "annual"}
              onCheckedChange={toggleBilling}
            />
            <span className="text-xs font-medium">Annual</span>
            <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-gray-200">
              {billingPeriod === "annual"
                ? "Save more with yearly"
                : "Switch to yearly to save"}
            </span>
          </div>

          {/* Cards: Free, Pro, Elite */}
          <div className="grid gap-6 md:grid-cols-3 justify-items-center">
            {/* Free */}
            <SimplePricingCard
              title="Free"
              subtitle="Perfect to try TradeReportz"
              price="₹0"
              features={FREE_FEATURES}
              buttonLabel={freeButtonLabel}
              disabled={freeButtonDisabled}
              tag={userTier === "Free" ? "Current" : "Starter"}
              highlight={userTier === "Free"}
            />

            {/* Pro / Prime */}
            <SimplePricingCard
              title="Pro (Prime)"
              subtitle="Best for part-time or beginner traders"
              price={proPrice}
              billingPeriod={billingPeriod}
              features={PRO_FEATURES}
              buttonLabel={proButton.label}
              disabled={proButton.disabled}
              highlight={userTier === "Free" || userTier === "Premium"}
              tag="Most Popular"
              onClick={
                proButton.disabled ? undefined : () => handleSubscribe("pro")
              }
            />

            {/* Elite / UltraPrime */}
            <SimplePricingCard
              title="Elite (UltraPrime)"
              subtitle="For serious traders who want automation"
              price={elitePrice}
              billingPeriod={billingPeriod}
              features={ELITE_FEATURES}
              buttonLabel={eliteButton.label}
              disabled={eliteButton.disabled}
              highlight={userTier === "UltraPremium"}
              tag={userTier === "UltraPremium" ? "Your Plan" : "Power Users"}
              onClick={
                eliteButton.disabled
                  ? undefined
                  : () => handleSubscribe("elite")
              }
            />
          </div>

          {/* Optional info text */}
          <p className="mt-6 text-center text-[11px] text-gray-300">
            All paid plans are auto-recurring via Razorpay. You can cancel
            anytime from your billing settings. Your tier automatically resets
            to Free if the subscription ends.
          </p>
        </div>
      </section>

      {/* Success modal */}
      <PaymentSuccessModal
        open={showSuccessModal}
        onClose={handleSuccessModalClose}
      />
    </>
  );
};

export default PricingSection;
