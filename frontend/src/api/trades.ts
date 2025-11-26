import { fetchApi } from "../utils/apiHandler";

export interface Trade {
  pnl: string;
  _id?: string;
  userId?: string;
  symbol: string;
  type: "Buy" | "Sell";
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  session?: "morning" | "mid" | "last";
  segment?: "equity" | "future" | "forex" | "option" | "commodity" | "currency" | "crypto";
  tradeType?: "intraday" | "positional" | "investment" | "swing" | "scalping";
  chartTimeframe?: string;
  strategy?: string;
  direction?: "Long" | "Short";
  entryCondition?: string;
  exitCondition?: string;
  entryDate?: string;
  entryNote?: string;
  exitDate?: string;
  exitNote?: string;
  brokerage?: number;
  remark?: string;
  notes?: string;
  tradeDate: string;
  source: "manual" | "broker" | "importCSV";
  broker?: string;
  image?: string | File; // single image file or URL
  aiAnalysis?: { summary: string; plusPoints: string[]; minusPoints: string[] };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Build FormData or JSON payload depending on image type
 */
function buildPayload(trade: Trade): FormData | Record<string, unknown> {
  const img = trade.image;
  const hasFile = typeof File !== "undefined" && img instanceof File;

  // Prepare sanitized trade data (no undefined/null)
  const cleanData: Record<string, unknown> = {};
  Object.entries(trade).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    cleanData[k] = v;
  });

  // File upload → use FormData
  if (hasFile) {
    const form = new FormData();
    Object.entries(cleanData).forEach(([key, value]) => {
      if (key === "image" && value instanceof File) {
        form.append("image", value);
        return;
      }

      // Convert objects (aiAnalysis) to JSON strings
      if (typeof value === "object" && !(value instanceof Date)) {
        form.append(key, JSON.stringify(value));
      } else {
        form.append(key, String(value));
      }
    });
    return form;
  }

  // No file upload → JSON payload
  const payload = { ...cleanData };
  if (typeof payload.image !== "string" || payload.image.trim() === "") {
    delete payload.image;
  }
  return payload;
}

// ------------------------------
// Trades API
// ------------------------------
export const tradesApi = {
  create: (trade: Trade) => {
    const payload = buildPayload(trade);
    if (payload instanceof FormData) {
      return fetchApi({ url: "/trades", method: "POST", data: payload });
    }
    return fetchApi({
      url: "/trades",
      method: "POST",
      data: payload,
      headers: { "Content-Type": "application/json" },
    });
  },

  getAll: () => fetchApi({ url: "/trades", method: "GET" }),

  getById: (id: string) => fetchApi({ url: `/trades/${id}`, method: "GET" }),

  update: (id: string, trade: Trade) => {
    const payload = buildPayload(trade);
    if (payload instanceof FormData) {
      return fetchApi({ url: `/trades/${id}`, method: "PUT", data: payload });
    }
    return fetchApi({
      url: `/trades/${id}`,
      method: "PUT",
      data: payload,
      headers: { "Content-Type": "application/json" },
    });
  },

  delete: (id: string) => fetchApi({ url: `/trades/${id}`, method: "DELETE" }),
};
