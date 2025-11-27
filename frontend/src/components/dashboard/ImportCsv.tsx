"use client";

import React, { useRef, useState } from "react";
import { importCsvApi } from "@/api/importCsv";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Sparkles, CheckCircle, AlertCircle, ChevronDown } from "lucide-react";

type Props = {
  onImported?: () => void;
};

const REQUIRED_COLUMNS = [
  "Symbol",
  "Quantity",
  "Entry Price",
  "Exit Price",
  "Entry Date",
  "Exit Date",
  "P/L",
];

export default function ImportCsv({ onImported }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRequirements, setShowRequirements] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setLoading(true);
    setProgress(5);
    setError(null);
    setSuccess(false);

    try {
      await importCsvApi.uploadMultiple(files, (percent: number) => setProgress(percent));

      setSuccess(true);
      setProgress(100);

      setTimeout(() => {
        if (onImported) onImported();
        setProgress(0);
      }, 1200);
    } catch (err: unknown) {
      // Safely extract message without using `any`
      const maybeObj = err as Record<string, unknown> | undefined;
      const extracted =
        (maybeObj && typeof maybeObj.error === "string" && maybeObj.error) ||
        (maybeObj && typeof maybeObj.message === "string" && maybeObj.message) ||
        (typeof err === "string" ? err : undefined) ||
        "Import failed";

      setError(extracted);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full rounded-xl bg-black/80 border border-gray-800 shadow-lg p-5 space-y-4">
      {/* Header with better visual hierarchy */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 shadow-inner">
            <Upload className="w-5 h-5 text-blue-400" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">Import Trades</h2>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                <span>CSV</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              Upload your trading data in CSV format
            </p>
          </div>
        </div>

        <div className="text-sm font-medium">
          {loading ? (
            <span className="text-blue-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              Uploading {progress}%
            </span>
          ) : success ? (
            <span className="text-green-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Completed
            </span>
          ) : (
            <span className="text-gray-400">Ready to import</span>
          )}
        </div>
      </div>

      {/* Collapsible Requirements Section */}
      <div className="border border-gray-800 rounded-lg bg-gray-900/50 overflow-hidden">
        <button
          onClick={() => setShowRequirements(!showRequirements)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-white">Required CSV Format</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${showRequirements ? "rotate-180" : ""}`}
          />
        </button>

        {showRequirements && (
          <div className="px-4 pb-4 space-y-4 border-t border-gray-800 pt-4">
            <div>
              <p className="text-xs text-gray-400 mb-3">Your CSV must include these columns:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {REQUIRED_COLUMNS.map((col) => (
                  <div
                    key={col}
                    className="px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-sm text-white text-center font-medium"
                  >
                    {col}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3 text-blue-400" />
              </div>
              <div className="text-xs text-gray-300">
                <span className="font-medium text-white">Pro Tip:</span> Include header row and use YYYY-MM-DD date format.
                Files with missing required columns will be skipped automatically.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Actions with improved visual hierarchy */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium px-5 py-2.5 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4 mr-2" />
          {loading ? "Importing..." : "Choose CSV Files"}
        </Button>

        {loading && (
          <div className="flex-1 space-y-2">
            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 shadow-lg"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)",
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Processing files...</span>
              <span className="font-medium text-white">{progress}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Status Messages with better design */}
      {success && !loading && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-400">Import successful!</p>
            <p className="text-xs text-green-500/80 mt-0.5">Your trades have been processed successfully.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-400">Import failed</p>
            <p className="text-xs text-red-500/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
