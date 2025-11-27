// src/components/dashboard/AdvancedFiltersPanel.tsx
'use client';
import React from 'react';
import { motion } from 'motion/react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';

/**
 * Filters type: keep fields you use here strongly typed as strings,
 * but allow extra keys so the panel can work with the full filters object
 * from TradeTable without needing to list every single possible field.
 */
export type Filters = {
  symbol?: string;
  type?: string;
  status?: string;
  strategy?: string;
  tradeDateFrom?: string;
  tradeDateTo?: string;
  [key: string]: string | undefined;
};

type Props = {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
};

export default function AdvancedFiltersPanel({ filters, setFilters }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden mb-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6 bg-gray-800/50 rounded-xl border border-gray-700">
        {/* Symbol Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Symbol</label>
          <Input
            placeholder="Filter by symbol"
            value={filters.symbol ?? ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, symbol: e.target.value }))}
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>

        {/* Type Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Type</label>
          <select
            value={filters.type ?? "all"}
            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">All Types</option>
            <option value="Buy">Buy</option>
            <option value="Sell">Sell</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Status</label>
          <select
            value={filters.status ?? "all"}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Strategy Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Strategy</label>
          <Input
            placeholder="Filter by strategy"
            value={filters.strategy ?? ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, strategy: e.target.value }))}
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>

        {/* Trade Date Range */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-300">Trade Date Range</label>
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2">
              <Input
                type="date"
                value={filters.tradeDateFrom ?? ""}
                onChange={(e) => setFilters((prev) => ({ ...prev, tradeDateFrom: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="border-gray-600 hover:bg-gray-700"
                onClick={() => {
                  const el = document.querySelector<HTMLInputElement>(`input[type="date"]`);
                  // prefer the focused element approach; if you must open a specific picker, browsers support is limited
                  el?.showPicker?.();
                }}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <Input
                type="date"
                value={filters.tradeDateTo ?? ""}
                onChange={(e) => setFilters((prev) => ({ ...prev, tradeDateTo: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="border-gray-600 hover:bg-gray-700"
                onClick={() => {
                  const el = document.querySelector<HTMLInputElement>(`input[type="date"]`);
                  el?.showPicker?.();
                }}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
