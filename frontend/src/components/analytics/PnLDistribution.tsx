"use client";

import React, { useMemo } from "react";
import { motion } from "motion/react";
import { BarChart3, Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { SimpleBarChart } from "../charts/SimpleBarChart";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";

type BarItem = { range: string; count: number };

interface PnLDistributionProps {
  data?: BarItem[];
  loading?: boolean;
}

/** Fallback data for dev/testing */
const MOCK_DATA: BarItem[] = [
  { range: "-5k to -3k", count: 3 },
  { range: "-3k to -1k", count: 7 },
  { range: "-1k to 0", count: 12 },
  { range: "0 to 1k", count: 20 },
  { range: "1k to 3k", count: 16 },
  { range: "3k to 5k", count: 8 },
  { range: "5k+", count: 5 },
];

export function PnLDistribution({ data, loading = false }: PnLDistributionProps) {
  const chartData = data && data.length > 0 ? data : MOCK_DATA;

  const totalTrades = useMemo(
    () => chartData.reduce((sum, d) => sum + d.count, 0),
    [chartData]
  );
  const profitableTrades = useMemo(
    () =>
      chartData
        .filter((d) => !d.range.startsWith("-"))
        .reduce((sum, d) => sum + d.count, 0),
    [chartData]
  );
  const winRate =
    totalTrades > 0 ? ((profitableTrades / totalTrades) * 100).toFixed(1) : "0.0";

  const topRange = chartData.reduce(
    (max, d) => (d.count > max.count ? d : max),
    chartData[0]
  );

  const hasProfit = profitableTrades > totalTrades / 2;

  // bar color mapping: losses = red, gains = green
  const coloredData = chartData.map((item) => ({
    ...item,
    color: item.range.includes("-") ? "#EF4444" : "#10B981",
  }));

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
      {/* background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-orange-500/5 opacity-50 group-hover:opacity-80 transition-opacity" />

      {/* animated glow */}
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
              Distribution of trades by profit/loss range
            </CardDescription>
          </div>

          <div className="text-right">
            {loading ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <>
                <div className="text-sm text-muted-foreground">
                  {totalTrades} Trades
                </div>
                <Badge
                  className={`mt-1 ${
                    hasProfit
                      ? "bg-green-500/10 text-green-500 border-green-500/30"
                      : "bg-red-500/10 text-red-500 border-red-500/30"
                  }`}
                >
                  {winRate}% Win Rate
                </Badge>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Chart */}
      <CardContent className="relative">
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            <SimpleBarChart data={coloredData} />

            {/* top range indicator */}
            {topRange && (
              <div className="flex items-center gap-1 mt-4 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span>
                  Most trades in{" "}
                  <strong className="text-foreground">
                    {topRange.range}
                  </strong>{" "}
                  ({topRange.count} trades)
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
