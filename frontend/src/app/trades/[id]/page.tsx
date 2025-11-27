// src/app/trades/[id]/page.tsx
import React from "react";
import TradeViewPage from "@/components/dashboard/TradeViewModal";

/**
 * Next.js App Router passes `params` as a plain object (not a Promise) at runtime.
 * Keep the prop typing simple and compatible with Next's generated PageProps.
 *
 * We declare the incoming prop shape inline in the function signature to avoid
 * mismatches with Next's internal PageProps utility types.
 */

type Props = {
  params: { id: string };
};

export default function Page({ params }: Props) {
  const id = params?.id ?? null;

  // TradeViewPage likely is a client component and accepts tradeId prop.
  // We simply forward the id (or null) — no logic change.
  return <TradeViewPage tradeId={id} />;
}
