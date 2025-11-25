// src/controllers/aiController.ts
import type { Request, Response } from "express";
import { Types } from "mongoose";
import { AISummaryModel } from "../models/AISummary.js";
import { TradeModel } from "../models/Trade.js";
import { UserModel } from "../models/User.js";
import { aiQueue } from "../queue/aiQueue.js";
import { callChat } from "../utils/bytezClient.js";
import { tradeSummaryPrompt, weeklySummaryPrompt } from "../utils/prompts.js";
import util from "util";

interface AuthRequest extends Request {
  user?: any;
}

/* ---------------------------- Helpers ---------------------------- */

/** Check whether user has Premium tier */
async function isUserPremium(userId: Types.ObjectId) {
  try {
    const user = await UserModel.findById(userId).lean();
    if (!user) return false;
    return user.tier === "Premium" || user.tier === "UltraPremium";
  } catch (e) {
    console.error("isUserPremium error:", e);
    return false;
  }
}

/** Check whether user is UltraPremium */
async function isUserUltraPremium(userId: Types.ObjectId) {
  try {
    const user = await UserModel.findById(userId).lean();
    if (!user) return false;
    return user.tier === "UltraPremium";
  } catch (e) {
    console.error("isUserUltraPremium error:", e);
    return false;
  }
}

/** normalize date range; throws on invalid */
function normalizeDateRange(dateRange?: any, fallbackDays = 6) {
  const end = dateRange?.end ? new Date(dateRange.end) : new Date();
  const start = dateRange?.start ? new Date(dateRange.start) : new Date(end.getTime() - fallbackDays * 24 * 60 * 60 * 1000);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new Error("Invalid dateRange");
  if (start > end) throw new Error("dateRange.start must be <= dateRange.end");
  return { start, end };
}

/* ---------------------------- Robust parsing helpers ---------------------------- */

/**
 * extractTextFromRaw
 * Normalize a variety of model response shapes into plain text.
 */
function extractTextFromRaw(raw: any): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw;

  // Common shaped responses
  if (typeof raw.output === "string") return raw.output;
  if (raw.response && typeof raw.response === "string") return raw.response;

  // OpenAI-like shapes
  if (Array.isArray(raw.choices) && raw.choices[0]) {
    const ch = raw.choices[0];
    if (ch.message && ch.message.content) return String(ch.message.content);
    if (ch.text) return String(ch.text);
  }

  // Bytez / other wrappers
  if (raw.output && typeof raw.output === "object") {
    try {
      return JSON.stringify(raw.output);
    } catch (e) {}
  }
  if (raw.content && typeof raw.content === "string") return raw.content;
  if (raw.result && typeof raw.result === "string") return raw.result;

  // fallback: stringify the object (safe)
  try {
    return JSON.stringify(raw);
  } catch (e) {
    return String(raw);
  }
}

