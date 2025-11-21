"use client";

import { useState, useCallback } from "react";
import { aiSummariesApi, AISummary } from "../../api/aiSummaries";

export type GeneratePayload =
  | { type: "trade"; tradeId: string }
  | { type: "weekly" | "monthly"; startDate?: string; endDate?: string };

export function useGenerateAISummary() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AISummary | null>(null);

  const generate = useCallback(async (payload: GeneratePayload) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Build request body for backend
      const body: any = { type: payload.type };

      if (payload.type === "trade") {
        body.tradeId = (payload as any).tradeId;
      } else {
        // weekly/monthly
        if ((payload as any).startDate) {
          body.dateRange = {
            start: (payload as any).startDate,
            end: (payload as any).endDate || (payload as any).startDate,
          };
        }
      }

      const res = await aiSummariesApi.generate(body);

      // Backend might return:
      // 1) { aiSummary: {...} } (immediate) OR
      // 2) { summaryId: "..." } with 202 (queued)
      // Our api wrapper returns raw `res` or throws — handle both
      let aiSummary: AISummary | null = null;

      if (!res) {
        throw new Error("Empty response from AI service");
      }

      // If server returned the object directly (older shape)
      if ((res as any).aiSummary) {
        aiSummary = (res as any).aiSummary as AISummary;
      } else if ((res as any).summaryId) {
        // queued -> create minimal draft object so UI can show a placeholder
        aiSummary = {
          _id: (res as any).summaryId,
          type: payload.type as any,
          status: "draft",
          summaryText: "Queued - generating...",
          generatedAt: new Date().toISOString(),
        };
      } else if ((res as any)._id) {
        // maybe returned the summary directly
        aiSummary = res as AISummary;
      } else {
        // Unknown shape: try to detect aiSummary nested somewhere
        aiSummary = (res as any).data?.aiSummary || (res as any).data;
      }

      if (!aiSummary) {
        throw new Error("Unexpected AI response shape");
      }

      setResult(aiSummary);
      return aiSummary;
    } catch (err: any) {
      console.error("generateAISummary error:", err);
      let message = "Failed to generate AI summary";
      if (err?.message) {
        if (typeof err.message === "string" && err.message.includes("<!DOCTYPE html>")) {
          message = "AI summary service is currently unavailable. Check backend.";
        } else {
          message = err.message;
        }
      }
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    generate,
    loading,
    error,
    result,
  };
}
