"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { aiSummariesApi, AISummary } from "../../api/aiSummaries";
import { Skeleton } from "../ui/skeleton";

interface AIInsightCardProps {
  userId: string;
}

export function AIInsightCard({ userId }: AIInsightCardProps) {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, [userId]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const summaries = await aiSummariesApi.getByUser(userId, "weekly");
      if (Array.isArray(summaries) && summaries.length > 0) {
        setSummary(summaries[0]);
      } else {
        setSummary(null);
      }
    } catch (error) {
      console.error("Error loading AI summary:", error);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Sparkles className="h-16 w-16 mx-auto mb-4 text-cyan-500" />
        <p className="text-muted-foreground text-base mb-1">
          Your AI summary will appear here.
        </p>
        <p className="text-xs text-muted-foreground">
          Once you start logging trades, AI will automatically analyze and
          generate your weekly insights.
        </p>
      </motion.div>
    </div>
  );

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-xl relative overflow-hidden group hover:border-primary/30 transition-all">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-blue-600/5 to-purple-600/5 opacity-50 group-hover:opacity-100 transition-opacity" />
      <motion.div
        className="absolute -top-24 -right-24 h-96 w-96 bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-600/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <CardHeader className="relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>AI Weekly Insights</CardTitle>
                <Badge className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white border-0 text-xs">
                  Beta
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Personalized analysis powered by AI
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative">
        {/* LOADING STATE */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <div className="grid sm:grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ) : !summary ? (
          renderEmptyState()
        ) : (
          <div className="space-y-6">
            {/* SUMMARY TEXT */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-xl bg-background/60 backdrop-blur-sm border border-border/50 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 h-20 w-20 bg-gradient-to-br from-cyan-500/10 to-purple-600/10 rounded-bl-full" />
              <p className="text-sm leading-relaxed relative">
                {summary.summaryText || "No summary text available yet."}
              </p>
            </motion.div>

            {/* PLUS & MINUS POINTS */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* PLUS */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-5 rounded-xl bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/20 backdrop-blur-sm relative overflow-hidden group/plus"
              >
                <div className="absolute -top-6 -right-6 h-24 w-24 bg-green-500/10 rounded-full blur-2xl group-hover/plus:bg-green-500/20 transition-colors" />
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <h4 className="text-sm text-green-400">What's Working</h4>
                </div>
                <ul className="space-y-2.5 relative">
                  {summary.plusPoints?.length ? (
                    summary.plusPoints.map((point, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="text-sm text-foreground/80 flex items-start gap-2"
                      >
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>{point}</span>
                      </motion.li>
                    ))
                  ) : (
                    <li className="text-sm text-muted-foreground">
                      No positive points detected yet.
                    </li>
                  )}
                </ul>
              </motion.div>

              {/* MINUS */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-5 rounded-xl bg-gradient-to-br from-orange-500/5 to-yellow-500/5 border border-orange-500/20 backdrop-blur-sm relative overflow-hidden group/minus"
              >
                <div className="absolute -top-6 -right-6 h-24 w-24 bg-orange-500/10 rounded-full blur-2xl group-hover/minus:bg-orange-500/20 transition-colors" />
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  </div>
                  <h4 className="text-sm text-orange-400">Areas to Improve</h4>
                </div>
                <ul className="space-y-2.5 relative">
                  {summary.minusPoints?.length ? (
                    summary.minusPoints.map((point, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="text-sm text-foreground/80 flex items-start gap-2"
                      >
                        <span className="text-orange-500 mt-0.5">!</span>
                        <span>{point}</span>
                      </motion.li>
                    ))
                  ) : (
                    <li className="text-sm text-muted-foreground">
                      No improvement points yet.
                    </li>
                  )}
                </ul>
              </motion.div>
            </div>

            {/* AI SUGGESTIONS */}
            {summary.aiSuggestions?.length ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-xl bg-gradient-to-br from-cyan-500/5 to-blue-600/5 border border-cyan-500/20 backdrop-blur-sm relative overflow-hidden"
              >
                <div className="absolute -bottom-6 -left-6 h-24 w-24 bg-cyan-500/10 rounded-full blur-2xl" />
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-cyan-500" />
                  </div>
                  <h4 className="text-sm text-cyan-400">AI Recommendations</h4>
                </div>
                <ul className="space-y-2.5 relative">
                  {summary.aiSuggestions.map((suggestion, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="text-sm text-foreground/80 flex items-start gap-2"
                    >
                      <span className="text-cyan-500 mt-0.5">→</span>
                      <span>{suggestion}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
