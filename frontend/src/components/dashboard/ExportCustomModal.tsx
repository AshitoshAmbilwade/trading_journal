// ExportCustomModal.tsx
'use client';
import React from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

type Props = {
  exportCustomOpen: boolean;
  exportStart: string;
  exportEnd: string;
  setExportStart: (s: string) => void;
  setExportEnd: (s: string) => void;
  setExportCustomOpen: (v: boolean) => void;
  doCustomExport: (format: 'csv'|'json') => void;
};

export default function ExportCustomModal({
  exportCustomOpen, exportStart, exportEnd, setExportStart, setExportEnd, setExportCustomOpen, doCustomExport
}: Props) {
  if (!exportCustomOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={() => setExportCustomOpen(false)} />
      <div className="relative z-10 w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Export Custom Range</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Start date</label>
              <Input
                type="date"
                className="bg-gray-800 border-gray-600 text-white"
                value={exportStart}
                onChange={(e) => setExportStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-300">End date</label>
              <Input
                type="date"
                className="bg-gray-800 border-gray-600 text-white"
                value={exportEnd}
                onChange={(e) => setExportEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setExportCustomOpen(false);
                setExportStart("");
                setExportEnd("");
              }}
              className="border-gray-600 text-white hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => doCustomExport('csv')}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              Export CSV
            </Button>
            <Button
              onClick={() => doCustomExport('json')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              Export JSON
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
