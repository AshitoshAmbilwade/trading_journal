"use client";

import React, { useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DataItem = {
  strategy: string;
  effectiveness: number;
  totalPnl?: number;
};

interface Props {
  data: DataItem[];
  height?: number;
}

function formatCurrency(v?: number) {
  if (v == null) return "₹0.00";
  const sign = v >= 0 ? "" : "-";
  return `${sign}₹${Math.abs(v).toFixed(2)}`;
}

/** Custom tooltip to show effectiveness + totalPnl (with white text) */
function RadarTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload as DataItem;
  return (
    <div
      style={{
        background: "rgba(15,15,20,0.95)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#fff",
        padding: "10px 12px",
        borderRadius: 8,
        fontSize: 13,
        minWidth: 180,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{`Strategy: ${p.strategy}`}</div>
      <div style={{ fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: "#9AE6B4", fontWeight: 600 }}>Effectiveness: </span>
        <span style={{ color: "#fff" }}>{`${Number(p.effectiveness ?? 0)}%`}</span>
      </div>
      <div style={{ fontSize: 13 }}>
        <span style={{ color: "#60A5FA", fontWeight: 600 }}>Total P/L: </span>
        <span style={{ color: Number(p.totalPnl ?? 0) >= 0 ? "#34D399" : "#FB7185", fontWeight: 600 }}>
          {formatCurrency(p.totalPnl)}
        </span>
      </div>
    </div>
  );
}

export function SimpleRadarChart({ data, height = 500 }: Props) {
  const chartData = useMemo(
    () =>
      (data || []).map((d) => ({
        strategy: String(d.strategy ?? "Unknown"),
        effectiveness: Number(d.effectiveness ?? 0),
        totalPnl: typeof d.totalPnl === "number" ? Number(d.totalPnl) : undefined,
      })),
    [data]
  );

  const strokeColor = "#8B5CF6";

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          cx="50%"            // perfect center
          cy="50%"            // slightly lower for balanced composition
          outerRadius="110%"   // 🔥 increased radius
          data={chartData}
          margin={{ top: 20, right: 70, left: 70, bottom: 20 }}
        >
          <PolarGrid stroke="rgba(255,255,255,0.06)" />
          <PolarAngleAxis
            dataKey="strategy"
            tick={({ x, y, payload }: any) => (
              <text
                x={x}
                y={y}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize={14}
                fontWeight={600}
                style={{ textShadow: "0 0 6px rgba(0,0,0,0.6)" }}
              >
                {payload?.value}
              </text>
            )}
          />
          <PolarRadiusAxis tick={false} axisLine={false} stroke="rgba(255,255,255,0.04)" />
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.28} />
            </linearGradient>
          </defs>

          <Radar
            name="Effectiveness"
            dataKey="effectiveness"
            stroke={strokeColor}
            strokeWidth={2}
            fill="url(#radarGradient)"
            fillOpacity={0.65}
            dot={{ r: 4, fill: "#fff", stroke: "rgba(0,0,0,0.15)" }}
          />

          <Tooltip content={<RadarTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SimpleRadarChart;
