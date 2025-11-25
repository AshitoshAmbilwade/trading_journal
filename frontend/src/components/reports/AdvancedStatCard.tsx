// src/components/reports/AdvancedStatCard.tsx
import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import GlassCard from "./GlassCard";
import { formatCurrency } from "./utils";

interface AdvancedStatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  format?: "percent" | "currency" | "number" | "ratio";
  currencySymbol?: string;
}
const AdvancedStatCard: React.FC<AdvancedStatCardProps> = ({ title, value, change, icon: Icon, format = "number", currencySymbol = "₹" }) => {
  const formatValue = () => {
    if (format === "percent") return `${value}%`;
    if (format === "currency") return formatCurrency(Number(value), currencySymbol);
    if (format === "ratio") return `${value}:1`;
    return value;
  };

  const isPositive = change ? change >= 0 : Number(value) >= 0;

  return (
    <GlassCard className="p-4 sm:p-6 hover:border-gray-600/50 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center ${
            isPositive
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-red-500/20 text-red-300 border border-red-500/30"
          } backdrop-blur-sm`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h3 className="text-gray-300 text-xs sm:text-sm font-medium">{title}</h3>
            <div className={`text-lg sm:text-2xl font-bold ${isPositive ? "text-emerald-300" : "text-red-300"}`}>
              {formatValue()}
            </div>
          </div>
        </div>

        {change !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
            isPositive
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-red-500/20 text-red-300"
          }`}>
            {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>

      <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${isPositive ? "bg-emerald-500" : "bg-red-500"} transition-all duration-1000`}
          style={{ width: `${Math.min(100, Math.abs(Number(value)))}%` }}
        />
      </div>
    </GlassCard>
  );
};

export default AdvancedStatCard;
