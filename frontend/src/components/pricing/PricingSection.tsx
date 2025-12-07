"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        "group relative flex w-full min-w-[260px] max-w-[360px] flex-col overflow-hidden rounded-3xl border bg-gradient-to-b from-neutral-900/90 to-black/95",
        "transition-transform duration-200",
        highlight
          ? "border-indigo-400/80 shadow-[0_0_40px_rgba(129,140,248,0.35)] scale-[1.02]"
          : "border-neutral-800 hover:border-neutral-600 hover:scale-[1.01]"
      )}
      role="group"
    >
      {/* subtle glow ring */}
      <div className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.2),_transparent_60%)] transition-opacity" />

      {/* Header */}
      <div className="relative z-10 px-5 pt-5 pb-4 border-b border-neutral-800/80">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {subtitle && (
              <p className="mt-1 text-[11px] leading-snug text-neutral-400">
                {subtitle}
              </p>
            )}
          </div>
          {tag && (
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-neutral-100">
              {tag}
            </span>
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-tight text-white">
              {price}
            </span>
            {billingPeriod && (
              <span className="text-xs text-neutral-400">
                {billingPeriod === "monthly" ? "/month" : "/year"}
              </span>
            )}
          </div>
          {billingPeriod && (
            <p className="mt-1 text-[11px] text-neutral-400">
              {billingPeriod === "monthly"
                ? "Billed every month"
                : "Billed every year"}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="relative z-10 flex-1 px-5 py-4">
        <ul className="space-y-3 text-sm">
          {features.map((f, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500/15">
                <CheckIcon className="h-3 w-3 text-indigo-300" />
              </span>
              <span className="text-sm leading-snug text-neutral-200">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="relative z-10 px-5 pb-5 pt-3 border-t border-neutral-800/80">
        <Button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "w-full h-10 rounded-full text-sm font-medium transition-all",
            disabled
              ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700"
              : "bg-white text-black hover:bg-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
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

  const toggleBilling = (period: BillingPeriod) => {
    setBillingPeriod(period);
  };

  const isProCurrent = userTier === "Premium";
  const isEliteCurrent = userTier === "UltraPremium";
  const hasActivePaidPlan = isProCurrent || isEliteCurrent;

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
    // Any active paid plan blocks new purchase (matches backend guard)
    if (isProCurrent) {
      return { label: "Current plan", disabled: true };
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
      return { label: "Current plan", disabled: true };
    }
    if (isProCurrent) {
      // user already on Prime, can’t switch mid-cycle (backend will block anyway)
      return { label: "Change plan after expiry", disabled: true };
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
    userTier === "Free" ? "Current plan" : "Included in all accounts";
  const freeButtonDisabled = true; // you can’t “buy” free here

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push("/dashboard");
  };

  return (
    <>
      {/* Full dark wrapper */}
      <section className="w-full bg-neutral-950 py-12 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4">
          {/* Heading */}
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-neutral-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Designed for serious traders
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Choose your trading co-pilot
            </h2>
            <p className="mt-3 text-sm text-neutral-300">
              Free to get started. Pro and Elite unlock automation, AI summaries,
              and trade sync so you spend less time logging and more time trading.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-neutral-800 bg-neutral-900/80 px-2 py-1">
              <button
                type="button"
                onClick={() => toggleBilling("monthly")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-all",
                  billingPeriod === "monthly"
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => toggleBilling("annual")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-all",
                  billingPeriod === "annual"
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                )}
              >
                Annual
              </button>
              <span className="ml-2 hidden text-[11px] text-neutral-400 sm:inline">
                {billingPeriod === "annual"
                  ? "Best value for long-term traders"
                  : "Switch to annual to save more"}
              </span>
            </div>
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
              tag="Most popular"
              onClick={
                proButton.disabled ? undefined : () => handleSubscribe("pro")
              }
            />

            {/* Elite / UltraPrime */}
            <SimplePricingCard
              title="Elite (UltraPrime)"
              subtitle="For traders who want everything automated"
              price={elitePrice}
              billingPeriod={billingPeriod}
              features={ELITE_FEATURES}
              buttonLabel={eliteButton.label}
              disabled={eliteButton.disabled}
              highlight={userTier === "UltraPremium"}
              tag={userTier === "UltraPremium" ? "Your plan" : "Power users"}
              onClick={
                eliteButton.disabled
                  ? undefined
                  : () => handleSubscribe("elite")
              }
            />
          </div>

          {/* Optional info text */}
          <p className="mx-auto max-w-2xl text-center text-[11px] text-neutral-500">
            All paid plans are auto-recurring via Razorpay. You can cancel anytime
            from your billing settings. Your tier automatically resets to Free if
            the subscription ends.
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
