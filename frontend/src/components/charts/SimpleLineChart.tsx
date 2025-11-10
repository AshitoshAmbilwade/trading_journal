"use client";
import React from "react";

interface DataPoint {
  date: string;
  pnl: number;
}

interface SimpleLineChartProps {
  data: DataPoint[]; // cumulative pnl series
}

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length <= 1) return points.map((p) => `L ${p.x} ${p.y}`).join(" ");
  // simple quadratic bezier smoothing
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` T ${last.x} ${last.y}`;
  return d;
}

export function SimpleLineChart({ data }: SimpleLineChartProps) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-[340px] flex items-center justify-center text-sm text-muted-foreground">
        No data
      </div>
    );
  }

  // defensive copy
  const safe = data.slice();

  // compute numeric bounds
  const values = safe.map((d) => d.pnl);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  // viewBox units
  const width = 1000; // larger for smoother curves
  const height = 360;
  const paddingX = 60;
  const paddingY = 40;
  const innerW = width - paddingX * 2;
  const innerH = height - paddingY * 2;

  // map points to pixel coords
  const points = safe.map((pt, i) => {
    const denom = Math.max(1, safe.length - 1);
    const x = paddingX + (i / denom) * innerW;
    const normalized = (pt.pnl - minValue) / range;
    const y = paddingY + (1 - normalized) * innerH;
    return { x, y, value: pt.pnl, label: pt.date };
  });

  const path = smoothPath(points);

  // Y ticks (top, mid, bottom)
  const topLabel = Math.round(maxValue);
  const midLabel = Math.round((maxValue + minValue) / 2);
  const bottomLabel = Math.round(minValue);

  // X labels: show up to 6 evenly spaced
  const labelStep = Math.max(1, Math.floor(points.length / 6));

  const gradientId = "lineGradientChart";

  return (
    <div className="relative w-full h-[340px]">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* grid horizontal lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((f, idx) => {
          const y = paddingY + f * innerH;
          return <line key={idx} x1={paddingX} x2={paddingX + innerW} y1={y} y2={y} stroke="rgba(255,255,255,0.04)" strokeDasharray="6 6" />;
        })}

        {/* area under curve */}
        <path d={`${path} L ${paddingX + innerW} ${paddingY + innerH} L ${paddingX} ${paddingY + innerH} Z`} fill={`url(#${gradientId})`} />

        {/* line stroke */}
        <path d={path.replace(/^L /, "L ")} fill="none" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* points */}
        {points.map((p, i) => (
          <circle key={i} cx={String(p.x)} cy={String(p.y)} r={4} fill="#06b6d4" stroke="rgba(255,255,255,0.06)" />
        ))}

        {/* left axis labels */}
        <text x={12} y={paddingY + 4} fontSize="12" fill="rgba(255,255,255,0.7)">
          ₹{topLabel}
        </text>
        <text x={12} y={paddingY + innerH / 2 + 4} fontSize="12" fill="rgba(255,255,255,0.45)">
          ₹{midLabel}
        </text>
        <text x={12} y={paddingY + innerH + 4} fontSize="12" fill="rgba(255,255,255,0.35)">
          ₹{bottomLabel}
        </text>
      </svg>

      {/* X axis labels */}
      <div className="absolute left-0 right-0 bottom-0 px-6 pb-2 flex justify-between text-xs text-muted-foreground">
        {points.map((p, i) =>
          i % labelStep === 0 ? (
            <span key={i} className="truncate" style={{ maxWidth: `${100 / Math.max(1, Math.floor(points.length / 6))}%` }}>
              {p.label}
            </span>
          ) : (
            <span key={i} style={{ visibility: "hidden" }}>
              .
            </span>
          )
        )}
      </div>
    </div>
  );
}
