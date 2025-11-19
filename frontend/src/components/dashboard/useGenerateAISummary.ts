// src/components/dashboard/useGenerateAISummary.ts
"use client";

import { useState, useCallback } from "react";
import { aiSummariesApi, AISummary } from "@/api/aiSummaries";

export type GeneratePayload =
  | { type: "trade"; tradeId: string }
  | { type: "weekly"; startDate?: string; endDate?: string };

export function useGenerateAISummary() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AISummary | null>(null);

  const generate = useCallback(async (payload: GeneratePayload) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Create proper request body
      const body: any = { type: payload.type };
      
      if (payload.type === "trade") {
        body.tradeId = payload.tradeId;
      } else if (payload.type === "weekly") {
        // For weekly summaries, use dateRange object
        if (payload.startDate) {
          body.dateRange = {
            start: payload.startDate,
            end: payload.endDate || payload.startDate,
          };
        }
      }

      console.log("Sending AI summary request:", body); // Debug log

      const res = await aiSummariesApi.generate(body);
      
      // Handle different response formats
      const aiSummary: AISummary = (res && (res as any).aiSummary) 
        ? (res as any).aiSummary 
        : (res as any);
      
      setResult(aiSummary);
      return aiSummary;
    } catch (err: any) {
      console.error("generateAISummary error:", err);
      
      // Extract meaningful error message from HTML response if needed
      let message = "Failed to generate AI summary";
      if (err?.message) {
        if (err.message.includes("<!DOCTYPE html>")) {
          message = "AI summary service is currently unavailable. Please check if the backend server is running.";
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