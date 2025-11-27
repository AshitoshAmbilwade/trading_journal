// src/app/trades/[id]/page.tsx
import React from "react";
import TradeViewPage from "@/components/dashboard/TradeViewModal";

type Props = {
  params: {
    id: string;
  };
};

/**
 * Server page for /trades/[id]
 * - Next's app router will call this with { params: { id: string } }.
 * - Keep it a simple, correctly typed server component so the build's type-check passes.
 * - TradeViewPage is a client component — rendering it directly is fine.
 */
export default function Page({ params }: Props) {
  const id = params?.id ?? "";
  return <TradeViewPage tradeId={id} />;
}
