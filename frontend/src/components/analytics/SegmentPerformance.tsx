"use client";

import React, { useEffect, useState } from "react";
import { analyticsApi, AnalyticsDistributionItem } from "@/api/analytics";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";
import { BarChart3 } from "lucide-react";

// 🎨 segment → color mapping
const SEGMENT_COLORS: Record<string, string> = {
  equity: "#10B981", // green
  future: "#3B82F6", // blue
  forex: "#6366F1", // indigo
  option: "#F59E0B", // amber
  commodity: "#EF4444", // red
  currency: "#8B5CF6", // violet
  crypto: "#14B8A6", // teal
  unknown: "#9CA3AF", // gray fallback
};

interface SegmentPerformanceProps {
  filters?: { from?: string; to?: string };
  loading?: boolean;
}

/**
 * ✅ SegmentPerformance — Donut chart showing total P/L by trading segment
 */
export default function SegmentPerformance({
  filters,
  loading = false,
}: SegmentPerformanceProps) {
  const [data, setData] = useState<
    { _id: string; totalPnl: number; count: number; winRate: number }[]
  >([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const load = async () => {
      setFetching(true);
      try {
        const res: AnalyticsDistributionItem[] =
          await analyticsApi.getDistribution("segment", filters);

        if (Array.isArray(res)) {
          // ✅ normalize null _id and ensure all numeric values are safe
          const cleanData = res.map((d) => ({
            _id: d._id ?? "Unknown",
            totalPnl: Number(d.totalPnl ?? 0),
            count: Number(d.count ?? 0),
            winRate: Number(d.winRate ?? 0),
          }));
          setData(cleanData);
        }
      } catch (err) {
        console.error("SegmentPerformance load error:", err);
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [JSON.stringify(filters)]);

  const isLoading = loading || fetching;
  const hasData = Array.isArray(data) && data.length > 0;
  const totalPnl = data.reduce((sum, d) => sum + d.totalPnl, 0);

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-xl relative overflow-hidden group hover:border-blue-500/40 transition-all duration-500">
      {/* background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-indigo-500/5 opacity-50 group-hover:opacity-80 transition-opacity" />

      {/* animated glow */}
      <motion.div
        className="absolute -bottom-20 -left-20 h-72 w-72 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Header */}
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <CardTitle>Segment Performance</CardTitle>
            </div>
            <CardDescription className="mt-1 text-sm text-gray-400">
              Total profit/loss by market segment
            </CardDescription>
          </div>

          {!isLoading && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total P/L</div>
              <div
                className={`text-lg font-semibold ${
                  totalPnl >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {totalPnl >= 0 ? "+" : "-"}₹{Math.abs(totalPnl).toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Chart */}
      <CardContent className="relative">
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Skeleton className="h-40 w-full" />
          </div>
        ) : hasData ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="totalPnl"
                  nameKey="_id"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={4}
                  label={({ _id, percent }) =>
                    `${_id} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {data.map((d, i) => (
                    <Cell
                      key={i}
                      fill={
                        SEGMENT_COLORS[d._id.toLowerCase()] ||
                        SEGMENT_COLORS.unknown
                      }
                      stroke="rgba(255,255,255,0.05)"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `₹${value.toFixed(2)}`,
                    name.charAt(0).toUpperCase() + name.slice(1),
                  ]}
                  labelFormatter={(name) => `Segment: ${name}`}
                  contentStyle={{
                    backgroundColor: "rgba(20,20,25,0.95)",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#ffffff",
                    fontSize: "13px",
                    padding: "8px 12px",
                  }}
                  itemStyle={{ color: "#ffffff" }} // <--- force white text inside tooltip items
                  labelStyle={{ color: "#ffffff", fontWeight: 600 }} // <--- white label text too
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-gray-500">
            No segment data
          </div>
        )}
      </CardContent>
    </Card>
  );
}
