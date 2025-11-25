// src/utils/bytezClient.ts
import axios, { AxiosResponse } from "axios";

export interface CallChatOptions {
  temperature?: number;
  max_tokens?: number;
  timeoutMs?: number;
  // provider specific options
  [k: string]: any;
}

/**
 * bytezClient.ts
 * - Production-ready Hugging Face helper that supports:
 *   1) Router chat completions (POST <base>/v1/chat/completions with { model, messages })
 *   2) Legacy model endpoints (POST <base>/models/<owner>/<model> with inputs/parameters)
 * - Retries, backoff, robust logging, and safe fallback.
 */

const DEFAULT_ROUTER_BASE_V1 = "https://router.huggingface.co/v1";
const DEFAULT_ROUTER_BASE = "https://router.huggingface.co/models";
const LEGACY_INFERENCE_BASE = "https://api-inference.huggingface.co/models";
const DEBUG_HF = process.env.DEBUG_HF === "true" || process.env.DEBUG === "true";

function getAuthToken(): string | null {
  // Accept either HF_API_KEY or HF_TOKEN env var for compatibility
  return process.env.HF_API_KEY || process.env.HF_TOKEN || null;
}

function getBaseFromEnv(): string {
  const env = (process.env.HF_BASE_URL || "").trim();
  if (!env) return DEFAULT_ROUTER_BASE;
  return env.replace(/\/$/, "");
}

/** Convert messages array -> single prompt string (legacy) */
function messagesToPrompt(messages: Array<{ role: string; content: string }>): string {
  return messages
    .map((m) => {
      const role = (m.role || "user").toLowerCase();
      const label = role === "system" ? "System" : role === "assistant" ? "Assistant" : "User";
      return `${label}: ${m.content.trim()}`;
    })
    .join("\n\n");
}

/** Extract/clean JSON-like content from HF output */
function cleanHfContent(raw: string): string {
  if (!raw || typeof raw !== "string") return String(raw ?? "");
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const trailingJson = s.match(/\{[\s\S]*\}$/);
  if (trailingJson) return trailingJson[0].trim();
  const firstJson = s.match(/\{[\s\S]*?\}/);
  if (firstJson) return firstJson[0].trim();
  return s;
}

/** Local fallback response so app remains usable offline */
function getFallbackResponse(messages: any[], model: string): string {
  const userMessage = messages.find((m) => m.role === "user")?.content || "";
  if (/trade/i.test(userMessage)) {
    return JSON.stringify({
      summaryText: "Trade analysis (fallback).",
      plusPoints: ["Trade recorded", "Position size okay"],
      minusPoints: ["Detailed AI analysis unavailable"],
      aiSuggestions: ["Review trade logs manually"],
      score: 6,
    });
  }
  if (/weekly/i.test(userMessage)) {
    return JSON.stringify({
      summaryText: "Weekly summary (fallback).",
      plusPoints: ["Trades recorded", "Win/lose patterns visible"],
      minusPoints: ["AI offline"],
      aiSuggestions: ["Inspect losing trades"],
    });
  }
  return JSON.stringify({
    summaryText: "Fallback analysis.",
    plusPoints: ["Basic analysis"],
    minusPoints: ["AI features limited"],
    aiSuggestions: ["Try again later"],
  });
}

