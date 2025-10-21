"use client";
import { motion } from "motion/react";
import { TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { SimpleLineChart } from "../charts/SimpleLineChart";
import { Badge } from "../ui/badge";

// Mock data for demonstration
const performanceData = [
  { date: "Jan", pnl: 2400 },
  { date: "Feb", pnl: 1398 },
  { date: "Mar", pnl: 9800 },
  { date: "Apr", pnl: 3908 },
  { date: "May", pnl: 4800 },
  { date: "Jun", pnl: 3800 },
  { date: "Jul", pnl: 4300 },
  { date: "Aug", pnl: 6200 },
  { date: "Sep", pnl: 5100 },
  { date: "Oct", pnl: 7800 },
  { date: "Nov", pnl: 8900 },
  { date: "Dec", pnl: 9500 },
];

export function PerformanceChart() {
  const totalGain = performanceData[performanceData.length - 1].pnl - performanceData[0].pnl;
  const percentageGain = ((totalGain / performanceData[0].pnl) * 100).toFixed(1);

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-xl relative overflow-hidden group hover:border-primary/30 transition-all">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-cyan-500/5 opacity-50 group-hover:opacity-100 transition-opacity" />
      <motion.div 
        className="absolute -bottom-24 -left-24 h-96 w-96 bg-gradient-to-br from-green-500/10 to-cyan-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <CardTitle>Performance Curve</CardTitle>
            </div>
            <CardDescription className="mt-2 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              Your cumulative P/L throughout the year
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                +{percentageGain}%
              </span>
            </div>
            <Badge className="bg-green-500/10 text-green-500 border-green-500/30 mt-1">
              YTD Gain
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <SimpleLineChart data={performanceData} />
      </CardContent>
    </Card>
  );
}
