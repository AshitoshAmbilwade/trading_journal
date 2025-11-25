// src/queue/aiWorker.ts
import "dotenv/config";
import { Worker, Job } from "bullmq";
import { workerOptions } from "../config/redis.js";
import { AISummaryModel } from "../models/AISummary.js";
import { callChat } from "../utils/bytezClient.js";
import { tradeSummaryPrompt, weeklySummaryPrompt } from "../utils/prompts.js";
import mongoose from "mongoose";
import { connectDB } from "../../db.js";
import Bottleneck from "bottleneck";

/**
 * AI Worker
 * - Uses Hugging Face client via src/utils/bytezClient.ts (callChat)
 * - Rate-limits/concurrency via Bottleneck (configurable)
 * - Robust tolerant JSON parsing + fallback persistence
 *
 * Environment variables (new/used):
 * - HF_TRADE_MODEL, HF_WEEKLY_MODEL, HF_MONTHLY_MODEL (model ids or full endpoint URLs)
 * - HF_MAX_CONCURRENCY (default 4)
 * - HF_MIN_TIME_MS (default 50)
 * - HF_TIMEOUT_MS (fallback to client)
 * - AI_QUEUE_THRESHOLD (keeps previous enqueue behavior)
 */

const DEBUG = process.env.DEBUG_HF === "true" || process.env.DEBUG === "true";

// Bottleneck config (tunable)
const MAX_CONCURRENCY = Number(process.env.HF_MAX_CONCURRENCY || 4);
const MIN_TIME_MS = Number(process.env.HF_MIN_TIME_MS || 50);

// Create a single limiter instance to control outgoing LLM traffic from this worker
const limiter = new Bottleneck({
  maxConcurrent: MAX_CONCURRENCY,
  minTime: MIN_TIME_MS,
});

// Helper to run callChat via limiter
async function limitedCallChat(model: string, messages: Array<{ role: string; content: string }>, opts: any) {
  return limiter.schedule(() => callChat(model, messages, opts));
}

/**
 * Robust LLM output extractor + JSON parser:
 * - Accepts raw (string or object)
 * - Extracts candidate text from known shapes (choices/message/content/output)
 * - Extracts largest balanced {...} JSON substring and attempts to parse
 * - Applies tolerant fixes (smart quotes, single quotes, trailing commas, unquoted keys)
 */

function extractTextFromRaw(raw: any): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw.output === "string") return raw.output;
  if (raw.response && typeof raw.response === "string") return raw.response;

  if (Array.isArray(raw.choices) && raw.choices[0]) {
    const ch = raw.choices[0];
    if (ch.message && ch.message.content) return String(ch.message.content);
    if (ch.text) return String(ch.text);
  }

  if (raw.output && typeof raw.output === "object") {
    try {
      return JSON.stringify(raw.output);
    } catch (e) {}
  }
  if (raw.content) return String(raw.content);
  if (raw.result && typeof raw.result === "string") return raw.result;

  try {
    return JSON.stringify(raw);
  } catch {
    return String(raw);
  }
}

