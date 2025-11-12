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

export default function AnalyticsShell() {
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<any | null>(null);
  const [timeseries, setTimeseries] = useState<TimeSeriesPoint[]>([]);
  const [distStrategy, setDistStrategy] = useState<DistItem[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});
  const [interval, setInterval] = useState<Interval>("weekly");

  // Main loader
  const loadAll = async (useRange?: { from: string; to: string }) => {
    setLoading(true);
    try {
      const range =
        useRange ?? computeRange(interval, customRange.from, customRange.to);

      const [s, t, dStr, rawTrades] = await Promise.all([
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

      const noTradesToday =
        interval === "daily" &&
        (!Array.isArray(rawTrades) || rawTrades.length === 0);

      if (noTradesToday) {
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayRange = computeRange(
          "custom",
          yesterdayDate,
          yesterdayDate
        );

        const [s2, t2, dStr2, trades2] = await Promise.all([
          analyticsApi.getSummary({
            from: yesterdayRange.from,
            to: yesterdayRange.to,
          }),
          analyticsApi.getTimeSeries({
            interval: "daily",
            from: yesterdayRange.from,
            to: yesterdayRange.to,
          }),
          analyticsApi.getDistribution("strategy", {
            from: yesterdayRange.from,
            to: yesterdayRange.to,
          }),
          analyticsApi.getTrades({
            from: yesterdayRange.from,
            to: yesterdayRange.to,
            limit: 5000,
          }),
        ]);

        setSummary(s2 ?? null);
        setTimeseries(Array.isArray(t2) ? t2 : []);
        setDistStrategy(
          Array.isArray(dStr2)
            ? dStr2.map((i: any) => ({ ...i, _id: i._id ?? "Unknown" }))
            : []
        );
        setTrades(Array.isArray(trades2) ? trades2 : []);
      } else {
        setSummary(s ?? null);
        setTimeseries(Array.isArray(t) ? t : []);
        setDistStrategy(
          Array.isArray(dStr)
            ? dStr.map((i: any) => ({ ...i, _id: i._id ?? "Unknown" }))
            : []
        );
        setTrades(Array.isArray(rawTrades) ? rawTrades : []);
      }
    } catch (err) {
      console.error("Analytics load error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
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
    const maxAvg =
      Math.max(...distStrategy.map((d) => Math.abs(d.avgPnl ?? 0))) || 1;
    return distStrategy.map((d) => ({
      strategy: d._id ?? "unknown",
      effectiveness: Math.round(((d.avgPnl ?? 0) / maxAvg) * 100),
      totalPnl: Number(d.totalPnl ?? 0), // <-- include totalPnl for tooltip
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
          <p className="text-sm text-muted-foreground">
            Comprehensive overview of your trading performance and metrics
          </p>
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
                  interval === opt 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {opt}
              </Button>
            ))}
          </div>

          {interval === "custom" && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <DatePickerWithRange
                value={customRange}
                onChange={(range) => setCustomRange(range ?? {})}
                disabled={loading}
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total P/L"
          value={Number(summary?.totalPnl ?? 0)}
          icon={TrendingUp}
          gradient="from-green-500 to-emerald-600"
          prefix="₹"
          loading={loading}
          trend={summary?.totalPnlTrend}
        />
        <KPICard
          title="Win Rate"
          value={Number(summary?.winRate ?? 0)}
          icon={BarChart3}
          gradient="from-blue-500 to-cyan-600"
          suffix="%"
          loading={loading}
          trend={summary?.winRateTrend}
        />
        <KPICard
          title="Avg P/L"
          value={Number(summary?.avgPnl ?? 0)}
          icon={Calendar}
          gradient="from-purple-500 to-pink-600"
          prefix="₹"
          loading={loading}
          trend={summary?.avgPnlTrend}
        />
        <KPICard
          title="Total Trades"
          value={Number(summary?.totalTrades ?? 0)}
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
              <p className="text-sm text-muted-foreground mt-1">
                P&L trends and trading activity over time
              </p>
            </div>
            <PerformanceChart
              trades={trades}
              data={perfData}
              interval={interval === "custom" ? "daily" : interval}
              loading={loading}
            />
          </div>

          {/* P&L Distribution Card */}
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">Strategy Effectiveness</h3>
              
              <p className="text-sm text-muted-foreground mt-1">
                Profit and loss distribution analysis
              </p>
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
              <p className="text-sm text-muted-foreground mt-1">
                Comparative performance across trading strategies
              </p>
            </div>

            <StrategyRadar data={radarData} loading={loading} />
          </div>

          {/* Segment Performance Card */}
          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">Segment Performance</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Performance breakdown by market segments
              </p>
            </div>
            <SegmentPerformance
              filters={rangeForDistribution}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}