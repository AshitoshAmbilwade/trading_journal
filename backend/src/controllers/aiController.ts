// src/controllers/aiController.ts
import type { Request, Response } from "express";
import { AISummaryModel } from "../models/AISummary.js";
import { Types } from "mongoose";
import { callChat } from "../utils/bytezClient.js";
import { tradeSummaryPrompt, weeklySummaryPrompt } from "../utils/prompts.js";
import { TradeModel } from "../models/Trade.js";

interface AuthRequest extends Request {
  user?: any;
}

const DEBUG_BYTEZ = process.env.DEBUG_BYTEZ === "true";

/**
 * safeJsonParse
 * - Extracts a {...} block from raw LLM output
 * - Removes code fences
 * - Converts single quotes to double quotes
 * - Adds quotes to unquoted keys
 * - Removes trailing commas
 * - Attempts JSON.parse and returns fallback on failure
 */
function safeJsonParse(raw: any, fallback: any) {
  try {
    if (!raw) return fallback;
    let text = String(raw);

    // Trim and remove top-level surrounding whitespace
    text = text.trim();

    // Remove common code fences like ``` or ```json
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    // Extract the most-likely JSON object: the last {...} block is preferred
    const lastJsonMatch = text.match(/\{[\s\S]*\}$/);
    if (lastJsonMatch) {
      text = lastJsonMatch[0];
    } else {
      // Fall back to first {...} if last not found
      const firstJsonMatch = text.match(/\{[\s\S]*?\}/);
      if (firstJsonMatch) {
        text = firstJsonMatch[0];
      }
    }

    // Heuristic fixes:
    // 1) Replace smart quotes and single quotes with double quotes (but avoid replacing apostrophes inside words minimally)
    //    We'll perform a global single-quote replacement — this is simple and effective for most LLM outputs.
    text = text.replace(/[\u2018\u2019\u201C\u201D]/g, '"'); // smart quotes
    // Replace single-quoted property values and keys with double quotes
    text = text.replace(/'([^']*)'/g, (_m, g1) => {
      // avoid converting single-quoted apostrophes within words like "don't" by a simple heuristic:
      if (/\w'\w/.test(_m)) return `"${g1}"`;
      return `"${g1}"`;
    });

    // 2) Ensure keys are quoted: convert unquoted keys (key: value) => "key": value
    //    This regex is conservative: matches keys consisting of letters, numbers, _ and -.
    text = text.replace(/([,{]\s*)([A-Za-z0-9_\-]+)\s*:/g, (_m, p1, p2) => {
      return `${p1}"${p2}":`;
    });

    // 3) Remove trailing commas before } or ]
    text = text.replace(/,\s*}/g, "}");
    text = text.replace(/,\s*]/g, "]");

    // 4) Remove stray backticks if any remain
    text = text.replace(/`/g, "");

    if (DEBUG_BYTEZ) {
      try {
        console.log("[safeJsonParse] cleaned candidate JSON snippet (preview 1200 chars):", text.slice(0, 1200));
      } catch {}
    }

    // Final parse
    return JSON.parse(text);
  } catch (err) {
    if (DEBUG_BYTEZ) {
      console.error("[safeJsonParse] parse failed, returning fallback. error:", err);
      try {
        console.log("[safeJsonParse] raw input (preview 1200):", String(raw).slice(0, 1200));
      } catch {}
    }
    return fallback;
  }
}

export const generateAISummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { type } = req.body;
    if (!type || (type !== "trade" && type !== "weekly")) {
      return res.status(400).json({ message: "type must be 'trade' or 'weekly'" });
    }

    const userId = new Types.ObjectId(req.user._id);
    let aiDoc: any = null;

    if (type === "trade") {
      const { tradeId } = req.body;
      if (!tradeId) return res.status(400).json({ message: "tradeId is required for type 'trade'" });

      const trade = await TradeModel.findOne({ _id: tradeId, userId }).lean();
      if (!trade) return res.status(404).json({ message: "Trade not found" });

      // Build input snapshot
      const inputSnapshot = {
        _id: String(trade._id),
        symbol: trade.symbol,
        type: trade.type || "Buy",
        quantity: Number(trade.quantity || 0),
        entryPrice: Number(trade.entryPrice || 0),
        exitPrice: trade.exitPrice !== undefined ? Number(trade.exitPrice) : undefined,
        pnl: Number((trade as any).pnl || 0),
        entryCondition: trade.customFields?.["Entry Condition"] || trade.entryCondition || "",
        exitCondition: trade.customFields?.["Exit Condition"] || trade.exitCondition || "",
        brokerage: Number(trade.brokerage || 0),
        strategy: trade.strategy || "",
        session: trade.session || "",
        tradeDate: trade.tradeDate ? new Date(trade.tradeDate).toISOString() : undefined,
        entryNote: trade.entryNote || trade.customFields?.["Entry Note"] || "",
        exitNote: trade.exitNote || trade.customFields?.["Exit Note"] || "",
        notes: trade.notes || ""
      };

      // Create draft AISummary entry
      const startEnd = inputSnapshot.tradeDate ?
        { start: inputSnapshot.tradeDate, end: inputSnapshot.tradeDate } :
        { start: new Date().toISOString(), end: new Date().toISOString() };

      aiDoc = await AISummaryModel.create({
        userId,
        type: "trade",
        tradeId: new Types.ObjectId(tradeId),
        dateRange: { start: new Date(startEnd.start), end: new Date(startEnd.end) },
        summaryText: "Generating trade analysis...",
        plusPoints: [],
        minusPoints: [],
        aiSuggestions: [],
        generatedAt: new Date(),
        rawResponse: "",
        inputSnapshot,
        status: "draft"
      });

      // Generate analysis
      const messages = tradeSummaryPrompt(inputSnapshot);
      const model = process.env.BYTEZ_TRADE_MODEL || "Qwen/Qwen2.5-7B-Instruct";

      let rawResponse = "";
      let parsed: any = null;

      try {
        console.log(`Generating trade analysis for ${inputSnapshot.symbol}...`);
        rawResponse = await callChat(model, messages, {
          temperature: 0.3,
          max_tokens: 500
        });

        // DEBUG: raw response length + optionally full response
        console.log("[AI] rawResponse length:", typeof rawResponse === "string" ? rawResponse.length : typeof rawResponse);
        if (DEBUG_BYTEZ) {
          console.log("[AI] rawResponse (full):", rawResponse);
        }

        // Parse tolerant JSON
        parsed = safeJsonParse(rawResponse, null);

        // If parsing produced null, fall back to regex extraction and fallback generator
        if (!parsed) {
          // Attempt regex extraction similar to previous approach
          const jsonMatch = String(rawResponse).match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              parsed = JSON.parse(jsonMatch[0]);
            } catch {
              parsed = createTradeFallback(inputSnapshot);
            }
          } else {
            parsed = createTradeFallback(inputSnapshot);
          }
        }
      } catch (err: any) {
        console.error("Trade analysis failed:", err?.message || err);
        parsed = createTradeFallback(inputSnapshot);
        rawResponse = JSON.stringify(parsed);
      }

      // Update with analysis data
      const updatePayload: any = {
        summaryText: parsed?.summaryText || `Analysis for ${inputSnapshot.symbol} trade`,
        plusPoints: Array.isArray(parsed?.plusPoints) ? parsed.plusPoints : ["Trade executed successfully"],
        minusPoints: Array.isArray(parsed?.minusPoints) ? parsed.minusPoints : ["Basic analysis only"],
        aiSuggestions: Array.isArray(parsed?.aiSuggestions) ? parsed.aiSuggestions : ["Review trade details manually"],
        generatedAt: new Date(),
        rawResponse,
        model: model,
        status: "ready",
      };

      await AISummaryModel.findByIdAndUpdate(aiDoc._id, updatePayload);
      const final = await AISummaryModel.findById(aiDoc._id).lean();

      if (DEBUG_BYTEZ) {
        console.log("[AI] saved AISummary (trade):", JSON.stringify(final, null, 2));
      }

      return res.status(200).json({ aiSummary: final });
    }

    // ---------- weekly summary ----------
    if (type === "weekly") {
      const { dateRange } = req.body;
      const end = dateRange?.end ? new Date(dateRange.end) : new Date();
      const start = dateRange?.start ? new Date(dateRange.start) : new Date(new Date().setDate(end.getDate() - 6));

      // Fetch trades
      const trades = await TradeModel.find({
        userId,
        tradeDate: { $gte: start, $lte: end }
      }).lean();

      // Build aggregated stats
      const totalTrades = trades.length;
      const winningTrades = trades.filter(t => Number((t as any).pnl || 0) > 0).length;
      const losingTrades = totalTrades - winningTrades;
      const totalPnL = trades.reduce((s, t) => s + Number((t as any).pnl || 0), 0);
      const avgPnLPerTrade = totalTrades ? totalPnL / totalTrades : 0;
      const bestTrade = trades.length ? trades.reduce((a,t) => (Number((t as any).pnl || 0) > Number((a as any).pnl || 0) ? t : a)) : null;
      const worstTrade = trades.length ? trades.reduce((a,t) => (Number((t as any).pnl || 0) < Number((a as any).pnl || 0) ? t : a)) : null;
      const strategiesUsed = Array.from(new Set(trades.map(t => t.strategy || "").filter(Boolean)));

      const issuesCount: Record<string, number> = {};
      trades.forEach(t => {
        const ec = (t.customFields?.["Exit Condition"] || t.exitCondition || "").toLowerCase();
        const ic = (t.customFields?.["Entry Condition"] || t.entryCondition || "").toLowerCase();
        [ec, ic].forEach(k => {
          if (!k) return;
          issuesCount[k] = (issuesCount[k] || 0) + 1;
        });
      });
      const dominantIssues = Object.entries(issuesCount).sort((a,b) => b[1]-a[1]).slice(0,5).map(([k]) => k);

      const aggregate = {
        period: `${start.toISOString().split("T")[0]}_to_${end.toISOString().split("T")[0]}`,
        totalTrades,
        winningTrades,
        losingTrades,
        winRatePct: totalTrades ? (winningTrades/totalTrades)*100 : 0,
        totalPnL,
        avgPnLPerTrade,
        bestTrade: bestTrade ? {
          symbol: bestTrade.symbol,
          pnl: Number((bestTrade as any).pnl || 0),
          date: bestTrade.tradeDate ? new Date(bestTrade.tradeDate).toISOString() : ""
        } : null,
        worstTrade: worstTrade ? {
          symbol: worstTrade.symbol,
          pnl: Number((worstTrade as any).pnl || 0),
          date: worstTrade.tradeDate ? new Date(worstTrade.tradeDate).toISOString() : ""
        } : null,
        strategiesUsed,
        dominantIssues,
        tradesSample: trades.slice(0, 10).map(t => ({
          _id: String(t._id),
          symbol: t.symbol,
          pnl: Number((t as any).pnl || 0),
          entryCondition: t.customFields?.["Entry Condition"] || t.entryCondition || "",
          exitCondition: t.customFields?.["Exit Condition"] || t.exitCondition || ""
        }))
      };

      // Create draft entry
      aiDoc = await AISummaryModel.create({
        userId,
        type: "weekly",
        dateRange: { start, end },
        summaryText: "Generating weekly analysis...",
        plusPoints: [],
        minusPoints: [],
        aiSuggestions: [],
        weeklyStats: {},
        generatedAt: new Date(),
        rawResponse: "",
        inputSnapshot: aggregate,
        status: "draft"
      });

      const messages = weeklySummaryPrompt(aggregate);
      const weeklyModel = process.env.BYTEZ_WEEKLY_MODEL || "Qwen/Qwen2.5-7B-Instruct";

      let rawResponse = "";
      let parsed: any = null;

      try {
        console.log(`Generating weekly analysis for ${aggregate.totalTrades} trades...`);
        rawResponse = await callChat(weeklyModel, messages, {
          temperature: 0.2,
          max_tokens: 800
        });

        // DEBUG: raw response length + optionally full response
        console.log("[AI] rawResponse length:", typeof rawResponse === "string" ? rawResponse.length : typeof rawResponse);
        if (DEBUG_BYTEZ) {
          console.log("[AI] rawResponse (full):", rawResponse);
        }

        // Parse tolerant JSON
        parsed = safeJsonParse(rawResponse, null);

        // If parsing failed, fallback to regex extraction or generate fallback
        if (!parsed) {
          const jsonMatch = String(rawResponse).match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              parsed = JSON.parse(jsonMatch[0]);
            } catch {
              parsed = createWeeklyFallback(aggregate);
            }
          } else {
            parsed = createWeeklyFallback(aggregate);
          }
        }
      } catch (err: any) {
        console.error("Weekly analysis failed:", err?.message || err);
        parsed = createWeeklyFallback(aggregate);
        rawResponse = JSON.stringify(parsed);
      }

      // Update with analysis
      const updatePayload: any = {
        summaryText: parsed?.summaryText || `Weekly analysis of ${aggregate.totalTrades} trades`,
        plusPoints: Array.isArray(parsed?.plusPoints) ? parsed.plusPoints : [`Completed ${aggregate.totalTrades} trades`],
        minusPoints: Array.isArray(parsed?.minusPoints) ? parsed.minusPoints : ["Basic analysis only"],
        aiSuggestions: Array.isArray(parsed?.aiSuggestions) ? parsed.aiSuggestions : ["Review weekly performance manually"],
        weeklyStats: parsed?.weeklyStats || aggregate,
        generatedAt: new Date(),
        rawResponse,
        model: weeklyModel,
        status: "ready",
      };

      await AISummaryModel.findByIdAndUpdate(aiDoc._id, updatePayload);
      const final = await AISummaryModel.findById(aiDoc._id).lean();

      if (DEBUG_BYTEZ) {
        console.log("[AI] saved AISummary (weekly):", JSON.stringify(final, null, 2));
      }

      return res.status(200).json({ aiSummary: final });
    }

    return res.status(400).json({ message: "Invalid type" });
  } catch (err: any) {
    console.error("generateAISummary error:", err);
    res.status(500).json({ message: err.message || "Error generating AI summary" });
  }
};

// Helper functions for fallback responses
function createTradeFallback(trade: any) {
  return {
    summaryText: `Trade analysis for ${trade.symbol}: ${trade.type} position of ${trade.quantity} shares. ${trade.pnl >= 0 ? 'Profitable trade.' : 'Loss-making trade.'}`,
    plusPoints: [
      "Trade executed according to plan",
      "Proper position sizing",
      trade.pnl >= 0 ? "Successful profit taking" : "Risk managed appropriately"
    ],
    minusPoints: [
      "Detailed AI analysis unavailable",
      "Limited insight into entry/exit timing"
    ],
    aiSuggestions: [
      "Review your trading journal regularly",
      "Analyze similar trades for patterns",
      "Consider risk-reward ratios for future trades"
    ],
    score: trade.pnl >= 0 ? 7 : 5,
    tags: ["fallback-analysis", trade.pnl >= 0 ? "profitable" : "loss"]
  };
}

function createWeeklyFallback(aggregate: any) {
  const winRate = aggregate.winRatePct.toFixed(1);
  return {
    summaryText: `Weekly trading summary: ${aggregate.totalTrades} trades executed with ${winRate}% win rate. ${aggregate.totalPnL >= 0 ? 'Overall profitable week.' : 'Challenging week with losses.'}`,
    plusPoints: [
      `Active trading with ${aggregate.totalTrades} trades`,
      `Win rate of ${winRate}%`,
      aggregate.totalPnL >= 0 ? "Positive overall P&L" : "Learning opportunity identified"
    ],
    minusPoints: [
      "Detailed AI analysis temporarily unavailable",
      "Limited pattern recognition"
    ],
    aiSuggestions: [
      "Review losing trades for common patterns",
      "Consider adjusting position sizing",
      "Maintain consistent trading journal entries"
    ],
    weeklyStats: aggregate,
    narrative: `Basic weekly performance summary generated. ${aggregate.totalTrades} trades were executed with a ${winRate}% success rate. ${aggregate.dominantIssues.length > 0 ? `Common issues: ${aggregate.dominantIssues.join(', ')}.` : ''}`
  };
}

// Keep your other CRUD endpoints as they are (createAISummary, listAISummaries, getAISummary, deleteAISummary)

export const createAISummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { type, dateRange, summaryText, plusPoints, minusPoints, aiSuggestions } = req.body;

    if (!type || !dateRange || !summaryText) {
      return res.status(400).json({ message: "type, dateRange and summaryText are required" });
    }

    const payload = {
      userId: new Types.ObjectId(req.user._id),
      type,
      dateRange: {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
      },
      summaryText,
      plusPoints: plusPoints || [],
      minusPoints: minusPoints || [],
      aiSuggestions: aiSuggestions || [],
    };

    const created = await AISummaryModel.create(payload);
    res.status(201).json({ aiSummary: created });
  } catch (err: any) {
    console.error("createAISummary error:", err);
    res.status(500).json({ message: err.message || "Error creating AI summary" });
  }
};

export const listAISummaries = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const summaries = await AISummaryModel.find({ userId: new Types.ObjectId(req.user._id) })
      .sort({ generatedAt: -1 })
      .lean();

    res.status(200).json({ summaries });
  } catch (err: any) {
    console.error("listAISummaries error:", err);
    res.status(500).json({ message: err.message || "Error fetching AI summaries" });
  }
};

export const getAISummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "id is required" });

    const summary = await AISummaryModel.findOne({
      _id: id,
      userId: new Types.ObjectId(req.user._id),
    });

    if (!summary) return res.status(404).json({ message: "AI summary not found" });

    res.status(200).json({ aiSummary: summary });
  } catch (err: any) {
    console.error("getAISummary error:", err);
    res.status(500).json({ message: err.message || "Error fetching AI summary" });
  }
};

export const deleteAISummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "id is required" });

    const deleted = await AISummaryModel.findOneAndDelete({
      _id: id,
      userId: new Types.ObjectId(req.user._id),
    });

    if (!deleted) return res.status(404).json({ message: "AI summary not found" });

    res.status(200).json({ message: "AI summary deleted" });
  } catch (err: any) {
    console.error("deleteAISummary error:", err);
    res.status(500).json({ message: err.message || "Error deleting AI summary" });
  }
};
