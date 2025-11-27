// src/components/reports/index.tsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Clock,
  FileText,
  RefreshCw,
  Sparkles,
  BarChart3,
  TrendingUp,
  Activity,
  Search,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import GenerateAISummaryButton from "@/components/dashboard/GenerateAISummaryButton";
import { aiSummariesApi, AISummaryListResponse } from "@/api/aiSummaries";
import SummaryCard from "@/components/reports/SummaryCard";
import DetailedSummaryView from "@/components/reports/DetailedSummaryView";
import GlassCard from "@/components/reports/GlassCard";
import { ExtendedAISummary } from "@/components/reports/types";
import { DEFAULT_REFRESH_INTERVAL } from "@/components/reports/utils";

const Reports: React.FC = () => {
  const [summaries, setSummaries] = useState<ExtendedAISummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSummary, setSelectedSummary] = useState<ExtendedAISummary | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");

  const loadSummaries = useCallback(async () => {
    try {
      setLoading(true);
      const resp: AISummaryListResponse = await aiSummariesApi.list();
      // aiSummariesApi.list() returns { summaries: AISummary[] }
      const items = Array.isArray(resp?.summaries) ? resp.summaries : [];
      setSummaries((items || []) as ExtendedAISummary[]);
    } catch (err) {
      console.error("Error loading AI summaries:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummaries();
    if (!autoRefresh) return;
    const id = setInterval(() => loadSummaries(), DEFAULT_REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [loadSummaries, autoRefresh]);

  const handleGenerateDone = async () => {
    try {
      await loadSummaries();
    } catch (e) {
      console.error("Error after generate done:", e);
    }
  };

  const handleGenerateError = (errMsg: string) => {
    console.error("AI generation error:", errMsg);
  };

  const filteredSummaries = summaries.filter((summary) => {
    const matchesSearch =
      searchTerm === "" ||
      summary.summaryText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      summary.type?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || summary.status === filterStatus;
    const matchesTab = activeTab === "all" || summary.type === activeTab;

    return matchesSearch && matchesStatus && matchesTab;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 sm:mb-12">
          <div className="text-center mb-8 sm:mb-12">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 rounded-full px-3 py-1.5 mb-4 sm:mb-6 border border-blue-500/30 backdrop-blur-sm text-xs sm:text-sm">
              <Sparkles className="h-3 w-3" />
              <span className="text-xs sm:text-sm font-semibold">AI-Powered Insights</span>
            </motion.div>

            <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent mb-3 sm:mb-6 tracking-tight">
              Trading Intelligence
            </h1>
            <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Advanced analytics and AI-driven insights to optimize your trading performance
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 max-w-5xl mx-auto">
            <motion.div whileHover={{ scale: 1.02, y: -4 }}>
              <GlassCard className="hover:border-blue-500/50 transition-all duration-300">
                <div className="h-1 sm:h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />
                <div className="p-4 sm:p-8">
                  <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-blue-300 mb-4 sm:mb-6 border border-blue-500/30 backdrop-blur-sm">
                    <Calendar className="h-6 w-6 sm:h-10 sm:w-10" />
                  </div>

                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-2">Weekly Analysis</h3>
                  <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
                    Get detailed insights on your last 7 days of trading performance with advanced metrics
                  </p>

                  <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
                    <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /><span>Performance</span></div>
                    <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /><span>Trends</span></div>
                    <div className="flex items-center gap-2"><Activity className="h-4 w-4" /><span>Metrics</span></div>
                  </div>

                  <GenerateAISummaryButton
                    mode="weekly"
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 sm:py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all border border-blue-500/30"
                    onDone={handleGenerateDone}
                    onError={handleGenerateError}
                  />
                </div>
              </GlassCard>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02, y: -4 }}>
              <GlassCard className="hover:border-purple-500/50 transition-all duration-300">
                <div className="h-1 sm:h-2 bg-gradient-to-r from-purple-500 to-pink-500" />
                <div className="p-4 sm:p-8">
                  <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-purple-300 mb-4 sm:mb-6 border border-purple-500/30 backdrop-blur-sm">
                    <Clock className="h-6 w-6 sm:h-10 sm:w-10" />
                  </div>

                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-2">Monthly Analysis</h3>
                  <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
                    Comprehensive overview of your trading month with strategic insights and risk analysis
                  </p>

                  <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
                    <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /><span>Strategy</span></div>
                    <div className="flex items-center gap-2"><Sparkles className="h-4 w-4" /><span>Insights</span></div>
                    <div className="flex items-center gap-2"><Activity className="h-4 w-4" /><span>Risk</span></div>
                  </div>

                  <GenerateAISummaryButton
                    mode="monthly"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 sm:py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all border border-purple-500/30"
                    onDone={handleGenerateDone}
                    onError={handleGenerateError}
                  />
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <GlassCard className="hover:border-gray-600/70 transition-all duration-300">
            <div className="p-4 sm:p-8 border-b border-gray-700/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div>
                  <h2 className="text-xl sm:text-3xl font-bold text-white mb-1">Analytics Reports</h2>
                  <p className="text-xs sm:text-sm text-gray-400">{summaries.length} analysis report{summaries.length !== 1 ? 's' : ''}</p>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="sr-only" />
                    <div className={`w-10 h-5 sm:w-11 sm:h-6 rounded-full transition-colors ${autoRefresh ? 'bg-emerald-500/30' : 'bg-gray-700'} relative border border-gray-600`}>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 sm:w-4 sm:h-4 rounded-full bg-white transition-transform ${autoRefresh ? 'transform translate-x-5' : ''}`} />
                    </div>
                    <span className="text-xs sm:text-sm text-gray-400">Auto-refresh</span>
                  </label>

                  <Button onClick={loadSummaries} disabled={loading} className="h-8 w-8 sm:h-10 sm:w-10 p-0 rounded-xl bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  </Button>

                  <Button className="h-8 sm:h-10 px-3 rounded-xl bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600 flex items-center gap-2 text-xs sm:text-sm">
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 bg-gray-800/50 border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:border-blue-500/50"
                  />
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <div className="flex gap-1 sm:gap-2 bg-gray-800/50 p-1 rounded-2xl border border-gray-700/50">
                    <button onClick={() => setActiveTab("all")} className={`px-3 py-1 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${activeTab === "all" ? "bg-gray-700 text-white shadow" : "text-gray-400 hover:text-white"}`}>All</button>
                    <button onClick={() => setActiveTab("weekly")} className={`px-3 py-1 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${activeTab === "weekly" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "text-gray-400 hover:text-white"}`}>Weekly</button>
                    <button onClick={() => setActiveTab("monthly")} className={`px-3 py-1 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${activeTab === "monthly" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "text-gray-400 hover:text-white"}`}>Monthly</button>
                  </div>

                  <div className="flex gap-1 sm:gap-2 bg-gray-800/50 p-1 rounded-2xl border border-gray-700/50">
                    <button onClick={() => setFilterStatus("all")} className={`px-3 py-1 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${filterStatus === "all" ? "bg-gray-700 text-white shadow" : "text-gray-400 hover:text-white"}`}>All</button>
                    <button onClick={() => setFilterStatus("ready")} className={`px-3 py-1 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${filterStatus === "ready" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-gray-400 hover:text-white"}`}>Ready</button>
                    <button onClick={() => setFilterStatus("draft")} className={`px-3 py-1 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${filterStatus === "draft" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-gray-400 hover:text-white"}`}>Queue</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-8">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-gray-800/30 rounded-3xl p-4 sm:p-6 border border-gray-700/50">
                      <Skeleton className="h-40 sm:h-48 rounded-2xl bg-gray-700/50 mb-3" />
                      <Skeleton className="h-4 rounded bg-gray-700/50 mb-2" />
                      <Skeleton className="h-4 rounded bg-gray-700/50 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : filteredSummaries.length === 0 ? (
                <div className="text-center py-12 sm:py-20">
                  <div className="h-20 w-20 sm:h-24 sm:w-24 mx-auto mb-4 sm:mb-6 rounded-3xl bg-gray-800/50 flex items-center justify-center border border-gray-700/50">
                    <FileText className="h-10 w-10 text-gray-500" />
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-2">{searchTerm || filterStatus !== "all" || activeTab !== "all" ? "No reports found" : "No reports yet"}</h3>
                  <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
                    {searchTerm || filterStatus !== "all" || activeTab !== "all" ? "Try adjusting your filters" : "Generate your first AI analysis to get started"}
                  </p>
                  {!searchTerm && filterStatus === "all" && activeTab === "all" && (
                    <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-2xl shadow-lg border border-blue-500/30 text-sm sm:text-base" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                      Generate Report
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  <AnimatePresence mode="popLayout">
                    {filteredSummaries.map((summary) => (
                      <SummaryCard key={summary._id || summary.id} summary={summary} onExpand={() => setSelectedSummary(summary)} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedSummary && <DetailedSummaryView summary={selectedSummary} onClose={() => setSelectedSummary(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default Reports;
