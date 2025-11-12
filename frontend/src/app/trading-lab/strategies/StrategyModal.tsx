"use client";
import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StrategyInputList } from "@/components/trading-lab";
import { Save, Loader2, ChevronLeft } from "lucide-react";
import strategiesApi, { Strategy } from "@/api/strategies";

interface Props {
  open: boolean;
  onClose: () => void;
  editStrategy?: Strategy | null;
  onSaved: (s: Strategy) => void;
}

export function StrategyModal({ open, onClose, editStrategy, onSaved }: Props) {
  const isEdit = !!editStrategy;
  const [name, setName] = useState(editStrategy?.name || "");
  const [entryCriteria, setEntryCriteria] = useState<string[]>(editStrategy?.entryCriteria || []);
  const [sltpCriteria, setSltpCriteria] = useState<string[]>(editStrategy?.sltpCriteria || []);
  const [managementRules, setManagementRules] = useState<string[]>(editStrategy?.managementRules || []);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setName(editStrategy?.name || "");
      setEntryCriteria(editStrategy?.entryCriteria || []);
      setSltpCriteria(editStrategy?.sltpCriteria || []);
      setManagementRules(editStrategy?.managementRules || []);
      setTimeout(() => ref.current?.focus(), 80);
    }
  }, [open, editStrategy]);

  const save = async () => {
    if (!name.trim()) { alert("Strategy name required"); return; }
    setLoading(true);
    try {
      let saved: Strategy;
      if (isEdit && editStrategy) {
        saved = await strategiesApi.updateStrategy(editStrategy._id, { name, entryCriteria, sltpCriteria, managementRules });
      } else {
        saved = await strategiesApi.createStrategy({ name, entryCriteria, sltpCriteria, managementRules });
      }
      onSaved(saved);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save strategy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] p-0 rounded-2xl border border-gray-800 bg-black">
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-t-2xl p-5 text-white flex items-center gap-4">
          <button onClick={onClose} className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h3 className="text-xl font-bold">{isEdit ? "Edit Strategy" : "Create Strategy"}</h3>
            <div className="text-sm text-cyan-100">{isEdit ? "Refine your trading approach" : "Build your trading strategy"}</div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-200">Strategy Name</label>
            <Input ref={ref} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., London Breakout" className="h-12 mt-2 bg-gray-900 text-white" />
          </div>

          <StrategyInputList label="Entry Criteria" items={entryCriteria} onChange={setEntryCriteria} />
          <StrategyInputList label="SL & TP Criteria" items={sltpCriteria} onChange={setSltpCriteria} />
          <StrategyInputList label="Trade Management Rules" items={managementRules} onChange={setManagementRules} />

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="h-11 px-5 rounded-xl bg-gray-800 text-gray-300">Cancel</button>
            <button onClick={save} disabled={loading} className="h-11 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Save className="h-4 w-4 mr-2" />{isEdit ? "Update Strategy" : "Save Strategy"}</>}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
