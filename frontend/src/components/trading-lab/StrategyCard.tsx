"use client";
import React from "react";
import { Pencil, Trash2 } from "lucide-react";
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
    <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
      <CardHeader className="flex items-start justify-between gap-3">
        <div>
          <CardTitle className="text-lg font-bold text-white">{strategy.name}</CardTitle>
          <div className="mt-2 flex gap-2">
            <Badge variant="outline" className="text-xs">Entry: {strategy.entryCriteria?.length ?? 0}</Badge>
            <Badge variant="outline" className="text-xs">SL/TP: {strategy.sltpCriteria?.length ?? 0}</Badge>
            <Badge variant="outline" className="text-xs">Manage: {strategy.managementRules?.length ?? 0}</Badge>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            {onEdit && <Button size="icon" variant="ghost" onClick={() => onEdit(strategy)}><Pencil className="h-4 w-4" /></Button>}
            {onDelete && <Button size="icon" variant="ghost" onClick={() => onDelete(strategy)}><Trash2 className="h-4 w-4 text-rose-400" /></Button>}
          </div>
          <div className="text-xs text-gray-400">Updated: {new Date(strategy.updatedAt).toLocaleDateString()}</div>
        </div>
      </CardHeader>

      <CardContent className="pt-2 text-sm text-gray-300">
        {strategy.entryCriteria?.slice(0, 3).map((c, i) => (
          <div key={i} className="truncate">{c}</div>
        ))}
      </CardContent>

      <CardFooter />
    </Card>
  );
}
