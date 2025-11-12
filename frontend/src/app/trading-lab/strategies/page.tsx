"use client";
import React, { useEffect, useState } from "react";
import { Plus, Loader2, TrendingUp } from "lucide-react";
import { StrategyCard, StrategyEmptyState } from "@/components/trading-lab";
import { StrategyModal } from "./StrategyModal";
import strategiesApi, { Strategy } from "@/api/strategies";

export default function TradingLabStrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await strategiesApi.getStrategies();
      setStrategies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const openNew = () => { setEditingStrategy(null); setModalOpen(true); };
  const openEdit = (s: Strategy) => { setEditingStrategy(s); setModalOpen(true); };

  const remove = async (s: Strategy) => {
    if (!confirm(`Delete strategy "${s.name}"?`)) return;
    try {
      await strategiesApi.deleteStrategy(s._id);
      setStrategies(prev => prev.filter(p => p._id !== s._id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete strategy");
    }
  };

  const onSaved = (saved: Strategy) => {
    setStrategies(prev => {
      const found = prev.find(p => p._id === saved._id);
      if (found) return prev.map(p => p._id === saved._id ? saved : p);
      return [saved, ...prev];
    });
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Trading Lab — Strategies</h1>
            <p className="text-gray-400">Add and manage your strategy rules.</p>
          </div>

          <button type="button" onClick={openNew} className="h-11 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold inline-flex items-center">
            <Plus className="h-5 w-5 mr-2" /> New Strategy
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-cyan-500" />
            <div className="mt-4">Loading your strategies...</div>
          </div>
        ) : strategies.length === 0 ? (
          <StrategyEmptyState onAdd={openNew} />
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {strategies.map(strat => (
              <StrategyCard key={strat._id} strategy={strat} onEdit={openEdit} onDelete={remove} />
            ))}
          </div>
        )}

        <StrategyModal open={modalOpen} onClose={() => setModalOpen(false)} editStrategy={editingStrategy} onSaved={onSaved} />
      </div>
    </div>
  );
}
