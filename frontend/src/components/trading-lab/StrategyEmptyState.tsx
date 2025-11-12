"use client";
import React from "react";
import { Target, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { onAdd?: () => void; }

export function StrategyEmptyState({ onAdd }: Props) {
  return (
    <div className="relative flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-800 rounded-2xl bg-gradient-to-br from-black to-gray-900">
      <div className="mb-6 p-6 bg-gray-900 rounded-2xl border border-gray-800 shadow-lg">
        <Target className="h-12 w-12 text-cyan-400" />
      </div>

      <h3 className="text-2xl font-bold text-white mb-2">No Strategies Yet</h3>
      <p className="text-gray-400 mb-6 max-w-lg">
        Create your first trading strategy to organize entry rules, SL/TP and trade management.
      </p>

      {onAdd && (
        <div>
          <Button onClick={onAdd} className="h-12 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
            <Plus className="h-5 w-5 mr-2" /> Create First Strategy
          </Button>
        </div>
      )}
    </div>
  );
}
