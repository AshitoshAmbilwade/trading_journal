// src/components/analytics/PerformanceChart.tsx
"use client";

import React, { useMemo, useEffect, useState } from "react";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ZAxis,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";
import { format } from "date-fns";

type SeriesPoint = { date: string; pnl: number };

export type Trade = {
  _id: string;
  symbol?: string;
  type?: string;
  quantity?: number;
  entryPrice?: number;
  exitPrice?: number;
  pnl?: number;
  segment?: string;
  tradeType?: string;
  strategy?: string;
  session?: string;
  broker?: string;
  direction?: string;
  entryDate?: string;
  exitDate?: string;
  tradeDate?: string;
  createdAt?: string;
  aiAnalysis?: any;
  [k: string]: any;
};

interface PerformanceChartProps {
  data?: SeriesPoint[];
  trades?: Trade[];
  interval?: "daily" | "weekly" | "monthly" | "custom";
  loading?: boolean;
}

/**
 * PerformanceChart — per-trade scatter (one point per trade) + connecting line.
 * - Shows every trade as a dot (green/red).
 * - Connecting line joins the points (monotone).
 * - X axis shows every trade timestamp (ticks derived from trades).
 * - Tooltip (black) shows pnl, type, qty, entry/exit prices and entry/exit dates (dd MMM yyyy).
 * - Responsive dot sizes.
 * - Minimal changes to your previous style.
 */
