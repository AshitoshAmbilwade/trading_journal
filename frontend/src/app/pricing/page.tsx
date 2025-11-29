import PricingSection from "@/components/pricing/PricingSection";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing – Trading Journal",
  description: "Choose your plan – Free, Premium, or Ultra Premium",
  openGraph: {
    title: "Trading Journal Pricing",
    description: "Upgrade to Premium or Ultra Premium for advanced AI analytics and reports.",
  },
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <PricingSection />
      </div>
    </main>
  );
}
