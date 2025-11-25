// src/utils/prompts.ts
// Prompts for AI summaries. These prompts explicitly require Indian Rupees (INR) and the rupee symbol '₹'.
// They also demand valid JSON only (no markdown fences, no extra commentary) and include a few helpful constraints
// (date format, numeric types) to improve parsing reliability.

function commonSystemCurrencyNote(roleLabel = "system") {
  return {
    role: roleLabel,
    content:
      "IMPORTANT: Always present monetary values in Indian Rupees (INR) using the rupee symbol '₹' (for example: ₹1,150). Do NOT use '$' or other currency symbols. When returning JSON, return valid JSON only (no markdown fences, no extra text). Use ISO 8601 date strings for dates (e.g. 2025-11-21T18:01:00Z) when including dates in JSON."
  };
}

export function tradeSummaryPrompt(trade: any) {
  const snapshot = JSON.stringify(trade, null, 2);

  return [
    commonSystemCurrencyNote("system"),
    {
      role: "system",
      content: `You are a professional trading analyst. Analyze the trade and return ONLY valid JSON without any additional text.

REQUIRED JSON FORMAT:
{
  "summaryText": "string (2-3 sentences summarizing the trade)",
  "plusPoints": ["string", "string", "string"],
  "minusPoints": ["string", "string", "string"], 
  "aiSuggestions": ["string", "string", "string"],
  "score": number,             // 1-10 integer
  "tags": ["string", "string"]
}

RULES:
- "score" must be integer 1-10 (1 poor — 10 excellent) based on trade quality.
- Monetary values (if mentioned) must use the rupee symbol '₹' and be formatted as integers or comma-separated (e.g. '₹1,150'). Do NOT use '$'.
- Give specific, actionable feedback focusing on entry/exit timing, position sizing, risk management, and emotional control.
- If you include any date fields inside the JSON, use ISO 8601 format (UTC).
- Return ONLY the JSON object, no additional text.`
    },
    {
      role: "user",
      content: `Analyze this trade and return JSON analysis (use ₹ for money values):

${snapshot}`
    }
  ];
}

export function weeklySummaryPrompt(aggregate: any) {
  const stats = JSON.stringify(aggregate, null, 2);

  return [
    commonSystemCurrencyNote("system"),
    {
      role: "system",
      content: `You are a trading performance coach. Analyze the weekly trading data and return ONLY valid JSON.

REQUIRED JSON FORMAT:
{
  "summaryText": "string (concise weekly summary)",
  "plusPoints": ["string", "string", "string"],
  "minusPoints": ["string", "string", "string"],
  "aiSuggestions": ["string", "string", "string"],
  "weeklyStats": {
    "totalTrades": number,
    "winningTrades": number,
    "losingTrades": number,
    "winRatePct": number,
    "totalPnL": number,            // in INR (plain number)
    "totalPnLDisplay": "string",   // formatted with ₹ symbol, e.g. "₹1,150"
    "avgPnLPerTrade": number,
    "bestTrade": { "symbol": "string", "pnl": number, "pnlDisplay": "string", "date": "string" },
    "worstTrade": { "symbol": "string", "pnl": number, "pnlDisplay": "string", "date": "string" },
    "strategiesUsed": ["string"],
    "dominantIssues": ["string"]
  },
  "narrative": "string (detailed performance analysis)"
}

RULES:
- Be objective and data-driven.
- Numbers in the nested weeklyStats must be numeric types (not strings) except the explicit *Display* fields (pnlDisplay / totalPnLDisplay) which must use '₹'.
- When you convert numeric PnL to display strings use the rupee symbol (e.g. \"₹1,150\"). Ensure consistency: numeric fields hold raw values (e.g. 1150), *Display fields* hold formatted strings with '₹'.
- Identify recurring patterns, root causes and provide concrete next-step actions.
- Return ONLY the JSON object, no extra commentary.`
    },
    {
      role: "user",
      content: `Analyze this weekly trading data and return JSON analysis (use ₹ for all money display fields):

${stats}`
    }
  ];
}
