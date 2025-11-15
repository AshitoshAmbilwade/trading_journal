// src/components/dashboard/CalendarMonthView.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { tradesApi } from "@/api/trades";
import { aggregateTradesToDailyPnL } from "@/utils/aggregateTrades"; // use your existing helper

// Local small helper for counts (if you don't have it)
function aggregateCounts(trades: any[]) {
  const counts: Record<string, number> = {};
  for (const t of trades) {
    const d = (t.exitDate ?? t.entryDate ?? t.tradeDate ?? "").slice(0, 10);
    if (!d) continue;
    counts[d] = (counts[d] ?? 0) + 1;
  }
  return counts;
}

type DailyMap = Record<string, number>;

interface Props {
  initialDate?: string; // "YYYY-MM-DD" or ISO
  onDayClick?: (ymd: string) => void; // invoked when user clicks a day
  className?: string;
}

/** Calendar month view component designed to look like your image */
export default function CalendarMonthView({ initialDate, onDayClick, className }: Props) {
  const now = new Date();
  const initial = initialDate ? new Date(initialDate) : now;
  const [visibleMonth, setVisibleMonth] = useState<Date>(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(initialDate ? initialDate.slice(0, 10) : null);

  const [dailyPnL, setDailyPnL] = useState<DailyMap>({});
  const [dayCounts, setDayCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await tradesApi.getAll();
        const trades = Array.isArray(res) ? res : res?.data ?? res?.trades ?? [];
        if (!mounted) return;

        const map = aggregateTradesToDailyPnL(trades);
        const counts = aggregateCounts(trades);
        setDailyPnL(map);
        setDayCounts(counts);
      } catch (err: any) {
        console.error(err);
        if (!mounted) return;
        setError(err?.message ?? "Failed to load trades");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Helpers
  const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
  const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

  // Build the month grid: Monday-first weeks, 6 rows x 7 columns (so month fits)
  const grid = useMemo(() => {
    const first = startOfMonth(visibleMonth);
    // Monday-first: compute previous Monday (or same if Monday)
    const dayOfWeek = (first.getDay() + 6) % 7; // Mon=0..Sun=6
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - dayOfWeek);

    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      cells.push(d);
    }
    return cells;
  }, [visibleMonth]);

  // Totals for visible month
  const { monthTotal, daysWithTrades } = useMemo(() => {
    const y = visibleMonth.getFullYear();
    const m = visibleMonth.getMonth() + 1;
    let total = 0;
    let days = 0;
    for (const [k, v] of Object.entries(dailyPnL)) {
      if (!k.startsWith(String(y))) continue;
      const monthPart = parseInt(k.slice(5, 7), 10);
      if (monthPart === m) {
        total += v;
        if (v !== 0) days++;
      }
    }
    // alternatively use dayCounts length >0
    let cnt = 0;
    for (const [k, v] of Object.entries(dayCounts)) {
      if (!k.startsWith(String(y))) continue;
      const monthPart = parseInt(k.slice(5, 7), 10);
      if (monthPart === m && v > 0) cnt++;
    }
    return { monthTotal: total, daysWithTrades: cnt || days };
  }, [dailyPnL, dayCounts, visibleMonth]);

  // Format helpers
  const formatCurrency = (n: number) =>
    (n >= 0 ? "$" : "-$") + Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 });

  // Navigation
  const goPrev = () => setVisibleMonth((s) => new Date(s.getFullYear(), s.getMonth() - 1, 1));
  const goNext = () => setVisibleMonth((s) => new Date(s.getFullYear(), s.getMonth() + 1, 1));
  const goToday = () => {
    const t = new Date();
    setVisibleMonth(new Date(t.getFullYear(), t.getMonth(), 1));
    setSelected(t.toISOString().slice(0, 10));
  };

  return (
    <div className={`bg-slate-900 rounded-lg p-4 text-slate-100 ${className ?? ""}`}>
      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={goPrev} aria-label="Previous month" className="p-2 rounded-md hover:bg-slate-800">
            <ChevronLeft />
          </button>
          <div>
            <div className="text-lg font-semibold">
              {visibleMonth.toLocaleString(undefined, { month: "long", year: "numeric" })}
            </div>
            <div className="text-xs text-slate-400">Month view</div>
          </div>
          <button onClick={goNext} aria-label="Next month" className="p-2 rounded-md hover:bg-slate-800">
            <ChevronRight />
          </button>
          <button onClick={goToday} className="ml-3 px-3 py-1 rounded-md bg-slate-800 text-xs hover:bg-slate-700">
            Today
          </button>
        </div>

        <div className="text-right">
          <div className={`text-sm font-medium ${monthTotal >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {formatCurrency(monthTotal)} / {daysWithTrades} days
          </div>
          <div className="text-xs text-slate-400">Summary</div>
        </div>
      </div>

      {/* weekday row */}
      <div className="grid grid-cols-7 text-xs text-slate-400 mb-2 px-1">
        <div className="text-center">Mon</div>
        <div className="text-center">Tue</div>
        <div className="text-center">Wed</div>
        <div className="text-center">Thu</div>
        <div className="text-center">Fri</div>
        <div className="text-center">Sat</div>
        <div className="text-center">Sun</div>
      </div>

      {/* calendar grid */}
      <div className="grid grid-cols-7 gap-3">
        {grid.map((d) => {
          const ymd = d.toISOString().slice(0, 10);
          const isCurrentMonth = d.getMonth() === visibleMonth.getMonth();
          const isToday = ymd === new Date().toISOString().slice(0, 10);
          const isSelected = selected === ymd;
          const pnl = dailyPnL[ymd] ?? 0;
          const count = dayCounts[ymd] ?? 0;

          // cell styling: dark boxes, subtle border, highlight selected
          const baseCell = "rounded-lg p-3 h-28 flex flex-col justify-between shadow-sm";
          const bg = isCurrentMonth ? "bg-slate-800/60" : "bg-transparent";
          const border = isSelected ? "ring-2 ring-amber-400" : "border border-slate-800";
          const opacity = isCurrentMonth ? "opacity-100" : "opacity-30";

          return (
            <button
              key={ymd}
              onClick={() => {
                setSelected(ymd);
                onDayClick?.(ymd);
              }}
              className={`${baseCell} ${bg} ${border} ${opacity} text-left relative focus:outline-none`}
            >
              <div className="flex items-start justify-between">
                <div className="text-sm font-medium">{d.getDate()}</div>
                {count > 0 && <div className="text-[11px] bg-slate-700/60 px-2 py-0.5 rounded-md text-slate-200">{count}</div>}
              </div>

              <div className="flex flex-col items-start">
                {/* show month P/L if exists, otherwise small placeholder */}
                {count > 0 ? (
                  <div className={`text-sm font-semibold ${pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {pnl >= 0 ? `+${pnl.toLocaleString()}` : pnl.toLocaleString()}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500"> </div>
                )}
                {/* small "View" CTA when selected */}
                {isSelected && (
                  <div className="mt-2">
                    <div className="text-xs text-slate-300">Selected</div>
                  </div>
                )}
              </div>

              {/* today marker */}
              {isToday && <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-emerald-400" />}
            </button>
          );
        })}
      </div>

      {/* loading / error footer */}
      <div className="mt-3 text-xs text-slate-400">
        {loading && <div>Loading trades...</div>}
        {error && <div className="text-rose-400">Error: {error}</div>}
      </div>
    </div>
  );
}
