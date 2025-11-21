// src/queue/aiWorker.ts
import "dotenv/config";
import { Worker, Job } from "bullmq";
import { workerOptions } from "../config/redis.js";
import { AISummaryModel } from "../models/AISummary.js";
import { callChat } from "../utils/bytezClient.js";
import { tradeSummaryPrompt, weeklySummaryPrompt } from "../utils/prompts.js";
import mongoose from "mongoose";
import { connectDB } from "../../db.js"; // adjust if path differs

// tolerantParse - robust JSON extraction from noisy LLM output
function tolerantParse(raw: string, fallback: any = null) {
  try {
    if (!raw) return fallback;
    let text = String(raw).trim();

    // remove fenced code blocks
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    // try to find the last JSON object in the text
    const lastJsonMatch = text.match(/\{[\s\S]*\}$/);
    if (lastJsonMatch) text = lastJsonMatch[0];
    else {
      const firstJsonMatch = text.match(/\{[\s\S]*?\}/);
      if (firstJsonMatch) text = firstJsonMatch[0];
    }

    // normalize smart quotes to straight quotes
    text = text.replace(/[\u2018\u2019\u201C\u201D]/g, '"');

    // convert single-quoted values to double quotes (best-effort)
    text = text.replace(/'([^']*)'/g, (_m, g1) => {
      if (/\w'\w/.test(_m)) return `"${g1}"`;
      return `"${g1}"`;
    });

    // add quotes to unquoted object keys
    text = text.replace(/([,{]\s*)([A-Za-z0-9_\-]+)\s*:/g, (_m, p1, p2) => `${p1}"${p2}":`);

    // remove trailing commas
    text = text.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");

    return JSON.parse(text);
  } catch (err) {
    return fallback;
  }
}

async function ensureDbConnected() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "";
  if (!uri) {
    throw new Error(
      "MONGO_URI or MONGODB_URI not set in environment for worker. Set MONGO_URI in .env or export it before running the worker."
    );
  }

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    console.log("✅ Worker: mongoose already connected");
    return;
  }

  await connectDB();

  if (mongoose.connection.readyState !== 1) {
    throw new Error("Failed to connect to MongoDB (mongoose.readyState !== 1) after connectDB()");
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

      if (!summaryId || !type) {
        throw new Error("Invalid job payload: missing summaryId or type");
      }

      console.log(`⚙️ Worker: processing job id=${job.id} summaryId=${summaryId} type=${type}`);

      // load draft (defensive)
      const aiDoc = await AISummaryModel.findById(summaryId).lean();
      if (!aiDoc) {
        throw new Error(`AISummary ${summaryId} not found`);
      }

      // build messages for LLM
      let messages: Array<{ role: string; content: string }> = [];
      if (type === "trade") {
        messages = tradeSummaryPrompt(input);
      } else if (type === "weekly" || type === "monthly") {
        messages = weeklySummaryPrompt(input);
      } else {
        throw new Error(`Unsupported job type: ${type}`);
      }

      let rawResponse: any = "";
      try {
        rawResponse = await callChat(model, messages, {
          temperature: type === "trade" ? 0.3 : 0.2,
          max_tokens: type === "trade" ? 500 : 1200,
          timeoutMs: 120000,
        });

        // Normalize raw to string for parsing and storage
        const rawStr = typeof rawResponse === "string" ? rawResponse : JSON.stringify(rawResponse);

        // Debug: show small prefix of rawStr (helps trace)
        const rawPreview = rawStr.length > 400 ? rawStr.slice(0, 400) + "...[truncated]" : rawStr;
        console.debug(`Worker debug: rawResponse typeof=${typeof rawResponse}, rawStr length=${rawStr.length}`);
        console.debug(`Worker debug: rawResponse preview: ${rawPreview}`);

        // Parse the string result
        const parsed = tolerantParse(rawStr, null);
        console.debug("Worker debug: parsed (trimmed) =", parsed ? JSON.stringify(parsed).slice(0, 400) + (JSON.stringify(parsed).length > 400 ? "...[truncated]" : "") : "null");

        const final = parsed || {
          summaryText: type === "trade" ? "Trade analysis (fallback)." : "Summary (fallback).",
          plusPoints: [],
          minusPoints: [],
          aiSuggestions: [],
          weeklyStats: parsed?.weeklyStats || input,
        };

        // Log final.summaryText before persistence
        console.debug("Worker debug: final.summaryText (first 200 chars) =", (final.summaryText || "").slice(0, 200));

        // Step 1: always persist rawResponse + status (so DB always has raw output)
        await AISummaryModel.findByIdAndUpdate(summaryId, {
          $set: {
            rawResponse: rawStr,
            model,
            status: "processing", // temporary status before parsed fields set
          },
          // do not remove other fields
        });

        // Step 2: if parsed exists, persist parsed fields; else persist fallback text
        // This split guarantees rawResponse is stored even if subsequent update fails
        const updatePayload: any = {
          summaryText: final.summaryText || "",
          plusPoints: Array.isArray(final.plusPoints) ? final.plusPoints : [],
          minusPoints: Array.isArray(final.minusPoints) ? final.minusPoints : [],
          aiSuggestions: Array.isArray(final.aiSuggestions) ? final.aiSuggestions : [],
          weeklyStats: final.weeklyStats || undefined,
          status: "ready",
          generatedAt: new Date(),
        };

        await AISummaryModel.findByIdAndUpdate(summaryId, { $set: updatePayload });

        // Read back freshly-updated doc to verify
        const fresh = await AISummaryModel.findById(summaryId).lean();
        if (fresh) {
          const storedSummaryText = String(fresh.summaryText || "");
          const storedPlusLen = Array.isArray(fresh.plusPoints) ? fresh.plusPoints.length : 0;
          const storedRawPreview = String(fresh.rawResponse || "").slice(0, 200) + (String(fresh.rawResponse || "").length > 200 ? "...[truncated]" : "");

          console.log(
            `✅ Worker: completed job summaryId=${summaryId} -> storedSummaryText (first100): "${storedSummaryText.slice(
              0,
              100
            )}" plusPoints=${storedPlusLen} rawPreview="${storedRawPreview}"`
          );
        } else {
          console.warn("Worker warning: could not read back AISummary after update:", summaryId);
        }

        return true;
      } catch (err: any) {
        console.error(`❌ Worker error for summaryId=${summaryId}:`, err?.message || err);

        try {
          await AISummaryModel.findByIdAndUpdate(summaryId, {
            $set: {
              status: "failed",
              rawResponse: typeof rawResponse === "string" ? rawResponse : JSON.stringify(rawResponse || ""),
              summaryText: "AI generation failed.",
              errorMessage: (err?.message || String(err)).slice(0, 1024),
            },
          });
        } catch (updateErr) {
          console.error("Failed to update AISummary on worker error:", updateErr);
        }

        throw err;
      }
    },
    workerOptions
  );

  aiWorker.on("completed", (job) => {
    console.log(`aiWorker: job ${job.id} completed`);
  });

  aiWorker.on("failed", (job, err) => {
    console.error(`aiWorker: job ${job?.id} failed -> ${err?.message || err}`);
  });

  const shutdown = async () => {
    console.log("aiWorker: shutting down...");
    try {
      await aiWorker.close();
      console.log("aiWorker: closed");
      process.exit(0);
    } catch (e) {
      console.error("aiWorker: error during shutdown", e);
      process.exit(1);
    }
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  console.log("🚀 AI Worker running (ai-processing queue)");
})();
