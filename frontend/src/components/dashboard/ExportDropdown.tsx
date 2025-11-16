// ExportDropdown.tsx
'use client';
import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Download, TableIcon, FileText, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Loader2 } from 'lucide-react';

type Props = {
  exporting: boolean;
  handleExport: (format: 'csv'|'json', range?: 'all'|'last7'|'last30'|'custom') => void;
  setExportCustomOpen: (v: boolean) => void;
};

export default function ExportDropdown({ exporting, handleExport, setExportCustomOpen }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="border-gray-600 hover:bg-gray-800/50 text-white relative min-w-[120px] justify-between"
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-800 border-gray-600 text-white w-64">
        <div className="px-2 py-1.5 text-xs text-gray-400 font-medium">Export Format</div>
        <DropdownMenuItem
          onClick={() => handleExport('csv', 'all')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <TableIcon className="h-4 w-4" />
          <div>
            <div>Export All (CSV)</div>
            <div className="text-xs text-gray-400">Complete trade history</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('json', 'all')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <FileText className="h-4 w-4" />
          <div>
            <div>Export All (JSON)</div>
            <div className="text-xs text-gray-400">Complete trade data</div>
          </div>
        </DropdownMenuItem>
        
        <div className="border-t border-gray-600 my-1"></div>
        <div className="px-2 py-1.5 text-xs text-gray-400 font-medium">Time Range</div>
        <DropdownMenuItem
          onClick={() => handleExport('csv', 'last7')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <TableIcon className="h-4 w-4" />
          Last 7 Days (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('csv', 'last30')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <TableIcon className="h-4 w-4" />
          Last 30 Days (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setExportCustomOpen(true)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <CalendarIcon className="h-4 w-4" />
          Custom Range...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
