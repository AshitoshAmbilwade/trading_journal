// src/utils/prompts.ts
// Prompts for AI summaries. These prompts explicitly require Indian Rupees (INR) and the rupee symbol '₹'.
// They also require valid JSON only (no markdown fences, no extra commentary) and include constraints
// to improve parsing reliability (date format, numeric types).

function commonSystemCurrencyNote(roleLabel = "system") {
  return {
    role: roleLabel,
    content:
      "IMPORTANT: Always present monetary values in Indian Rupees (INR) using the rupee symbol '₹' (for example: ₹1,150). Do NOT use '$' or other currency symbols. When returning JSON, return valid JSON only (no markdown fences, no extra text). Use ISO 8601 date strings for dates (e.g. 2025-11-21T18:01:00Z) when including dates in JSON. Respond ONLY with a single JSON object — no surrounding text.",
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
- Monetary values (if mentioned) must use the rupee symbol '₹' and be formatted (e.g. '₹1,150').
- Give specific, actionable feedback focusing on entry/exit timing, position sizing, risk management, and emotional control.
- If you include any date fields inside the JSON, use ISO 8601 format (UTC).
- Return ONLY the JSON object, no additional text.`,
    },
    {
      role: "user",
      content: `Analyze this trade and return JSON analysis (use ₹ for money values):

${snapshot}`,
    },
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
  "summaryText": "string (concise weekly summary - 2-3 sentences)",
  "plusPoints": ["string", "string", "string"],
  "minusPoints": ["string", "string", "string"],
  "aiSuggestions": ["string", "string", "string"],
  "weeklyStats": {
    "totalTrades": number,
    "winningTrades": number,
    "losingTrades": number,
    "winRatePct": number,
    "totalPnL": number,            // raw number in INR (e.g. 1150)
    "totalPnLDisplay": "string",   // formatted with ₹ symbol, e.g. "₹1,150"
    "avgPnLPerTrade": number,
    "bestTrade": { "symbol": "string", "pnl": number, "pnlDisplay": "string", "date": "string" },
    "worstTrade": { "symbol": "string", "pnl": number, "pnlDisplay": "string", "date": "string" },
    "strategiesUsed": ["string"],
    "dominantIssues": ["string"]
  },
  "narrative": "string (detailed performance analysis, 2-4 paragraphs max)"
}

RULES:
- Be objective and data-driven. Use the weeklyStats object for numeric/stat fields.
- numeric fields must be numbers (not strings) except explicit Display fields which should contain the rupee symbol.
- Include a 'narrative' field for a paragraph-level explanation that may be shown verbatim to users.
- Return ONLY the JSON object, no extra commentary.`,
    },
    {
      role: "user",
      content: `Analyze this weekly trading data and return JSON analysis (use ₹ for all money display fields):

${stats}`,
    },
  ];
}

export function monthlySummaryPrompt(aggregate: any) {
  const stats = JSON.stringify(aggregate, null, 2);

  return [
    commonSystemCurrencyNote("system"),
    {
      role: "system",
      content: `You are a senior trading analyst producing a MONTHLY performance report. Return ONLY valid JSON — no markdown fences, no commentary.

REQUIRED JSON FORMAT (monthly):
{
  "summaryText": "string (concise monthly summary — 2-3 sentences)",
  "plusPoints": ["string", "string", "string"],
  "minusPoints": ["string", "string", "string"],
  "aiSuggestions": ["string", "string", "string"],
  "monthlyStats": {
    "totalTrades": number,
    "winningTrades": number,
    "losingTrades": number,
    "winRatePct": number,
    "totalPnL": number,
    "totalPnLDisplay": "string",
    "avgPnLPerTrade": number,
    "bestTrade": { "symbol": "string", "pnl": number, "pnlDisplay": "string", "date": "string" },
    "worstTrade": { "symbol": "string", "pnl": number, "pnlDisplay": "string", "date": "string" },
    "strategiesUsed": ["string"],
    "dominantIssues": ["string"]
  },
  "narrative": "string (detailed analysis and recommended next steps; customer-facing paragraph)"
}

RULES:
- For monthly output use the 'monthlyStats' object (NOT weeklyStats) to avoid ambiguity.
- Keep numeric fields as numbers; Display fields must include '₹' and be formatted.
- The 'narrative' field should be user-facing (1-3 paragraphs) and may include examples (symbols, dates).
- Return ONLY the JSON object.`,
    },
    {
      role: "user",
      content: `Analyze this monthly trading data and return JSON analysis (use ₹ for money display fields):

${stats}`,
    },
  ];
}
