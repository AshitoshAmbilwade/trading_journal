// src/app/trades/[id]/page.tsx
import React from "react";
import TradeViewPage from "@/components/dashboard/TradeViewModal";

/**
 * Use `unknown` for incoming props to avoid `any` and the Next.js PageProps
 * mismatch. We then safely await and extract `id` with runtime checks.
 */
export default async function Page({ params }: { params: unknown }) {
  // Next sometimes provides params as a Promise — await it safely.
  const resolved = await params;

  // resolved may be anything; guard it and extract id if present and a string.
  let id = "";
  if (resolved && typeof resolved === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maybe = resolved as Record<string, unknown>;
    const raw = maybe["id"];
    if (typeof raw === "string") {
      id = raw;
    } else if (typeof raw === "number") {
      id = String(raw);
    } else if (raw != null) {
      // fallback: attempt to stringify (keeps behavior stable)
      id = String(raw);
    }
  }

  return <TradeViewPage tradeId={id} />;
}
