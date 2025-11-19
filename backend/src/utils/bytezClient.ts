// src/utils/bytezClient.ts
import axios from "axios";

export interface CallChatOptions {
  temperature?: number;
  max_tokens?: number;
  timeoutMs?: number;
  [k: string]: any;
}

const DEFAULT_BASE = "https://api.bytez.com/models/v2";
const DEBUG_BYTEZ = process.env.DEBUG_BYTEZ === "true";

function getBase() {
  return (process.env.BYTEZ_BASE_URL || DEFAULT_BASE).replace(/\/$/, "");
}

export async function listModels(): Promise<any> {
  const BYTEZ_KEY = process.env.BYTEZ_KEY;
  if (!BYTEZ_KEY) throw new Error("BYTEZ_KEY missing");

  const url = `${getBase()}`;
  const res = await axios.get(url, {
    headers: { Authorization: BYTEZ_KEY },
    timeout: 15000,
  });
  return res.data;
}

/** Clean a Bytez string: remove code fences and return inner JSON if present, else cleaned text */
function cleanBytezContent(raw: string): string {
  if (!raw || typeof raw !== "string") return String(raw ?? "");

  let s = raw.trim();

  // Remove leading/trailing triple-backticks or ```json fences
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // Extract the last {...} JSON block if present
  const jsonMatch = s.match(/\{[\s\S]*\}$/);
  if (jsonMatch) {
    return jsonMatch[0].trim();
  }

  // Prefer the first full {...} block if no trailing block
  const firstJsonMatch = s.match(/\{[\s\S]*?\}/);
  if (firstJsonMatch) {
    return firstJsonMatch[0].trim();
  }

  // If nothing JSON-like, return cleaned text
  return s;
}

export async function callChat(
  model: string,
  messages: Array<{ role: string; content: string }>,
  opts: CallChatOptions = {}
): Promise<string> {
  const BYTEZ_KEY = process.env.BYTEZ_KEY;
  if (!BYTEZ_KEY) {
    console.warn("BYTEZ_KEY not found — returning local fallback");
    return getFallbackResponse(messages, model);
  }

  const base = getBase();
  const targetUrl = `${base}/${model}`;

  const payload: any = {
    model,
    messages,
    max_tokens: opts.max_tokens ?? 800,
    temperature: opts.temperature ?? 0.3,
    ...opts,
  };

  async function tryRequest(attempt = 0): Promise<string> {
    const timeout = opts.timeoutMs ?? 120000;
    try {
      const res = await axios.post(targetUrl, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: BYTEZ_KEY,
        },
        timeout,
      });

      const data = res.data;

      // 1) Bytez shape: data.output (object or array) with .content (string)
      if (data && (data.output || data?.result)) {
        const out = data.output ?? data.result;
        const firstOut = Array.isArray(out) ? out[0] : out;
        const content = firstOut?.content ?? firstOut?.text ?? null;
        if (typeof content === "string" && content.trim().length > 0) {
          const cleaned = cleanBytezContent(content);
          if (DEBUG_BYTEZ) {
            try {
              console.log("[Bytez DEBUG] cleaned content (output):", cleaned);
            } catch {}
          }
          return cleaned;
        }
      }

      // 2) OpenAI-like choices (some Bytez endpoints mimic OpenAI)
      if (data?.choices && Array.isArray(data.choices) && data.choices.length > 0) {
        const maybe = data.choices[0]?.message?.content ?? data.choices[0]?.text ?? null;
        if (typeof maybe === "string" && maybe.trim().length > 0) {
          const cleaned = cleanBytezContent(maybe);
          if (DEBUG_BYTEZ) {
            try {
              console.log("[Bytez DEBUG] cleaned content (choices):", cleaned);
            } catch {}
          }
          return cleaned;
        }
      }

      // 3) Alternate output array shape
      if (Array.isArray(data?.output) && data.output.length > 0) {
        const maybe = data.output[0]?.content ?? data.output[0]?.text;
        if (typeof maybe === "string" && maybe.trim().length > 0) {
          const cleaned = cleanBytezContent(maybe);
          if (DEBUG_BYTEZ) {
            try {
              console.log("[Bytez DEBUG] cleaned content (output-array):", cleaned);
            } catch {}
          }
          return cleaned;
        }
      }

      // 4) Top-level string body
      if (typeof data === "string" && data.trim().length > 0) {
        const cleaned = cleanBytezContent(data);
        if (DEBUG_BYTEZ) {
          try {
            console.log("[Bytez DEBUG] cleaned content (top-level):", cleaned);
          } catch {}
        }
        return cleaned;
      }

      // 5) Unrecognized shape — log and throw to trigger retry/fallback
      console.warn("Bytez returned unexpected shape:", { status: res.status, body: data });
      throw new Error("No valid response content from Bytez");
    } catch (err: any) {
      // Log response body if present
      if (err?.response) {
        console.warn(`Bytez API attempt ${attempt + 1} failed with status ${err.response.status}`, err.response.data);
      } else {
        console.warn(`Bytez API attempt ${attempt + 1} failed:`, err?.message || err);
      }

      if (attempt < 2) {
        const backoff = 500 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, backoff));
        return tryRequest(attempt + 1);
      }

      throw err;
    }
  }

  try {
    return await tryRequest(0);
  } catch (e: any) {
    console.error("All Bytez attempts failed for model:", model, e?.response?.data || e?.message || e);
    // Final fallback: return local fallback JSON so your app still works
    return getFallbackResponse(messages, model);
  }
}

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

export default { callChat, listModels };
