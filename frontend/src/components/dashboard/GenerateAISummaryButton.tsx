"use client";

import React from "react";
import { useGenerateAISummary } from "./useGenerateAISummary";

type BaseProps = {
  className?: string;
  children?: React.ReactNode;
  onDone?: (summary: any) => void;
  onError?: (error: string) => void;
};

type TradeProps = BaseProps & {
  mode: "trade";
  tradeId: string;
};

type PeriodProps = BaseProps & {
  mode: "weekly" | "monthly";
  startDate?: string;
  endDate?: string;
};

type Props = TradeProps | PeriodProps;

export default function GenerateAISummaryButton(props: Props) {
  const { generate, loading } = useGenerateAISummary();

  const handleClick = async () => {
    try {
      let res;
      if (props.mode === "trade") {
        if (!("tradeId" in props) || !props.tradeId) {
          const errorMsg = "tradeId is required for trade summary generation.";
          alert(errorMsg);
          props.onError?.(errorMsg);
          return;
        }
        res = await generate({ type: "trade", tradeId: props.tradeId });
      } else {
        const start = (props as any).startDate;
        const end = (props as any).endDate;
        res = await generate({
          type: props.mode,
          startDate: start,
          endDate: end,
        });
      }

      // If the returned object is a draft (queued), inform user differently
      if (res) {
        alert("AI summary generated successfully!");
      }

      props.onDone?.(res);
    } catch (err: any) {
      console.error("Generate button error:", err);
      const errorMsg = err?.message || "Failed to generate AI summary. Please check the backend service.";
      alert(errorMsg);
      props.onError?.(errorMsg);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={
        props.className ??
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-black font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
      }
      title={props.mode === "trade" ? "Generate AI summary for this trade" : `Generate ${props.mode} AI summary`}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : null}
      {props.children ?? (props.mode === "trade" ? "Generate Summary" : `Generate ${props.mode === "weekly" ? "Weekly" : "Monthly"} Summary`)}
    </button>
  );
}
