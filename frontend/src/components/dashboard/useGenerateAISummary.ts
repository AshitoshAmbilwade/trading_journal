"use client";

import { useState, useCallback } from "react";
import { aiSummariesApi, AISummary } from "../../api/aiSummaries";
import { AnyARecord } from "dns";

export type GeneratePayload =
  | { type: "trade"; tradeId: string }
  | { type: "weekly" | "monthly"; startDate?: string; endDate?: string };

/** Narrowing helpers */
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";
const hasKey = <K extends string>(obj: Record<string, unknown>, key: K): obj is Record<K, unknown> =>
  Object.prototype.hasOwnProperty.call(obj, key);

export function useGenerateAISummary() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AISummary | null>(null);

  const generate = useCallback(async (payload: GeneratePayload): Promise<AISummary> => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Build request body
      type RequestBody =
        | { type: "trade"; tradeId: string }
        | { type: "weekly" | "monthly"; dateRange?: { start: string; end: string } };

      let body: RequestBody;
      if (payload.type === "trade") {
        body = { type: "trade", tradeId: payload.tradeId };
      } else {
        const start = payload.startDate;
        const end = payload.endDate || payload.startDate;
        body = {
          type: payload.type,
          dateRange: start ? { start, end: end as string } : undefined,
        };
      }

      const res: unknown = await aiSummariesApi.generate(body as any);

      if (!isObject(res)) {
        throw new Error("Empty response from AI service");
      }

      let aiSummary: AISummary | null = null;

      // 1) { aiSummary: {...} }
      if (hasKey(res, "aiSummary") && isObject(res.aiSummary)) {
        aiSummary = (res.aiSummary as unknown) as AISummary;
      }
      // 2) queued -> { summaryId: "..." }
      else if (hasKey(res, "summaryId") && typeof (res as Record<string, unknown>).summaryId === "string") {
        const summaryId = (res as Record<string, unknown>).summaryId as string;
        const draft = {
          _id: summaryId,
          type: payload.type,
          status: "draft",
          summaryText: "Queued - generating...",
          generatedAt: new Date().toISOString(),
        };
        aiSummary = (draft as unknown) as AISummary;
      }
      // 3) returned the summary directly (has _id)
      else if (hasKey(res, "_id")) {
        aiSummary = (res as unknown) as AISummary;
      }
      // 4) nested under .data
      else if (hasKey(res, "data") && isObject((res as Record<string, unknown>).data)) {
        const data = (res as Record<string, unknown>).data!;
        if (hasKey(data as Record<string, unknown>, "aiSummary") && isObject((data as Record<string, unknown>).aiSummary)) {
          aiSummary = ((data as Record<string, unknown>).aiSummary as unknown) as AISummary;
        } else {
          aiSummary = (data as unknown) as AISummary;
        }
      } else {
        // best-effort: try common places
        const maybeAiSummary = (res as Record<string, unknown>).aiSummary ?? (res as Record<string, unknown>).data;
        if (isObject(maybeAiSummary)) {
          aiSummary = (maybeAiSummary as unknown) as AISummary;
        }
      }

      if (!aiSummary) {
        throw new Error("Unexpected AI response shape");
      }

      setResult(aiSummary);
      return aiSummary;
    } catch (err: unknown) {
      console.error("generateAISummary error:", err);
      let message = "Failed to generate AI summary";

      if (isObject(err) && hasKey(err, "message") && typeof (err as Record<string, unknown>).message === "string") {
        const emsg = (err as Record<string, unknown>).message as unknown;
        if (typeof emsg === "string") {
          if (emsg.includes("<!DOCTYPE html>")) {
            message = "AI summary service is currently unavailable. Check backend.";
          } else {
            message = emsg;
          }
        }
      } else if (typeof err === "string") {
        message = err;
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
