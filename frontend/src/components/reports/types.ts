// src/components/reports/types.ts
export interface WeeklyStats {
  totalTrades?: number;
  winningTrades?: number;
  losingTrades?: number;
  winRatePct?: number;
  totalPnL?: number | string;
  totalPnLDisplay?: string;
  avgPnLPerTrade?: number;
  bestTrade?: any;
  worstTrade?: any;
  strategiesUsed?: string[];
  dominantIssues?: string[];
  riskRewardRatio?: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
  volatility?: number;
}

export interface Trade {
  _id?: string;
  symbol?: string;
  type?: string;
  quantity?: number;
  pnl?: number;
  entryPrice?: number;
  exitPrice?: number;
  strategy?: string;
  tradeDate?: string;
  brokerage?: number;
  pnlDisplay?: string;
  duration?: number;
  roi?: number;
}

export interface DateRange {
  start?: string;
  end?: string;
}

export interface ExtendedAISummary {
  _id?: string;
  id?: string;
  status?: "draft" | "ready" | "failed" | string;
  rawResponse?: string;
  model?: string;
  generatedAt?: string | number | Date;
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
  inputSnapshot?: {
    weeklyStats?: WeeklyStats;
    currencySymbol?: string;
    tradesSample?: Trade[];
    period?: string;
    totalTrades?: number;
    winningTrades?: number;
    totalPnL?: number;
    tradesSampleRaw?: Trade[];
  };
  plusPoints?: string[];
  minusPoints?: string[];
  aiSuggestions?: string[];
  weeklyStats?: WeeklyStats;        // parser may put structured stats here
  stats?: any;                     // legacy
  narrative?: string;              // long-form narrative produced by LLM
  type?: "weekly" | "monthly" | "trade" | string;
  dateRange?: DateRange;
  summaryText?: string;
  trades?: Trade[];
  snapshot?: {
    tradesSample?: Trade[];
  };
  performanceMetrics?: {
    consistencyScore?: number;
    riskAdjustedReturn?: number;
    efficiencyScore?: number;
  };
}
