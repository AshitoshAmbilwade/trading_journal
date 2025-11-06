// src/api/trades.ts
import { fetchApi } from "../utils/apiHandler";

export interface Trade {
  _id?: string;
  userId?: string;
  symbol: string;
  type: "Buy" | "Sell";
  quantity: number;
  price: number;
  pnl: number;
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
  // single image: either a remote URL (string) or a File object (new upload)
  image?: string | File;
  aiAnalysis?: { summary: string; plusPoints: string[]; minusPoints: string[] };
  createdAt?: string;
  updatedAt?: string;
}

/** Return true for a plain empty object like {} (not File). */
function isPlainEmptyObject(v: any): boolean {
  return (
    v &&
    typeof v === "object" &&
    !(typeof File !== "undefined" && v instanceof File) &&
    Object.getPrototypeOf(v) === Object.prototype &&
    Object.keys(v).length === 0
  );
}

/**
 * Build payload:
 * - If trade.image is a File -> return FormData (file appended under `image`)
 * - Otherwise return a JSON-ready object with `image` either string or removed when empty
 */
function buildFormData(trade: Trade): FormData | Omit<Trade, "image"> | Trade {
  const img = (trade as any).image;

  // If image is a plain empty object ({}), treat as no image
  if (isPlainEmptyObject(img)) {
    const clone: any = { ...trade };
    delete clone.image;
    return clone;
  }

  // If image is a File -> build FormData
  const hasFile = typeof File !== "undefined" && img instanceof File;
  if (hasFile) {
    const form = new FormData();
    Object.entries(trade).forEach(([k, v]) => {
      if (v === undefined || v === null) return;

      if (k === "image" && v instanceof File) {
        form.append("image", v);
        return;
      }

      // nest/objects -> stringify
      if (typeof v === "object") {
        try {
          form.append(k, JSON.stringify(v));
        } catch {
          form.append(k, String(v));
        }
        return;
      }

      form.append(k, String(v));
    });
    return form;
  }

  // No file — return JSON-friendly object and remove image if not a useful string
  const clone: any = { ...trade };
  if (clone.image === undefined || clone.image === null || clone.image === "") {
    delete clone.image;
  } else if (typeof clone.image === "object") {
    // try to extract common url fields or stringify (defensive)
    try {
      const candidates = ["path", "secure_url", "location", "url", "filename", "public_id"];
      let extracted = "";
      for (const c of candidates) {
        if ((clone.image as any)[c]) {
          extracted = String((clone.image as any)[c]);
          break;
        }
      }
      if (extracted) clone.image = extracted;
      else {
        const s = JSON.stringify(clone.image);
        if (s && s !== "{}") clone.image = s;
        else delete clone.image;
      }
    } catch {
      delete clone.image;
    }
  }
  return clone;
}

// ---- trades API wrapper ----
export const tradesApi = {
  create: (trade: Trade) => {
    const payload = buildFormData(trade);
    if (payload instanceof FormData) {
      // DO NOT set Content-Type header for FormData
      return fetchApi({ url: "/trades", method: "POST", data: payload });
    }
    // JSON path
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
    const payload = buildFormData(trade);
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