/** apply common tolerant fixes to candidate JSON string */
function tolerantFixes(candidate: string): string {
  let s = candidate;
  s = s.replace(/[\u2018\u2019\u201C\u201D]/g, '"'); // smart quotes -> straight
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim(); // strip code fences
  s = s.replace(/,\s*([}\]])/g, "$1"); // trailing commas
  s = s.replace(/\\n/g, "\\n"); // leave escapes alone
  // single-quoted strings -> double quotes (best-effort)
  s = s.replace(/'([^']*)'/g, (_m, g1) => `"${g1.replace(/"/g, '\\"')}"`);
  // naive quote unquoted keys: { key: -> { "key":
  s = s.replace(/([,{]\s*)([A-Za-z0-9_\-]+)\s*:/g, (_m, p1, p2) => `${p1}"${p2}":`);
  return s;
}

/** Find largest balanced {...} chunk (if any) */
function findLargestJsonSubstring(text: string): string | null {
  const chunks: string[] = [];
  const n = text.length;
  for (let i = 0; i < n; i++) {
    if (text[i] !== "{") continue;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let j = i; j < n; j++) {
      const ch = text[j];
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = !inString;
      } else if (!inString) {
        if (ch === "{") depth++;
        else if (ch === "}") {
          depth--;
          if (depth === 0) {
            chunks.push(text.slice(i, j + 1));
            i = j; // fast-forward outer loop
            break;
          }
        }
      }
    }
  }
  if (chunks.length === 0) return null;
  chunks.sort((a, b) => b.length - a.length);
  return chunks[0];
}

/**
 * parseTolerantInline
 * Aggressive multi-strategy parsing:
 * 1. Try parse(rawText)
 * 2. Try largest balanced {...}
 * 3. Try first '{' to last '}' substring
 * 4. Try tolerantFixes on any candidate
 * 5. If candidate parses to a string containing JSON, parse again
 */
function parseTolerantInline(raw: any): any | null {
  try {
    const text = extractTextFromRaw(raw);
    if (!text) return null;

    // 1) direct parse
    try {
      const d = JSON.parse(text);
      // If parse yields a JSON string (double-encoded), try again
      if (typeof d === "string") {
        try {
          return JSON.parse(d);
        } catch (e) {
          return d;
        }
      }
      return d;
    } catch (e) {
      // continue
    }

    // 2) largest balanced {...}
    const cand = findLargestJsonSubstring(text);
    if (cand) {
      try {
        return JSON.parse(tolerantFixes(cand));
      } catch (e) {
        try {
          return JSON.parse(cand);
        } catch (err) {
          // continue
        }
      }
    }

    // 3) first '{' to last '}' substring (covers "JSON then text" cases)
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      const piece = text.slice(first, last + 1);
      try {
        return JSON.parse(tolerantFixes(piece));
      } catch (e) {
        try {
          return JSON.parse(piece);
        } catch (err) {
          // continue
        }
      }
    }

    // 4) if raw was already an object, return it
    if (typeof raw === "object") return raw;

    return null;
  } catch (err) {
    return null;
  }
}

/** Coerce parsed object to normalized fields used by DB */
function normalizeParsedInline(parsed: any, inputSnapshot: any) {
  const out: any = {
    summaryText: "",
    plusPoints: [] as string[],
    minusPoints: [] as string[],
    aiSuggestions: [] as string[],
    weeklyStats: undefined as any,
  };

  if (!parsed) return out;

  const possibleSummary = parsed.summaryText || parsed.summary || parsed.narrative || parsed.text;
  out.summaryText = typeof possibleSummary === "string" ? possibleSummary : "";

  const toArray = (v: any) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === "string") {
      // split on newlines or bullet-like characters
      return v.split(/[\r\n•\-]+/).map((s: string) => s.trim()).filter(Boolean);
    }
    return [v];
  };

  out.plusPoints = toArray(parsed.plusPoints || parsed.positives || parsed.advantages);
  out.minusPoints = toArray(parsed.minusPoints || parsed.negatives || parsed.issues);
  out.aiSuggestions = toArray(parsed.aiSuggestions || parsed.suggestions || parsed.recommendations);

  if (parsed.weeklyStats && typeof parsed.weeklyStats === "object") out.weeklyStats = parsed.weeklyStats;
  else out.weeklyStats = parsed.weeklyStats ?? inputSnapshot ?? undefined;

  return out;
}

/** enqueue helper with sane defaults */
async function enqueueAiJob(payload: { summaryId: string; type: string; model: string; input: any; userId: string }) {
  const jobOptions = {
    attempts: 3,
    backoff: { type: "exponential" as const, delay: 2000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  };

  console.debug("[aiController] enqueueAiJob ->", payload.summaryId, payload.type, payload.model);
  return aiQueue.add("ai-job", payload, jobOptions);
}

/* ---------------------------- Inline processing ---------------------------- */

/**
 * Inline processor (same logic as worker)
 * - calls LLM
 * - stores rawResponse first
 * - parses and persists normalized fields
 *
 * Note: conservative token limits used to reduce chance of provider OOM.
 */
async function processInlineAndPersist(summaryId: string, type: string, model: string, input: any) {
  let messages: Array<{ role: string; content: string }> = [];
  if (type === "trade") messages = tradeSummaryPrompt(input);
  else messages = weeklySummaryPrompt(input);

  // tuned token limits (reduce memory use for larger types)
  const opts = {
    temperature: type === "trade" ? 0.3 : 0.2,
    max_tokens: type === "trade" ? 400 : 800, // lowered from 500/1200 to be safer
    timeoutMs: 120000,
  };

  const rawResponse = await callChat(model, messages, opts);

  const rawStr = typeof rawResponse === "string" ? rawResponse : JSON.stringify(rawResponse);
  // persist raw early (so you never lose raw LLM output)
  await AISummaryModel.findByIdAndUpdate(summaryId, { $set: { rawResponse: rawStr, model, status: "processing" } });

  const parsed = parseTolerantInline(rawResponse);
  const normalized = normalizeParsedInline(parsed, input);

  const finalSummaryText = normalized.summaryText || (type === "trade" ? "Trade analysis (fallback)." : "Summary (fallback).");

  const updatePayload: any = {
    summaryText: finalSummaryText,
    plusPoints: Array.isArray(normalized.plusPoints) ? normalized.plusPoints : [],
    minusPoints: Array.isArray(normalized.minusPoints) ? normalized.minusPoints : [],
    aiSuggestions: Array.isArray(normalized.aiSuggestions) ? normalized.aiSuggestions : [],
    weeklyStats: normalized.weeklyStats || undefined,
    status: "ready",
    generatedAt: new Date(),
  };

  // If parse failed (no parsed object), mark as failed_to_parse instead of ready so free-summary accounting isn't consumed
  if (!parsed) {
    // keep rawResponse (already set), mark parse-failed
    await AISummaryModel.findByIdAndUpdate(summaryId, {
      $set: {
        status: "failed_to_parse",
        // keep summaryText fallback but don't count as ready (so user's free quota isn't consumed)
        summaryText: finalSummaryText,
        errorMessage: "Failed to parse LLM output to structured JSON",
        generatedAt: new Date(),
      },
    });

    // return the draft with rawResponse preserved
    const fresh = await AISummaryModel.findById(summaryId).lean();
    return fresh;
  }

  // if parsed OK, persist structured fields
  await AISummaryModel.findByIdAndUpdate(summaryId, { $set: updatePayload });

  const fresh = await AISummaryModel.findById(summaryId).lean();
  return fresh;
}

/* ---------------------------- Inline failure handler ---------------------------- */

/**
 * handleInlineFailure
 * Centralized fallback logic when inline processing throws.
 * - If the error looks like provider GPU OOM / inference 422, enqueue and return 202.
 * - Otherwise attempt to enqueue; if enqueue fails, return 500.
 */
async function handleInlineFailure(err: any, payload: any, draftId: string, res: Response) {
  const errMsg = String(err?.message || err || "");
  console.error("[aiController] Inline AI processing failed:", util.inspect(err, { depth: null }));

  const providerOOM =
    /cuda/i.test(errMsg) ||
    /out of memory/i.test(errMsg) ||
    /CUBLAS_STATUS_ALLOC_FAILED/i.test(errMsg) ||
    /inference failed/i.test(errMsg) ||
    (err?.status === 422) ||
    /cuda out of memory/i.test(errMsg);

  if (providerOOM) {
    console.warn("[aiController] Detected provider GPU OOM / 422 inference failure — enqueueing job for worker.");
    try {
      await enqueueAiJob(payload);
      return res.status(202).json({ summaryId: draftId, message: "Enqueued due to provider resource error" });
    } catch (enqueueErr) {
      console.error("[aiController] Failed to enqueue after inline provider error:", enqueueErr);
      return res.status(500).json({ message: "AI processing failed and enqueueing also failed" });
    }
  }

  // general fallback: try to enqueue
  try {
    await enqueueAiJob(payload);
    return res.status(202).json({ summaryId: draftId });
  } catch (enqueueErr) {
    console.error("[aiController] Failed to enqueue after inline error:", enqueueErr);
    return res.status(500).json({ message: "AI processing failed and enqueueing also failed" });
  }
}

/* ---------------------------- Quota checks ---------------------------- */

/**
 * canUserGenerate
 * Enforce quotas:
 * - Free: 1 weekly (status: "ready") allowed, monthly NOT allowed.
 * - Premium/UltraPremium: up to 4 weekly (ready) & 1 monthly (ready).
 * - Trade summaries: Free -> 10 ready allowed, Premium/UltraPremium -> 30 ready allowed.
 */
async function canUserGenerate(userId: Types.ObjectId, type: "weekly" | "monthly" | "trade") {
  const premium = await isUserPremium(userId);
  const ultra = await isUserUltraPremium(userId);

  if (type === "weekly") {
    if (!premium) {
      const prior = await AISummaryModel.countDocuments({ userId, type: "weekly", status: "ready" });
      return { allowed: prior < 1, reason: prior >= 1 ? "free_weekly_limit_reached" : null };
    } else {
      const prior = await AISummaryModel.countDocuments({ userId, type: "weekly", status: "ready" });
      return { allowed: prior < 4, reason: prior >= 4 ? "premium_weekly_limit_reached" : null };
    }
  }

  if (type === "monthly") {
    if (!premium) {
      return { allowed: false, reason: "monthly_requires_premium" };
    } else {
      const prior = await AISummaryModel.countDocuments({ userId, type: "monthly", status: "ready" });
      return { allowed: prior < 1, reason: prior >= 1 ? "monthly_limit_reached" : null };
    }
  }

  if (type === "trade") {
    // Free users: up to 10 trade summaries (ready)
    // Premium/Ultra: up to 30 trade summaries (ready)
    const prior = await AISummaryModel.countDocuments({ userId, type: "trade", status: "ready" });
    if (!premium) {
      return { allowed: prior < 10, reason: prior >= 10 ? "free_trade_limit_reached" : null };
    } else {
      return { allowed: prior < 30, reason: prior >= 30 ? "premium_trade_limit_reached" : null };
    }
  }

  return { allowed: false, reason: "invalid_type" };
}

/* ---------------------------- Controller: generateAISummary ---------------------------- */

/**
 * Body: { type: "trade"|"weekly"|"monthly", tradeId?, dateRange? }
 *
 * Behavior:
 * - create draft AISummary (status: draft)
 * - if queue load low (AI_QUEUE_THRESHOLD), attempt inline processing and return 200 + aiSummary
 * - else enqueue and return 202 with summaryId
 *
 * Note: quota checks enforce free vs premium behaviour described in requirements.
 */
export const generateAISummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const userId = new Types.ObjectId(req.user._id);
    const { type } = req.body;

    if (!["trade", "weekly", "monthly"].includes(type)) {
      return res.status(400).json({ message: "Invalid type. Must be 'trade', 'weekly' or 'monthly'." });
    }

    /* ------------------ TRADE ------------------ */
    if (type === "trade") {
      const { tradeId } = req.body;
      if (!tradeId) return res.status(400).json({ message: "tradeId required for trade summary" });

      // trade quota check
      const quota = await canUserGenerate(userId, "trade");
      if (!quota.allowed) {
        if (quota.reason === "free_trade_limit_reached" || quota.reason === "premium_trade_limit_reached") {
          return res.status(402).json({ error: "payment_required", message: "Trade summary quota reached. Upgrade or wait." });
        }
        return res.status(403).json({ message: "Not allowed" });
      }

      const trade = await TradeModel.findOne({ _id: tradeId, userId }).lean();
      if (!trade) return res.status(404).json({ message: "Trade not found" });

      // include currency metadata
      const inputSnapshot = {
        _id: String(trade._id),
        symbol: trade.symbol,
        type: trade.type || "Buy",
        quantity: Number(trade.quantity || 0),
        entryPrice: Number(trade.entryPrice || 0),
        exitPrice: trade.exitPrice != null ? Number(trade.exitPrice) : null,
        pnl: Number(trade.pnl || 0),
        entryCondition: trade.entryCondition || "",
        exitCondition: trade.exitCondition || "",
        strategy: trade.strategy || "",
        tradeDate: trade.tradeDate,
        currency: "INR",
        currencySymbol: "₹",
      };

      const draft = await AISummaryModel.create({
        userId,
        type: "trade",
        tradeId: String(trade._id),
        dateRange: { start: trade.tradeDate, end: trade.tradeDate },
        summaryText: "Generating trade analysis...",
        inputSnapshot,
        status: "draft",
      });

      const payload = {
        summaryId: String(draft._id),
        type: "trade",
        model: process.env.BYTEZ_TRADE_MODEL || "Qwen/Qwen2.5-7B-Instruct",
        input: inputSnapshot,
        userId: String(userId),
      };

      const threshold = Number(process.env.AI_QUEUE_THRESHOLD || 5);
      const jobCounts = await aiQueue.getJobCounts("waiting", "active");
      const totalActiveWait = (jobCounts.waiting || 0) + (jobCounts.active || 0);

      console.debug("[aiController] queueCounts:", jobCounts, "totalActiveWait:", totalActiveWait, "threshold:", threshold);

      if (totalActiveWait < threshold) {
        console.debug("[aiController] Processing inline (low queue load)");
        try {
          const fresh = await processInlineAndPersist(payload.summaryId, payload.type, payload.model, payload.input);
          return res.status(200).json({ summaryId: String(draft._id), aiSummary: fresh });
        } catch (err: any) {
          return await handleInlineFailure(err, payload, String(draft._id), res);
        }
      } else {
        await enqueueAiJob(payload);
        return res.status(202).json({ summaryId: String(draft._id) });
      }
    }

    /* ------------------ WEEKLY ------------------ */
    if (type === "weekly") {
      const { dateRange } = req.body;
      let start: Date, end: Date;
      try {
        ({ start, end } = normalizeDateRange(dateRange, 6));
      } catch (e: any) {
        return res.status(400).json({ message: e.message || "Invalid dateRange" });
      }

      // Quota enforcement
      const quota = await canUserGenerate(userId, "weekly");
      if (!quota.allowed) {
        if (quota.reason === "free_weekly_limit_reached" || quota.reason === "premium_weekly_limit_reached") {
          return res.status(402).json({ error: "payment_required", message: "Weekly summary quota reached. Upgrade or wait." });
        }
        return res.status(403).json({ message: "Not allowed" });
      }

      const trades = await TradeModel.find({ userId, tradeDate: { $gte: start, $lte: end } })
        .sort({ tradeDate: 1 })
        .lean();

      const aggregate = {
        period: `${start.toISOString()}_${end.toISOString()}`,
        totalTrades: trades.length,
        winningTrades: trades.filter((t) => (t as any).pnl > 0).length,
        totalPnL: trades.reduce((s, t) => s + ((t as any).pnl || 0), 0),
        tradesSample: trades.slice(0, 15),
        currency: "INR",
        currencySymbol: "₹",
      };

      const draft = await AISummaryModel.create({
        userId,
        type: "weekly",
        dateRange: { start, end },
        summaryText: "Generating weekly analysis...",
        inputSnapshot: aggregate,
        status: "draft",
      });

      console.debug("[aiController] created weekly AISummary draft:", String(draft._id), "user:", String(userId), "trades:", aggregate.totalTrades);

      const payload = {
        summaryId: String(draft._id),
        type: "weekly",
        model: process.env.BYTEZ_WEEKLY_MODEL || "Qwen/Qwen2.5-7B-Instruct",
        input: aggregate,
        userId: String(userId),
      };

      const threshold = Number(process.env.AI_QUEUE_THRESHOLD || 5);
      const jobCounts = await aiQueue.getJobCounts("waiting", "active");
      const totalActiveWait = (jobCounts.waiting || 0) + (jobCounts.active || 0);

      console.debug("[aiController] queueCounts:", jobCounts, "totalActiveWait:", totalActiveWait, "threshold:", threshold);

      if (totalActiveWait < threshold) {
        console.debug("[aiController] Processing inline (low queue load)");
        try {
          const fresh = await processInlineAndPersist(payload.summaryId, payload.type, payload.model, payload.input);
          return res.status(200).json({ summaryId: String(draft._id), aiSummary: fresh });
        } catch (err: any) {
          return await handleInlineFailure(err, payload, String(draft._id), res);
        }
      } else {
        await enqueueAiJob(payload);
        return res.status(202).json({ summaryId: String(draft._id) });
      }
    }

    /* ------------------ MONTHLY ------------------ */
    if (type === "monthly") {
      // Monthly allowed only for premium/ultrapremium and limited to 1 ready
      const quota = await canUserGenerate(userId, "monthly");
      if (!quota.allowed) {
        if (quota.reason === "monthly_requires_premium") {
          return res.status(402).json({ error: "payment_required", message: "Monthly summaries require a Premium plan." });
        }
        if (quota.reason === "monthly_limit_reached") {
          return res.status(402).json({ error: "payment_required", message: "Monthly summary limit reached." });
        }
        return res.status(403).json({ message: "Not allowed" });
      }

      const { dateRange } = req.body;
      let start: Date, end: Date;
      try {
        ({ start, end } = normalizeDateRange(dateRange, 29));
      } catch (e: any) {
        return res.status(400).json({ message: e.message || "Invalid dateRange" });
      }

      const trades = await TradeModel.find({ userId, tradeDate: { $gte: start, $lte: end } })
        .sort({ tradeDate: 1 })
        .lean();

      const aggregate = {
        period: `${start.toISOString()}_${end.toISOString()}`,
        totalTrades: trades.length,
        winningTrades: trades.filter((t) => (t as any).pnl > 0).length,
        totalPnL: trades.reduce((s, t) => s + ((t as any).pnl || 0), 0),
        tradesSample: trades.slice(0, 15),
        currency: "INR",
        currencySymbol: "₹",
      };

      const draft = await AISummaryModel.create({
        userId,
        type: "monthly",
        dateRange: { start, end },
        summaryText: "Generating monthly analysis...",
        inputSnapshot: aggregate,
        status: "draft",
      });

      console.debug("[aiController] created monthly AISummary draft:", String(draft._id), "user:", String(userId), "trades:", aggregate.totalTrades);

      const payload = {
        summaryId: String(draft._id),
        type: "monthly",
        model: process.env.BYTEZ_WEEKLY_MODEL || process.env.BYTEZ_TRADE_MODEL || "Qwen/Qwen2.5-7B-Instruct",
        input: aggregate,
        userId: String(userId),
      };

      const threshold = Number(process.env.AI_QUEUE_THRESHOLD || 5);
      const jobCounts = await aiQueue.getJobCounts("waiting", "active");
      const totalActiveWait = (jobCounts.waiting || 0) + (jobCounts.active || 0);

      console.debug("[aiController] queueCounts:", jobCounts, "totalActiveWait:", totalActiveWait, "threshold:", threshold);

      if (totalActiveWait < threshold) {
        console.debug("[aiController] Processing inline (low queue load)");
        try {
          const fresh = await processInlineAndPersist(payload.summaryId, payload.type, payload.model, payload.input);
          return res.status(200).json({ summaryId: String(draft._id), aiSummary: fresh });
        } catch (err: any) {
          return await handleInlineFailure(err, payload, String(draft._id), res);
        }
      } else {
        await enqueueAiJob(payload);
        return res.status(202).json({ summaryId: String(draft._id) });
      }
    }

    return res.status(400).json({ message: "Invalid type" });
  } catch (err: any) {
    console.error("generateAISummary ERROR:", util.inspect(err, { depth: null }));
    return res.status(500).json({ message: err?.message || "AI summary generation failed" });
  }
};

/* ---------------------------- CRUD endpoints ---------------------------- */

/** createAISummary - manual create (admin-ish) */
export const createAISummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { type, dateRange, summaryText, plusPoints, minusPoints, aiSuggestions } = req.body;
    if (!type || !dateRange || !summaryText) {
      return res.status(400).json({ message: "type, dateRange and summaryText are required" });
    }

    const payload: any = {
      userId: new Types.ObjectId(req.user._id),
      type,
      dateRange: { start: new Date(dateRange.start), end: new Date(dateRange.end) },
      summaryText,
      plusPoints: plusPoints || [],
      minusPoints: minusPoints || [],
      aiSuggestions: aiSuggestions || [],
      status: "ready",
      generatedAt: new Date(),
    };

    const created = await AISummaryModel.create(payload);
    res.status(201).json({ aiSummary: created });
  } catch (err: any) {
    console.error("createAISummary error:", util.inspect(err, { depth: null }));
    res.status(500).json({ message: err?.message || "Error creating AI summary" });
  }
};

/** listAISummaries for user */
export const listAISummaries = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const summaries = await AISummaryModel.find({ userId: new Types.ObjectId(req.user._id) })
      .sort({ generatedAt: -1 })
      .lean();

    res.status(200).json({ summaries });
  } catch (err: any) {
    console.error("listAISummaries error:", util.inspect(err, { depth: null }));
    res.status(500).json({ message: err?.message || "Error fetching AI summaries" });
  }
};

/** get single AISummary */
export const getAISummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "id is required" });

    const summary = await AISummaryModel.findOne({ _id: id, userId: new Types.ObjectId(req.user._id) });
    if (!summary) return res.status(404).json({ message: "AI summary not found" });

    res.status(200).json({ aiSummary: summary });
  } catch (err: any) {
    console.error("getAISummary error:", util.inspect(err, { depth: null }));
    res.status(500).json({ message: err?.message || "Error fetching AI summary" });
  }
};

/** delete AISummary */
export const deleteAISummary = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "id is required" });

    const deleted = await AISummaryModel.findOneAndDelete({ _id: id, userId: new Types.ObjectId(req.user._id) });
    if (!deleted) return res.status(404).json({ message: "AI summary not found" });

    res.status(200).json({ message: "AI summary deleted" });
  } catch (err: any) {
    console.error("deleteAISummary error:", util.inspect(err, { depth: null }));
    res.status(500).json({ message: err?.message || "Error deleting AI summary" });
  }
};
