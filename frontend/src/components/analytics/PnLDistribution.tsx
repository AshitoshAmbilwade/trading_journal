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
  filters?: any;
}

const TRADE_TYPES = ["intraday", "positional", "investment", "swing", "scalping"];

export function PnLDistribution({ loading = false, filters = {} }: Props) {
  const [data, setData] = useState<TradeTypeDist[]>([]);
  const [fetching, setFetching] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      setFetching(true);
      try {
        const res = await analyticsApi.getDistribution("tradeType", filters);
        if (Array.isArray(res)) {
          // Normalize: ensure tradeTypes always ordered consistently
          const map = new Map(res.map((r: any) => [r._id ?? "unknown", r]));
          const normalized = TRADE_TYPES.map((type) =>
            map.get(type) || { _id: type, count: 0, totalPnl: 0, avgPnl: 0, winRate: 0 }
          );
          setData(normalized);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error("PnLDistribution error:", err);
        setData([]);
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [JSON.stringify(filters)]);

  const chartData = useMemo(() => {
    return data.map((item) => ({
      tradeType: item._id,
      count: item.count,
      totalPnl: item.totalPnl,
      avgPnl: item.avgPnl,
      winRate: item.winRate,
    }));
  }, [data]);

  const totalTrades = chartData.reduce((sum, d) => sum + (d.count ?? 0), 0);
  const overallWinRate =
    totalTrades > 0
      ? (chartData.reduce((s, d) => s + (d.winRate * d.count) / 100, 0) / totalTrades) * 100
      : 0;

  const topTradeType = chartData.reduce(
    (max, d) => (d.count > max.count ? d : max),
    chartData[0] || { tradeType: "none", count: 0 }
  );

  const coloredData = chartData.map((item) => {
    let color = "#71717A"; // neutral gray
    if (item.totalPnl > 0) color = "#10B981"; // green
    else if (item.totalPnl < 0) color = "#EF4444"; // red
    return { ...item, color };
  });

  const isLoading = loading || fetching;

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
      <div className="bg-black/90 text-white p-3 rounded-md text-xs shadow-md border border-white/10">
        <div className="font-semibold mb-1">{p.tradeType}</div>
        <div>Total Trades: {p.count}</div>
        <div>Win Rate: {p.winRate.toFixed(1)}%</div>
        <div>Total P/L: ₹{p.totalPnl.toFixed(2)}</div>
        <div>Avg P/L: ₹{p.avgPnl.toFixed(2)}</div>
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
                <div className="text-sm text-muted-foreground">
                  {totalTrades} Trades
                </div>
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
                <BarChart
                  data={coloredData}
                  margin={{ top: 20, right: 20, left: 10, bottom: 30 }}
                  barCategoryGap="25%"
                >
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="tradeType"
                    tick={{ fill: "#aaa", fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#aaa", fontSize: 12 }}
                    tickLine={false}
                    allowDecimals={false}
                  />
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
                  <strong className="text-foreground">
                    {topTradeType.tradeType}
                  </strong>{" "}
                  ({topTradeType.count} trades)
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
