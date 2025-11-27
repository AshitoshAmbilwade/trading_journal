"use client";

import React from "react";
import { motion } from "motion/react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

interface KPICardProps {
  title: string;
  value: number | string;
  // Lucide icons are SVG components that accept standard SVG props
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  gradient: string;
  prefix?: string;
  suffix?: string;
  trend?: "up" | "down";
  loading?: boolean;
}

export function KPICard({
  title,
  value,
  icon: Icon,
  gradient,
  prefix = "",
  suffix = "",
  trend,
  loading = false,
}: KPICardProps) {
  const formattedValue =
    typeof value === "number"
      ? Number.isInteger(value)
        ? value.toLocaleString()
        : value.toFixed(2)
      : String(value);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="relative overflow-hidden border-border/50 bg-card/40 backdrop-blur-xl hover:bg-card/60 transition-all h-full group">
        {/* Gradient background */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}
        />

        {/* Glow effect */}
        <div
          className={`absolute -top-24 -right-24 h-48 w-48 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-500`}
        />

        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">{title}</p>
              {loading ? (
                <Skeleton className="h-10 w-32 mt-2" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl sm:text-4xl bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                    {prefix}
                    {formattedValue}
                    {suffix}
                  </h3>
                  {trend && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`flex items-center gap-0.5 text-sm px-2 py-0.5 rounded-full ${
                        trend === "up" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {trend === "up" ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                    </motion.span>
                  )}
                </div>
              )}
            </div>

            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}
            >
              {/* Render the passed icon component */}
              <Icon className="h-6 w-6 text-white" />
            </motion.div>
          </div>

          {/* Progress bar indicator */}
          <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: loading ? "0%" : "75%" }}
              transition={{ duration: 1, delay: 0.3 }}
              className={`h-full bg-gradient-to-r ${gradient}`}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
