// src/components/dashboard/TradeTable.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { tradesApi, Trade } from "../../api/trades";
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

function extractImageString(img: any): string {
  if (!img) return "";
  if (typeof img === "string") return img;
  if (typeof File !== "undefined" && img instanceof File) return "";
  if (typeof img === "object") {
    const keys = ["path", "secure_url", "url", "location", "filename", "public_id"];
    for (const k of keys) if (img[k]) return String(img[k]);
  }
  return "";
}

// Calculate P&L based on entry price, exit price, quantity, type, and brokerage
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
    // For Buy: Profit = (Exit - Entry) * Quantity
    grossPnL = (exitPrice - entryPrice) * quantity;
  } else {
    // For Sell: Profit = (Entry - Exit) * Quantity  
    grossPnL = (entryPrice - exitPrice) * quantity;
  }
  
  // Subtract brokerage
  const netPnL = grossPnL - brokerage;
  return Number(netPnL.toFixed(2));
};

// Export functions
const exportToCSV = (trades: Trade[]) => {
  const headers = [
    "Symbol", "Type", "Quantity", "Entry Price", "Exit Price", "P/L", "Brokerage", 
    "Trade Date", "Entry Date", "Exit Date", "Broker", "Strategy", 
    "Session", "Segment", "Trade Type", "Direction", "Chart Timeframe",
    "Entry Condition", "Exit Condition", "Source", "Entry Note", 
    "Exit Note", "Remark", "Notes"
  ].join(',');

  const data = trades.map(trade => [
    trade.symbol,
    trade.type,
    trade.quantity,
    trade.entryPrice,
    trade.exitPrice || '',
    trade.pnl || '',
    trade.brokerage || '',
    trade.tradeDate,
    trade.entryDate || '',
    trade.exitDate || '',
    trade.broker || '',
    trade.strategy || '',
    trade.session || '',
    trade.segment || '',
    trade.tradeType || '',
    trade.direction || '',
    trade.chartTimeframe || '',
    trade.entryCondition || '',
    trade.exitCondition || '',
    trade.source || '',
    `"${(trade.entryNote || '').replace(/"/g, '""')}"`,
    `"${(trade.exitNote || '').replace(/"/g, '""')}"`,
    `"${(trade.remark || '').replace(/"/g, '""')}"`,
    `"${(trade.notes || '').replace(/"/g, '""')}"`
  ].join(','));

  const csv = [headers, ...data].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `trades-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const exportToJSON = (trades: Trade[]) => {
  const data = JSON.stringify(trades, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `trades-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export function TradeTable() {
  const router = useRouter();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Enhanced filter states for all entities
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

  const [newTrade, setNewTrade] = useState<Partial<Trade>>({
    symbol: "",
    type: "Buy",
    quantity: 0,
    entryPrice: 0,
    exitPrice: undefined,
    brokerage: 0,
    tradeDate: new Date().toISOString(),
    entryDate: undefined,
    exitDate: undefined,
    source: "manual",
    image: "",
  });

  // Calculate P&L whenever relevant fields change
  const calculatedPnL = calculatePnL(
    newTrade.type || "Buy",
    newTrade.entryPrice || 0,
    newTrade.exitPrice,
    newTrade.quantity || 0,
    newTrade.brokerage || 0
  );

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    try {
      setLoading(true);
      const data = await tradesApi.getAll();
      const loaded = Array.isArray(data) ? data : data?.trades || [];
      const normalized: Trade[] = loaded.map((t: any) => ({
        ...t,
        tradeDate: t.tradeDate ? new Date(t.tradeDate).toISOString() : new Date().toISOString(),
        entryDate: t.entryDate ? new Date(t.entryDate).toISOString() : undefined,
        exitDate: t.exitDate ? new Date(t.exitDate).toISOString() : undefined,
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

  const handleSaveTrade = async () => {
    if (saving) return;
    setSaving(true);

    try {
      if (!newTrade.symbol || !newTrade.quantity || !newTrade.entryPrice) {
        alert("Symbol, Quantity, and Entry Price are required.");
        setSaving(false);
        return;
      }

      const payload: Partial<Trade> = {
        ...newTrade,
        quantity: Number(newTrade.quantity),
        entryPrice: Number(newTrade.entryPrice),
        exitPrice: newTrade.exitPrice ? Number(newTrade.exitPrice) : undefined,
        brokerage: Number(newTrade.brokerage) || 0,
        tradeDate: new Date(newTrade.tradeDate || new Date()).toISOString(),
        entryDate: newTrade.entryDate ? new Date(newTrade.entryDate).toISOString() : undefined,
        exitDate: newTrade.exitDate ? new Date(newTrade.exitDate).toISOString() : undefined,
      };

      // P&L will be calculated automatically by the backend based on the prices
      // Remove pnl from payload since backend calculates it
      delete (payload as any).pnl;

      if (payload.image && typeof payload.image === "object" && !(payload.image instanceof File)) {
        payload.image = extractImageString(payload.image);
      }
      if (payload.image === undefined || payload.image === null) payload.image = "";

      console.log("[TradeTable] Saving trade:", {
        ...payload,
        image: payload.image instanceof File ? "[File]" : payload.image,
      });

      if (editingTrade) await tradesApi.update(editingTrade._id!, payload as Trade);
      else await tradesApi.create(payload as Trade);

      // Reset form and reload
      setModalOpen(false);
      setEditingTrade(null);
      setImageUrl("");
      setNewTrade({
        symbol: "",
        type: "Buy",
        quantity: 0,
        entryPrice: 0,
        exitPrice: undefined,
        brokerage: 0,
        tradeDate: new Date().toISOString(),
        entryDate: undefined,
        exitDate: undefined,
        source: "manual",
        image: "",
      });

      await loadTrades();
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
    setNewTrade({
      ...trade,
      image: img,
      tradeDate: trade.tradeDate ? new Date(trade.tradeDate).toISOString() : new Date().toISOString(),
      entryDate: trade.entryDate ? new Date(trade.entryDate).toISOString() : undefined,
      exitDate: trade.exitDate ? new Date(trade.exitDate).toISOString() : undefined,
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

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      switch (format) {
        case 'csv':
          exportToCSV(filteredTrades);
          break;
        case 'json':
          exportToJSON(filteredTrades);
          break;
      }
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Enhanced search and filter for all entities
  const filteredTrades = trades.filter((trade) => {
    // Search term across all text fields
    const matchesSearch = searchTerm === "" || 
      trade.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.broker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.strategy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.segment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.tradeType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.direction?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.entryCondition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.exitCondition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.entryNote?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.exitNote?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.remark?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    // Individual field filters
    const matchesSymbol = !filters.symbol || trade.symbol?.toLowerCase().includes(filters.symbol.toLowerCase());
    const matchesType = filters.type === "all" || trade.type === filters.type;
    const matchesQuantity = (!filters.quantityMin || Number(trade.quantity) >= Number(filters.quantityMin)) &&
                          (!filters.quantityMax || Number(trade.quantity) <= Number(filters.quantityMax));
    const matchesEntryPrice = (!filters.entryPriceMin || Number(trade.entryPrice) >= Number(filters.entryPriceMin)) &&
                        (!filters.entryPriceMax || Number(trade.entryPrice) <= Number(filters.entryPriceMax));
    const matchesExitPrice = (!filters.exitPriceMin || (trade.exitPrice && Number(trade.exitPrice) >= Number(filters.exitPriceMin))) &&
                           (!filters.exitPriceMax || (trade.exitPrice && Number(trade.exitPrice) <= Number(filters.exitPriceMax)));
    const matchesPnl = (!filters.pnlMin || Number((trade as any).pnl) >= Number(filters.pnlMin)) &&
                      (!filters.pnlMax || Number((trade as any).pnl) <= Number(filters.pnlMax));
    const matchesBroker = !filters.broker || trade.broker?.toLowerCase().includes(filters.broker.toLowerCase());
    const matchesStrategy = !filters.strategy || trade.strategy?.toLowerCase().includes(filters.strategy.toLowerCase());
    const matchesSession = filters.session === "all" || trade.session === filters.session;
    const matchesSegment = filters.segment === "all" || trade.segment === filters.segment;
    const matchesTradeType = filters.tradeType === "all" || trade.tradeType === filters.tradeType;
    const matchesDirection = filters.direction === "all" || trade.direction === filters.direction;
    const matchesChartTimeframe = !filters.chartTimeframe || trade.chartTimeframe?.toLowerCase().includes(filters.chartTimeframe.toLowerCase());
    const matchesEntryCondition = filters.entryCondition === "all" || trade.entryCondition === filters.entryCondition;
    const matchesExitCondition = filters.exitCondition === "all" || trade.exitCondition === filters.exitCondition;
    const matchesSource = filters.source === "all" || trade.source === filters.source;

    // Date filters
    const tradeDate = new Date(trade.tradeDate);
    const matchesTradeDate = (!filters.tradeDateFrom || tradeDate >= new Date(filters.tradeDateFrom)) &&
                           (!filters.tradeDateTo || tradeDate <= new Date(filters.tradeDateTo + 'T23:59:59'));

    const entryDate = trade.entryDate ? new Date(trade.entryDate) : null;
    const matchesEntryDate = (!filters.entryDateFrom || (entryDate && entryDate >= new Date(filters.entryDateFrom))) &&
                           (!filters.entryDateTo || (entryDate && entryDate <= new Date(filters.entryDateTo + 'T23:59:59')));

    const exitDate = trade.exitDate ? new Date(trade.exitDate) : null;
    const matchesExitDate = (!filters.exitDateFrom || (exitDate && exitDate >= new Date(filters.exitDateFrom))) &&
                          (!filters.exitDateTo || (exitDate && exitDate <= new Date(filters.exitDateTo + 'T23:59:59')));

    // Status filter
    const matchesStatus = filters.status === "all" || 
                         (filters.status === "active" && !trade.exitPrice) ||
                         (filters.status === "closed" && trade.exitPrice);

    return matchesSearch && matchesSymbol && matchesType && matchesQuantity && matchesEntryPrice && 
           matchesExitPrice && matchesPnl && matchesBroker && matchesStrategy && matchesSession && matchesSegment &&
           matchesTradeType && matchesDirection && matchesChartTimeframe && matchesEntryCondition &&
           matchesExitCondition && matchesSource && matchesTradeDate && matchesEntryDate &&
           matchesExitDate && matchesStatus;
  });

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

  return (
    <Card className="border border-gray-700 bg-black/80 backdrop-blur-xl hover:border-cyan-500/40 transition-all">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-white">Trade Journal</CardTitle>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              {filteredTrades.length} {filteredTrades.length === 1 ? 'trade' : 'trades'} found
              {activeFiltersCount > 0 && ` • ${activeFiltersCount} filter${activeFiltersCount === 1 ? '' : 's'} active`}
            </p>
          </div>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="border-gray-600 hover:bg-gray-800/50 text-white relative"
                  disabled={exporting}
                >
                  {exporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 border-gray-600 text-white">
                <DropdownMenuItem 
                  onClick={() => handleExport('csv')}
                  className="flex items-center gap-2"
                >
                  <TableIcon className="h-4 w-4" />
                  Export as CSV (All Data)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleExport('json')}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Export as JSON (All Data)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                  onClick={() => {
                    if (!modalOpen) {
                      setEditingTrade(null);
                      setNewTrade({
                        symbol: "",
                        type: "Buy",
                        quantity: 0,
                        entryPrice: 0,
                        exitPrice: undefined,
                        brokerage: 0,
                        tradeDate: new Date().toISOString(),
                        entryDate: undefined,
                        exitDate: undefined,
                        source: "manual",
                        image: "",
                      });
                      setImageUrl("");
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {editingTrade ? "Edit Trade" : "Add Trade"}
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-4xl bg-gray-900 border border-gray-700 text-white max-h-[90vh] overflow-y-auto rounded-xl p-6">
                <DialogHeader>
                  <DialogTitle>{editingTrade ? "Edit Trade" : "Add New Trade"}</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Core Inputs */}
                  {[
                    { label: "Symbol", key: "symbol", type: "text" },
                    { label: "Quantity", key: "quantity", type: "number" },
                    { label: "Entry Price", key: "entryPrice", type: "number" },
                    { label: "Exit Price", key: "exitPrice", type: "number" },
                    { label: "Brokerage", key: "brokerage", type: "number" },
                    { label: "Trade Date", key: "tradeDate", type: "date" },
                    { label: "Entry Date", key: "entryDate", type: "date" },
                    { label: "Exit Date", key: "exitDate", type: "date" },
                    { label: "Broker", key: "broker", type: "text" },
                    { label: "Strategy", key: "strategy", type: "text" },
                    { label: "Chart Timeframe", key: "chartTimeframe", type: "text" },
                    { label: "Remark", key: "remark", type: "text" },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="text-sm font-medium">{f.label}</label>
                      <Input
                        type={f.type}
                        value={
                          f.type === "date"
                            ? (newTrade as any)[f.key]
                              ? (newTrade as any)[f.key].split("T")[0]
                              : ""
                            : (newTrade as any)[f.key] ?? ""
                        }
                        onChange={(e) =>
                          setNewTrade((p) => ({
                            ...p,
                            [f.key]:
                              f.type === "number"
                                ? Number(e.target.value)
                                : f.type === "date"
                                ? e.target.value
                                  ? new Date(e.target.value).toISOString()
                                  : undefined
                                : e.target.value,
                          }))
                        }
                        className="bg-gray-800 border border-gray-600 text-white focus:border-cyan-400"
                      />
                    </div>
                  ))}

                  {/* Calculated P&L Display */}
                  <div>
                    <label className="text-sm font-medium">Calculated P&L</label>
                    <Input
                      type="text"
                      value={formatCurrency(calculatedPnL)}
                      readOnly
                      className={`bg-gray-800 border border-gray-600 ${
                        calculatedPnL >= 0 ? "text-green-500" : "text-red-500"
                      } font-medium`}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {newTrade.type === "Buy" ? "Buy: (Exit - Entry) × Qty" : "Sell: (Entry - Exit) × Qty"} - Brokerage
                    </p>
                  </div>

                  {/* Dropdowns */}
                  {[
                    { label: "Type", key: "type", options: ["Buy", "Sell"] },
                    { label: "Session", key: "session", options: ["morning", "mid", "last"] },
                    {
                      label: "Segment",
                      key: "segment",
                      options: [
                        "equity",
                        "future",
                        "forex",
                        "option",
                        "commodity",
                        "currency",
                        "crypto",
                      ],
                    },
                    {
                      label: "Trade Type",
                      key: "tradeType",
                      options: [
                        "intraday",
                        "positional",
                        "investment",
                        "swing",
                        "scalping",
                      ],
                    },
                    { label: "Direction", key: "direction", options: ["Long", "Short"] },
                    {
                      label: "Entry Condition",
                      key: "entryCondition",
                      options: [
                        "revenge",
                        "last entry",
                        "good",
                        "fomo",
                        "entry without confirmation",
                        "early entry",
                        "accurate entry",
                      ],
                    },
                    {
                      label: "Exit Condition",
                      key: "exitCondition",
                      options: [
                        "accurate",
                        "early",
                        "fear",
                        "sl hit",
                        "target hit",
                        "trailing sl hit",
                      ],
                    },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="text-sm font-medium">{f.label}</label>
                      <select
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-2 py-1 text-white focus:border-cyan-400"
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

                  {/* Notes Section */}
                  {[
                    { label: "Entry Note", key: "entryNote" },
                    { label: "Exit Note", key: "exitNote" },
                    { label: "Notes", key: "notes" },
                  ].map((f) => (
                    <div key={f.key} className="col-span-full">
                      <label className="text-sm font-medium">{f.label}</label>
                      <Input
                        placeholder="Type here..."
                        value={(newTrade as any)[f.key] || ""}
                        onChange={(e) =>
                          setNewTrade((p) => ({ ...p, [f.key]: e.target.value }))
                        }
                        className="bg-gray-800 border border-gray-600 text-white"
                      />
                    </div>
                  ))}

                  {/* Image Upload */}
                  <div className="col-span-full">
                    <label className="block text-sm font-medium mb-1">Upload Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                    />
                    {imageUrl ? (
                      <div className="flex items-center justify-between mt-2 text-sm text-gray-300 border border-gray-700 rounded p-2">
                        <span className="truncate">{imageUrl}</span>
                        <button
                          type="button"
                          onClick={removeImage}
                          className="text-red-500 hover:text-red-400 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm mt-2">No image selected</div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleSaveTrade}
                  disabled={saving}
                  className={`w-full mt-4 font-semibold text-black ${
                    saving
                      ? "bg-gray-500 cursor-not-allowed opacity-70"
                      : "bg-cyan-500 hover:bg-cyan-400"
                  }`}
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </span>
                  ) : editingTrade ? (
                    "Update Trade"
                  ) : (
                    "Save Trade"
                  )}
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      {/* Table Section */}
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by symbol, strategy, broker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border border-gray-600 text-white focus:border-cyan-400"
            />
          </div>
          <Button 
            size="icon" 
            variant="outline" 
            className="border-gray-600 text-white relative"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <Filter className="h-4 w-4" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="text-gray-400 hover:text-gray-300"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700 mb-4">
                {/* Symbol Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-300">Symbol</label>
                  <Input
                    placeholder="Filter by symbol"
                    value={filters.symbol}
                    onChange={(e) => setFilters(prev => ({ ...prev, symbol: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                  />
                </div>

                {/* Type Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-300">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white mt-1"
                  >
                    <option value="all">All Types</option>
                    <option value="Buy">Buy</option>
                    <option value="Sell">Sell</option>
                  </select>
                </div>

                {/* Quantity Range */}
                <div>
                  <label className="text-sm font-medium text-gray-300">Quantity Range</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Min"
                      type="number"
                      value={filters.quantityMin}
                      onChange={(e) => setFilters(prev => ({ ...prev, quantityMin: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      value={filters.quantityMax}
                      onChange={(e) => setFilters(prev => ({ ...prev, quantityMax: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                {/* Entry Price Range */}
                <div>
                  <label className="text-sm font-medium text-gray-300">Entry Price Range</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Min"
                      type="number"
                      value={filters.entryPriceMin}
                      onChange={(e) => setFilters(prev => ({ ...prev, entryPriceMin: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      value={filters.entryPriceMax}
                      onChange={(e) => setFilters(prev => ({ ...prev, entryPriceMax: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                {/* Exit Price Range */}
                <div>
                  <label className="text-sm font-medium text-gray-300">Exit Price Range</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Min"
                      type="number"
                      value={filters.exitPriceMin}
                      onChange={(e) => setFilters(prev => ({ ...prev, exitPriceMin: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      value={filters.exitPriceMax}
                      onChange={(e) => setFilters(prev => ({ ...prev, exitPriceMax: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                {/* P&L Range */}
                <div>
                  <label className="text-sm font-medium text-gray-300">P&L Range</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Min"
                      type="number"
                      value={filters.pnlMin}
                      onChange={(e) => setFilters(prev => ({ ...prev, pnlMin: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      value={filters.pnlMax}
                      onChange={(e) => setFilters(prev => ({ ...prev, pnlMax: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                {/* Broker Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-300">Broker</label>
                  <Input
                    placeholder="Filter by broker"
                    value={filters.broker}
                    onChange={(e) => setFilters(prev => ({ ...prev, broker: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                  />
                </div>

                {/* Strategy Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-300">Strategy</label>
                  <Input
                    placeholder="Filter by strategy"
                    value={filters.strategy}
                    onChange={(e) => setFilters(prev => ({ ...prev, strategy: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white mt-1"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-300">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white mt-1"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Trade Date Range */}
                <div>
                  <label className="text-sm font-medium text-gray-300">Trade Date Range</label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="date"
                      value={filters.tradeDateFrom}
                      onChange={(e) => setFilters(prev => ({ ...prev, tradeDateFrom: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Input
                      type="date"
                      value={filters.tradeDateTo}
                      onChange={(e) => setFilters(prev => ({ ...prev, tradeDateTo: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="rounded-lg border border-gray-700 overflow-hidden">
          <Table className="min-w-full text-white text-sm">
            <TableHeader>
              <TableRow className="bg-gray-900/80 text-gray-300">
                <TableHead>Date</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Entry</TableHead>
                <TableHead>Exit</TableHead>
                <TableHead>P/L</TableHead>
                <TableHead>Strategy</TableHead>
                <TableHead>Broker</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(10)].map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredTrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-6 text-gray-400">
                    No trades found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrades.map((t) => (
                  <motion.tr
                    key={t._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-700 hover:bg-gray-800/50"
                  >
                    <TableCell>{formatDate(t.tradeDate)}</TableCell>
                    <TableCell>{t.symbol}</TableCell>
                    <TableCell>
                      <Badge
                        variant={t.type === "Buy" ? "default" : "secondary"}
                        className={
                          t.type === "Buy"
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        }
                      >
                        {t.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.quantity}</TableCell>
                    <TableCell>{formatCurrency(Number(t.entryPrice))}</TableCell>
                    <TableCell>{t.exitPrice ? formatCurrency(Number(t.exitPrice)) : "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {((t as any).pnl >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ))}
                        <span className={((t as any).pnl >= 0 ? "text-green-500" : "text-red-500")}>
                          {formatCurrency(Math.abs(Number((t as any).pnl)))}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{t.strategy || "-"}</TableCell>
                    <TableCell>{t.broker || "Manual"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => router.push(`/trades/${t._id}`)}
                          title="Open full trade view"
                        >
                          <Eye className="h-4 w-4 text-white" />
                        </Button>

                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditTrade(t)}>
                          <Edit className="h-4 w-4 text-white" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-400" onClick={() => handleDeleteTrade(t._id!)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}