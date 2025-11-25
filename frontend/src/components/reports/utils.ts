// src/components/reports/utils.ts
import { WeeklyStats, Trade } from "./types";

export const DEFAULT_REFRESH_INTERVAL = 30000;

export const formatDate = (dateString?: string | number | Date): string => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateString);
  }
};

export const formatDateTime = (dateString?: string | number | Date): string => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dateString);
  }
};

export const formatCurrency = (value?: number | string, symbol: string = "₹"): string => {
  if (value === undefined || value === null) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  return `${symbol}${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatPercentage = (value?: number): string => {
  if (value === undefined || Number.isNaN(value as number)) return "-";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
};

// PnL display helper (defensive)
export const getPnLDisplay = (stats?: WeeklyStats, currencySymbol: string = "₹") => {
  if (!stats) return "-";
  if (stats.totalPnLDisplay && String(stats.totalPnLDisplay).trim() !== "") {
    return String(stats.totalPnLDisplay);
  }
  if (typeof stats.totalPnL === "number" && !Number.isNaN(stats.totalPnL)) {
    return formatCurrency(stats.totalPnL, currencySymbol);
  }
  if (stats.totalPnL && !isNaN(Number(stats.totalPnL))) {
    return formatCurrency(Number(stats.totalPnL), currencySymbol);
  }
  return "-";
};

// Core stats calculator (used as canonical source of truth if weeklyStats missing)
export const calculateAdvancedStats = (trades: Trade[] = [], weeklyStats?: WeeklyStats) => {
  const totalTrades = (trades.length || (weeklyStats?.totalTrades ?? 0));
  const winningTrades = (trades.filter(t => (t.pnl || 0) > 0).length || (weeklyStats?.winningTrades ?? 0));
  const losingTrades = (trades.filter(t => (t.pnl || 0) < 0).length || (weeklyStats?.losingTrades ?? 0));
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : (weeklyStats?.winRatePct ?? 0);

  const totalPnLFromTrades = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const totalPnL = (typeof weeklyStats?.totalPnL === "number" ? weeklyStats.totalPnL : totalPnLFromTrades) || 0;
  const avgPnL = totalTrades > 0 ? totalPnL / totalTrades : 0;

  const profitableTrades = trades.filter(t => (t.pnl || 0) > 0);
  const losingTradesList = trades.filter(t => (t.pnl || 0) < 0);

  const avgWin = profitableTrades.length > 0 ?
    profitableTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / profitableTrades.length : 0;
  const avgLoss = losingTradesList.length > 0 ?
    losingTradesList.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / losingTradesList.length : 0;

  const riskRewardRatio = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : (avgWin > 0 ? Infinity : 0);

  // Volatility (std dev)
  const pnls = trades.length > 0 ? trades.map(t => t.pnl || 0) : [(weeklyStats?.totalPnL as number) || 0];
  const mean = pnls.reduce((a, b) => a + b, 0) / pnls.length;
  const volatility = pnls.length > 0 ?
    Math.sqrt(pnls.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / pnls.length) : 0;

  // max drawdown
  let maxDrawdown = 0;
  let peak = 0;
  let runningTotal = 0;
  trades.forEach(trade => {
    runningTotal += trade.pnl || 0;
    if (runningTotal > peak) peak = runningTotal;
    const drawdown = peak - runningTotal;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });

  const sharpeRatio = volatility > 0 ? (avgPnL / volatility) * Math.sqrt(252) : 0;

  const consistencyScore = Math.max(0, Math.min(100,
    (winRate * 0.4) +
    (Math.min(riskRewardRatio, 3) * 20) +
    (Math.max(0, 100 - (maxDrawdown / (Math.abs(totalPnL) || 1)) * 100) * 0.2)
  ));

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    totalPnL,
    avgPnL,
    riskRewardRatio: Number(riskRewardRatio === Infinity ? 0 : Number(riskRewardRatio.toFixed(2))),
    volatility: Number(volatility.toFixed(2)),
    maxDrawdown,
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    consistencyScore: Math.round(consistencyScore),
    avgWin: Number(avgWin.toFixed(2)),
    avgLoss: Number(avgLoss.toFixed(2)),
    bestTrade: trades.length > 0 ?
      trades.reduce((best, current) => (current.pnl || 0) > (best.pnl || 0) ? current : best) :
      weeklyStats?.bestTrade,
    worstTrade: trades.length > 0 ?
      trades.reduce((worst, current) => (current.pnl || 0) < (worst.pnl || 0) ? current : worst) :
      weeklyStats?.worstTrade
  };
};
