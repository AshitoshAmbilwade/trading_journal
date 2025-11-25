// src/components/reports/StatusBadge.tsx
import React from "react";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

const statusConfig = {
  draft: {
    label: "Queued",
    bgClass: "bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30",
    textClass: "text-amber-300",
    icon: Clock,
    glow: "shadow-lg shadow-amber-500/20"
  },
  ready: {
    label: "Ready",
    bgClass: "bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30",
    textClass: "text-emerald-300",
    icon: CheckCircle2,
    glow: "shadow-lg shadow-emerald-500/20"
  },
  failed: {
    label: "Failed",
    bgClass: "bg-gradient-to-br from-red-500/20 to-rose-600/20 border border-red-500/30",
    textClass: "text-red-300",
    icon: XCircle,
    glow: "shadow-lg shadow-red-500/20"
  }
};

interface StatusBadgeProps {
  status?: string;
}
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: "Unknown",
    bgClass: "bg-gray-500/20 border border-gray-500/30",
    textClass: "text-gray-300",
    icon: Clock,
    glow: ""
  };
  const Icon = config.icon;
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bgClass} ${config.textClass} ${config.glow} text-xs backdrop-blur-sm`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </div>
  );
};

export default StatusBadge;
