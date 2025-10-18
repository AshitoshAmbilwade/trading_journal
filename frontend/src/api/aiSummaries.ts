import { fetchApi } from "../utils/apiHandler";

// Period types
export type SummaryPeriod = "daily" | "weekly" | "monthly";

// Frontend interface aligned with backend schema
export interface AISummary {
  _id?: string;
  userId: string;
  period: SummaryPeriod;
  dateRange: {
    start: string; // ISO string
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
export interface AISummaryRequest {
  userId: string;
  period: SummaryPeriod;
  startDate?: string; // optional: override default range
  endDate?: string;
}

// API wrapper
export const aiSummariesApi = {
  // Generate a new AI summary
  generate: (data: AISummaryRequest) =>
    fetchApi<AISummary>({
      url: "/ai-summaries/generate",
      method: "POST",
      data,
    }),

  // Get existing summaries for a user (optional: filter by period)
  getByUser: (userId: string, period?: SummaryPeriod) =>
    fetchApi<AISummary[]>({
      url: `/ai-summaries/${userId}`,
      method: "GET",
      params: period ? { period } : undefined,
    }),
};
