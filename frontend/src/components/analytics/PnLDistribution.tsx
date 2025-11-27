"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion } from "motion/react";
import { BarChart3, Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { analyticsApi } from "@/api/analytics";

interface TradeTypeDist {
  _id: string;
  count: number;
  totalPnl: number;
  avgPnl: number;
  winRate: number;
}

interface Props {
  loading?: boolean;
  // Generic filters object; the analytics API expects keys like { from, to }
  filters?: Record<string, unknown>;
}

const TRADE_TYPES = ["intraday", "positional", "investment", "swing", "scalping"];

/** runtime check helpers */
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";
const toNumber = (v: unknown) => {
  const n = Number(v as unknown);
  return Number.isFinite(n) ? n : 0;
};

export function PnLDistribution({ loading = false, filters = {} }: Props) {
  const [data, setData] = useState<TradeTypeDist[]>([]);
  const [fetching, setFetching] = useState<boolean>(false);

  // avoid complex expression in deps — memoize serialized filters
  const serializedFilters = useMemo(() => JSON.stringify(filters ?? {}), [filters]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setFetching(true);
      try {
        const res = await analyticsApi.getDistribution("tradeType", filters);
        if (Array.isArray(res)) {
          // Normalize response items and coerce types safely
          const normalizedIncoming: TradeTypeDist[] = (res as unknown[]).map((r) => {
            if (isRecord(r)) {
              return {
                _id: String(r._id ?? "unknown"),
                count: toNumber(r.count),
                totalPnl: toNumber(r.totalPnl),
                avgPnl: toNumber(r.avgPnl),
                winRate: toNumber(r.winRate),
              };
            }
            return { _id: "unknown", count: 0, totalPnl: 0, avgPnl: 0, winRate: 0 };
          });

          // Ensure consistent ordering & default entries for missing types
          const map = new Map<string, TradeTypeDist>();
          normalizedIncoming.forEach((r) => map.set(r._id, r));
          const normalized = TRADE_TYPES.map((type) =>
            map.get(type) ?? { _id: type, count: 0, totalPnl: 0, avgPnl: 0, winRate: 0 }
          );

          if (mounted) setData(normalized);
        } else {
          if (mounted) setData([]);
        }
      } catch (err) {
        // keep error log for debugging but don't throw
        // eslint-disable-next-line no-console
        console.error("PnLDistribution error:", err);
        if (mounted) setData([]);
      } finally {
        if (mounted) setFetching(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
    // only depends on serializedFilters to avoid complex dependency arrays
  }, [serializedFilters]);

  const chartData = useMemo(
    () =>
      data.map((item) => ({
        tradeType: item._id,
        count: item.count,
        totalPnl: item.totalPnl,
        avgPnl: item.avgPnl,
        winRate: item.winRate,
      })),
    [data]
  );

  const totalTrades = chartData.reduce((sum, d) => sum + (d.count ?? 0), 0);
  const overallWinRate =
    totalTrades > 0
      ? (chartData.reduce((s, d) => s + (d.winRate * (d.count ?? 0)) / 100, 0) / totalTrades) * 100
      : 0;

  const topTradeType =
    chartData.length > 0
      ? chartData.reduce((max, d) => (d.count > (max.count ?? 0) ? d : max), chartData[0])
      : null;

  const coloredData = chartData.map((item) => {
    let color = "#71717A"; // neutral gray
    if (item.totalPnl > 0) color = "#10B981"; // green
    else if (item.totalPnl < 0) color = "#EF4444"; // red
    return { ...item, color };
  });

  const isLoading = loading || fetching;

  type TooltipPayload = { payload?: Record<string, unknown>[]; active?: boolean };

  const CustomTooltip: React.FC<TooltipPayload> = ({ active, payload }) => {
    if (!active || !Array.isArray(payload) || !payload.length) return null;
    const p0 = payload[0];
    const p = p0?.payload;
    if (!isRecord(p)) return null;

    const tradeType = String(p.tradeType ?? "unknown");
    const count = toNumber(p.count);
    const winRate = toNumber(p.winRate);
    const totalPnl = toNumber(p.totalPnl);
    const avgPnl = toNumber(p.avgPnl);

    return (
      <div className="bg-black/90 text-white p-3 rounded-md text-xs shadow-md border border-white/10">
        <div className="font-semibold mb-1">{tradeType}</div>
        <div>Total Trades: {count}</div>
        <div>Win Rate: {winRate.toFixed(1)}%</div>
        <div>Total P/L: ₹{totalPnl.toFixed(2)}</div>
        <div>Avg P/L: ₹{avgPnl.toFixed(2)}</div>
      </div>
    );
  };

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
      {/* soft glow bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-orange-500/5 opacity-50 group-hover:opacity-80 transition-opacity" />
      <motion.div
        className="absolute -bottom-20 -left-20 h-72 w-72 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Header */}
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <CardTitle>P/L Distribution</CardTitle>
            </div>
            <CardDescription className="mt-2">
              Distribution of trades by <strong>Trade Type</strong>
            </CardDescription>
          </div>

          <div className="text-right">
            {isLoading ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <>
                <div className="text-sm text-muted-foreground">{totalTrades} Trades</div>
                <Badge
                  className={`mt-1 ${
                    overallWinRate >= 50
                      ? "bg-green-500/10 text-green-500 border-green-500/30"
                      : "bg-red-500/10 text-red-500 border-red-500/30"
                  }`}
                >
                  {overallWinRate.toFixed(1)}% Win Rate
                </Badge>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Chart */}
      <CardContent className="relative">
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coloredData} margin={{ top: 20, right: 20, left: 10, bottom: 30 }} barCategoryGap="25%">
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="tradeType" tick={{ fill: "#aaa", fontSize: 12 }} tickLine={false} />
                  <YAxis tick={{ fill: "#aaa", fontSize: 12 }} tickLine={false} allowDecimals={false} />
                  <ReTooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {coloredData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* top trade type summary */}
            {topTradeType && (
              <div className="flex items-center gap-1 mt-4 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span>
                  Most trades in{" "}
                  <strong className="text-foreground">{topTradeType.tradeType}</strong> ({topTradeType.count} trades)
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default PnLDistribution;
