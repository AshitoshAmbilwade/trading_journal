// src/app/trades/[id]/page.tsx
"use client";

import React from "react";
import { useParams } from "next/navigation";
import TradeViewPage from "@/components/dashboard/TradeViewModal";

/**
 * Client wrapper for /trades/[id]
 *
 * Reason:
 * - Server-side typing for PageProps in your Next version is causing a type-constraint failure during build.
 * - Making this a client component and using useParams() avoids the generated PageProps type entirely,
 *   while keeping runtime behavior identical: TradeViewPage still receives the tradeId.
 *
 * No changes to TradeViewPage are required.
 */
export default function PageClient() {
  const params = useParams() as { id?: string } | null;
  const id = params?.id ?? "";

  return <TradeViewPage tradeId={id} />;
}
