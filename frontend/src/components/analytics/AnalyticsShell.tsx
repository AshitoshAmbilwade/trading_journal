"use client";

import React, { useEffect, useMemo, useState } from "react";
import { analyticsApi, Trade } from "@/api/analytics";
import { KPICard } from "./KPICard";
import { PerformanceChart } from "./PerformanceChart";
import { PnLDistribution } from "./PnLDistribution";
import { StrategyRadar } from "./StrategyRadar";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, Calendar, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";

type TimeSeriesPoint = {
  period?: string;
  totalPnl: number;
  totalTrades?: number;
  avgPnl?: number;
};

type DistItem = { _id: string; count: number; totalPnl: number; avgPnl?: number };

type Interval = "daily" | "weekly" | "monthly" | "custom";

/**
 * Return ISO strings for from/to.
 * - daily  => today 00:00:00.000 -> today 23:59:59.999
 * - weekly => 7 days back (inclusive)
 * - monthly => 30 days back (inclusive)
 * - custom => provided customFrom/customTo
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

  // central loader
  const loadAll = async (useRange?: { from: string; to: string }) => {
    setLoading(true);
    try {
      const range =
        useRange ??
        computeRange(interval, customRange.from, customRange.to);

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
    <div className="p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Analytics</h1>

        <div className="flex gap-2 flex-wrap items-center">
          {(["daily", "weekly", "monthly", "custom"] as Interval[]).map(
            (opt) => (
              <Button
                key={opt}
                variant={interval === opt ? "secondary" : "outline"}
                disabled={loading}
                onClick={() => handleIntervalChange(opt)}
                className={cn(
                  "capitalize transition-all",
                  interval === opt &&
                    "ring-2 ring-offset-2 ring-primary font-semibold"
                )}
              >
                {opt}
              </Button>
            )
          )}

          {interval === "custom" && (
            <div className="ml-3">
              <DatePickerWithRange
                value={customRange}
                onChange={(range) => setCustomRange(range ?? {})}
                disabled={loading}
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Total P/L"
          value={Number(summary?.totalPnl ?? 0)}
          icon={TrendingUp}
          gradient="from-green-500 to-emerald-500"
          prefix="₹"
          loading={loading}
        />
        <KPICard
          title="Win Rate"
          value={Number(summary?.winRate ?? 0)}
          icon={BarChart3}
          gradient="from-cyan-500 to-blue-500"
          suffix="%"
          loading={loading}
        />
        <KPICard
          title="Avg P/L"
          value={Number(summary?.avgPnl ?? 0)}
          icon={Calendar}
          gradient="from-purple-500 to-pink-500"
          prefix="₹"
          loading={loading}
        />
        <KPICard
          title="Trades"
          value={Number(summary?.totalTrades ?? 0)}
          icon={Target}
          gradient="from-yellow-400 to-orange-500"
          loading={loading}
        />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <PerformanceChart
            trades={trades}
            data={perfData}
            interval={interval === "custom" ? "daily" : interval}
            loading={loading}
          />
        </div>

        <div className="space-y-6">
          {/* ✅ FIXED: remove data prop, only pass loading + filters */}
          <PnLDistribution loading={loading} filters={rangeForDistribution} />
          <StrategyRadar data={radarData} loading={loading} />
        </div>
      </div>
    </div>
  );
}
