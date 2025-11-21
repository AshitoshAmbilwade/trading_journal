"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Calendar, Clock, FileText, RefreshCw, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import GenerateAISummaryButton from "@/components/dashboard/GenerateAISummaryButton";
import { aiSummariesApi, AISummary } from "@/api/aiSummaries";

export function Reports() {
  const [summaries, setSummaries] = useState<AISummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"weekly" | "monthly">("monthly");

  useEffect(() => {
    loadSummaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSummaries = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await aiSummariesApi.list();
      // api returns { summaries: AISummary[] }
      const items = (resp && (resp as any).summaries) ? (resp as any).summaries : (resp as any);
      setSummaries(items || []);
    } catch (err) {
      console.error("Error loading AI summaries:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGenerateDone = async (res: any) => {
    // Called when GenerateAISummaryButton's onDone fires; refresh list
    try {
      // if response contains summaryId (draft) or aiSummary, reload
      await loadSummaries();
    } catch (e) {
      console.error("Error after generate done:", e);
    }
  };

  const handleGenerateError = (errMsg: string) => {
    console.error("AI generation error:", errMsg);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const statusBadge = (status?: string) => {
    if (status === "draft") return <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-200">Queued</Badge>;
    if (status === "ready") return <Badge className="text-xs bg-green-100 text-green-800 border-green-200">Ready</Badge>;
    if (status === "failed") return <Badge className="text-xs bg-red-100 text-red-800 border-red-200">Failed</Badge>;
    return <Badge className="text-xs bg-muted/10">Unknown</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl sm:text-4xl mb-2">AI Summaries</h1>
          <p className="text-muted-foreground">Generate weekly or monthly AI-powered summaries of your trades</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* AI Summary Generator (left, spans 2 columns) */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Generate New AI Summary</CardTitle>
                <CardDescription>Select period and generate AI insights for your trades</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Period Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Summary Period</label>
                  <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as "weekly" | "monthly")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Cards (Weekly / Monthly) */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Generate Summary</label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Weekly */}
                    <motion.div whileHover={{ scale: 1.02 }} className="p-4 rounded-lg border border-border bg-background/50 hover:border-primary/30 transition-all group">
                      <div className="flex flex-col items-center text-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Weekly Summary</h4>
                          <p className="text-xs text-muted-foreground">Insights for the last 7 days</p>
                        </div>
                        <GenerateAISummaryButton
                          mode="weekly"
                          startDate={undefined}
                          endDate={undefined}
                          className="w-full"
                          onDone={handleGenerateDone}
                          onError={handleGenerateError}
                        />
                      </div>
                    </motion.div>

                    {/* Monthly */}
                    <motion.div whileHover={{ scale: 1.02 }} className="p-4 rounded-lg border border-border bg-background/50 hover:border-primary/30 transition-all group">
                      <div className="flex flex-col items-center text-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Clock className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Monthly Summary</h4>
                          <p className="text-xs text-muted-foreground">Insights for the last 30 days</p>
                        </div>
                        <GenerateAISummaryButton
                          mode="monthly"
                          className="w-full"
                          onDone={handleGenerateDone}
                          onError={handleGenerateError}
                        />
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Note / Info */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium mb-1">How it works</h4>
                      <p className="text-xs text-muted-foreground">Generating creates a draft summary immediately (queued). The background worker processes the job and updates the summary status when ready.</p>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20">Queued → Ready</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent AI Summaries (right column) */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Recent AI Summaries</CardTitle>
                <CardDescription>View latest generated summaries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Auto refresh</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={loadSummaries} disabled={loading}>
                      <FileText className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>

                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
                  ) : summaries.length === 0 ? (
                    <div className="text-center py-8">
                      <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No AI summaries yet</p>
                    </div>
                  ) : (
                    summaries.slice(0, 6).map((s) => (
                      <motion.div
                        key={s._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg border border-border bg-background/50 hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-indigo-500" />
                            <span className="text-sm font-medium truncate max-w-[12rem]">{s.summaryText ? s.summaryText.slice(0, 60) : `AI Summary (${s.type})`}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {statusBadge(s.status)}
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground mb-2">
                          {s.type?.toUpperCase()} • {s.dateRange ? `${formatDate(s.dateRange.start)} — ${formatDate(s.dateRange.end)}` : formatDate(s.generatedAt)}
                        </p>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(s._id || "")}>
                            Copy ID
                          </Button>
                          <Button size="sm" onClick={() => alert(s.summaryText || "No summary yet")}>
                            View
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
