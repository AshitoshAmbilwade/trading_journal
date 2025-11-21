// src/api/aiSummries.ts
import { fetchApi } from "../utils/apiHandler";

// Period types
export type SummaryPeriod = "daily" | "weekly" | "monthly";

// Frontend interface aligned with backend schema
export interface AISummary {
  _id?: string;
  userId: string;
  type?: "trade" | "weekly" | "monthly";
  dateRange: {
    start: string;
    end: string;
  };
  summaryText: string;
  plusPoints: string[];
  minusPoints: string[];
  aiSuggestions?: string[];
  generatedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

// Request body for generating a summary
export interface AISummaryGenerateRequest {
  type: "trade" | "weekly" | "monthly";
  tradeId?: string;
  startDate?: string;
  endDate?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// API wrapper
export const aiSummariesApi = {
  /**
   * Generate AI summary (trade or weekly or monthly)
   * POST /api/ai/generate
   *
   * Note: we intentionally DO NOT add a leading slash so fetchApi's base prefix (like /api) won't double-up.
   */
  generate: (data: AISummaryGenerateRequest) =>
    fetchApi<any>({
      url: "ai/generate",
      method: "POST",
      data,
    }),

  /**
   * Get all summaries for the logged-in user
   * GET /api/ai
   */
  list: () =>
    fetchApi<{ summaries: AISummary[] }>({
      url: "ai",
      method: "GET",
    }),

  /**
   * Get single summary
   * GET /api/ai/:id
   */
  getOne: (summaryId: string) =>
    fetchApi<{ aiSummary: AISummary }>({
      url: `ai/${summaryId}`,
      method: "GET",
    }),

  /**
   * Delete summary
   * DELETE /api/ai/:id
   */
  delete: (summaryId: string) =>
    fetchApi({
      url: `ai/${summaryId}`,
      method: "DELETE",
    }),
};