function tolerantFixes(candidate: string): string {
  let s = candidate;
  s = s.replace(/[\u2018\u2019\u201C\u201D]/g, '"'); // smart quotes
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  s = s.replace(/,\s*([}\]])/g, "$1");
  s = s.replace(/'([^']*)'/g, (_m, g1) => `"${g1.replace(/"/g, '\\"')}"`);
  s = s.replace(/([,{]\s*)([A-Za-z0-9_\-]+)\s*:/g, (_m, p1, p2) => `${p1}"${p2}":`);
  return s;
}

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
            i = j; // jump forward
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

function parseTolerant(raw: any): any | null {
  try {
    const text = extractTextFromRaw(raw);
    if (!text) return null;

    // quick direct parse
    try {
      const d = JSON.parse(text);
      if (typeof d === "string") {
        try {
          return JSON.parse(d);
        } catch {
          return d;
        }
      }
      return d;
    } catch (e) {}

    // try balanced substring
    const cand = findLargestJsonSubstring(text);
    if (cand) {
      try {
        return JSON.parse(tolerantFixes(cand));
      } catch (e) {
        try {
          return JSON.parse(cand);
        } catch {
          // continue
        }
      }
    }

    // try first '{' to last '}' piece
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      const piece = text.slice(first, last + 1);
      try {
        return JSON.parse(tolerantFixes(piece));
      } catch (e) {
        try {
          return JSON.parse(piece);
        } catch {
          // continue
        }
      }
    }

    // final: if raw was already an object, return it
    if (typeof raw === "object") return raw;
    return null;
  } catch (err) {
    return null;
  }
}

/* ---------------------------- small helper to safely limit logged length ---------------------------- */
function short(s: any, n = 2000) {
  try {
    if (s == null) return String(s);
    const str = typeof s === "string" ? s : JSON.stringify(s);
    return str.length > n ? str.slice(0, n) + `... (truncated ${str.length - n} chars)` : str;
  } catch {
    try {
      return String(s).slice(0, n);
    } catch {
      return "[unable to stringify]";
    }
  }
}

async function ensureDbConnected() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "";
  if (!uri) throw new Error("MONGO_URI or MONGODB_URI not set in environment for worker");
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    console.log("✅ Worker: mongoose already connected");
    return;
  }
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    throw new Error("Failed to connect to MongoDB after connectDB()");
  }
}

export let aiWorker: Worker;

(async () => {
  try {
    await ensureDbConnected();
  } catch (err: any) {
    console.error("❌ Worker: Failed to connect to MongoDB:", err?.message || err);
    process.exit(1);
  }

  aiWorker = new Worker(
    "ai-processing",
    async (job: Job) => {
      const data = job.data || {};
      const { summaryId, type, model, input } = data;
      if (!summaryId || !type) throw new Error("Invalid job payload: missing summaryId or type");

      console.log(`⚙️ Worker: job=${job.id} summaryId=${summaryId} type=${type}`);

      // defensive read
      const aiDoc = await AISummaryModel.findById(summaryId).lean();
      if (!aiDoc) throw new Error(`AISummary ${summaryId} not found`);

      // build messages
      let messages: Array<{ role: string; content: string }> = [];
      if (type === "trade") messages = tradeSummaryPrompt(input);
      else messages = weeklySummaryPrompt(input);

      // model choice fallback: prefer provided model, otherwise env defaults
      const effectiveModel =
        model ||
        (type === "trade"
          ? process.env.HF_TRADE_MODEL || process.env.HF_MODEL || "deepseek/deepseek-r1"
          : process.env.HF_WEEKLY_MODEL || process.env.HF_MODEL || "deepseek/deepseek-r1");

      let rawResponse: any = "";
      try {
        // callChat via limiter
        rawResponse = await limitedCallChat(effectiveModel, messages, {
          temperature: type === "trade" ? 0.3 : 0.2,
          max_tokens: type === "trade" ? 500 : 1200,
          timeoutMs: Number(process.env.HF_TIMEOUT_MS || 120000),
        });

        // Log rawResponse safely (truncated)
        if (DEBUG) {
          console.log(`[HF RAW] summaryId=${summaryId} model=${effectiveModel} rawResponse: ${short(rawResponse, 2000)}`);
        } else {
          // still log small snippet so you can correlate docs
          console.log(`[HF RAW] summaryId=${summaryId} model=${effectiveModel} rawResponse (first200): ${short(rawResponse, 200)}`);
        }

        // Extract plain text for immediate persistence
        const rawText = extractTextFromRaw(rawResponse);
        await AISummaryModel.findByIdAndUpdate(summaryId, {
          $set: { rawResponse: typeof rawText === "string" ? rawText : JSON.stringify(rawText), model: effectiveModel },
        });

        // parse tolerantly
        const parsed = parseTolerant(rawResponse);

        if (parsed) {
          // extracted fields if available
          const summaryText = parsed.summaryText || parsed.summary || parsed.narrative || parsed.text || "";
          const plusPoints = Array.isArray(parsed.plusPoints) ? parsed.plusPoints : parsed.plusPoints ? [parsed.plusPoints] : [];
          const minusPoints = Array.isArray(parsed.minusPoints) ? parsed.minusPoints : parsed.minusPoints ? [parsed.minusPoints] : [];
          const aiSuggestions = Array.isArray(parsed.aiSuggestions) ? parsed.aiSuggestions : parsed.aiSuggestions ? [parsed.aiSuggestions] : [];
          const weeklyStats = parsed.weeklyStats || parsed.stats || parsed.monthlyStats || undefined;

          // Log parsed object (truncated) for debugging / audit
          if (DEBUG) console.log(`[HF PARSED] summaryId=${summaryId} parsed: ${short(parsed, 2000)}`);
          else console.log(`[HF PARSED] summaryId=${summaryId} parsed summaryText (first200): ${short(summaryText, 200)}`);

          await AISummaryModel.findByIdAndUpdate(summaryId, {
            $set: {
              summaryText: summaryText || "",
              plusPoints,
              minusPoints,
              aiSuggestions,
              weeklyStats,
              status: "ready",
              generatedAt: new Date(),
            },
          });

          const fresh = await AISummaryModel.findById(summaryId).lean();

          // Log final stored document (truncated)
          console.log(
            `✅ Worker: completed summaryId=${summaryId} stored summaryText (first200): "${String(fresh?.summaryText || "").slice(0, 200)}"`
          );
          if (DEBUG) console.log(`[HF STORED FULL] summaryId=${summaryId} doc: ${short(fresh, 2000)}`);

        } else {
          // parsing failed — keep rawResponse but mark processing failed-to-parse, do not mark as READY
          await AISummaryModel.findByIdAndUpdate(summaryId, {
            $set: {
              status: "failed_to_parse",
              errorMessage: "Failed to parse LLM output to JSON",
            },
          });
          console.warn(`⚠️ Worker: parsed=null for summaryId=${summaryId} — raw saved to rawResponse`);
          if (DEBUG) console.warn(`[HF RAW ON FAIL] summaryId=${summaryId} rawResponse: ${short(rawResponse, 2000)}`);
        }

        return true;
      } catch (err: any) {
        console.error(`❌ Worker error for summaryId=${summaryId}:`, err?.message || err);

        // attempt to update doc with failure and raw response if available
        try {
          await AISummaryModel.findByIdAndUpdate(summaryId, {
            $set: {
              status: "failed",
              rawResponse: typeof rawResponse === "string" ? rawResponse : JSON.stringify(rawResponse || ""),
              errorMessage: (err?.message || String(err)).slice(0, 1024),
            },
          });
        } catch (upErr) {
          console.error("Failed to update AISummary after worker error:", upErr);
        }

        // Rethrow to allow BullMQ retries/failed handling
        throw err;
      }
    },
    workerOptions
  );

  aiWorker.on("completed", (job) => console.log(`aiWorker: job ${job.id} completed`));
  aiWorker.on("failed", (job, err) => console.error(`aiWorker: job ${job?.id} failed -> ${err?.message || err}`));

  process.on("SIGINT", async () => {
    console.log("aiWorker: shutting down...");
    try {
      await aiWorker.close();
      console.log("aiWorker: closed");
      process.exit(0);
    } catch (e) {
      console.error("aiWorker: error during shutdown", e);
      process.exit(1);
    }
  });

  console.log(
    `🚀 AI Worker running (ai-processing queue) — limiter: maxConcurrent=${MAX_CONCURRENCY} minTimeMs=${MIN_TIME_MS}`
  );
})();
