// src/components/dashboard/TradeViewPage.tsx
"use client";

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { TrendingUp, TrendingDown, X, Calendar, Clock, BarChart3, Target, Zap, Lightbulb, Sparkles } from "lucide-react";
import { Loader2, ArrowLeft, DollarSign, PieChart, Image as ImageIcon } from "lucide-react";
import type { Trade } from "../../api/trades";
import { tradesApi } from "../../api/trades";

/**
 * Full-page Trade view component.
 * Usage:
 *  - In app router: put this component in app/trades/[id]/page.tsx and render <TradeViewPage tradeId={params.id} />
 *  - Or import & use inside any route and pass tradeId prop.
 */

interface Props {
  tradeId: string;
  // optional callback when user wants to leave
  onClose?: () => void;
}

const formatDate = (dateLike?: string | Date) => {
  if (!dateLike) return "-";
  const d = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { 
    day: "2-digit", 
    month: "short", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const formatDateShort = (dateLike?: string | Date) => {
  if (!dateLike) return "-";
  const d = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { 
    day: "2-digit", 
    month: "short", 
    year: "numeric"
  });
};

const inr = (v: number | undefined | null) => {
  if (v === undefined || v === null || Number.isNaN(Number(v))) return "-";
  
  // Handle large numbers with compact notation
  if (Math.abs(v) >= 10000000) { // 1 crore
    return new Intl.NumberFormat("en-IN", { 
      style: "currency", 
      currency: "INR", 
      notation: "compact",
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(Number(v));
  }
  
  return new Intl.NumberFormat("en-IN", { 
    style: "currency", 
    currency: "INR", 
    maximumFractionDigits: 2,
    minimumFractionDigits: 2 
  }).format(Number(v));
};

const formatNumber = (v: number | undefined | null) => {
  if (v === undefined || v === null || Number.isNaN(Number(v))) return "-";
  
  // Handle large numbers with compact notation
  if (Math.abs(v) >= 1000000) { // 1 million
    return new Intl.NumberFormat("en-IN", { 
      notation: "compact",
      maximumFractionDigits: 1
    }).format(Number(v));
  }
  
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0
  }).format(Number(v));
};

const calculateTradeMetrics = (trade: Trade) => {
  const entryPrice = Number(trade.entryPrice) || 0;
  const exitPrice = Number(trade.exitPrice) || 0;
  const quantity = Number(trade.quantity) || 0;
  const pnl = Number((trade as any).pnl) || 0;
  const brokerage = Number(trade.brokerage) || 0;
  
  // Total investment
  const totalInvestment = entryPrice * quantity;
  
  // Return percentage (pnl already includes brokerage)
  const returnPercentage = totalInvestment > 0 ? (pnl / totalInvestment) * 100 : 0;
  
  // Trade duration
  let durationDays = 0;
  let durationText = "-";
  if (trade.entryDate && trade.exitDate) {
    const entry = new Date(trade.entryDate);
    const exit = new Date(trade.exitDate);
    durationDays = Math.ceil((exit.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24));
    durationText = durationDays === 1 ? "1 day" : `${durationDays} days`;
  } else if (trade.entryDate) {
    durationText = "Active";
  }
  
  // Daily return rate (annualized for trades longer than 1 day)
  let dailyReturnRate = 0;
  let annualizedReturn = 0;
  if (durationDays > 0 && totalInvestment > 0) {
    dailyReturnRate = (returnPercentage / durationDays);
    annualizedReturn = dailyReturnRate * 365;
  }
  
  return {
    totalInvestment,
    returnPercentage,
    durationDays,
    durationText,
    dailyReturnRate,
    annualizedReturn,
    entryPrice,
    exitPrice,
    brokerage
  };
};

const extractImageUrl = (trade: Trade): string | null => {
  const anyTrade: any = trade as any;

  if (typeof anyTrade.image === "string" && anyTrade.image.trim() !== "") return anyTrade.image;

  if (anyTrade.image && typeof anyTrade.image === "object") {
    const candidates = ["secure_url", "url", "path", "location", "filename", "public_id"];
    for (const k of candidates) if (anyTrade.image[k]) return String(anyTrade.image[k]);
  }

  if (Array.isArray(anyTrade.images) && anyTrade.images.length > 0) {
    const first = anyTrade.images[0];
    if (typeof first === "string" && first.trim() !== "") return first;
    if (first && typeof first === "object") {
      const candidates = ["secure_url", "url", "path", "location", "filename", "public_id"];
      for (const k of candidates) if (first[k]) return String(first[k]);
    }
  }

  if (typeof anyTrade.images === "string" && anyTrade.images.startsWith("blob:")) return anyTrade.images;

  return null;
};

const PerformanceIndicator = ({ value, type = "percentage" }: { value: number; type?: "percentage" | "amount" }) => {
  const isPositive = value >= 0;
  const absValue = Math.abs(value);
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
      isPositive 
        ? "bg-green-500/20 text-green-400 border border-green-500/30" 
        : "bg-red-500/20 text-red-400 border border-red-500/30"
    }`}>
      {isPositive ? <TrendingUp className="h-3 w-3 flex-shrink-0" /> : <TrendingDown className="h-3 w-3 flex-shrink-0" />}
      <span className="truncate">
        {type === "percentage" ? `${absValue.toFixed(2)}%` : inr(absValue)}
      </span>
    </div>
  );
};

const CurrencyDisplay = ({ value, className = "" }: { value: number; className?: string }) => {
  const isPositive = value >= 0;
  const absValue = Math.abs(value);
  
  return (
    <span className={`font-bold truncate ${isPositive ? 'text-green-400' : 'text-red-400'} ${className}`}>
      {inr(value)}
    </span>
  );
};

const NumberDisplay = ({ value, className = "" }: { value: number; className?: string }) => {
  return (
    <span className={`font-bold truncate ${className}`}>
      {formatNumber(value)}
    </span>
  );
};

export default function TradeViewPage({ tradeId, onClose }: Props) {
  const router = useRouter();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch trade by id
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await tradesApi.getById(tradeId);
        // Expect either trade object or { trade } - normalize
        const t = res && (res._id || res.id) ? res : res?.trade ?? null;
        if (!t && mounted) {
          setError("Trade not found");
          setTrade(null);
        } else if (mounted) {
          setTrade(t);
        }
      } catch (err: any) {
        console.error("[TradeViewPage] load error:", err);
        if (mounted) setError(err?.message || "Failed to load trade");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [tradeId]);

  // image URL
  const imageUrl = trade ? extractImageUrl(trade) : null;

  useEffect(() => {
    if (!imageUrl) setPreviewOpen(false);
  }, [imageUrl]);

  // Prevent background scroll when preview open
  useEffect(() => {
    if (previewOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [previewOpen]);

  // escape to close preview
  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [previewOpen]);

  const handleBack = () => {
    if (onClose) return onClose();
    if (typeof router?.back === "function") router.back();
  };

  const metrics = trade ? calculateTradeMetrics(trade) : null;

  return (
    <div className="min-h-screen bg-black/80 backdrop-blur-xl text-white">
      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 sm:gap-3 text-gray-300 hover:text-white transition-all duration-300 group bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 border border-gray-700 hover:border-cyan-500/40 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="hidden sm:block font-medium text-sm">Back</span>
            </button>
            <div className="h-6 w-px bg-gradient-to-b from-gray-600 to-gray-700 hidden sm:block flex-shrink-0"></div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent truncate">
                Trade Analysis
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-1 truncate">Detailed performance breakdown and insights</p>
            </div>
          </div>

          {trade && (
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold backdrop-blur-sm border ${
                Number((trade as any).pnl) >= 0 
                  ? "bg-green-500/10 text-green-500 border-green-500/20" 
                  : "bg-red-500/10 text-red-500 border-red-500/20"
              }`}>
                <div className="flex items-center gap-1 sm:gap-2">
                  {Number((trade as any).pnl) >= 0 ? (
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  )}
                  <span className="hidden xs:inline">
                    {Number((trade as any).pnl) >= 0 ? "Profitable" : "Loss"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16 sm:py-24">
            <div className="text-center">
              <div className="relative">
                <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-cyan-400 mx-auto mb-3 sm:mb-4" />
                <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full"></div>
              </div>
              <p className="text-gray-400 text-sm sm:text-lg">Loading trade analytics...</p>
              <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2">Crunching the numbers for you</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center max-w-md mx-auto backdrop-blur-sm">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <X className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-red-400 mb-2 sm:mb-3">Trade Not Found</h3>
            <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6">{error}</p>
            <button
              onClick={handleBack}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
            >
              Return to Dashboard
            </button>
          </div>
        )}

        {/* Trade Content */}
        {trade && !loading && metrics && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
            {/* Left Main Column */}
            <div className="xl:col-span-3 space-y-4 sm:space-y-6">
              {/* Performance Overview */}
              <div className="bg-black/40 backdrop-blur-sm border border-gray-700 hover:border-cyan-500/40 transition-all rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white truncate">Performance Overview</h2>
                </div>
                
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Investment */}
                  <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-600 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-gray-400 truncate">Investment</span>
                    </div>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate" title={inr(metrics.totalInvestment)}>
                      {inr(metrics.totalInvestment)}
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full flex-shrink-0"></div>
                      <span className="text-xs text-gray-400 truncate">
                        {formatNumber(Number(trade.quantity))} units
                      </span>
                    </div>
                  </div>

                  {/* P&L (Already includes brokerage) */}
                  <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-600 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-gray-400 truncate">P&L</span>
                    </div>
                    <div className="flex flex-col xs:flex-row xs:items-end gap-1 xs:gap-2 min-w-0">
                      <p className={`text-lg sm:text-xl lg:text-2xl font-bold truncate ${Number((trade as any).pnl) >= 0 ? 'text-green-500' : 'text-red-500'}`} title={inr(Number((trade as any).pnl))}>
                        {inr(Number((trade as any).pnl))}
                      </p>
                      <div className="flex-shrink-0">
                        <PerformanceIndicator 
                          value={metrics.returnPercentage} 
                          type="percentage" 
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate" title={inr(Number(trade.brokerage))}>
                      Includes brokerage: {inr(Number(trade.brokerage))}
                    </p>
                  </div>

                  {/* Brokerage */}
                  <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-600 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <PieChart className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-gray-400 truncate">Brokerage</span>
                    </div>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate" title={inr(metrics.brokerage)}>
                      {inr(metrics.brokerage)}
                    </p>
                  </div>

                  {/* Duration */}
                  <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-600 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-gray-400 truncate">Duration</span>
                    </div>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate" title={metrics.durationText}>
                      {metrics.durationText}
                    </p>
                    {metrics.durationDays > 0 && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {metrics.dailyReturnRate > 0 ? '+' : ''}{metrics.dailyReturnRate.toFixed(2)}% daily
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Trade Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Basic Information */}
                <div className="bg-black/40 backdrop-blur-sm border border-gray-700 hover:border-cyan-500/40 transition-all rounded-xl p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white truncate">Trade Details</h2>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    {[
                      { icon: <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />, label: "Symbol", value: trade.symbol, highlight: true },
                      { icon: <Zap className="h-3 w-3 sm:h-4 sm:w-4" />, label: "Type", value: trade.type, capitalize: true },
                      { icon: <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />, label: "Entry Price", value: inr(metrics.entryPrice) },
                      { icon: <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />, label: "Exit Price", value: trade.exitPrice ? inr(metrics.exitPrice) : "-" },
                      { icon: <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />, label: "Trade Date", value: formatDateShort(trade.tradeDate) },
                      { icon: <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />, label: "Entry Date", value: formatDate(trade.entryDate) },
                      { icon: <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />, label: "Exit Date", value: formatDate(trade.exitDate) },
                      { icon: <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />, label: "Broker", value: trade.broker || "Manual" },
                    ].map((item, index) => (
                      <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-600 last:border-b-0 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="p-1 sm:p-1.5 bg-gray-700 rounded-md sm:rounded-lg flex-shrink-0">
                            {item.icon}
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-gray-400 truncate">{item.label}</span>
                        </div>
                        <span className={`text-xs sm:text-sm font-semibold truncate ml-2 ${item.highlight ? 'text-cyan-400' : 'text-white'}`} title={String(item.value)}>
                          {item.capitalize ? (item.value as string).charAt(0).toUpperCase() + (item.value as string).slice(1) : item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strategy & Conditions */}
                <div className="bg-black/40 backdrop-blur-sm border border-gray-700 hover:border-cyan-500/40 transition-all rounded-xl p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <Lightbulb className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white truncate">Strategy & Conditions</h2>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    {[
                      { label: "Strategy", value: trade.strategy },
                      { label: "Session", value: trade.session },
                      { label: "Segment", value: trade.segment },
                      { label: "Trade Type", value: trade.tradeType },
                      { label: "Direction", value: trade.direction },
                      { label: "Chart Timeframe", value: trade.chartTimeframe },
                      { label: "Entry Condition", value: trade.entryCondition },
                      { label: "Exit Condition", value: trade.exitCondition },
                      { label: "Source", value: trade.source },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-1.5 sm:py-2 min-w-0">
                        <span className="text-xs sm:text-sm font-medium text-gray-400 truncate pr-2">{item.label}</span>
                        <span className="text-xs sm:text-sm text-white text-right truncate flex-1 min-w-0" title={item.value || "-"}>
                          {item.value || "-"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes & Analysis */}
              <div className="bg-black/40 backdrop-blur-sm border border-gray-700 hover:border-cyan-500/40 transition-all rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <Lightbulb className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white truncate">Trader's Notes</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {[
                    { label: "Entry Note", value: trade.entryNote, icon: "↗️" },
                    { label: "Exit Note", value: trade.exitNote, icon: "↘️" },
                    { label: "Remark", value: trade.remark, icon: "💡", span: true },
                    { label: "Additional Notes", value: trade.notes, icon: "📝", span: true },
                  ].map((item) => (
                    <div key={item.label} className={item.span ? "md:col-span-2" : ""}>
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <span className="text-base sm:text-lg">{item.icon}</span>
                        <h3 className="font-semibold text-gray-300 text-sm sm:text-base truncate">{item.label}</h3>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-600 min-h-[80px] sm:min-h-[100px]">
                        <p className="text-gray-200 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm break-words">
                          {item.value || (
                            <span className="text-gray-500 italic">No {item.label.toLowerCase()} provided</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Analysis */}
              {trade.aiAnalysis && (
                <div className="bg-black/40 backdrop-blur-sm border border-cyan-500/40 rounded-xl p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg sm:text-xl font-bold text-cyan-400 truncate">AI Performance Analysis</h2>
                      <p className="text-cyan-400/70 text-xs sm:text-sm truncate">Powered by advanced trading analytics</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 sm:space-y-6">
                    {/* Summary */}
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className="font-semibold text-cyan-400 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full flex-shrink-0"></div>
                        Executive Summary
                      </h3>
                      <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-600">
                        <p className="text-gray-200 leading-relaxed text-xs sm:text-sm break-words">
                          {trade.aiAnalysis.summary || "No summary available"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {/* Strengths */}
                      {trade.aiAnalysis.plusPoints?.length > 0 && (
                        <div className="space-y-2 sm:space-y-3">
                          <h3 className="font-semibold text-green-400 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                            Key Strengths
                          </h3>
                          <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-600">
                            <ul className="space-y-1.5 sm:space-y-2">
                              {trade.aiAnalysis.plusPoints.map((p: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 sm:gap-3 text-gray-200 text-xs sm:text-sm">
                                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full mt-1 sm:mt-2 flex-shrink-0"></div>
                                  <span className="leading-relaxed break-words flex-1">{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Improvements */}
                      {trade.aiAnalysis.minusPoints?.length > 0 && (
                        <div className="space-y-2 sm:space-y-3">
                          <h3 className="font-semibold text-amber-400 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-400 rounded-full flex-shrink-0"></div>
                            Improvement Areas
                          </h3>
                          <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-600">
                            <ul className="space-y-1.5 sm:space-y-2">
                              {trade.aiAnalysis.minusPoints.map((p: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 sm:gap-3 text-gray-200 text-xs sm:text-sm">
                                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-400 rounded-full mt-1 sm:mt-2 flex-shrink-0"></div>
                                  <span className="leading-relaxed break-words flex-1">{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              {/* Trade Image */}
              {imageUrl && (
                <div className="bg-black/40 backdrop-blur-sm border border-gray-700 hover:border-cyan-500/40 transition-all rounded-xl p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-white text-sm sm:text-base truncate">Trade Chart</h3>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <button
                      onClick={() => setPreviewOpen(true)}
                      className="block w-full rounded-lg overflow-hidden border border-gray-600 hover:border-cyan-400 transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black group"
                    >
                      <div className="relative overflow-hidden">
                        <img 
                          src={imageUrl} 
                          alt={`Trade ${trade.symbol || "chart"}`} 
                          className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3">
                          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 text-center">
                            <p className="text-xs sm:text-sm text-gray-200">Click to view full size</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Performance Metrics */}
              <div className="bg-black/40 backdrop-blur-sm border border-gray-700 hover:border-cyan-500/40 transition-all rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-white text-sm sm:text-base truncate">Performance Metrics</h3>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-600 min-w-0">
                    <span className="text-xs sm:text-sm text-gray-400 truncate">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ml-2 ${
                      trade.exitDate 
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                        : "bg-green-500/10 text-green-400 border border-green-500/20"
                    }`}>
                      {trade.exitDate ? "Closed" : "Active"}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-600 min-w-0">
                    <span className="text-xs sm:text-sm text-gray-400 truncate">Duration</span>
                    <span className="text-xs sm:text-sm font-semibold text-white truncate ml-2" title={metrics.durationText}>
                      {metrics.durationText}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-600 min-w-0">
                    <span className="text-xs sm:text-sm text-gray-400 truncate">Return</span>
                    <div className="flex-shrink-0 ml-2">
                      <PerformanceIndicator value={metrics.returnPercentage} type="percentage" />
                    </div>
                  </div>
                  
                  {metrics.annualizedReturn !== 0 && (
                    <div className="flex justify-between items-center py-2 sm:py-3 min-w-0">
                      <span className="text-xs sm:text-sm text-gray-400 truncate">Annualized</span>
                      <div className="flex-shrink-0 ml-2">
                        <PerformanceIndicator value={metrics.annualizedReturn} type="percentage" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-black/40 backdrop-blur-sm border border-gray-700 hover:border-cyan-500/40 transition-all rounded-xl p-4 sm:p-6">
                <h3 className="font-semibold text-white text-sm sm:text-base mb-3 sm:mb-4 truncate">Quick Actions</h3>
                <div className="space-y-2 sm:space-y-3">
                  <button
                    onClick={handleBack}
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-gray-200 font-medium transition-all duration-300 hover:scale-105 text-left text-xs sm:text-sm"
                  >
                    ← Back to Trades
                  </button>
                  {imageUrl && (
                    <button
                      onClick={() => setPreviewOpen(true)}
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 font-medium transition-all duration-300 hover:scale-105 text-left text-xs sm:text-sm"
                    >
                      📊 View Full Chart
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Image Preview Modal */}
      {previewOpen && imageUrl &&
        ReactDOM.createPortal(
          <div 
            role="dialog" 
            aria-modal="true" 
            onClick={() => setPreviewOpen(false)} 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-3 sm:p-4 backdrop-blur-sm transition-all duration-300"
          >
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="relative max-w-[95vw] max-h-[90vh] flex items-center justify-center"
            >
              <button
                aria-label="Close image preview"
                onClick={() => setPreviewOpen(false)}
                className="absolute -top-12 sm:-top-16 right-0 bg-gray-800 hover:bg-gray-700 text-white p-2 sm:p-3 rounded-xl transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <X className="h-4 w-4 sm:h-6 sm:w-6" />
              </button>

              <div className="relative">
                <img 
                  src={imageUrl} 
                  alt={`Full-size ${trade?.symbol || "trade"} chart`} 
                  className="max-w-[95vw] max-h-[90vh] object-contain rounded-xl shadow-2xl bg-gray-800"
                />
                <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 bg-black/80 backdrop-blur-sm rounded-lg p-2 sm:p-4">
                  <p className="text-gray-200 text-center font-medium text-xs sm:text-sm">
                    {trade?.symbol} - {trade?.type} Trade • {formatDateShort(trade?.tradeDate)}
                  </p>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}