export function PerformanceChart({
  data,
  trades,
  interval = "daily",
  loading = false,
}: PerformanceChartProps) {
  // responsive dot radius (small phones -> 3, tablets -> 5, desktop -> 7)
  const useWindowWidth = () => {
    const [w, setW] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1200);
    useEffect(() => {
      const onResize = () => setW(window.innerWidth);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, []);
    return w;
  };
  const winWidth = useWindowWidth();
  const dotRadius = winWidth < 420 ? 3 : winWidth < 768 ? 5 : 7;

  const isProfit = useMemo(() => {
    if (trades?.length) return trades.reduce((s, t) => s + Number(t.pnl ?? 0), 0) >= 0;
    if (data?.length) return (data[data.length - 1].pnl ?? 0) - (data[0].pnl ?? 0) >= 0;
    return true;
  }, [trades, data]);

  const intervalLabel =
    interval === "daily" ? "Day-by-day P/L" : interval === "weekly" ? "Week-by-week P/L" : "Month-by-month P/L";

  // Build scatter data: each trade => one point. Use createdAt as fallback to avoid missing points.
  const scatterData = useMemo(() => {
    if (!trades?.length) return [];
    return trades
      .map((tr) => {
        const dateStr = tr.entryDate ?? tr.tradeDate ?? tr.exitDate ?? tr.createdAt;
        const d = dateStr ? new Date(dateStr) : new Date();
        return {
          x: d.getTime(),
          y: Number(tr.pnl ?? 0),
          _trade: tr,
          // label kept for debug / axis formatting if needed
          label: format(d, interval === "monthly" ? "MMM yyyy" : "dd MMM"),
        };
      })
      .sort((a, b) => a.x - b.x);
  }, [trades, interval]);

  // If scatterData contains multiple trades with same timestamp they will still appear;
  // providing explicit ticks ensures x-axis has each point shown.
  const xTicks = useMemo(() => scatterData.map((p) => p.x), [scatterData]);

  const yMinMax = useMemo(() => {
    const vals = scatterData.length ? scatterData.map((d) => d.y) : (data || []).map((d) => d.pnl);
    if (!vals.length) return { min: 0, max: 0, pad: 10 };
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = Math.max(10, Math.abs(max - min) * 0.15);
    return { min, max, pad };
  }, [scatterData, data]);

  const lineData = useMemo(() => (data?.length ? data.map((d) => ({ date: d.date, pnl: Number(d.pnl ?? 0) })) : []), [data]);

  // Custom dot renderer to color per-point (profit green / loss red)
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null) return null;
    const pnl = Number(payload?.y ?? 0);
    const color = pnl >= 0 ? "#10B981" : "#EF4444"; // green / red
    return (
      <g>
        <circle cx={cx} cy={cy} r={dotRadius + 1} fill="rgba(255,255,255,0.04)" />
        <circle cx={cx} cy={cy} r={dotRadius} fill={color} stroke="rgba(255,255,255,0.06)" />
      </g>
    );
  };

  /* ---------- Custom Tooltip: show only requested fields (no time, no broker) ---------- */
  const TradeTooltip: React.FC<any> = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    const trade: Trade | undefined = p?._trade;
    if (!trade) return null;

    const fmtPrice = (val?: number) => (val == null ? "-" : Number(val).toFixed(2));
    const fmtDate = (v?: string) => {
      if (!v) return "-";
      try {
        return format(new Date(v), "dd MMM yyyy");
      } catch {
        return "-";
      }
    };
    const shortSummary =
      trade.aiAnalysis && typeof trade.aiAnalysis === "string"
        ? trade.aiAnalysis.slice(0, 140)
        : trade.aiAnalysis
        ? JSON.stringify(trade.aiAnalysis).slice(0, 140)
        : null;

    return (
      <div className="bg-black/95 text-white border border-white/8 p-3 rounded-md shadow-lg min-w-[220px]">
        <div className="flex justify-between items-center mb-1">
          <div className="font-medium">{trade.symbol ?? "-"}</div>
          <div className={`text-sm font-semibold ${Number(trade.pnl ?? 0) >= 0 ? "text-green-400" : "text-red-300"}`}>
            {Number(trade.pnl ?? 0) >= 0 ? "+" : ""}₹{Number(trade.pnl ?? 0).toFixed(2)}
          </div>
        </div>

        <div className="text-xs text-gray-300 space-y-1">
          <div>
            <span className="text-gray-400">Type: </span>
            {trade.type ?? "-"}
          </div>
          <div>
            <span className="text-gray-400">Direction: </span>
            {trade.direction ?? "-"}
          </div>
          
          <div>
            <span className="text-gray-400">Qty: </span>
            {trade.quantity ?? "-"}
          </div>

          <div>
            <span className="text-gray-400">Entry: </span>
            {fmtPrice(trade.entryPrice)}{" "}
            <span className="text-gray-500">• {fmtDate(trade.entryDate ?? trade.createdAt)}</span>
          </div>

          <div>
            <span className="text-gray-400">Exit: </span>
            {fmtPrice(trade.exitPrice)}{" "}
            <span className="text-gray-500">• {fmtDate(trade.exitDate ?? trade.createdAt)}</span>
          </div>

          {shortSummary && (
            <div className="pt-2 border-t border-white/6 text-[12px] text-gray-300 mt-2">
              {shortSummary}
              {String(trade.aiAnalysis).length > 140 ? "…" : ""}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ---------- Render ---------- */
  return (
    <Card className="border-border/40 bg-card/30 backdrop-blur-xl relative overflow-hidden group hover:border-primary/40 transition-all duration-500">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${
          isProfit ? "from-green-500/5 via-emerald-500/5 to-cyan-500/5" : "from-red-500/5 via-rose-500/5 to-pink-500/5"
        } opacity-70 group-hover:opacity-100 transition-opacity`}
      />

      <motion.div
        className="absolute -bottom-32 -left-32 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-0 group-hover:opacity-80 transition-all duration-700"
        style={{
          background: isProfit
            ? "linear-gradient(to bottom right, rgba(16,185,129,0.15), rgba(6,182,212,0.15))"
            : "linear-gradient(to bottom right, rgba(239,68,68,0.15), rgba(244,114,182,0.15))",
        }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Header */}
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center shadow-inner ${
                  isProfit ? "bg-gradient-to-br from-green-500 to-emerald-600" : "bg-gradient-to-br from-red-500 to-rose-600"
                }`}
              >
                {isProfit ? <TrendingUp className="h-4 w-4 text-white" /> : <TrendingDown className="h-4 w-4 text-white" />}
              </div>
              <CardTitle className="text-lg font-semibold text-white">Performance ({intervalLabel})</CardTitle>
            </div>
            <CardDescription className="mt-1 text-sm text-gray-400 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              Track P/L evolution — hover for trade details
            </CardDescription>
          </div>

          <div className="text-right">
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <span className={`text-2xl font-bold bg-gradient-to-r ${isProfit ? "from-green-400 to-emerald-500" : "from-red-400 to-pink-500"} bg-clip-text text-transparent`}>
                {isProfit ? "Profit" : "Loss"}
              </span>
            )}
            <Badge className={`mt-1 ${isProfit ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
              {isProfit ? "Net Gain" : "Net Loss"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative">
        {loading ? (
          <div className="h-60 flex items-center justify-center">
            <Skeleton className="h-40 w-full" />
          </div>
        ) : scatterData?.length ? (
          <div className="w-full h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={scatterData} margin={{ top: 8, right: 20, left: 12, bottom: 40 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={["dataMin", "dataMax"]}
                  ticks={xTicks}
                  tickFormatter={(ts) => (interval === "monthly" ? format(new Date(ts), "MMM yyyy") : format(new Date(ts), "dd MMM"))}
                  tick={{ fontSize: 12, fill: "#aaa" }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  domain={[yMinMax.min - yMinMax.pad, yMinMax.max + yMinMax.pad]}
                  tickFormatter={(v) => `₹${v}`}
                  tick={{ fontSize: 12, fill: "#aaa" }}
                />
                <ZAxis type="number" dataKey="y" range={[70, 280]} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                <ReTooltip cursor={{ stroke: "rgba(255,255,255,0.05)" }} content={<TradeTooltip />} wrapperStyle={{ zIndex: 50 }} />
                {/* connecting line */}
                <Line type="monotone" dataKey="y" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
                {/* dots */}
                <Scatter name="Trades" data={scatterData} shape={<CustomDot />} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : lineData?.length ? (
          <div className="w-full h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData} margin={{ top: 8, right: 20, left: 12, bottom: 20 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#aaa" }} />
                <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 12, fill: "#aaa" }} />
                <Area type="monotone" dataKey="pnl" stroke="#06b6d4" fillOpacity={0.25} fill="#06b6d4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-gray-500">No data</div>
        )}
      </CardContent>
    </Card>
  );
}

export default PerformanceChart;
