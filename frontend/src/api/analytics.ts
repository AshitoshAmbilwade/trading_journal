// src/api/analytics.ts
import { fetchApi } from "../utils/apiHandler";

// --- Types ---
export interface AnalyticsSummary {
  totalTrades: number;
  totalPnl: number;
  avgPnl: number;
  winRate: number;
  largestWin: number;
  largestLoss: number;
}

export interface AnalyticsTimeSeries {
  _id: string; // date or month string
  totalTrades: number;
  totalPnl: number;
  avgPnl: number;
}

export interface AnalyticsDistribution {
  _id: string; // grouping key (segment, strategy, etc.)
  count: number;
  totalPnl: number;
  avgPnl: number;
}

// --- API Wrapper ---
export const analyticsApi = {
  /**
   * Summary statistics
   * GET /analytics/summary
   */
  getSummary: (filters?: {
    from?: string;
    to?: string;
    segment?: string;
    tradeType?: string;
    symbol?: string;
  }): Promise<AnalyticsSummary> => {
    return fetchApi({
      url: "/analytics/summary",
      method: "GET",
      params: filters,
    });
  },

  /**
   * Time series stats
   * GET /analytics/timeseries
   */
  getTimeSeries: (
    interval: "daily" | "weekly" | "monthly" = "daily",
    from?: string,
    to?: string
  ): Promise<AnalyticsTimeSeries[]> => {
    return fetchApi({
      url: "/analytics/timeseries",
      method: "GET",
      params: { interval, from, to },
    });
  },

  /**
   * Distribution by segment/tradeType/strategy
   * GET /analytics/distribution
   */
  getDistribution: (
    by: "segment" | "tradeType" | "strategy" | "type" = "segment"
  ): Promise<AnalyticsDistribution[]> => {
    return fetchApi({
      url: "/analytics/distribution",
      method: "GET",
      params: { by },
    });
  },
};
