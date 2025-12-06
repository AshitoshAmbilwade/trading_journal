"use client";

import PricingSection from "@/components/pricing/PricingSection";
import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const { user, isAuthenticated, loading } = useUser();
  const router = useRouter();

  const handleRequireLogin = () => {
    // You can open a modal instead if you want
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Optional: you can add a skeleton loader while user is loading */}
        {loading ? (
          <div className="text-center text-sm text-gray-500">Loading...</div>
        ) : (
          <PricingSection
            userTier={user?.tier ?? "Free"}
            isAuthenticated={isAuthenticated}
            onRequireLogin={handleRequireLogin}
          />
        )}
      </div>
    </main>
  );
}
