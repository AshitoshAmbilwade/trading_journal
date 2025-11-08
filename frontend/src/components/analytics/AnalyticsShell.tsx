"use client";

import React, { useEffect, useMemo, useState } from "react";
import { analyticsApi } from "@/api/analytics";
import { KPICard } from "./KPICard"; // from components root
import { PerformanceChart } from "./PerformanceChart";
import { PnLDistribution } from "./PnLDistribution";
import { StrategyRadar } from "./StrategyRadar";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, Calendar, Target } from "lucide-react";

type TimeSeriesPoint = { _id: string; totalPnl: number; totalTrades?: number; avgPnl?: number };
type DistItem = { _id: string; count: number; totalPnl: number; avgPnl: number };

export default function AnalyticsShell() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any | null>(null);
  const [timeseries, setTimeseries] = useState<TimeSeriesPoint[]>([]);
  const [distSegment, setDistSegment] = useState<DistItem[]>([]);
  const [distStrategy, setDistStrategy] = useState<DistItem[]>([]);
  const [filters, setFilters] = useState<{ from?: string; to?: string; interval?: "daily" | "weekly" | "monthly" }>({
    interval: "daily",
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, t, dSeg, dStr] = await Promise.all([
        analyticsApi.getSummary(filters),
        analyticsApi.getTimeSeries(filters.interval || "daily", filters.from, filters.to),
        analyticsApi.getDistribution("segment"),
        analyticsApi.getDistribution("strategy"),
      ]);
      setSummary(s);
      setTimeseries(t as TimeSeriesPoint[]);
      setDistSegment(dSeg as DistItem[]);
      setDistStrategy(dStr as DistItem[]);
    } catch (err) {
      console.error("Analytics load error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.from, filters.to, filters.interval]);

  // Map timeseries into the shape your SimpleLineChart expects (date, pnl)
  const perfData = useMemo(
    () => (timeseries || []).map((d) => ({ date: d._id, pnl: Number(d.totalPnl || 0) })),
    [timeseries]
  );

  // Map distSegment -> bar chart format { range, count }
  const barData = useMemo(
    () =>
      (distSegment || []).map((d) => ({
        range: String(d._id || "Unknown"),
        count: Number(d.count || 0),
      })),
    [distSegment]
  );

  // Map strategy dist -> radar format { strategy, effectiveness }
  const radarData = useMemo(() => {
    if (!distStrategy || distStrategy.length === 0) return [];
    const maxAvg = Math.max(...distStrategy.map((d) => Math.abs(d.avgPnl || 0))) || 1;
    return distStrategy.map((d) => ({
      strategy: d._id || "unknown",
      effectiveness: Math.round(((d.avgPnl || 0) / maxAvg) * 100),
    }));
  }, [distStrategy]);

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <div className="ml-auto flex gap-2">
          <Button onClick={() => setFilters({ ...filters, interval: "daily" })}>Daily</Button>
          <Button onClick={() => setFilters({ ...filters, interval: "weekly" })}>Weekly</Button>
          <Button onClick={() => setFilters({ ...filters, interval: "monthly" })}>Monthly</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Total P/L"
          value={summary?.totalPnl ?? 0}
          icon={TrendingUp}
          gradient="from-green-500 to-emerald-500"
          prefix="₹"
          loading={loading}
        />
        <KPICard
          title="Win Rate"
          value={(summary?.winRate ?? 0) * 100}
          icon={BarChart3}
          gradient="from-cyan-500 to-blue-500"
          suffix="%"
          loading={loading}
        />
        <KPICard
          title="Avg P/L"
          value={summary?.avgPnl ?? 0}
          icon={Calendar}
          gradient="from-purple-500 to-pink-500"
          prefix="₹"
          loading={loading}
        />
        <KPICard
          title="Trades"
          value={summary?.totalTrades ?? 0}
          icon={Target}
          gradient="from-yellow-400 to-orange-500"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          {/* Cast to any to avoid TS error until you update PerformanceChart props */}
          <PerformanceChart {...({ data: perfData, loading } as any)} />
        </div>

        <div className="space-y-6">
          <PnLDistribution {...({ data: barData, loading } as any)} />
          <StrategyRadar {...({ data: radarData, loading } as any)} />
        </div>
      </div>

      {/* Lower: you can add TradesTablePanel here */}
    </div>
  );
}
