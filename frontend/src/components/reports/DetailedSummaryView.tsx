// src/components/reports/DetailedSummaryView.tsx
import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Clock, X, Copy, Crown, Sparkles, TrendingUp, TrendingDown, PieChart, Trophy, Brain, Gem, ChartBar, Coins, Target, Activity, Star, CircleDot, AlertTriangle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GlassCard from "./GlassCard";
import { ExtendedAISummary } from "./types";
import { calculateAdvancedStats, getPnLDisplay, formatDate, formatDateTime, formatCurrency } from "./utils";
import PerformanceMetric from "./PerformanceMetric";
import AdvancedStatCard from "./AdvancedStatCard";
import TradeCard from "./TradeCard";

const DetailedSummaryView: React.FC<{ summary: ExtendedAISummary; onClose: () => void }> = ({ summary, onClose }) => {
  const id = summary._id || summary.id || "";
  const currencySymbol = summary.inputSnapshot?.currencySymbol ?? "₹";
  const stats = summary.weeklyStats ?? summary.inputSnapshot?.weeklyStats;
  const trades = summary.inputSnapshot?.tradesSample || summary.snapshot?.tradesSample || summary.trades || [];
  const advancedStats = calculateAdvancedStats(trades, stats);

  const pnlNumberForModal = Number(stats?.totalPnL ?? advancedStats.totalPnL);
  const isPositive = !Number.isNaN(pnlNumberForModal) && pnlNumberForModal > 0;

  const winRate = Math.round(advancedStats.winRate);

  const copyToClipboard = async (text: string) => {
    try {
      if (!text) return;
      await navigator.clipboard?.writeText(text);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  const headerGradient = summary.type === "weekly" ? "from-blue-600/30 to-cyan-600/30 border-blue-500/50" : "from-purple-600/30 to-pink-600/30 border-purple-500/50";

  const fallbackStatsForPnL: any = stats ?? { totalPnL: advancedStats.totalPnL, totalPnLDisplay: undefined };
  const pnlDisplay = getPnLDisplay(fallbackStatsForPnL, currencySymbol);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 w-full max-w-7xl max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`bg-gradient-to-r ${headerGradient} p-6 sm:p-8 text-white border-b border-gray-700/50 backdrop-blur-xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                {summary.type === "weekly" ? <Calendar className="h-8 w-8 sm:h-10 sm:w-10" /> : <Clock className="h-8 w-8 sm:h-10 sm:w-10" />}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl sm:text-4xl font-bold capitalize bg-gradient-to-br from-white to-gray-300 bg-clip-text text-transparent">
                    {summary.type || "analysis"} Report
                  </h2>
                  {winRate > 70 && (
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 backdrop-blur-sm text-amber-300 border border-amber-500/30 text-sm flex items-center gap-1.5">
                      <Crown className="h-4 w-4" />
                      Elite
                    </span>
                  )}
                </div>
                <p className="text-gray-300 text-sm sm:text-lg">
                  {summary.dateRange
                    ? `${formatDate((summary.dateRange as any)?.start)} - ${formatDate((summary.dateRange as any)?.end)}`
                    : formatDateTime(summary.generatedAt ?? summary.updatedAt ?? summary.createdAt)}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-10 w-10 sm:h-12 sm:w-12 p-0 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-160px)] p-4 sm:p-8 bg-gradient-to-br from-gray-900 to-black">
          <div className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
              <PerformanceMetric
                value={formatCurrency(advancedStats.totalPnL, currencySymbol)}
                label={`Total P&L (${pnlDisplay === "-" ? currencySymbol : ""})`}
                icon={Coins}
                trend={isPositive ? "up" : "down"}
                gradientFrom={isPositive ? "from-emerald-600" : "from-red-600"}
                gradientTo={isPositive ? "to-teal-600" : "to-rose-600"}
                subtitle={String(advancedStats.avgPnL)}
              />
              <PerformanceMetric
                value={`${winRate}%`}
                label="Win Rate"
                icon={Target}
                trend={winRate >= 50 ? "up" : "down"}
                gradientFrom="from-blue-600"
                gradientTo="to-cyan-600"
                subtitle={`${advancedStats.winningTrades}/${advancedStats.totalTrades} wins`}
              />
              <PerformanceMetric
                value={String(advancedStats.totalTrades)}
                label="Total Trades"
                icon={Activity}
                gradientFrom="from-purple-600"
                gradientTo="to-pink-600"
                subtitle={`${Math.round(advancedStats.totalTrades / 5)} trades/day`}
              />
              <PerformanceMetric
                value={`${advancedStats.riskRewardRatio}:1`}
                label="Risk/Reward"
                icon={ChartBar}
                trend={advancedStats.riskRewardRatio >= 1.5 ? "up" : "down"}
                gradientFrom="from-amber-600"
                gradientTo="to-orange-600"
                subtitle="Ratio"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <AdvancedStatCard title="Consistency" value={advancedStats.consistencyScore} icon={TrendingUp} format="percent" />
              <AdvancedStatCard title="Sharpe Ratio" value={advancedStats.sharpeRatio} icon={ChartBar} format="number" />
              <AdvancedStatCard title="Avg Win" value={advancedStats.avgWin} icon={TrendingUp} format="currency" currencySymbol={currencySymbol} />
              <AdvancedStatCard title="Avg Loss" value={advancedStats.avgLoss} icon={TrendingDown} format="currency" currencySymbol={currencySymbol} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
              <div className="xl:col-span-2 space-y-6 sm:space-y-8">
                {summary.summaryText && (
                  <GlassCard className="p-4 sm:p-8">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-blue-300 border border-blue-500/30">
                        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <h3 className="text-lg sm:text-2xl font-bold text-white">AI Analysis</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed text-sm sm:text-lg">
                      {summary.summaryText}
                    </p>
                  </GlassCard>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-5">
                  <GlassCard className="p-4 sm:p-6 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 border border-emerald-500/30">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm sm:text-lg font-bold text-emerald-300">Strengths</h3>
                    </div>
                    <ul className="space-y-2 text-emerald-200 text-sm">
                      {(summary.plusPoints && summary.plusPoints.length > 0 ? summary.plusPoints : ["Consistent performance", "Strong risk management", "Excellent timing"]).map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <CircleDot className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-400" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassCard>

                  <GlassCard className="p-4 sm:p-6 border border-red-500/20">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-300 border border-red-500/30">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm sm:text-lg font-bold text-red-300">Areas to Improve</h3>
                    </div>
                    <ul className="space-y-2 text-red-200 text-sm">
                      {(summary.minusPoints && summary.minusPoints.length > 0 ? summary.minusPoints : ["Risk optimization needed", "Position sizing review", "Emotional patterns"]).map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <CircleDot className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-400" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassCard>

                  <GlassCard className="p-4 sm:p-6 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300 border border-blue-500/30">
                        <Lightbulb className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm sm:text-lg font-bold text-blue-300">AI Suggestions</h3>
                    </div>
                    <ul className="space-y-2 text-blue-200 text-sm">
                      {(summary.aiSuggestions && summary.aiSuggestions.length > 0 ? summary.aiSuggestions : ["Diversify portfolio", "Implement trailing stops", "Review regularly"]).map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <CircleDot className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-400" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassCard>
                </div>

                {trades.length > 0 && (
                  <GlassCard className="p-4 sm:p-8">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-purple-300 border border-purple-500/30">
                          <PieChart className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <h3 className="text-lg sm:text-2xl font-bold text-white">Trade Breakdown</h3>
                      </div>
                      <Badge variant="secondary" className="bg-gray-700/50 text-gray-300">{trades.length} trades</Badge>
                    </div>
                    <div className="space-y-3 max-h-80 sm:max-h-96 overflow-y-auto pr-2">
                      {trades.map((trade, index) => <TradeCard key={trade._id || index} trade={trade} currencySymbol={currencySymbol} />)}
                    </div>
                  </GlassCard>
                )}
              </div>

              <div className="space-y-4 sm:space-y-6">
                {(advancedStats.bestTrade || advancedStats.worstTrade) && (
                  <GlassCard className="p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Trophy className="h-5 w-5 text-amber-400" />
                      <h3 className="text-lg font-bold text-white">Performance Extremes</h3>
                    </div>

                    {advancedStats.bestTrade && (
                      <div className="mb-4">
                        <div className="text-emerald-400 text-sm mb-2 font-semibold flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Best Trade
                        </div>
                        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-600/10 rounded-2xl p-3 border border-emerald-500/20">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400 text-sm">Symbol</span>
                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-bold border border-emerald-500/30">
                              {String(advancedStats.bestTrade.symbol ?? "").toUpperCase()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Profit</span>
                            <span className="text-emerald-300 text-lg font-bold">
                              {advancedStats.bestTrade.pnlDisplay ?? formatCurrency(advancedStats.bestTrade.pnl, currencySymbol)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {advancedStats.worstTrade && (
                      <div>
                        <div className="text-red-400 text-sm mb-2 font-semibold flex items-center gap-2">
                          <TrendingDown className="h-4 w-4" />
                          Needs Review
                        </div>
                        <div className="bg-gradient-to-br from-red-500/10 to-rose-600/10 rounded-2xl p-3 border border-red-500/20">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400 text-sm">Symbol</span>
                            <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm font-bold border border-red-500/30">
                              {String(advancedStats.worstTrade.symbol ?? "").toUpperCase()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Loss</span>
                            <span className="text-red-300 text-lg font-bold">
                              {advancedStats.worstTrade.pnlDisplay ?? formatCurrency(advancedStats.worstTrade.pnl, currencySymbol)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </GlassCard>
                )}

                <GlassCard className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="h-5 w-5 text-purple-400" />
                    <h3 className="text-lg font-bold text-white">Risk Metrics</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                      <span className="text-gray-400 text-sm">Max Drawdown</span>
                      <span className="font-bold text-red-300">{formatCurrency(advancedStats.maxDrawdown, currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                      <span className="text-gray-400 text-sm">Volatility</span>
                      <span className="font-bold text-amber-300">{formatCurrency(advancedStats.volatility, currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                      <span className="text-gray-400 text-sm">Sharpe Ratio</span>
                      <span className={`font-bold ${advancedStats.sharpeRatio > 1 ? 'text-emerald-300' : advancedStats.sharpeRatio > 0 ? 'text-amber-300' : 'text-red-300'}`}>
                        {advancedStats.sharpeRatio}
                      </span>
                    </div>
                    {stats?.strategiesUsed && stats.strategiesUsed.filter(s => s).length > 0 && (
                      <div>
                        <span className="text-gray-400 text-sm block mb-2">Strategies Used</span>
                        <div className="flex flex-wrap gap-2">
                          {stats.strategiesUsed.filter(s => s).map((strategy, idx) => (
                            <span key={idx} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium border border-blue-500/30">
                              {strategy}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </GlassCard>

                <GlassCard className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Gem className="h-5 w-5 text-blue-400" />
                    <h3 className="text-lg font-bold text-white">Report Details</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-400 text-sm">AI Model</span>
                      <span className="text-white font-medium text-sm">{summary.model ?? "GPT-4"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-400 text-sm">Generated</span>
                      <span className="text-gray-300 text-sm">{formatDateTime(summary.generatedAt ?? summary.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-400 text-sm">Report ID</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-800/50 text-gray-300 px-2 py-1 rounded-lg font-mono border border-gray-700/50">
                          {id.slice(0, 8)}...
                        </code>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(id)} className="h-8 w-8 p-0 rounded-lg hover:bg-gray-700/50 border border-gray-700/50">
                          <Copy className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DetailedSummaryView;
