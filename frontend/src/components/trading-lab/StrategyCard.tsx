"use client";
import React from "react";
import { Pencil, Trash2, TrendingUp, Target, Settings, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Strategy } from "@/api/strategies";

interface Props {
  strategy: Strategy;
  onEdit?: (s: Strategy) => void;
  onDelete?: (s: Strategy) => void;
}

export function StrategyCard({ strategy, onEdit, onDelete }: Props) {
  return (
    <Card className="md:w-lg group relative bg-gradient-to-br from-gray-900 to-black border border-gray-800/50 rounded-2xl hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 overflow-hidden">
      {/* Gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Animated border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardHeader className="relative z-10 flex flex-row items-start justify-between gap-4 p-6 pb-4">
        <div className="flex-1 space-y-3">
          {/* Strategy Name with Icon */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {strategy.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                <Calendar className="h-3 w-3" />
                Updated {new Date(strategy.updatedAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant="secondary" 
              className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 px-3 py-1 text-xs font-medium"
            >
              <Target className="h-3 w-3 mr-1" />
              {strategy.entryCriteria?.length ?? 0} Entry Rules
            </Badge>
            <Badge 
              variant="secondary" 
              className="bg-purple-500/10 text-purple-400 border-purple-500/20 px-3 py-1 text-xs font-medium"
            >
              <Settings className="h-3 w-3 mr-1" />
              {strategy.sltpCriteria?.length ?? 0} SL/TP Rules
            </Badge>
            <Badge 
              variant="secondary" 
              className="bg-green-500/10 text-green-400 border-green-500/20 px-3 py-1 text-xs font-medium"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              {strategy.managementRules?.length ?? 0} Management
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-end gap-3">
          <div className="flex gap-1">
            {onEdit && (
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => onEdit(strategy)}
                className="h-9 w-9 rounded-lg bg-gray-800/50 hover:bg-cyan-500/20 hover:text-cyan-400 border border-gray-700/50 hover:border-cyan-500/30 transition-all duration-200"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => onDelete(strategy)}
                className="h-9 w-9 rounded-lg bg-gray-800/50 hover:bg-red-500/20 hover:text-red-400 border border-gray-700/50 hover:border-red-500/30 transition-all duration-200"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Entry Criteria Preview */}
      <CardContent className="relative z-10 p-6 pt-2">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-400 mb-3">Entry Conditions</h4>
          {strategy.entryCriteria && strategy.entryCriteria.length > 0 ? (
            <div className="space-y-2">
              {strategy.entryCriteria.slice(0, 3).map((criterion, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-300 p-2 rounded-lg bg-gray-800/30 hover:bg-gray-700/50 transition-colors duration-200"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 mt-2 flex-shrink-0" />
                  <span className="leading-relaxed">{criterion}</span>
                </div>
              ))}
              {strategy.entryCriteria.length > 3 && (
                <div className="text-xs text-cyan-400 font-medium px-2 py-1">
                  +{strategy.entryCriteria.length - 3} more conditions
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic p-2 rounded-lg bg-gray-800/20">
              No entry conditions defined
            </div>
          )}
        </div>
      </CardContent>

      {/* Footer with Usage Stats */}
      <CardFooter className="relative z-10 p-6 pt-4 border-t border-gray-800/50">
        <div className="flex items-center justify-between w-full text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Active Strategy</span>
            </div>
            <div className="h-3 w-px bg-gray-700" />
            <span>Last used: Recently</span>
          </div>
          
          {/* Success Rate Indicator (placeholder - you can replace with actual data) */}
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-cyan-500 rounded-full"
                style={{ width: '75%' }} // Replace with actual success rate
              />
            </div>
            <span className="text-cyan-400 font-medium">75%</span>
          </div>
        </div>
      </CardFooter>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-cyan-500/5 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </Card>
  );
}