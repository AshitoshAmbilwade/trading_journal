"use client";

import React, { useEffect, useMemo, useState } from "react";
import { analyticsApi, Trade } from "@/api/analytics";
import { KPICard } from "./KPICard";
import { PerformanceChart } from "./PerformanceChart";
import { PnLDistribution } from "./PnLDistribution";
import { StrategyRadar } from "./StrategyRadar";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, Calendar, Target, Download, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import SegmentPerformance from "./SegmentPerformance";

type TimeSeriesPoint = {
  period?: string;
  totalPnl: number;
  totalTrades?: number;
  avgPnl?: number;
};

type DistItem = { _id: string; count: number; totalPnl: number; avgPnl?: number };

type Interval = "daily" | "weekly" | "monthly" | "custom";

/** A flexible shape we may get back from analyticsApi summary endpoint. */
type SummaryLike = {
  totalPnl?: unknown;
  totalPnlTrend?: unknown;
  winRate?: unknown;
  winRateTrend?: unknown;
  avgPnl?: unknown;
  avgPnlTrend?: unknown;
  totalTrades?: unknown;
  tradesTrend?: unknown;
} | null;

/**
 * Helper to compute from/to ISO date range
 */
function computeRange(interval: Interval, customFrom?: Date, customTo?: Date) {
  const now = new Date();
  let from = customFrom ? new Date(customFrom) : new Date(now);
  let to = customTo ? new Date(customTo) : new Date(now);

  if (interval === "daily") {
    from = new Date(now);
    to = new Date(now);
  } else if (interval === "weekly") {
    from = new Date(now);
    from.setDate(now.getDate() - 6);
  } else if (interval === "monthly") {
    from = new Date(now);
    from.setDate(now.getDate() - 29);
  } else if (interval === "custom") {
    if (!customFrom && !customTo) {
      from = new Date(now);
      from.setDate(now.getDate() - 6);
    } else {
      if (!customFrom) from = new Date(now);
      if (!customTo) to = new Date(now);
    }
  }

  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  return { from: from.toISOString(), to: to.toISOString() };
}

/** Narrowing helpers */
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";
const toNumber = (v: unknown) => {
  const n = Number(v as unknown);
  return Number.isFinite(n) ? n : 0;
};

