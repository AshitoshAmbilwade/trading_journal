"use client";
import { motion } from "motion/react";
import { Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { SimpleRadarChart } from "../charts/SimpleRadarChart";
import { Badge } from "../ui/badge";

// Mock data
const strategyData = [
  { strategy: "Momentum", effectiveness: 85 },
  { strategy: "Breakout", effectiveness: 72 },
  { strategy: "Reversal", effectiveness: 68 },
  { strategy: "Scalping", effectiveness: 55 },
  { strategy: "Swing", effectiveness: 78 },
  { strategy: "Options", effectiveness: 62 },
];

export function StrategyRadar() {
  const bestStrategy = strategyData.reduce((best, current) => 
    current.effectiveness > best.effectiveness ? current : best
  );

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-xl relative overflow-hidden group hover:border-cyan-500/30 transition-all">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-purple-500/5 opacity-50 group-hover:opacity-100 transition-opacity" />
      <motion.div 
        className="absolute -bottom-24 -right-24 h-96 w-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, 360, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              <CardTitle>Strategy Radar</CardTitle>
            </div>
            <CardDescription className="mt-2">
              Win rate comparison across strategies
            </CardDescription>
          </div>
          <div className="text-right">
            <Badge className="bg-cyan-500/10 text-cyan-500 border-cyan-500/30 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {bestStrategy.strategy}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative flex items-center justify-center">
        <SimpleRadarChart data={strategyData} />
      </CardContent>
    </Card>
  );
}
