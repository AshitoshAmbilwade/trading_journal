// src/api/analytics.ts
import { fetchApi } from "../utils/apiHandler";

/**
 * ✅ Frontend Analytics API Client (simplified)
 * Matches backend routes:
 *   - GET /api/analytics/summary
 *   - GET /api/analytics/timeseries
 *   - GET /api/analytics/distribution
 *   - GET /api/analytics/trades
 */

/* --------------------- Types --------------------- */

export interface AnalyticsSummary {
  totalTrades: number;
  totalPnl: number;
  avgPnl: number;
  largestWin: number;
  largestLoss: number;
  winRate: number; // percent
}

export interface AnalyticsTimeSeriesItem {
  period: string; // "2025-11-01" | "2025-11" | etc.
  totalTrades: number;
  totalPnl: number;
  avgPnl: number;
}

export interface AnalyticsDistributionItem {
  _id: string | null; // segment | strategy | type | session
  count: number;
  totalPnl: number;
  avgPnl: number;
  winRate: number;
}

/* Trade shape returned by /analytics/trades */
export interface Trade {
  _id: string;
  userId?: string;
  symbol?: string;
  type?: string;
  quantity?: number;
  price?: number;
  pnl?: number;
  segment?: string;
  tradeType?: string;
  strategy?: string;
  session?: string;
  broker?: string;
  direction?: string;
  entryDate?: string; // ISO
  exitDate?: string; // ISO
  tradeDate?: string; // ISO (if present)
  createdAt?: string;
  updatedAt?: string;
  // allow additional fields but avoid `any`
  // use unknown to keep type-safety
  [key: string]: unknown;
}

/* --------------------- Filters --------------------- */
export interface AnalyticsFilters {
  from?: string;
  to?: string;
  segment?: string;
  tradeType?: string;
  strategy?: string;
  symbol?: string;
  direction?: string;
  session?: string;
  broker?: string;
  interval?: "daily" | "weekly" | "monthly";
  by?: string;
  limit?: number;
  skip?: number;
}

/* --------------------- API wrapper --------------------- */

export const analyticsApi = {
  /**
   * 🔹 1. Summary
   * GET /analytics/summary
   */
  getSummary: (filters?: AnalyticsFilters): Promise<AnalyticsSummary> =>
    fetchApi<AnalyticsSummary>({
      url: "analytics/summary",
      method: "GET",
      params: filters,
    }),

  /**
   * 🔹 2. Time-series performance
   * GET /analytics/timeseries?interval=daily|weekly|monthly
   */
  getTimeSeries: (
    params?: {
      interval?: "daily" | "weekly" | "monthly";
      from?: string;
      to?: string;
    }
  ): Promise<AnalyticsTimeSeriesItem[]> =>
    fetchApi<AnalyticsTimeSeriesItem[]>({
      url: "analytics/timeseries",
      method: "GET",
      params,
    }),

  /**
   * 🔹 3. Distribution
   * GET /analytics/distribution?by=segment|tradeType|strategy|session
   */
  getDistribution: (
    by: "segment" | "tradeType" | "strategy" | "type" | "session" = "segment",
    filters?: AnalyticsFilters
  ): Promise<AnalyticsDistributionItem[]> =>
    fetchApi<AnalyticsDistributionItem[]>({
      url: "analytics/distribution",
      method: "GET",
      params: { by, ...(filters || {}) },
    }),

  /**
   * 🔹 4. Raw trades (per-trade data)
   * GET /analytics/trades?from=...&to=...&limit=...&skip=...
   *
   * Returns: Trade[]
   */
  getTrades: (filters?: AnalyticsFilters): Promise<Trade[]> =>
    fetchApi<Trade[]>({
      url: "analytics/trades",
      method: "GET",
      params: filters,
    }),
};
