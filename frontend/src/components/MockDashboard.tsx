"use client";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Target, Zap } from "lucide-react";

export function MockDashboard() {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-card via-card to-secondary/50 rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Live Dashboard</span>
        </div>
        <div className="flex gap-2">
          <div className="h-2 w-2 rounded-full bg-border"></div>
          <div className="h-2 w-2 rounded-full bg-border"></div>
          <div className="h-2 w-2 rounded-full bg-border"></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-3 sm:p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Total P&L</span>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
          </div>
          <p className="text-lg sm:text-2xl text-green-400">₹1,24,560</p>
          <p className="text-xs text-green-400/70">+18.5% this month</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-3 sm:p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-primary/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Win Rate</span>
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
          </div>
          <p className="text-lg sm:text-2xl text-primary">72.3%</p>
          <p className="text-xs text-primary/70">156 of 216 trades</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-3 sm:p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Profit Factor</span>
            <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
          </div>
          <p className="text-lg sm:text-2xl text-purple-400">2.45</p>
          <p className="text-xs text-purple-400/70">Above average</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-3 sm:p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-yellow-500/5 border border-orange-500/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Avg Win</span>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-orange-400" />
          </div>
          <p className="text-lg sm:text-2xl text-orange-400">₹1,847</p>
          <p className="text-xs text-orange-400/70">Per winning trade</p>
        </motion.div>
      </div>

      {/* Chart Area */}
      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="relative h-32 sm:h-48 rounded-lg bg-gradient-to-b from-secondary/50 to-transparent border border-border p-4 overflow-hidden">
          {/* Simplified chart visual */}
          <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
              d="M 0 80 Q 50 60, 100 65 T 200 45 T 300 35 T 400 25"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="3"
              className="drop-shadow-lg"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0EA5E9" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute bottom-2 left-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
        <h4 className="text-xs text-muted-foreground mb-3">Recent Trades</h4>
        <div className="space-y-2">
          {[
            { symbol: "NIFTY 50", pnl: "+₹2,450", status: "win" },
            { symbol: "BANKNIFTY", pnl: "+₹1,890", status: "win" },
            { symbol: "RELIANCE", pnl: "-₹450", status: "loss" },
          ].map((trade, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/30 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`h-2 w-2 rounded-full ${trade.status === "win" ? "bg-green-500" : "bg-red-500"}`}></div>
                <span className="text-xs sm:text-sm">{trade.symbol}</span>
              </div>
              <span className={`text-xs sm:text-sm ${trade.status === "win" ? "text-green-400" : "text-red-400"}`}>
                {trade.pnl}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
