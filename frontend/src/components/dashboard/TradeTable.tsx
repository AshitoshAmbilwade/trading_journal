// src/components/dashboard/TradeTable.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
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
import { TradeViewModal } from "./TradeViewModal";

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

export function TradeTable() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // 👈 prevents double-click issue
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");

  const [newTrade, setNewTrade] = useState<Partial<Trade>>({
    symbol: "",
    type: "Buy",
    quantity: 0,
    price: 0,
    pnl: 0,
    tradeDate: new Date().toISOString(),
    source: "manual",
    image: "",
  });

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
        tradeDate: new Date(t.tradeDate).toISOString(),
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
    if (saving) return; // 👈 prevents multiple submits
    setSaving(true);

    try {
      if (!newTrade.symbol || !newTrade.quantity || !newTrade.price) {
        alert("Symbol, Quantity, and Price are required.");
        setSaving(false);
        return;
      }

      const payload: Partial<Trade> = {
        ...newTrade,
        quantity: Number(newTrade.quantity),
        price: Number(newTrade.price),
        pnl: Number(newTrade.pnl) || 0,
        brokerage: Number(newTrade.brokerage) || 0,
        tradeDate: new Date(newTrade.tradeDate || new Date()).toISOString(),
      };

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
        price: 0,
        pnl: 0,
        tradeDate: new Date().toISOString(),
        source: "manual",
        image: "",
      });

      await loadTrades();
    } catch (err: any) {
      console.error("[TradeTable] Save failed:", err);
      alert(err?.message || "Failed to save trade.");
    } finally {
      // 👇 Unlock button after operation
      setSaving(false);
    }
  };

  const handleEditTrade = (trade: Trade) => {
    const img = extractImageString(trade.image || (trade as any).images?.[0] || "");
    setEditingTrade(trade);
    setNewTrade({
      ...trade,
      image: img,
      tradeDate: new Date(trade.tradeDate).toISOString(),
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

  const filtered = trades.filter(
    (t) =>
      t.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.broker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.strategy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

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
            <p className="text-sm text-gray-400 mt-2">All your trades in one place</p>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-gray-600 hover:bg-gray-800/50 text-white"
              onClick={() => console.log("Export clicked")}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                  onClick={() => {
                    if (!modalOpen) {
                      setEditingTrade(null);
                      setNewTrade({
                        symbol: "",
                        type: "Buy",
                        quantity: 0,
                        price: 0,
                        pnl: 0,
                        tradeDate: new Date().toISOString(),
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
                    { label: "Price", key: "price", type: "number" },
                    { label: "P/L", key: "pnl", type: "number" },
                    { label: "Trade Date", key: "tradeDate", type: "date" },
                    { label: "Broker", key: "broker", type: "text" },
                    { label: "Strategy", key: "strategy", type: "text" },
                    { label: "Brokerage", key: "brokerage", type: "number" },
                    { label: "Chart Timeframe", key: "chartTimeframe", type: "text" },
                    { label: "Remark", key: "remark", type: "text" },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="text-sm font-medium">{f.label}</label>
                      <Input
                        type={f.type}
                        value={
                          f.type === "date"
                            ? newTrade.tradeDate?.split("T")[0] || ""
                            : (newTrade as any)[f.key] || ""
                        }
                        onChange={(e) =>
                          setNewTrade((p) => ({
                            ...p,
                            [f.key]:
                              f.type === "number"
                                ? Number(e.target.value)
                                : f.type === "date"
                                ? new Date(e.target.value).toISOString()
                                : e.target.value,
                          }))
                        }
                        className="bg-gray-800 border border-gray-600 text-white focus:border-cyan-400"
                      />
                    </div>
                  ))}

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
                  disabled={saving} // 👈 disable during save
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
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border border-gray-600 text-white focus:border-cyan-400"
            />
          </div>
          <Button size="icon" variant="outline" className="border-gray-600 text-white">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="rounded-lg border border-gray-700 overflow-hidden">
          <Table className="min-w-full text-white text-sm">
            <TableHeader>
              <TableRow className="bg-gray-900/80 text-gray-300">
                <TableHead>Date</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Price</TableHead>
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
                    {[...Array(9)].map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-6 text-gray-400">
                    No trades found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
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
                    <TableCell>₹{t.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {t.pnl >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span
                          className={t.pnl >= 0 ? "text-green-500" : "text-red-500"}
                        >
                          ₹{Math.abs(t.pnl).toFixed(2)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{t.strategy || "-"}</TableCell>
                    <TableCell>{t.broker || "Manual"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <TradeViewModal
                          trade={t}
                          trigger={
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <Eye className="h-4 w-4 text-white" />
                            </Button>
                          }
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleEditTrade(t)}
                        >
                          <Edit className="h-4 w-4 text-white" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-500 hover:text-red-400"
                          onClick={() => handleDeleteTrade(t._id!)}
                        >
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
