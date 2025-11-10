"use client";
import React from "react";
import { motion } from "motion/react";
import { Target, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import SimpleRadarChart from "../charts/SimpleRadarChart";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";

type StrategyItem = {
  strategy: string;
  effectiveness: number;
  totalPnl?: number;
};

interface StrategyRadarProps {
  data?: StrategyItem[];
  loading?: boolean;
}

const MOCK_DATA: StrategyItem[] = [
  { strategy: "Momentum", effectiveness: 85, totalPnl: 1200 },
  { strategy: "Breakout", effectiveness: 72, totalPnl: 820 },
  { strategy: "Reversal", effectiveness: 68, totalPnl: 540 },
  { strategy: "Scalping", effectiveness: 55, totalPnl: -120 },
  { strategy: "Swing", effectiveness: 78, totalPnl: 900 },
  { strategy: "Options", effectiveness: 62, totalPnl: 300 },
];

export function StrategyRadar({ data, loading = false }: StrategyRadarProps) {
  const chartData = data && data.length ? data : MOCK_DATA;

  const bestStrategy =
    chartData.length > 0
      ? chartData.reduce((a, b) => (a.effectiveness > b.effectiveness ? a : b))
      : null;

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-xl relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-indigo-500/5 opacity-50 group-hover:opacity-80 transition-opacity" />
      <motion.div
        className="absolute -bottom-24 -right-24 h-80 w-80 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />

      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              <CardTitle>Strategy Radar</CardTitle>
            </div>
            <CardDescription className="mt-1 text-sm text-gray-400">
              Win rate & effectiveness comparison across strategies
            </CardDescription>
          </div>

          <div className="text-right">
            {loading ? (
              <Skeleton className="h-5 w-24" />
            ) : bestStrategy ? (
              <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-400/30 flex items-center gap-2">
                <TrendingUp className="h-3 w-3" />
                <span className="font-medium">{bestStrategy.strategy}</span>
                <span className="text-xs opacity-70">({bestStrategy.effectiveness}%)</span>
              </Badge>
            ) : (
              <Badge className="bg-muted/20 text-muted-foreground border border-border/30">
                No Data
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative flex items-center justify-center">
        {loading ? (
          <div className="h-[320px] w-full flex items-center justify-center">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="w-full">
            <SimpleRadarChart data={chartData} height={320} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StrategyRadar;
