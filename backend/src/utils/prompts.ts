// src/utils/prompts.ts
export function tradeSummaryPrompt(trade: any) {
  const snapshot = JSON.stringify(trade, null, 2);

  return [
    {
      role: "system",
      content: `You are a professional trading analyst. Analyze the trade and return ONLY valid JSON without any additional text.

REQUIRED JSON FORMAT:
{
  "summaryText": "string (2-3 sentences summarizing the trade)",
  "plusPoints": ["string", "string", "string"],
  "minusPoints": ["string", "string", "string"], 
  "aiSuggestions": ["string", "string", "string"],
  "score": number,
  "tags": ["string", "string"]
}

RULES:
- "score" must be 1-10 based on trade quality
- Use specific, actionable feedback
- Focus on entry/exit timing, risk management, emotional control
- Return ONLY the JSON object, no other text`
    },
    {
      role: "user",
      content: `Analyze this trade and return JSON analysis:

${snapshot}`
    }
  ];
}

export function weeklySummaryPrompt(aggregate: any) {
  const stats = JSON.stringify(aggregate, null, 2);

  return [
    {
      role: "system",
      content: `You are a trading performance coach. Analyze the weekly trading data and return ONLY valid JSON.

REQUIRED JSON FORMAT:
{
  "summaryText": "string (comprehensive weekly summary)",
  "plusPoints": ["string", "string", "string"],
  "minusPoints": ["string", "string", "string"],
  "aiSuggestions": ["string", "string", "string"],
  "weeklyStats": {
    "totalTrades": number,
    "winningTrades": number,
    "losingTrades": number,
    "winRatePct": number,
    "totalPnL": number,
    "avgPnLPerTrade": number,
    "bestTrade": { "symbol": "string", "pnl": number, "date": "string" },
    "worstTrade": { "symbol": "string", "pnl": number, "date": "string" },
    "strategiesUsed": ["string"],
    "dominantIssues": ["string"]
  },
  "narrative": "string (detailed performance analysis)"
}

RULES:
- Be objective and data-driven
- Identify patterns and recurring issues
- Provide actionable improvement suggestions
- Return ONLY the JSON object, no other text`
    },
    {
      role: "user",
      content: `Analyze this weekly trading data and return JSON analysis:

${stats}`
    }
  ];
}