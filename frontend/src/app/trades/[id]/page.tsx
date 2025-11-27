// src/app/trades/[id]/page.tsx
import React from "react";
import TradeViewPage from "@/components/dashboard/TradeViewModal";

/**
 * NOTE:
 * We intentionally type the incoming props as `any` here to avoid
 * colliding with Next.js' generated PageProps type for app routes.
 * The runtime behavior is unchanged: we still `await params` (Next
 * sometimes provides a Promise) and extract `id`.
 */
export default async function Page({ params }: any) {
  // await params before using its properties — required by Next.js
  const p = await params;
  const id = p?.id ?? "";

  // Render the client TradeViewPage component (unchanged logic)
  return <TradeViewPage tradeId={id} />;
}
