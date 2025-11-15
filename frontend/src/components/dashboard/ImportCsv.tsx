"use client";

import React, { useRef, useState } from "react";
import { importCsvApi } from "@/api/importCsv";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

type Props = {
  onImported?: () => void;
};

export default function ImportCsv({ onImported }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setLoading(true);
    setProgress(5);
    setError(null);
    setSuccess(false);

    try {
      await importCsvApi.uploadMultiple(files, (percent) => setProgress(percent));

      setSuccess(true);
      setProgress(100);

      setTimeout(() => {
        if (onImported) onImported();
        setProgress(0);
      }, 300);
    } catch (err: any) {
      setError(err?.error || err?.message || "Import failed");
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
    <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 shadow-md space-y-4 text-white">
      <h2 className="text-xl font-semibold">Import Trades (CSV)</h2>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="flex items-center gap-3">
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {loading ? "Importing..." : "Upload CSV(s)"}
        </Button>

        {loading && (
          <div className="w-48">
            <div className="h-2 w-full bg-neutral-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-neutral-300 mt-1">{progress}%</div>
          </div>
        )}
      </div>

      {/* Success message */}
      {success && (
        <div className="p-3 rounded bg-green-900/40 border border-green-700 text-green-300 text-sm">
          ✅ Trades imported successfully!
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 rounded bg-red-900/40 border border-red-700 text-red-300 text-sm">
          ❌ {error}
        </div>
      )}
    </div>
  );
}
