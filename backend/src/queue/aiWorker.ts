// src/queue/aiWorker.ts
import "dotenv/config";
import { Worker, Job } from "bullmq";
import { workerOptions } from "../config/redis.js";
import { AISummaryModel } from "../models/AISummary.js";
import { callChat } from "../utils/bytezClient.js";
import { tradeSummaryPrompt, weeklySummaryPrompt } from "../utils/prompts.js";
import mongoose from "mongoose";
import { connectDB } from "../../db.js";

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
  // Common model wrappers
  if (raw.output && typeof raw.output === "string") return raw.output;
  // openai-like
  if (Array.isArray(raw.choices) && raw.choices[0]) {
    const ch = raw.choices[0];
    if (ch.message && ch.message.content) return String(ch.message.content);
    if (ch.text) return String(ch.text);
  }
  // some SDKs wrap in .content or .result
  if (raw.content) return String(raw.content);
  if (raw.result && typeof raw.result === "string") return raw.result;
  // fallback to JSON string
  return JSON.stringify(raw);
}

function tolerantFixes(candidate: string): string {
  let s = candidate;
  s = s.replace(/[\u2018\u2019\u201C\u201D]/g, '"'); // smart quotes
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  // remove trailing commas like ,}
  s = s.replace(/,\s*([}\]])/g, "$1");
  // single quotes around strings -> double
  s = s.replace(/'([^']*)'/g, (_m, g1) => `"${g1.replace(/"/g, '\\"')}"`);
  // add quotes to unquoted keys (best-effort)
  s = s.replace(/([,{]\s*)([A-Za-z0-9_\-]+)\s*:/g, (_m, p1, p2) => `${p1}"${p2}":`);
  return s;
}

/**
 * Find balanced JSON objects in a text and return the largest candidate.
 * Returns null if none.
 */
function findLargestJsonSubstring(text: string): string | null {
  const chunks: string[] = [];
  const n = text.length;
  for (let i = 0; i < n; i++) {
    if (text[i] === "{") {
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
  }
  if (chunks.length === 0) return null;
  // return largest chunk (most likely the real JSON object)
  chunks.sort((a, b) => b.length - a.length);
  return chunks[0];
}

function parseTolerant(raw: any): any | null {
  try {
    const text = extractTextFromRaw(raw);
    // quick direct parse
    try {
      return JSON.parse(text);
    } catch (e) {}
    // try balanced substring
    const cand = findLargestJsonSubstring(text);
    if (cand) {
      const fixed = tolerantFixes(cand);
      try {
        return JSON.parse(fixed);
      } catch (e) {
        // last attempt: try more fixes (already applied above)
        try {
          return JSON.parse(cand);
        } catch (err) {
          return null;
        }
      }
    }
    // final: try to parse raw as object if it already was an object
    if (typeof raw === "object") return raw;
    return null;
  } catch (err) {
    return null;
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

      let rawResponse: any = "";
      try {
        rawResponse = await callChat(model, messages, {
          temperature: type === "trade" ? 0.3 : 0.2,
          max_tokens: type === "trade" ? 500 : 1200,
          timeoutMs: 120000,
        });

        const rawText = extractTextFromRaw(rawResponse);
        // persist raw immediately so we always have the LLM output
        await AISummaryModel.findByIdAndUpdate(summaryId, {
          $set: { rawResponse: typeof rawText === "string" ? rawText : JSON.stringify(rawText), model },
        });

        // parse tolerantly
        const parsed = parseTolerant(rawResponse);

        if (parsed) {
          // extracted fields if available
          const summaryText = parsed.summaryText || parsed.summary || parsed.narrative || parsed.text || "";
          const plusPoints = Array.isArray(parsed.plusPoints) ? parsed.plusPoints : parsed.plusPoints ? [parsed.plusPoints] : [];
          const minusPoints = Array.isArray(parsed.minusPoints) ? parsed.minusPoints : parsed.minusPoints ? [parsed.minusPoints] : [];
          const aiSuggestions = Array.isArray(parsed.aiSuggestions) ? parsed.aiSuggestions : parsed.aiSuggestions ? [parsed.aiSuggestions] : [];
          const weeklyStats = parsed.weeklyStats || parsed.stats || undefined;

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
          console.log(`✅ Worker: completed summaryId=${summaryId} stored summaryText (first100): "${String(fresh?.summaryText || "").slice(0, 100)}"`);
        } else {
          // parsing failed — keep rawResponse but mark processing failed-to-parse, do not mark as READY
          await AISummaryModel.findByIdAndUpdate(summaryId, {
            $set: {
              status: "failed_to_parse",
              // keep rawResponse already set
              errorMessage: "Failed to parse LLM output to JSON",
            },
          });
          console.warn(`⚠️ Worker: parsed=null for summaryId=${summaryId} — raw saved to rawResponse`);
        }

        return true;
      } catch (err: any) {
        console.error(`❌ Worker error for summaryId=${summaryId}:`, err?.message || err);
        // attempt to update doc with failure
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

  console.log("🚀 AI Worker running (ai-processing queue)");
})();
