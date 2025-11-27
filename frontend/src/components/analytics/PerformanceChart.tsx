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
  aiAnalysis?: unknown;
} & Record<string, unknown>;

interface PerformanceChartProps {
  data?: SeriesPoint[];
  trades?: Trade[];
  interval?: "daily" | "weekly" | "monthly" | "custom";
  loading?: boolean;
}

/**
 * PerformanceChart — per-trade scatter (one point per trade) + connecting line.
 */
export function PerformanceChart({
  data,
  trades,
  interval = "daily",
  loading = false,
}: PerformanceChartProps) {
  // responsive dot radius
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

  // Build scatter data
  const scatterData = useMemo(() => {
    if (!trades?.length) return [];
    return trades
      .map((tr) => {
        const dateStr = (tr.entryDate as string) ?? (tr.tradeDate as string) ?? (tr.exitDate as string) ?? (tr.createdAt as string);
        const d = dateStr ? new Date(dateStr) : new Date();
        return {
          x: d.getTime(),
          y: Number(tr.pnl ?? 0),
          _trade: tr,
          label: format(d, interval === "monthly" ? "MMM yyyy" : "dd MMM"),
        };
      })
      .sort((a, b) => a.x - b.x);
  }, [trades, interval]);

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

  // Custom dot renderer — typed with unknown and narrowed
  type CustomDotProps = {
    cx?: number | null;
    cy?: number | null;
    payload?: unknown;
  };

  const CustomDot: React.FC<CustomDotProps> = (props) => {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null) return null;

    // payload should be an object with y value
    let pnl = 0;
    if (payload && typeof payload === "object") {
      const p = payload as Record<string, unknown>;
      pnl = Number(p.y ?? 0);
    }

    const color = pnl >= 0 ? "#10B981" : "#EF4444"; // green / red
    return (
      <g>
        <circle cx={cx} cy={cy} r={dotRadius + 1} fill="rgba(255,255,255,0.04)" />
        <circle cx={cx} cy={cy} r={dotRadius} fill={color} stroke="rgba(255,255,255,0.06)" />
      </g>
    );
  };

  /* ---------- Custom Tooltip ---------- */
  type TooltipProps = {
    active?: boolean;
    payload?: unknown[];
  };

  const TradeTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
    if (!active || !Array.isArray(payload) || payload.length === 0) return null;
    const p0 = payload[0] as Record<string, unknown> | undefined;
    const p = p0?.payload;
    if (!p || typeof p !== "object") return null;
    const tradeObj = (p as Record<string, unknown>)["_trade"] as Trade | undefined;
    if (!tradeObj) return null;

    const fmtPrice = (val?: unknown) => {
      const n = Number(val as unknown);
      return Number.isFinite(n) ? n.toFixed(2) : "-";
    };
    const fmtDate = (v?: unknown) => {
      if (!v) return "-";
      try {
        return format(new Date(String(v)), "dd MMM yyyy");
      } catch {
        return "-";
      }
    };

    // short summary from aiAnalysis (string or object)
    const shortSummary = (() => {
      const a = tradeObj.aiAnalysis;
      if (!a) return null;
      if (typeof a === "string") return a.slice(0, 140);
      try {
        return JSON.stringify(a).slice(0, 140);
      } catch {
        return null;
      }
    })();

    const pnlNum = Number(tradeObj.pnl ?? 0);

    return (
      <div className="bg-black/95 text-white border border-white/8 p-3 rounded-md shadow-lg min-w-[220px]">
        <div className="flex justify-between items-center mb-1">
          <div className="font-medium">{tradeObj.symbol ?? "-"}</div>
          <div className={`text-sm font-semibold ${pnlNum >= 0 ? "text-green-400" : "text-red-300"}`}>
            {pnlNum >= 0 ? "+" : ""}₹{Number(pnlNum).toFixed(2)}
          </div>
        </div>

        <div className="text-xs text-gray-300 space-y-1">
          <div>
            <span className="text-gray-400">Type: </span>
            {tradeObj.type ?? "-"}
          </div>
          <div>
            <span className="text-gray-400">Direction: </span>
            {tradeObj.direction ?? "-"}
          </div>

          <div>
            <span className="text-gray-400">Qty: </span>
            {tradeObj.quantity ?? "-"}
          </div>

          <div>
            <span className="text-gray-400">Entry: </span>
            {fmtPrice(tradeObj.entryPrice)}{" "}
            <span className="text-gray-500">• {fmtDate(tradeObj.entryDate ?? tradeObj.createdAt)}</span>
          </div>

          <div>
            <span className="text-gray-400">Exit: </span>
            {fmtPrice(tradeObj.exitPrice)}{" "}
            <span className="text-gray-500">• {fmtDate(tradeObj.exitDate ?? tradeObj.createdAt)}</span>
          </div>

          {shortSummary && (
            <div className="pt-2 border-t border-white/6 text-[12px] text-gray-300 mt-2">
              {shortSummary}
              {String(tradeObj.aiAnalysis ?? "").length > 140 ? "…" : ""}
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
                  tickFormatter={(ts) => (interval === "monthly" ? format(new Date(Number(ts)), "MMM yyyy") : format(new Date(Number(ts)), "dd MMM"))}
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
                <Line type="monotone" dataKey="y" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
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
