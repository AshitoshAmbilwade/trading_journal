// src/components/charts/SimpleLineChart.tsx
"use client";
import React from "react";

interface DataPoint {
  date: string;
  pnl: number;
}

interface SimpleLineChartProps {
  data: DataPoint[];
}

export function SimpleLineChart({ data }: SimpleLineChartProps) {
  if (!Array.isArray(data) || data.length === 0) {
    // render a simple empty placeholder
    return (
      <div className="w-full h-[300px] flex items-center justify-center text-sm text-muted-foreground">
        No data
      </div>
    );
  }

  // Defensive: if only one point, render it centered
  const safeData = data.length === 1 ? [{ ...data[0], date: data[0].date }] : data.slice();

  const maxValue = Math.max(...safeData.map((d) => d.pnl));
  const minValue = Math.min(...safeData.map((d) => d.pnl));
  // avoid zero range
  const range = maxValue - minValue || 1;
  const padding = 20;

  // use actual pixel width/height relative coords (these are viewBox units)
  const width = 100;
  const height = 80;

  // when only one point, center it horizontally
  const points = safeData.map((point, index) => {
    const denom = safeData.length === 1 ? 1 : safeData.length - 1;
    const x = safeData.length === 1 ? width / 2 : (index / denom) * width;
    // clamp pnl to avoid NaN
    const normalized = (point.pnl - minValue) / range;
    const y = Math.max(0, Math.min(height - padding / 2, height - normalized * (height - padding)));
    return { x, y, value: point.pnl };
  });

  const pathData = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  // compute Y axis labels simple
  const topLabel = Math.round(maxValue);
  const bottomLabel = Math.round(minValue);

  return (
    <div className="relative w-full h-[300px] flex items-center justify-center">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((yPct) => {
          const y = (yPct / 100) * height;
          return <line key={yPct} x1="0" y1={y} x2={width} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="2,2" />;
        })}

        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Area under curve */}
        <path d={`${pathData} L ${width} ${height} L 0 ${height} Z`} fill="url(#lineGradient)" />

        {/* Line */}
        <path d={pathData} fill="none" stroke="#0EA5E9" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle cx={String(point.x)} cy={String(point.y)} r="0.8" fill="#0EA5E9" className="hover:r-1.5 transition-all cursor-pointer" />
          </g>
        ))}
      </svg>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 text-xs text-muted-foreground">
        {safeData.map((d, i) =>
          // show at most 6 labels, evenly spaced
          i % Math.max(1, Math.floor(safeData.length / 6)) === 0 ? (
            <span key={i}>{d.date}</span>
          ) : (
            <span key={i} />
          )
        )}
      </div>

      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground pr-2">
        <span>₹{topLabel}</span>
        <span>₹{bottomLabel}</span>
      </div>
    </div>
  );
}
