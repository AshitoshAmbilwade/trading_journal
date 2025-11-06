"use client";

import { useState } from "react";
import { Trade } from "../../api/trades";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { TrendingUp, TrendingDown, X } from "lucide-react";

/** Utility: format a date nicely */
const formatDate = (dateLike?: string | Date) => {
  if (!dateLike) return "-";
  const d = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/** Normalize any image value to a usable URL string */
const extractImageUrl = (trade: Trade): string | null => {
  const anyTrade = trade as any;
  if (typeof anyTrade.image === "string" && anyTrade.image.trim() !== "") {
    return anyTrade.image;
  }
  if (anyTrade.image && typeof anyTrade.image === "object") {
    const candidates = ["path", "secure_url", "location", "url", "filename", "public_id"];
    for (const k of candidates) {
      if (anyTrade.image[k]) return String(anyTrade.image[k]);
    }
  }
  if (Array.isArray(anyTrade.images) && anyTrade.images.length > 0) {
    const first = anyTrade.images[0];
    if (typeof first === "string" && first.trim() !== "") return first;
    if (first && typeof first === "object") {
      const candidates = ["path", "secure_url", "location", "url", "filename", "public_id"];
      for (const k of candidates) {
        if (first[k]) return String(first[k]);
      }
    }
  }
  return null;
};

interface TradeViewModalProps {
  trade: Trade;
  trigger?: React.ReactNode;
  onClose?: () => void;
}

export function TradeViewModal({ trade, trigger, onClose }: TradeViewModalProps) {
  const [imagePreview, setImagePreview] = useState(false);
  const imageUrl = extractImageUrl(trade);

  return (
    <Dialog onOpenChange={(open) => !open && onClose?.()}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-gray-900 text-white border border-gray-700 rounded-xl p-4 sm:p-6 space-y-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            Trade Details
          </DialogTitle>
        </DialogHeader>

        {/* GRID OF DETAILS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-300">
          {[
            ["Symbol", trade.symbol],
            ["Type", trade.type],
            ["Quantity", trade.quantity],
            ["Price", `₹${Number(trade.price).toFixed(2)}`],
            [
              "P/L",
              <span
                key="pnl"
                className={`flex items-center gap-1 ${
                  trade.pnl >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {trade.pnl >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                ₹{Math.abs(trade.pnl).toFixed(2)}
              </span>,
            ],
            ["Brokerage", trade.brokerage ? `₹${trade.brokerage}` : "-"],
            ["Trade Date", formatDate(trade.tradeDate)],
            ["Entry Date", formatDate(trade.entryDate)],
            ["Exit Date", formatDate(trade.exitDate)],
            ["Broker", trade.broker || "Manual"],
            ["Strategy", trade.strategy || "-"],
            ["Session", trade.session || "-"],
            ["Segment", trade.segment || "-"],
            ["Trade Type", trade.tradeType || "-"],
            ["Direction", trade.direction || "-"],
            ["Chart Timeframe", trade.chartTimeframe || "-"],
            ["Entry Condition", trade.entryCondition || "-"],
            ["Exit Condition", trade.exitCondition || "-"],
            ["Source", trade.source || "-"],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <p className="font-medium text-white">{label}:</p>
              <p>{value || "-"}</p>
            </div>
          ))}

          {/* Notes Fields */}
          {[
            ["Entry Note", trade.entryNote],
            ["Exit Note", trade.exitNote],
            ["Remark", trade.remark],
            ["Notes", trade.notes],
          ].map(([label, value]) => (
            <div key={String(label)} className="col-span-full">
              <p className="font-medium text-white">{label}:</p>
              <p>{value || "-"}</p>
            </div>
          ))}

          {/* AI Analysis */}
          {trade.aiAnalysis && (
            <div className="col-span-full bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-2">
              <p className="font-medium text-cyan-400">AI Summary:</p>
              <p className="text-gray-200 text-sm">{trade.aiAnalysis.summary}</p>

              {trade.aiAnalysis.plusPoints?.length > 0 && (
                <div>
                  <p className="font-medium text-green-400">Plus Points:</p>
                  <ul className="list-disc list-inside text-gray-300 text-sm">
                    {trade.aiAnalysis.plusPoints.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {trade.aiAnalysis.minusPoints?.length > 0 && (
                <div>
                  <p className="font-medium text-red-400">Minus Points:</p>
                  <ul className="list-disc list-inside text-gray-300 text-sm">
                    {trade.aiAnalysis.minusPoints.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* IMAGE */}
          {imageUrl && (
            <div className="col-span-full">
              <p className="font-medium text-white mb-2">Image:</p>
              <img
                src={imageUrl}
                alt="Trade"
                onClick={() => setImagePreview(true)}
                className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-lg border border-gray-700 cursor-pointer hover:opacity-80 transition"
              />
              <p className="text-xs text-gray-400 mt-1">Click image to view full size</p>
            </div>
          )}
        </div>

        <Button
          onClick={onClose}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-black mt-4 font-semibold"
        >
          Close
        </Button>
      </DialogContent>

      {/* FULLSCREEN IMAGE PREVIEW */}
      {imagePreview && imageUrl && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center">
          <img
            src={imageUrl}
            alt="Trade Preview"
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-lg"
          />
          <button
            onClick={() => setImagePreview(false)}
            className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </Dialog>
  );
}
