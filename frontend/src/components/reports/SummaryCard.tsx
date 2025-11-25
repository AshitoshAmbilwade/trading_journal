// src/components/reports/SummaryCard.tsx
import React from "react";
import { motion } from "motion/react";
import { Calendar, Clock, Eye, ArrowUpRight, Star } from "lucide-react";
import GlassCard from "./GlassCard";
import StatusBadge from "./StatusBadge";
import { ExtendedAISummary } from "./types";
import { calculateAdvancedStats, getPnLDisplay, formatDate } from "./utils";

const SummaryCard: React.FC<{ summary: ExtendedAISummary; onExpand: () => void }> = ({ summary, onExpand }) => {
  const stats = summary.weeklyStats ?? summary.inputSnapshot?.weeklyStats;
  const trades = summary.inputSnapshot?.tradesSample || summary.snapshot?.tradesSample || summary.trades || [];
  const advancedStats = calculateAdvancedStats(trades, stats);

  const pnlNumberForCard = Number(stats?.totalPnL ?? advancedStats.totalPnL);
  const isPositive = !Number.isNaN(pnlNumberForCard) && pnlNumberForCard > 0;

  const currencySymbol = summary.inputSnapshot?.currencySymbol ?? "₹";
  const winRate = Math.round(advancedStats.winRate);

  const cardGradient = summary.type === "weekly"
    ? "from-blue-500/20 to-cyan-500/20 border-blue-500/30"
    : "from-purple-500/20 to-pink-500/20 border-purple-500/30";

  const fallbackStatsForPnL: any = stats ?? { totalPnL: advancedStats.totalPnL, totalPnLDisplay: undefined };
  const pnlDisplay = getPnLDisplay(fallbackStatsForPnL, currencySymbol);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="group cursor-pointer"
      onClick={onExpand}
    >
      <GlassCard className="hover:border-gray-600/70 transition-all duration-300 overflow-hidden">
        <div className={`h-1 bg-gradient-to-r ${summary.type === "weekly" ? "from-blue-500 to-cyan-500" : "from-purple-500 to-pink-500"}`} />

        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between mb-4 sm:mb-5">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br ${cardGradient} flex items-center justify-center text-white backdrop-blur-sm border`}>
                {summary.type === "weekly" ? <Calendar className="h-6 w-6 sm:h-7 sm:w-7" /> : <Clock className="h-6 w-6 sm:h-7 sm:w-7" />}
              </div>
              <div>
                <h3 className="text-white font-bold capitalize flex items-center gap-2 text-sm sm:text-base">
                  {summary.type || "analysis"}
                  {winRate > 70 && <Star className="h-4 w-4 text-amber-400 fill-amber-400/20" />}
                </h3>
                <p className="text-gray-400 text-xs">
                  {formatDate(summary.generatedAt ?? summary.createdAt)}
                </p>
              </div>
            </div>
            <StatusBadge status={summary.status} />
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-gray-800/50 rounded-xl p-2 sm:p-3 text-center backdrop-blur-sm border border-gray-700/50">
              <div className="text-gray-400 text-[10px] mb-1 uppercase font-semibold">P&L</div>
              <div className={`text-sm font-bold ${isPositive ? "text-emerald-300" : "text-red-300"}`}>
                {pnlDisplay}
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-2 sm:p-3 text-center backdrop-blur-sm border border-gray-700/50">
              <div className="text-gray-400 text-[10px] mb-1 uppercase font-semibold">Win Rate</div>
              <div className={`text-sm font-bold ${winRate >= 70 ? "text-emerald-300" : winRate >= 50 ? "text-amber-300" : "text-red-300"}`}>
                {winRate}%
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-2 sm:p-3 text-center backdrop-blur-sm border border-gray-700/50">
              <div className="text-gray-400 text-[10px] mb-1 uppercase font-semibold">Trades</div>
              <div className="text-sm font-bold text-white">
                {advancedStats.totalTrades}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
            <span>RRR: {advancedStats.riskRewardRatio}:1</span>
            <span>Consistency: {advancedStats.consistencyScore}%</span>
            <span>Vol: {advancedStats.volatility ?? "-"}</span>
          </div>

          {summary.summaryText && (
            <p className="text-gray-300 text-sm line-clamp-2 mb-3 leading-relaxed">
              {summary.summaryText}
            </p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
            <div className="flex items-center gap-2 text-gray-400 text-sm group-hover:text-blue-400 transition-colors">
              <Eye className="h-4 w-4" />
              <span>View Details</span>
            </div>
            <ArrowUpRight className="h-5 w-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default SummaryCard;
