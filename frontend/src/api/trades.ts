import { fetchApi } from "../utils/apiHandler";

export interface Trade {
  _id?: string;
  userId: string;
  symbol: string;
  type: "Buy" | "Sell";
  quantity: number;
  price: number;
  pnl: number;
  strategy?: string;
  notes?: string;
  tradeDate: string; // ISO string
  source: "manual" | "broker" | "importCSV";
  broker?: string;
  images?: string[];
  aiAnalysis?: {
    summary: string;
    plusPoints: string[];
    minusPoints: string[];
  };
  createdAt?: string;
  updatedAt?: string;
}


// Trades API wrapper
export const tradesApi = {
  // Create a new trade
  create: (trade: Trade) =>
    fetchApi({ url: "/trades", method: "POST", data: trade }),

  // Get all trades (optionally can add query params later)
  getAll: () =>
    fetchApi({ url: "/trades", method: "GET" }),

  // Get trade by ID
  getById: (id: string) =>
    fetchApi({ url: `/trades/${id}`, method: "GET" }),

  // Update trade by ID
  update: (id: string, trade: Trade) =>
    fetchApi({ url: `/trades/${id}`, method: "PUT", data: trade }),

  // Delete trade by ID
  delete: (id: string) =>
    fetchApi({ url: `/trades/${id}`, method: "DELETE" }),
};
