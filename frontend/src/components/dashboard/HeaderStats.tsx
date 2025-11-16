// HeaderStats.tsx
'use client';
import React from 'react';
import { BarChart3 } from 'lucide-react';
import { CardTitle } from '../ui/card';

type Props = {
  filteredCount: number;
  winningTrades: number;
  totalPnL: number;
  winRate: number;
  formatCurrency: (v: number) => string;
};

export default function HeaderStats({ filteredCount, winningTrades, totalPnL, winRate, formatCurrency }: Props) {
  return (
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <CardTitle className="text-white text-xl font-bold">Trade Journal</CardTitle>
          <p className="text-sm text-gray-400 mt-1">
            Manage and analyze your trading performance
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mt-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-cyan-500"></div>
          <span className="text-sm text-gray-300">
            {filteredCount} {filteredCount === 1 ? 'trade' : 'trades'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-300">
            {winningTrades} winning trades
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
          <span className={`text-sm font-medium ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            Total P&L: {formatCurrency(totalPnL)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-purple-500"></div>
          <span className="text-sm text-gray-300">
            Win Rate: {winRate.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