export default function AnalyticsShell() {
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<SummaryLike>(null);
  const [timeseries, setTimeseries] = useState<TimeSeriesPoint[]>([]);
  const [distStrategy, setDistStrategy] = useState<DistItem[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});
  const [interval, setInterval] = useState<Interval>("weekly");

  // Main loader
  const loadAll = async (useRange?: { from: string; to: string }) => {
    setLoading(true);
    try {
      const range = useRange ?? computeRange(interval, customRange.from, customRange.to);

      const [sRaw, tRaw, dStrRaw, rawTrades] = await Promise.all([
        analyticsApi.getSummary({ from: range.from, to: range.to }),
        analyticsApi.getTimeSeries({
          interval: interval === "custom" ? "daily" : interval,
          from: range.from,
          to: range.to,
        }),
        analyticsApi.getDistribution("strategy", {
          from: range.from,
          to: range.to,
        }),
        analyticsApi.getTrades({
          from: range.from,
          to: range.to,
          limit: 5000,
        }),
      ]);

      // normalize helpers
      const normalizeSummary = (s: unknown): SummaryLike => {
        if (!s) return null;
        if (isRecord(s)) return s as SummaryLike;
        return null;
      };

      const normalizeTimeSeries = (t: unknown): TimeSeriesPoint[] => {
        if (!Array.isArray(t)) return [];
        return t.map((item) => {
          if (isRecord(item)) {
            return {
              period: item.period ? String(item.period) : undefined,
              totalPnl: toNumber(item.totalPnl),
              totalTrades: item.totalTrades ? toNumber(item.totalTrades) : undefined,
              avgPnl: item.avgPnl ? toNumber(item.avgPnl) : undefined,
            } as TimeSeriesPoint;
          }
          return { period: undefined, totalPnl: 0 };
        });
      };

      const normalizeDist = (ds: unknown): DistItem[] => {
        if (!Array.isArray(ds)) return [];
        return ds.map((i) => {
          if (isRecord(i)) {
            return {
              _id: i._id ? String(i._id) : "Unknown",
              count: i.count ? toNumber(i.count) : 0,
              totalPnl: i.totalPnl ? toNumber(i.totalPnl) : 0,
              avgPnl: i.avgPnl !== undefined ? toNumber(i.avgPnl) : undefined,
            } as DistItem;
          }
          return { _id: "Unknown", count: 0, totalPnl: 0 };
        });
      };

      const normalizeTrades = (tr: unknown): Trade[] => {
        if (!Array.isArray(tr)) return [];
        // try to cast each item to Trade conservatively
        return tr
          .filter((it) => isRecord(it))
          .map((it) => {
            // best-effort mapping, keep original object but typed as Trade
            return it as unknown as Trade;
          });
      };

      const noTradesToday = interval === "daily" && (!Array.isArray(rawTrades) || rawTrades.length === 0);

      if (noTradesToday) {
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayRange = computeRange("custom", yesterdayDate, yesterdayDate);

        const [s2Raw, t2Raw, dStr2Raw, trades2Raw] = await Promise.all([
          analyticsApi.getSummary({ from: yesterdayRange.from, to: yesterdayRange.to }),
          analyticsApi.getTimeSeries({ interval: "daily", from: yesterdayRange.from, to: yesterdayRange.to }),
          analyticsApi.getDistribution("strategy", { from: yesterdayRange.from, to: yesterdayRange.to }),
          analyticsApi.getTrades({ from: yesterdayRange.from, to: yesterdayRange.to, limit: 5000 }),
        ]);

        setSummary(normalizeSummary(s2Raw));
        setTimeseries(normalizeTimeSeries(t2Raw));
        setDistStrategy(normalizeDist(dStr2Raw));
        setTrades(normalizeTrades(trades2Raw));
      } else {
        setSummary(normalizeSummary(sRaw));
        setTimeseries(normalizeTimeSeries(tRaw));
        setDistStrategy(normalizeDist(dStrRaw));
        setTrades(normalizeTrades(rawTrades));
      }
    } catch (err) {
      // keep console error for debugging but don't crash UI
      // `err` could be unknown; safely stringify if possible
      console.error("Analytics load error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // keep dependency consistent with original intent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval, customRange]);

  const perfData = useMemo(
    () =>
      timeseries.map((d) => ({
        date: String(d.period ?? ""),
        pnl: Number(d.totalPnl ?? 0),
      })),
    [timeseries]
  );

  const radarData = useMemo(() => {
    if (!distStrategy.length) return [];
    const maxAvg = Math.max(...distStrategy.map((d) => Math.abs(d.avgPnl ?? 0))) || 1;
    return distStrategy.map((d) => ({
      strategy: d._id ?? "unknown",
      effectiveness: Math.round(((d.avgPnl ?? 0) / maxAvg) * 100),
      totalPnl: Number(d.totalPnl ?? 0),
    }));
  }, [distStrategy]);

  const handleIntervalChange = (newInterval: Interval) => {
    setInterval(newInterval);
    if (newInterval !== "custom") setCustomRange({});
  };

  const rangeForDistribution = useMemo(() => {
    const range = computeRange(interval, customRange.from, customRange.to);
    return { from: range.from, to: range.to };
  }, [interval, customRange]);

  return (
    <div className="min-h-screen bg-background/50 p-6 space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Comprehensive overview of your trading performance and metrics</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-background/80 p-1 backdrop-blur-sm">
            {(["daily", "weekly", "monthly", "custom"] as Interval[]).map((opt) => (
              <Button
                key={opt}
                variant="ghost"
                size="sm"
                disabled={loading}
                onClick={() => handleIntervalChange(opt)}
                className={cn(
                  "capitalize px-3 py-1 text-xs font-medium transition-all duration-200",
                  interval === opt ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {opt}
              </Button>
            ))}
          </div>

          {interval === "custom" && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <DatePickerWithRange value={customRange} onChange={(range) => setCustomRange(range ?? {})} disabled={loading} />
            </div>
          )}
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total P/L"
          value={toNumber(summary?.totalPnl ?? 0)}
          icon={TrendingUp}
          gradient="from-green-500 to-emerald-600"
          prefix="₹"
          loading={loading}
          trend={summary?.totalPnlTrend}
        />
        <KPICard
          title="Win Rate"
          value={toNumber(summary?.winRate ?? 0)}
          icon={BarChart3}
          gradient="from-blue-500 to-cyan-600"
          suffix="%"
          loading={loading}
          trend={summary?.winRateTrend}
        />
        <KPICard
          title="Avg P/L"
          value={toNumber(summary?.avgPnl ?? 0)}
          icon={Calendar}
          gradient="from-purple-500 to-pink-600"
          prefix="₹"
          loading={loading}
          trend={summary?.avgPnlTrend}
        />
        <KPICard
          title="Total Trades"
          value={toNumber(summary?.totalTrades ?? 0)}
          icon={Target}
          gradient="from-orange-500 to-amber-600"
          loading={loading}
          trend={summary?.tradesTrend}
        />
      </div>

      {/* MAIN DASHBOARD GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Performance & Strategy */}
        <div className="xl:col-span-2 space-y-6">
          {/* Performance Chart Card */}
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">Performance Overview</h3>
              <p className="text-sm text-muted-foreground mt-1">P&L trends and trading activity over time</p>
            </div>
            <PerformanceChart trades={trades} data={perfData} interval={interval === "custom" ? "daily" : interval} loading={loading} />
          </div>

          {/* P&L Distribution Card */}
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">Strategy Effectiveness</h3>
              <p className="text-sm text-muted-foreground mt-1">Profit and loss distribution analysis</p>
            </div>

            <PnLDistribution loading={loading} filters={rangeForDistribution} />
          </div>
        </div>

        {/* RIGHT COLUMN - Distribution & Segments */}
        <div className="space-y-6">
          {/* Strategy Radar Card */}
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">P&L Distribution</h3>
              <p className="text-sm text-muted-foreground mt-1">Comparative performance across trading strategies</p>
            </div>

            <StrategyRadar data={radarData} loading={loading} />
          </div>

          {/* Segment Performance Card */}
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">Segment Performance</h3>
              <p className="text-sm text-muted-foreground mt-1">Performance breakdown by market segments</p>
            </div>
            <SegmentPerformance filters={rangeForDistribution} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
