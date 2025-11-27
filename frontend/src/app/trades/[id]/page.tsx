// src/app/trades/[id]/page.tsx
import React from "react";
import TradeViewPage from "@/components/dashboard/TradeViewModal";

export default async function Page({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  // await params before using its properties — required by Next.js
  const p = await params;
  const id = p?.id ?? "";

  // If TradeViewPage is a client component, that's fine — you can render it from here
  return <TradeViewPage tradeId={id} />;
}
