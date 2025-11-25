// src/components/reports/PerformanceMetric.tsx
"use client";
import React from "react";
import { motion } from "motion/react";
import { ArrowUp, ArrowDown } from "lucide-react";

interface PerformanceMetricProps {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
  gradientFrom: string;
  gradientTo: string;
  subtitle?: string;
}
const PerformanceMetric: React.FC<PerformanceMetricProps> = ({ value, label, icon: Icon, trend, gradientFrom, gradientTo, subtitle }) => (
  <motion.div
    whileHover={{ scale: 1.03, y: -4 }}
    className={`relative p-6 rounded-3xl bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white overflow-hidden group cursor-pointer backdrop-blur-sm border border-white/10 min-h-[110px]`}
  >
    <div className="absolute inset-0 bg-black/20" />
    <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-30 transition-opacity">
      <Icon className="h-16 w-16" />
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-5 w-5" />
        {trend && trend !== "neutral" && (
          <div className="bg-white/20 rounded-full p-1 backdrop-blur-sm">
            {trend === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          </div>
        )}
      </div>
      <div className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-br from-white to-gray-200 bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-sm opacity-90 font-medium">{label}</div>
      {subtitle && <div className="text-xs opacity-70 mt-1">{subtitle}</div>}
    </div>
  </motion.div>
);

export default PerformanceMetric;
