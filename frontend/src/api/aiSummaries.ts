import { fetchApi } from "../utils/apiHandler";

// Period types
export type SummaryPeriod = "daily" | "weekly" | "monthly";

// Frontend interface aligned with backend schema
export interface AISummary {
  _id?: string;
  userId: string;
  period: SummaryPeriod;
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
  type: "trade" | "weekly";
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
   * Generate AI summary (trade or weekly)
   * POST /api/ai/generate
   */
  generate: (data: AISummaryGenerateRequest) =>
    fetchApi<AISummary>({
      url: "/ai/generate", // Fixed: added proper endpoint path
      method: "POST",
      data,
    }),

  /**
   * Get all summaries for the logged-in user
   * GET /api/ai
   */
  list: () =>
    fetchApi<{ summaries: AISummary[] }>({
      url: "/api/ai", // Fixed: added proper endpoint path
      method: "GET",
    }),

  /**
   * Get single summary
   * GET /api/ai/:id
   */
  getOne: (summaryId: string) =>
    fetchApi<{ aiSummary: AISummary }>({
      url: `/ai/${summaryId}`, // Fixed: added proper endpoint path
      method: "GET",
    }),

  /**
   * Delete summary
   * DELETE /api/ai/:id
   */
  delete: (summaryId: string) =>
    fetchApi({
      url: `/ai/${summaryId}`, // Fixed: added proper endpoint path
      method: "DELETE",
    }),
};