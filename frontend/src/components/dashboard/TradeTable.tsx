// src/components/dashboard/TradeTable.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { tradesApi, Trade } from "../../api/trades";
import strategiesApi, { Strategy } from "@/api/strategies";
import {
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Eye,
  Loader2,
  X,
  FileText,
  TableIcon,
  Calendar as CalendarIcon,
  ChevronDown,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Skeleton } from "../ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

/* ---------------- Helpers ---------------- */

function extractImageString(img: any): string {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (typeof File !== "undefined" && img instanceof File) return "";
  if (typeof img === "object") {
    const keys = ["path", "secure_url", "url", "location", "filename", "public_id"];
    for (const k of keys) if ((img as any)[k]) return String((img as any)[k]);
  }
  return "";
}

const calculatePnL = (
  type: "Buy" | "Sell",
  entryPrice: number,
  exitPrice: number | undefined,
  quantity: number,
  brokerage: number = 0
): number => {
  if (!entryPrice || !exitPrice || !quantity) return 0;

  let grossPnL = 0;

  if (type === "Buy") {
    grossPnL = (exitPrice - entryPrice) * quantity;
  } else {
    grossPnL = (entryPrice - exitPrice) * quantity;
  }

  const netPnL = grossPnL - brokerage;
  return Number(netPnL.toFixed(2));
};

/**
 * Robust date extractor:
 * - If input contains YYYY-MM-DD -> return that.
 * - If numeric timestamp -> use UTC date.
 * - If ISO string ending with Z or containing timezone offset -> use UTC date.
 * - If string without timezone -> treat as local date and use local components.
 *
 * Returns 'YYYY-MM-DD' or empty string.
 */
