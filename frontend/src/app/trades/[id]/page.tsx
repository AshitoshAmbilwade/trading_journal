// app/trades/[id]/page.tsx  (App Router)
import TradeViewPage from "@/components/dashboard/TradeViewModal"; // path based on your project
import React from "react";

interface PageProps {
  params: { id: string };
}

export default function Page({ params }: PageProps) {
  // params.id is the dynamic route
  return <TradeViewPage tradeId={params.id} />;
}