/** Build target URL for legacy model endpoint */
function buildLegacyModelUrl(base: string, model: string) {
  // model may be 'owner/model[:revision]' or full URL; encode segments
  if (/^https?:\/\//i.test(model)) return model.replace(/\/$/, "");
  const encoded = model.split("/").map((p) => encodeURIComponent(p)).join("/");
  return `${base.replace(/\/$/, "")}/${encoded}`;
}

/** Build router chat completions URL */
function buildRouterChatUrl(base: string) {
  // base may already include /v1
  if (base.endsWith("/v1")) return `${base.replace(/\/$/, "")}/chat/completions`;
  // if base is the older /models router, use v1 chat path on official host
  if (base.includes("router.huggingface.co")) return `${DEFAULT_ROUTER_BASE_V1.replace(/\/$/, "")}/chat/completions`;
  // fall back to base + /v1/chat/completions
  return `${base.replace(/\/$/, "")}/v1/chat/completions`;
}

/**
 * callChat: main exported function.
 *
 * Behavior:
 * - If HF_BASE_URL includes '/v1' or we detect chat preference, try chat completions first (POST to /v1/chat/completions with {model, messages}).
 * - Otherwise try legacy model endpoints (/models/<model> with { inputs, parameters }).
 * - Try multiple bases in sequence (env base, router v1, legacy inference) with retries/backoff.
 */
export async function callChat(
  model: string,
  messages: Array<{ role: string; content: string }>,
  opts: CallChatOptions = {}
): Promise<string> {
  const HF_TOKEN = getAuthToken();
  if (!HF_TOKEN) {
    console.warn("HF token not found — returning local fallback");
    return getFallbackResponse(messages, model);
  }

  // Candidate bases in order of preference
  const envBase = getBaseFromEnv();
  // Normalize candidate bases; avoid duplicates
  const candidateBases = Array.from(
    new Set<string>([
      envBase,
      // For chat v1 we will compute chat URL separately; but include both router variants for legacy attempts
      DEFAULT_ROUTER_BASE_V1.replace(/\/$/, ""),
      DEFAULT_ROUTER_BASE.replace(/\/$/, ""),
      LEGACY_INFERENCE_BASE.replace(/\/$/, ""),
    ])
  );

  const isModelUrl = /^https?:\/\//i.test(model);
  const preferChat = envBase.includes("/v1") || envBase.includes("/chat") || envBase.includes("/v1/");

  // what to send for legacy endpoints (string input)
  const legacyPrompt = messagesToPrompt(messages);
  const maxNewTokens = opts.max_tokens ?? 800;
  const temperature = opts.temperature ?? 0.3;
  const timeoutMs = opts.timeoutMs ?? Number(process.env.HF_TIMEOUT_MS || 120000);

  // Try loop with bases + retries
  async function tryRequest(attempt = 0): Promise<string> {
    let lastErr: any = null;

    // If preferChat or model is not a simple owner/model we try chat-style first for each base
    const baseCandidates = candidateBases;

    for (const base of baseCandidates) {
      // 1) If base (envBase) looks like v1 router or we prefer chat, attempt chat completions path
      const chatUrl = buildRouterChatUrl(base);

      // Build chat request body: use messages directly (chat API)
      const chatBody = {
        model,
        messages: messages.map((m) => ({ role: m.role || "user", content: m.content })),
        temperature,
        max_tokens: maxNewTokens,
        ...((opts.parameters && { parameters: opts.parameters }) || {}),
      };

      // Prefer chat attempt if base seems router/v1 or if preferChat flag true
      try {
        if (preferChat || base.includes("router.huggingface.co") || base.includes("/v1")) {
          if (DEBUG_HF) console.log("[HF DEBUG] Trying chat completions URL:", chatUrl, { model, base });
          const res: AxiosResponse = await axios.post(chatUrl, chatBody, {
            headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
            timeout: timeoutMs,
          });

          if (DEBUG_HF) console.log("[HF DEBUG] chat completions status:", res.status);
          const data = res.data;
          // Chat completions shape: { id, choices: [{ message: { content } , ...}] }
          const choiceText =
            data?.choices?.[0]?.message?.content ??
            data?.choices?.[0]?.message ??
            data?.choices?.[0]?.text ??
            (typeof data === "string" ? data : null);

          if (choiceText && typeof choiceText === "string" && choiceText.trim().length > 0) {
            const cleaned = cleanHfContent(choiceText);
            if (DEBUG_HF) console.log("[HF DEBUG] cleaned chat response:", cleaned);
            return cleaned;
          }

          // If shape unexpected, continue to legacy attempts
          if (DEBUG_HF) console.warn("[HF DEBUG] chat completions returned unexpected shape", { data, chatUrl });
        }
      } catch (err: any) {
        lastErr = err;
        const status = err?.response?.status;
        if (err?.response) {
          if (DEBUG_HF)
            console.warn("[HF WARN] chat request failed", {
              url: buildRouterChatUrl(base),
              status,
              body: err.response.data,
              base,
              model,
            });
          // If 410 (old endpoint warning) or 404, continue to legacy attempts or next base
          if (status === 410 || status === 404) {
            // proceed to legacy attempt for same base
          } else {
            // for other statuses, allow next base to try
          }
        } else {
          if (DEBUG_HF) console.warn("[HF WARN] chat request network/error", { err: err?.message || err, base, model });
        }
      }

      // 2) Legacy model endpoint attempt for this base (/models/<model>)
      try {
        const targetUrl = isModelUrl ? model : buildLegacyModelUrl(base, model);
        if (DEBUG_HF) console.log("[HF DEBUG] Trying legacy model URL:", targetUrl, { base, model });
        const legacyPayload = {
          inputs: legacyPrompt,
          parameters: {
            max_new_tokens: maxNewTokens,
            temperature,
            ...(opts.parameters || {}),
          },
          options: { wait_for_model: true, ...(opts.options || {}) },
        };

        const res: AxiosResponse = await axios.post(targetUrl, legacyPayload, {
          headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
          timeout: timeoutMs,
        });

        const data = res.data;
        // Many legacy endpoints return array with generated_text or object with generated_text
        if (Array.isArray(data) && data.length > 0) {
          const entry = data[0];
          const maybeText = entry.generated_text ?? entry.text ?? (typeof entry === "string" ? entry : null);
          if (typeof maybeText === "string" && maybeText.trim().length > 0) {
            const cleaned = cleanHfContent(maybeText);
            if (DEBUG_HF) console.log("[HF DEBUG] cleaned legacy (array):", cleaned);
            return cleaned;
          }
        }
        if (data && typeof data === "object") {
          const maybe = data.generated_text ?? data.output?.[0]?.generated_text ?? data.output?.[0]?.text ?? data.text ?? null;
          if (typeof maybe === "string" && maybe.trim().length > 0) {
            const cleaned = cleanHfContent(maybe);
            if (DEBUG_HF) console.log("[HF DEBUG] cleaned legacy (object):", cleaned);
            return cleaned;
          }
        }
        if (typeof data === "string" && data.trim().length > 0) {
          const cleaned = cleanHfContent(data);
          if (DEBUG_HF) console.log("[HF DEBUG] cleaned legacy (string):", cleaned);
          return cleaned;
        }

        if (DEBUG_HF) console.warn("[HF DEBUG] legacy endpoint returned unexpected shape", { data, targetUrl });
        lastErr = new Error("No usable content from legacy endpoint");
      } catch (err: any) {
        lastErr = err;
        if (err?.response) {
          const status = err.response.status;
          if (DEBUG_HF)
            console.warn("[HF WARN] legacy request failed", {
              url: isModelUrl ? model : buildLegacyModelUrl(base, model),
              status,
              body: err.response.data,
              base,
              model,
            });
          // if 404/410 try next base; otherwise continue
        } else {
          if (DEBUG_HF) console.warn("[HF WARN] legacy request network/error", { err: err?.message || err, base, model });
        }
        // continue to next base
      }
    } // end for baseCandidates

    // none of bases gave a usable result
    if (attempt < 2) {
      const backoff = 500 * Math.pow(2, attempt);
      if (DEBUG_HF) console.log(`[HF DEBUG] retrying all bases after ${backoff}ms (attempt ${attempt + 1})`);
      await new Promise((r) => setTimeout(r, backoff));
      return tryRequest(attempt + 1);
    }

    throw lastErr || new Error("Hugging Face calls failed for all bases");
  } // tryRequest

  try {
    return await tryRequest(0);
  } catch (e: any) {
    // Final log and fallback
    console.error("All Hugging Face attempts failed for model:", model, {
      HF_BASE_URL: getBaseFromEnv(),
      error: e?.response?.data ?? e?.message ?? String(e),
    });
    return getFallbackResponse(messages, model);
  }
}

export async function listModels(): Promise<any> {
  const HF_TOKEN = getAuthToken();
  if (!HF_TOKEN) throw new Error("HF token missing (HF_API_KEY or HF_TOKEN)");
  const base = getBaseFromEnv();
  // try router v1 chat URL root or models root
  try {
    const url = base.includes("/v1") ? base : DEFAULT_ROUTER_BASE.replace(/\/$/, "");
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${HF_TOKEN}` },
      timeout: Number(process.env.HF_TIMEOUT_MS || 15000),
    });
    return res.data;
  } catch (err) {
    // fallback try legacy inference base
    try {
      const res = await axios.get(LEGACY_INFERENCE_BASE, {
        headers: { Authorization: `Bearer ${HF_TOKEN}` },
        timeout: Number(process.env.HF_TIMEOUT_MS || 15000),
      });
      return res.data;
    } catch (e: any) {
      throw new Error("Failed to list HF models: " + ((e as Error)?.message || String(e)));
    }
  }
}

export default { callChat, listModels };
