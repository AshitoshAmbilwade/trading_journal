// src/utils/aggregateTrades.ts
export type Trade = {
  _id?: string;
  date?: string; // ISO date for trade (entry or exit)
  exitDate?: string;
  pnl: number; // positive or negative
};

export function aggregateTradesToDailyPnL(trades: Trade[]) {
  const map: Record<string, number> = {};
  for (const t of trades) {
    const d = t.exitDate ?? t.date;
    if (!d) continue;
    const day = new Date(d);
    if (isNaN(day.getTime())) continue;
    const key = `${day.getFullYear()}-${(day.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${day.getDate().toString().padStart(2, "0")}`;
    map[key] = (map[key] ?? 0) + (t.pnl ?? 0);
  }
  return map;
}
