// src/app/analytics/page.tsx
import React from "react";
import AnalyticsShell from "@/components/analytics/AnalyticsShell";

export const metadata = {
  title: "Analytics • Earnotic",
  description: "Visual analytics for your trades — P/L, distributions, strategy radar and more.",
};

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-8">
      <main className="max-w-[1200px] mx-auto">
        <AnalyticsShell />
      </main>
    </div>
  );
}
