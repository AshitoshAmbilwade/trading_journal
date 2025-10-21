"use client";
import { motion } from "motion/react";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { SimpleBarChart } from "../charts/SimpleBarChart";
import { Badge } from "../ui/badge";

// Mock data
const distributionData = [
  { range: "-5k to -3k", count: 2 },
  { range: "-3k to -1k", count: 5 },
  { range: "-1k to 0", count: 8 },
  { range: "0 to 1k", count: 15 },
  { range: "1k to 3k", count: 12 },
  { range: "3k to 5k", count: 7 },
  { range: "5k+", count: 3 },
];

export function PnLDistribution() {
  const totalTrades = distributionData.reduce((sum, item) => sum + item.count, 0);
  const profitableTrades = distributionData.slice(3).reduce((sum, item) => sum + item.count, 0);
  const winRate = ((profitableTrades / totalTrades) * 100).toFixed(0);

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
            <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/30">
              {winRate}% Win Rate
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <SimpleBarChart data={distributionData} />
      </CardContent>
    </Card>
  );
}
