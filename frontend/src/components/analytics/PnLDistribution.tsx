"use client";
import React from "react";
import { motion } from "motion/react";
import { BarChart3 } from "lucide-react";
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

// ✅ fallback mock (for empty / testing)
const MOCK_DATA: BarItem[] = [
  { range: "-5k to -3k", count: 2 },
  { range: "-3k to -1k", count: 5 },
  { range: "-1k to 0", count: 8 },
  { range: "0 to 1k", count: 15 },
  { range: "1k to 3k", count: 12 },
  { range: "3k to 5k", count: 7 },
  { range: "5k+", count: 3 },
];

export function PnLDistribution({ data, loading = false }: PnLDistributionProps) {
  const chartData = data && data.length > 0 ? data : MOCK_DATA;

  // compute winrate
  const totalTrades = chartData.reduce((sum, item) => sum + item.count, 0);
  const profitableTrades = chartData
    .filter((d) => !d.range.includes("-")) // crude heuristic for positive
    .reduce((sum, item) => sum + item.count, 0);
  const winRate =
    totalTrades > 0 ? ((profitableTrades / totalTrades) * 100).toFixed(0) : "0";

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-xl relative overflow-hidden group hover:border-purple/30 transition-all">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-orange-500/5 opacity-50 group-hover:opacity-100 transition-opacity" />
      <motion.div
        className="absolute -top-24 -right-24 h-96 w-96 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

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
              Trade distribution across profit/loss ranges
            </CardDescription>
          </div>
          <div className="text-right">
            {loading ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/30">
                {winRate}% Win Rate
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative">
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <SimpleBarChart data={chartData} />
        )}
      </CardContent>
    </Card>
  );
}