const getDateOnly = (val?: any): string => {
  if (val === undefined || val === null) return "";
  try {
    // numeric timestamp
    if (typeof val === "number" && isFinite(val)) {
      const d = new Date(val);
      if (isNaN(d.getTime())) return "";
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }

    const s = String(val).trim();
    if (!s) return "";

    // If already has YYYY-MM-DD anywhere, return first match
    const isoMatch = s.match(/(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) {
      // But ensure we pick correct semantics: if string contains timezone info, the YYYY-MM-DD may be part of ISO; okay to return
      return isoMatch[1];
    }

    // Parse as Date
    const d = new Date(s);
    if (isNaN(d.getTime())) return "";

    // detect timezone presence in original string: 'Z' or offset like +05:30 or -0400
    const hasTZ = /Z$|[+\-]\d{2}:?\d{2}$/.test(s) || /T.*[+\-]\d{2}:?\d{2}/.test(s);

    if (hasTZ) {
      // use UTC components (string had explicit timezone)
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    } else {
      // no timezone present -> use local date components (user likely entered local date)
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
  } catch {
    return "";
  }
};

// Export CSV: force Excel to treat dates as text cells to avoid #### and ensure calendar date shown
const exportCsvFromTrades = (trades: Trade[]) => {
  const headers = [
    "Symbol", "Type", "Quantity", "Entry Price", "Exit Price", "P/L", "Brokerage",
    "Trade Date", "Entry Date", "Exit Date", "Broker", "Strategy",
    "Session", "Segment", "Trade Type", "Direction", "Chart Timeframe",
    "Entry Condition", "Exit Condition", "Source", "Entry Note",
    "Exit Note", "Remark", "Notes"
  ].join(',');

  const data = trades.map(trade => {
    const tradeDateStr = getDateOnly(trade.tradeDate);
    const entryDateStr = getDateOnly(trade.entryDate);
    const exitDateStr = getDateOnly(trade.exitDate);

    const tradeDateCell = tradeDateStr ? `="${tradeDateStr}"` : '';
    const entryDateCell = entryDateStr ? `="${entryDateStr}"` : '';
    const exitDateCell = exitDateStr ? `="${exitDateStr}"` : '';

    return [
      trade.symbol ?? '',
      trade.type ?? '',
      trade.quantity ?? '',
      trade.entryPrice ?? '',
      trade.exitPrice ?? '',
      (trade as any).pnl ?? '',
      trade.brokerage ?? '',
      tradeDateCell,
      entryDateCell,
      exitDateCell,
      trade.broker ?? '',
      trade.strategy ?? '',
      trade.session ?? '',
      trade.segment ?? '',
      trade.tradeType ?? '',
      trade.direction ?? '',
      trade.chartTimeframe ?? '',
      trade.entryCondition ?? '',
      trade.exitCondition ?? '',
      trade.source ?? '',
      `"${(trade.entryNote || '').replace(/"/g, '""')}"`,
      `"${(trade.exitNote || '').replace(/"/g, '""')}"`,
      `"${(trade.remark || '').replace(/"/g, '""')}"`,
      `"${(trade.notes || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  const csv = [headers, ...data].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `trades-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const exportJsonFromTrades = (trades: Trade[]) => {
  const data = JSON.stringify(trades, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `trades-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

/* ---------------- New component imports (presentational) ---------------- */
import HeaderStats from './HeaderStats';
import ExportDropdown from './ExportDropdown';
import SearchAndFiltersBar from './SearchAndFiltersBar';
import AdvancedFiltersPanel from './AdvancedFiltersPanel';
import TradesTableBody from './TradesTableBody';
import ExportCustomModal from './ExportCustomModal';

// New AI imports
import GenerateAISummaryButton from './GenerateAISummaryButton';
import { useGenerateAISummary } from './useGenerateAISummary';

/* ---------------- Component ---------------- */

export function TradeTable() {
  const router = useRouter();

  // AI hook (used for generating summaries after create and for top-level weekly button)
  const { generate: generateAISummary, loading: aiLoading } = useGenerateAISummary();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Export states
  const [exportCustomOpen, setExportCustomOpen] = useState(false);
  const [exportStart, setExportStart] = useState<string>("");
  const [exportEnd, setExportEnd] = useState<string>("");

  // Enhanced filter states
  const [filters, setFilters] = useState({
    symbol: "",
    type: "all",
    quantityMin: "",
    quantityMax: "",
    entryPriceMin: "",
    entryPriceMax: "",
    exitPriceMin: "",
    exitPriceMax: "",
    pnlMin: "",
    pnlMax: "",
    tradeDateFrom: "",
    tradeDateTo: "",
    entryDateFrom: "",
    entryDateTo: "",
    exitDateFrom: "",
    exitDateTo: "",
    broker: "",
    strategy: "",
    session: "all",
    segment: "all",
    tradeType: "all",
    direction: "all",
    chartTimeframe: "",
    entryCondition: "all",
    exitCondition: "all",
    source: "all",
    status: "all",
  });

  // Strategies state
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [localStrategies, setLocalStrategies] = useState<string[]>([]);
  const [loadingStrategies, setLoadingStrategies] = useState(false);

  const todayDateStr = (() => new Date().toISOString().split("T")[0])();

  // Default new trade state
  const defaultNewTrade: Partial<Trade> = {
    symbol: "",
    type: "Buy",
    quantity: 0,
    entryPrice: 0,
    exitPrice: undefined,
    brokerage: 0,
    tradeDate: todayDateStr,
    entryDate: todayDateStr,
    exitDate: todayDateStr,
    source: "manual",
    image: "",
    strategy: "",
  };

  const [newTrade, setNewTrade] = useState<Partial<Trade>>(defaultNewTrade);

  const strategyInputRef = useRef<HTMLInputElement | null>(null);
  const tradeDateRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Calculate P&L
  const calculatedPnL = calculatePnL(
    (newTrade.type as "Buy" | "Sell") || "Buy",
    Number(newTrade.entryPrice || 0),
    newTrade.exitPrice === undefined ? undefined : Number(newTrade.exitPrice),
    Number(newTrade.quantity || 0),
    Number(newTrade.brokerage || 0)
  );

  // Load data
  useEffect(() => {
    loadTrades();
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      setLoadingStrategies(true);
      const data = await strategiesApi.getStrategies();
      setStrategies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[TradeTable] loadStrategies error:", err);
      setStrategies([]);
    } finally {
      setLoadingStrategies(false);
    }
  };

  const loadTrades = async () => {
    try {
      setLoading(true);
      const data = await tradesApi.getAll();
      const loaded = Array.isArray(data) ? data : (data && (data as any).trades) || [];
      // Preserve backend's stored values but ensure we have something valid
      const normalized: Trade[] = loaded.map((t: any) => ({
        ...t,
        // keep whatever backend returned (ISO string, date-only string, timestamp) — we'll normalize on export/filter/etc
        tradeDate: t.tradeDate ?? new Date().toISOString(),
        entryDate: t.entryDate ?? undefined,
        exitDate: t.exitDate ?? undefined,
        image: t.image ?? (Array.isArray(t.images) ? t.images[0] : ""),
      }));
      setTrades(normalized);
    } catch (err) {
      console.error("[TradeTable] load error:", err);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  // Image handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file only.");
      e.target.value = "";
      return;
    }
    setNewTrade((p) => ({ ...p, image: file }));
    setImageUrl(file.name);
    e.target.value = "";
  };

  const removeImage = () => {
    setNewTrade((p) => ({ ...p, image: "" }));
    setImageUrl("");
  };

  // Trade operations
  const resetForm = useCallback(() => {
    setNewTrade(defaultNewTrade);
    setEditingTrade(null);
    setImageUrl("");
  }, [defaultNewTrade]);

  const handleSaveTrade = async () => {
    if (saving) return;
    setSaving(true);

    try {
      if (!newTrade.symbol?.trim() || !newTrade.quantity || !newTrade.entryPrice) {
        alert("Symbol, Quantity, and Entry Price are required.");
        setSaving(false);
        return;
      }

      // IMPORTANT: create UTC midnight for the selected date to avoid timezone shift
      const toIsoFromDateStr = (d?: any) =>
        d ? new Date(`${String(d).split("T")[0]}T00:00:00Z`).toISOString() : undefined;

      const payload: Partial<Trade> = {
        ...newTrade,
        quantity: Number(newTrade.quantity),
        entryPrice: Number(newTrade.entryPrice),
        exitPrice: newTrade.exitPrice ? Number(newTrade.exitPrice) : undefined,
        brokerage: Number(newTrade.brokerage) || 0,
        tradeDate: toIsoFromDateStr(newTrade.tradeDate) || new Date().toISOString(),
        entryDate: toIsoFromDateStr(newTrade.entryDate),
        exitDate: toIsoFromDateStr(newTrade.exitDate),
      };

      delete (payload as any).pnl;

      if (payload.image && typeof payload.image === "object" && !(payload.image instanceof File)) {
        payload.image = extractImageString(payload.image);
      }
      if (payload.image === undefined || payload.image === null) payload.image = "";

      console.log("[TradeTable] Saving trade:", {
        ...payload,
        image: payload.image instanceof File ? "[File]" : payload.image,
      });

      if (editingTrade) {
        await tradesApi.update(editingTrade._id!, payload as Trade);
        // Update flow for edit: keep as before
        setModalOpen(false);
        resetForm();
        await loadTrades();
      } else {
        // CREATE: capture response so we can generate AI summary for the created trade
        const created = await tradesApi.create(payload as Trade);
        setModalOpen(false);
        resetForm();
        await loadTrades();

        // If backend returned created trade id/object, trigger AI summary generation for the new trade
        try {
          const createdId = (created && ((created as any)._id || (created as any).id)) ? ((created as any)._id || (created as any).id) : undefined;
          if (createdId) {
            // Best-effort generation; swallow errors so UX isn't blocked
            try {
              await generateAISummary({ type: "trade", tradeId: String(createdId) });
              // Optional: give user feedback; replace with toast if available
              // alert("AI summary generated for the newly added trade.");
              console.log("[TradeTable] AI summary generated for new trade:", createdId);
            } catch (aiErr) {
              console.warn("[TradeTable] AI summary generation for new trade failed:", aiErr);
            }
          } else {
            // If create returned nothing useful, try find the latest trade from API and generate for it
            try {
              const reloaded = await tradesApi.getAll();
              const list = Array.isArray(reloaded) ? reloaded : (reloaded && (reloaded as any).trades) || [];
              if (list.length > 0) {
                const newest = list[0]; // assuming backend returns newest first; if not, you can sort by createdAt
                const nid = (newest as any)._id || (newest as any).id;
                if (nid) {
                  try {
                    await generateAISummary({ type: "trade", tradeId: String(nid) });
                    console.log("[TradeTable] AI summary generated for new trade (fallback using newest):", nid);
                  } catch (e) {
                    console.warn("[TradeTable] fallback AI generation failed:", e);
                  }
                }
              }
            } catch (e) {
              // ignore
            }
          }
        } catch (e) {
          console.warn("[TradeTable] error while attempting to auto-generate summary:", e);
        }
      }
    } catch (err: any) {
      console.error("[TradeTable] Save failed:", err);
      alert(err?.message || "Failed to save trade.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditTrade = (trade: Trade) => {
    const img = extractImageString(trade.image ?? (trade as any).images?.[0] ?? "");
    setEditingTrade(trade);

    // For date inputs, use YYYY-MM-DD that matches original calendar day
    const getDateStr = (v?: any) => v ? getDateOnly(v) : todayDateStr;

    setNewTrade({
      ...trade,
      image: img,
      tradeDate: getDateStr(trade.tradeDate as any),
      entryDate: trade.entryDate ? getDateStr(trade.entryDate as any) : todayDateStr,
      exitDate: trade.exitDate ? getDateStr(trade.exitDate as any) : todayDateStr,
      strategy: trade.strategy ?? "",
    });
    setImageUrl(img);
    setModalOpen(true);
  };

  const handleDeleteTrade = async (id: string) => {
    if (!confirm("Delete this trade permanently?")) return;
    try {
      await tradesApi.delete(id);
      await loadTrades();
    } catch (err) {
      console.error("[TradeTable] Delete failed:", err);
      alert("Failed to delete trade.");
    }
  };

  // Filtering and export
  const computeFilteredTrades = useCallback((): Trade[] => {
    return trades.filter((trade) => {
      const s = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === "" ||
        (trade.symbol || "").toLowerCase().includes(s) ||
        (trade.broker || "").toLowerCase().includes(s) ||
        (trade.strategy || "").toLowerCase().includes(s) ||
        (trade.segment || "").toLowerCase().includes(s) ||
        (trade.tradeType || "").toLowerCase().includes(s) ||
        (trade.direction || "").toLowerCase().includes(s) ||
        (trade.entryCondition || "").toLowerCase().includes(s) ||
        (trade.exitCondition || "").toLowerCase().includes(s) ||
        (trade.entryNote || "").toLowerCase().includes(s) ||
        (trade.exitNote || "").toLowerCase().includes(s) ||
        (trade.remark || "").toLowerCase().includes(s) ||
        (trade.notes || "").toLowerCase().includes(s);

      const matchesSymbol = !filters.symbol || (trade.symbol || "").toLowerCase().includes(filters.symbol.toLowerCase());
      const matchesType = filters.type === "all" || trade.type === filters.type;
      const matchesQuantity = (!filters.quantityMin || Number(trade.quantity) >= Number(filters.quantityMin)) &&
        (!filters.quantityMax || Number(trade.quantity) <= Number(filters.quantityMax));
      const matchesEntryPrice = (!filters.entryPriceMin || Number(trade.entryPrice) >= Number(filters.entryPriceMin)) &&
        (!filters.entryPriceMax || Number(trade.entryPrice) <= Number(filters.entryPriceMax));
      const matchesExitPrice = (!filters.exitPriceMin || (trade.exitPrice && Number(trade.exitPrice) >= Number(filters.exitPriceMin))) &&
        (!filters.exitPriceMax || (trade.exitPrice && Number(trade.exitPrice) <= Number(filters.exitPriceMax)));
      const matchesPnl = (!filters.pnlMin || Number((trade as any).pnl) >= Number(filters.pnlMin)) &&
        (!filters.pnlMax || Number((trade as any).pnl) <= Number(filters.pnlMax));
      const matchesBroker = !filters.broker || (trade.broker || "").toLowerCase().includes(filters.broker.toLowerCase());
      const matchesStrategy = !filters.strategy || (trade.strategy || "").toLowerCase().includes(filters.strategy.toLowerCase());
      const matchesSession = filters.session === "all" || trade.session === filters.session;
      const matchesSegment = filters.segment === "all" || trade.segment === filters.segment;
      const matchesTradeType = filters.tradeType === "all" || trade.tradeType === filters.tradeType;
      const matchesDirection = filters.direction === "all" || trade.direction === filters.direction;
      const matchesChartTimeframe = !filters.chartTimeframe || (trade.chartTimeframe || "").toLowerCase().includes(filters.chartTimeframe.toLowerCase());
      const matchesEntryCondition = filters.entryCondition === "all" || trade.entryCondition === filters.entryCondition;
      const matchesExitCondition = filters.exitCondition === "all" || trade.exitCondition === filters.exitCondition;
      const matchesSource = filters.source === "all" || trade.source === filters.source;

      // Normalize trade date to midnight UTC for consistent comparisons
      const tradeDateIso = getDateOnly(trade.tradeDate);
      const tradeDate = tradeDateIso ? new Date(tradeDateIso + "T00:00:00Z") : null;

      const matchesTradeDate = (!filters.tradeDateFrom || (tradeDate && tradeDate >= new Date(filters.tradeDateFrom + "T00:00:00Z"))) &&
        (!filters.tradeDateTo || (tradeDate && tradeDate <= new Date(filters.tradeDateTo + "T23:59:59Z")));

      const entryDateIso = trade.entryDate ? getDateOnly(trade.entryDate) : "";
      const entryDate = entryDateIso ? new Date(entryDateIso + "T00:00:00Z") : null;
      const matchesEntryDate = (!filters.entryDateFrom || (entryDate && entryDate >= new Date(filters.entryDateFrom + "T00:00:00Z"))) &&
        (!filters.entryDateTo || (entryDate && entryDate <= new Date(filters.entryDateTo + "T23:59:59Z")));

      const exitDateIso = trade.exitDate ? getDateOnly(trade.exitDate) : "";
      const exitDate = exitDateIso ? new Date(exitDateIso + "T00:00:00Z") : null;
      const matchesExitDate = (!filters.exitDateFrom || (exitDate && exitDate >= new Date(filters.exitDateFrom + "T00:00:00Z"))) &&
        (!filters.exitDateTo || (exitDate && exitDate <= new Date(filters.exitDateTo + "T23:59:59Z")));

      const matchesStatus = filters.status === "all" ||
        (filters.status === "active" && !trade.exitPrice) ||
        (filters.status === "closed" && trade.exitPrice);

      return matchesSearch && matchesSymbol && matchesType && matchesQuantity && matchesEntryPrice &&
        matchesExitPrice && matchesPnl && matchesBroker && matchesStrategy && matchesSession && matchesSegment &&
        matchesTradeType && matchesDirection && matchesChartTimeframe && matchesEntryCondition &&
        matchesExitCondition && matchesSource && matchesTradeDate && matchesEntryDate &&
        matchesExitDate && matchesStatus;
    });
  }, [trades, searchTerm, filters]);

  const handleExport = async (format: 'csv' | 'json', range: 'all' | 'last7' | 'last30' | 'custom' = 'all') => {
    setExporting(true);
    try {
      const base = computeFilteredTrades();
      let toExport = base.slice();

      const today = new Date();
      const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (range === 'last7') {
        const s = new Date(startOf(today));
        s.setDate(s.getDate() - 6);
        const sIso = getDateOnly(s.toISOString()) + "T00:00:00Z";
        const eIso = getDateOnly(today.toISOString()) + "T23:59:59Z";
        toExport = base.filter(t => {
          const td = new Date(getDateOnly(t.tradeDate) + "T00:00:00Z");
          return td >= new Date(sIso) && td <= new Date(eIso);
        });
      } else if (range === 'last30') {
        const s = new Date(startOf(today));
        s.setDate(s.getDate() - 29);
        const sIso = getDateOnly(s.toISOString()) + "T00:00:00Z";
        const eIso = getDateOnly(today.toISOString()) + "T23:59:59Z";
        toExport = base.filter(t => {
          const td = new Date(getDateOnly(t.tradeDate) + "T00:00:00Z");
          return td >= new Date(sIso) && td <= new Date(eIso);
        });
      } else if (range === 'custom') {
        setExportCustomOpen(true);
        setExporting(false);
        return;
      }

      if (format === 'csv') exportCsvFromTrades(toExport);
      else exportJsonFromTrades(toExport);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const doCustomExport = (format: 'csv' | 'json') => {
    if (!exportStart || !exportEnd) {
      alert("Pick both start and end dates for custom export.");
      return;
    }
    const s = new Date(`${exportStart}T00:00:00Z`);
    const e = new Date(`${exportEnd}T23:59:59Z`);
    if (s > e) {
      alert("Start date must be before or equal to end date.");
      return;
    }
    const base = computeFilteredTrades();
    const toExport = base.filter(t => {
      const td = new Date(getDateOnly(t.tradeDate) + "T00:00:00Z");
      return td >= s && td <= e;
    });

    if (format === 'csv') exportCsvFromTrades(toExport);
    else exportJsonFromTrades(toExport);

    setExportCustomOpen(false);
    setExportStart("");
    setExportEnd("");
  };

  // Strategy handling
  const onStrategyInputChange = (val: string) => {
    if (val === "+ Add new strategy...") {
      setNewTrade(prev => ({ ...prev, strategy: "" }));
      setTimeout(() => strategyInputRef.current?.focus(), 20);
      return;
    }
    setNewTrade(prev => ({ ...prev, strategy: val }));
  };

  const filteredTrades = computeFilteredTrades();

  const clearFilters = () => {
    setFilters({
      symbol: "",
      type: "all",
      quantityMin: "",
      quantityMax: "",
      entryPriceMin: "",
      entryPriceMax: "",
      exitPriceMin: "",
      exitPriceMax: "",
      pnlMin: "",
      pnlMax: "",
      tradeDateFrom: "",
      tradeDateTo: "",
      entryDateFrom: "",
      entryDateTo: "",
      exitDateFrom: "",
      exitDateTo: "",
      broker: "",
      strategy: "",
      session: "all",
      segment: "all",
      tradeType: "all",
      direction: "all",
      chartTimeframe: "",
      entryCondition: "all",
      exitCondition: "all",
      source: "all",
      status: "all",
    });
    setSearchTerm("");
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const activeFiltersCount = Object.values(filters).filter(val =>
    val !== "" && val !== "all"
  ).length;

  // Stats calculation
  const totalPnL = filteredTrades.reduce((sum, trade) => sum + Number((trade as any).pnl || 0), 0);
  const winningTrades = filteredTrades.filter(trade => Number((trade as any).pnl || 0) > 0).length;
  const winRate = filteredTrades.length > 0 ? (winningTrades / filteredTrades.length) * 100 : 0;

  // Helper to compute week range for Generate Weekly Summary button
  const computeLast7Range = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
  };

  return (
    <Card className="border border-gray-700 bg-black/80 backdrop-blur-xl hover:border-cyan-500/40 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Left: Header Stats (extracted) */}
          <HeaderStats
            filteredCount={filteredTrades.length}
            winningTrades={winningTrades}
            totalPnL={totalPnL}
            winRate={winRate}
            formatCurrency={formatCurrency}
          />

          {/* Right: Export + Add + AI */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch">
            {/* Quick CSV export button (new single export button requested) */}
            <Button
              onClick={() => handleExport('csv', 'all')}
              className="min-w-[120px] bg-gray-800 border border-gray-600 hover:bg-gray-700 text-white"
              disabled={exporting}
              title="Quick Export CSV of visible trades"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>

            {/* Existing ExportDropdown (keeps original behavior) */}
            <ExportDropdown
              exporting={exporting}
              handleExport={handleExport}
              setExportCustomOpen={setExportCustomOpen}
            />

            {/* Generate weekly AI summary button (uses existing GenerateAISummaryButton component) */}
            <GenerateAISummaryButton
              mode="weekly"
              className="min-w-[180px] bg-gradient-to-r from-yellow-500 to-cyan-400 hover:opacity-95 text-black font-semibold"
              startDate={computeLast7Range().start}
              endDate={computeLast7Range().end}
              onDone={(s: any) => {
                console.log("Weekly AI summary generated:", s);
                // optionally show toast
              }}
              onError={(err) => {
                console.warn("Weekly AI generation error:", err);
              }}
            >
              Generate Weekly Summary
            </GenerateAISummaryButton>

            <Dialog open={modalOpen} onOpenChange={(open) => {
              setModalOpen(open);
              if (!open) {
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg transition-all duration-200 min-w-[140px]"
                  onClick={() => {
                    resetForm();
                    loadStrategies();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Trade
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-4xl bg-gray-900 border border-gray-700 text-white max-h-[85vh] overflow-y-auto rounded-xl">
                <DialogHeader className="border-b border-gray-700 pb-4">
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    {editingTrade ? (
                      <>
                        <Edit className="h-5 w-5 text-cyan-400" />
                        Edit Trade
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 text-cyan-400" />
                        Add New Trade
                      </>
                    )}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Core Information Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { label: "Symbol *", key: "symbol", type: "text", placeholder: "e.g., RELIANCE" },
                      { label: "Quantity *", key: "quantity", type: "number", placeholder: "0" },
                      { label: "Entry Price *", key: "entryPrice", type: "number", placeholder: "0.00" },
                      { label: "Exit Price", key: "exitPrice", type: "number", placeholder: "0.00" },
                      { label: "Brokerage", key: "brokerage", type: "number", placeholder: "0.00" },
                      { label: "Broker", key: "broker", type: "text", placeholder: "Broker name" },
                    ].map((f) => (
                      <div key={f.key} className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">{f.label}</label>
                        <Input
                          type={f.type}
                          value={(newTrade as any)[f.key] ?? ""}
                          onChange={(e) =>
                            setNewTrade((p) => ({
                              ...p,
                              [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value,
                            }))
                          }
                          placeholder={f.placeholder}
                          className="bg-gray-800 border-gray-600 text-white focus:border-cyan-400"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Dates Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: "Trade Date", key: "tradeDate", type: "date" },
                      { label: "Entry Date", key: "entryDate", type: "date" },
                      { label: "Exit Date", key: "exitDate", type: "date" },
                    ].map((f) => (
                      <div key={f.key} className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">{f.label}</label>
                        <div className="flex gap-2">
                          <Input
                            type="date"
                            value={(newTrade as any)[f.key] ?? ""}
                            onChange={(e) =>
                              setNewTrade((p) => ({ ...p, [f.key]: e.target.value }))
                            }
                            className="bg-gray-800 border-gray-600 text-white flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="border-gray-600 hover:bg-gray-700"
                            onClick={() => {
                              const el = document.querySelector<HTMLInputElement>(`input[type="date"][value="${(newTrade as any)[f.key] ?? ''}"]`);
                              el?.showPicker?.();
                            }}
                          >
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Strategy and P&L Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Strategy</label>
                      <div className="flex gap-2">
                        <input
                          ref={strategyInputRef}
                          list="strategies-list"
                          value={newTrade.strategy || ""}
                          onChange={(e) => onStrategyInputChange(e.target.value)}
                          placeholder="Type or select strategy..."
                          className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
                        />
                        <datalist id="strategies-list">
                          {strategies.map((s) => (
                            <option key={s._id} value={s.name} />
                          ))}
                          <option value="+ Add new strategy..." />
                        </datalist>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Calculated P&L</label>
                      <Input
                        type="text"
                        value={formatCurrency(calculatedPnL)}
                        readOnly
                        className={`bg-gray-800 border-gray-600 font-bold ${calculatedPnL >= 0 ? "text-green-400" : "text-red-400"}`}
                      />
                      <p className="text-xs text-gray-400">
                        {newTrade.type === "Buy"
                          ? "Buy: (Exit - Entry) × Qty - Brokerage"
                          : "Sell: (Entry - Exit) × Qty - Brokerage"}
                      </p>
                    </div>
                  </div>

                  {/* Dropdowns Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Type", key: "type", options: ["Buy", "Sell"] },
                      { label: "Session", key: "session", options: ["morning", "mid", "last"] },
                      { label: "Segment", key: "segment", options: ["equity", "future", "forex", "option", "commodity", "currency", "crypto"] },
                      { label: "Trade Type", key: "tradeType", options: ["intraday", "positional", "investment", "swing", "scalping"] },
                      { label: "Direction", key: "direction", options: ["Long", "Short"] },
                      { label: "Entry Condition", key: "entryCondition", options: ["revenge", "last entry", "good", "fomo", "entry without confirmation", "early entry", "accurate entry"] },
                      { label: "Exit Condition", key: "exitCondition", options: ["accurate", "early", "fear", "sl hit", "target hit", "trailing sl hit"] },
                    ].map((f) => (
                      <div key={f.key} className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">{f.label}</label>
                        <select
                          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
                          value={(newTrade as any)[f.key] || ""}
                          onChange={(e) =>
                            setNewTrade((p) => ({ ...p, [f.key]: e.target.value }))
                          }
                        >
                          <option value="">Select {f.label}</option>
                          {f.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Notes Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-300 border-b border-gray-700 pb-2">Additional Notes</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: "Entry Note", key: "entryNote", placeholder: "Why did you enter this trade?" },
                        { label: "Exit Note", key: "exitNote", placeholder: "Why did you exit this trade?" },
                      ].map((f) => (
                        <div key={f.key} className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">{f.label}</label>
                          <Input
                            placeholder={f.placeholder}
                            value={(newTrade as any)[f.key] || ""}
                            onChange={(e) =>
                              setNewTrade((p) => ({ ...p, [f.key]: e.target.value }))
                            }
                            className="bg-gray-800 border-gray-600 text-white"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">General Notes</label>
                      <Input
                        placeholder="Any additional comments or observations..."
                        value={newTrade.notes || ""}
                        onChange={(e) =>
                          setNewTrade((p) => ({ ...p, notes: e.target.value }))
                        }
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  {/* Image Upload Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Trade Image</label>
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-cyan-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="trade-image-upload"
                      />
                      <label
                        htmlFor="trade-image-upload"
                        className="cursor-pointer block"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-300">
                              {imageUrl ? "Change image" : "Upload trade image"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              PNG, JPG, WEBP up to 10MB
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>
                    {imageUrl && (
                      <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 mt-2">
                        <span className="text-sm text-gray-300 truncate flex-1">{imageUrl}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeImage}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8 px-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <Button
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 border-gray-600 text-white hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveTrade}
                    disabled={saving}
                    className={`flex-1 font-semibold ${saving ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"}`}
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {editingTrade ? "Updating..." : "Saving..."}
                      </span>
                    ) : editingTrade ? (
                      "Update Trade"
                    ) : (
                      "Save Trade"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      {/* Table Section */}
      <CardContent className="pt-0">
        {/* Search and Filters (extracted) */}
        <SearchAndFiltersBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterOpen={filterOpen}
          setFilterOpen={setFilterOpen}
          activeFiltersCount={activeFiltersCount}
          clearFilters={clearFilters}
        />

        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {filterOpen && (
            <AdvancedFiltersPanel filters={filters} setFilters={setFilters} />
          )}
        </AnimatePresence>

        {/* Table Container */}
        <div className="rounded-xl border border-gray-700 overflow-hidden bg-gray-800/20">
          <div className="overflow-x-auto">
            <Table className="min-w-full text-white text-sm">
              <TableHeader>
                <TableRow className="bg-gray-900/80 border-b border-gray-700 hover:bg-gray-900">
                  <TableHead className="text-gray-300 font-semibold py-4">Date</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Symbol</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Type</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Qty</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Entry</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Exit</TableHead>
                  <TableHead className="text-gray-300 font-semibold">P/L</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Strategy</TableHead>
                  <TableHead className="text-gray-300 font-semibold">Broker</TableHead>
                  <TableHead className="text-gray-300 font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TradesTableBody
                  loading={loading}
                  filteredTrades={filteredTrades}
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                  handleEditTrade={handleEditTrade}
                  handleDeleteTrade={handleDeleteTrade}
                  routerPush={(p: string) => router.push(p)}
                />
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Custom Export Modal (extracted) */}
        <ExportCustomModal
          exportCustomOpen={exportCustomOpen}
          exportStart={exportStart}
          exportEnd={exportEnd}
          setExportStart={setExportStart}
          setExportEnd={setExportEnd}
          setExportCustomOpen={setExportCustomOpen}
          doCustomExport={doCustomExport}
        />
      </CardContent>
    </Card>
  );
}

export default TradeTable;
