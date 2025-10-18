import { fetchApi } from "../utils/apiHandler";

// Export types
export type ExportType = "PDF" | "CSV" | "Excel";
export type ExportPeriod = "daily" | "weekly" | "monthly" | "custom";

// Frontend interface aligned with backend
export interface ExportLog {
  _id?: string;
  userId: string;
  exportType: ExportType;
  fileName: string;
  period: ExportPeriod;
  totalTrades: number;
  generatedAt: string; // ISO string
  aiIncluded?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Request payload for generating an export
export interface ExportRequest {
  userId: string;
  type: "trades" | "ai-summary";
  period?: ExportPeriod; // optional for AI summaries
  startDate?: string;
  endDate?: string;
  format: ExportType;
  includeAI?: boolean; // optional flag to include AI summary
}

// Exports API wrapper
export const exportsApi = {
  // Generate a new export
  generate: (data: ExportRequest) =>
    fetchApi<ExportLog>({
      url: "/exports/generate",
      method: "POST",
      data,
    }),

  // Get all exports for a user
  getAll: (userId: string) =>
    fetchApi<ExportLog[]>({
      url: `/exports/${userId}`,
      method: "GET",
    }),
};
