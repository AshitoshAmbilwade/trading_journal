// src/components/reports/TradeCard.tsx
import React from "react";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { Trade } from "./types";
import { formatCurrency, formatPercentage } from "./utils";

const TradeCard: React.FC<{ trade: Trade; currencySymbol: string }> = ({ trade, currencySymbol }) => {
  const isPositive = (trade.pnl ?? 0) > 0;
  const roi = trade.roi ?? ((trade.pnl || 0) / (trade.entryPrice || 1) * 100);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-gray-700/50 hover:border-gray-600/50 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center ${
            isPositive
              ? "bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30"
              : "bg-gradient-to-br from-red-500/20 to-rose-600/20 border border-red-500/30"
          } backdrop-blur-sm`}>
            {isPositive ?
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-300" /> :
              <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-300" />
            }
          </div>
          <div>
            <div className="text-white font-semibold text-sm sm:text-base">{(trade.symbol ?? "").toUpperCase()}</div>
            <div className="text-gray-400 text-xs sm:text-sm">{trade.type} • {trade.quantity} shares</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg sm:text-xl font-bold ${isPositive ? "text-emerald-300" : "text-red-300"}`}>
            {formatCurrency(trade.pnl, currencySymbol)}
          </div>
          <div className={`text-xs sm:text-sm ${isPositive ? "text-emerald-400/70" : "text-red-400/70"}`}>
            {formatPercentage(roi)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="bg-gray-700/30 rounded-xl p-2 sm:p-3 backdrop-blur-sm">
          <div className="text-gray-400 text-xs mb-1">Entry</div>
          <div className="text-white font-medium text-sm">{formatCurrency(trade.entryPrice, currencySymbol)}</div>
        </div>
        <div className="bg-gray-700/30 rounded-xl p-2 sm:p-3 backdrop-blur-sm">
          <div className="text-gray-400 text-xs mb-1">Exit</div>
          <div className="text-white font-medium text-sm">{formatCurrency(trade.exitPrice, currencySymbol)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {trade.strategy && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium border border-blue-500/30">
            <Sparkles className="h-3 w-3" />
            {trade.strategy}
          </span>
        )}

        {trade.duration && (
          <span className="text-gray-400 text-xs sm:text-sm">
            {trade.duration} days
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default TradeCard;
