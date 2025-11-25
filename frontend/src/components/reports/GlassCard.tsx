// src/components/reports/GlassCard.tsx
import React from "react";

const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl ${className}`}>
    {children}
  </div>
);

export default GlassCard;
