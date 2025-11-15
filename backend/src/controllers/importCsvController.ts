// backend/src/controllers/importCsvController.ts
import { Request, Response } from "express";
import Papa from "papaparse";
const { parse } = Papa;
import { TradeModel } from "../models/Trade.js";

// helpers
const toNumber = (val: any) => {
  if (val === null || val === undefined) return null;
  const s = String(val ?? "").trim();
  if (s === "" || s.toLowerCase() === "null") return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isNaN(n) ? null : n;
};
const toDate = (val: any) => {
  if (val === null || val === undefined) return null;
  const s = String(val ?? "").trim();
  if (s === "" || s.toLowerCase() === "null") return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};
const computePnl = (type: string | undefined, entryPrice: number | null, exitPrice: number | null, qty: number | null, brokerage: number | null) => {
  if (entryPrice == null || exitPrice == null || qty == null) return null;
  const e = Number(entryPrice), x = Number(exitPrice), q = Number(qty);
  if ([e, x, q].some(Number.isNaN)) return null;
  const gross = type === "Buy" ? (x - e) * q : (e - x) * q;
  const b = brokerage == null ? 0 : Number(brokerage);
  return Number((gross - b).toFixed(2));
};

// Mapping functions to convert CSV text -> schema enum tokens
const mapSession = (raw: any): "morning" | "mid" | "last" | undefined => {
  if (raw === null || raw === undefined) return undefined;
  const s = String(raw).trim().toLowerCase();
  if (s === "" || s === "null") return undefined;
  // common variants -> schema tokens
  if (["morning", "morn", "am"].includes(s)) return "morning";
  if (["mid", "afternoon", "midday", "noon", "pm"].includes(s)) return "mid";
  if (["last", "evening", "close", "end"].includes(s)) return "last";
  return undefined; // unknown => omit
};

const mapSegment = (raw: any): "equity" | "future" | "forex" | "option" | "commodity" | "currency" | "crypto" | undefined => {
  if (raw === null || raw === undefined) return undefined;
  const s = String(raw).trim().toLowerCase();
  if (s === "" || s === "null") return undefined;
  if (["equity", "stocks"].includes(s)) return "equity";
  if (["future", "futures"].includes(s)) return "future";
  if (["forex", "fx", "currency pair"].includes(s)) return "forex";
  if (["option", "options"].includes(s)) return "option";
  if (["commodity", "commodities"].includes(s)) return "commodity";
  if (["currency"].includes(s)) return "currency";
  if (["crypto", "cryptocurrency", "coin"].includes(s)) return "crypto";
  return undefined;
};

const mapTradeType = (raw: any): "intraday" | "positional" | "investment" | "swing" | "scalping" | undefined => {
  if (raw === null || raw === undefined) return undefined;
  const s = String(raw).trim().toLowerCase();
  if (s === "" || s === "null") return undefined;
  if (["intraday", "day", "daytrade", "day trading"].includes(s)) return "intraday";
  if (["positional", "position"].includes(s)) return "positional";
  if (["investment", "invest"].includes(s)) return "investment";
  if (["swing"].includes(s)) return "swing";
  if (["scalp", "scalping"].includes(s)) return "scalping";
  return undefined;
};

interface AuthReq extends Request {
  user?: { _id?: any };
}

export const importCsvController = async (req: AuthReq, res: Response) => {
  try {
    const files: Express.Multer.File[] = Array.isArray(req.files)
      ? (req.files as Express.Multer.File[])
      : req.file
      ? [req.file as Express.Multer.File]
      : [];

    if (!files || files.length === 0) return res.status(400).json({ error: "At least 1 CSV file is required" });
    if (!req.user || !req.user._id) return res.status(401).json({ error: "Unauthorized: user not found" });

    let totalRows = 0;
    const prepared: Array<{ index: number; doc: any; raw: any }> = [];
    const skippedInvalid: Array<{ index: number; reason: string; raw: any }> = [];

    for (const file of files) {
      if (!file) continue;
      const csv = file.buffer.toString("utf8");
      const parsed = parse(csv, { header: true, skipEmptyLines: true });
      if (parsed.errors && parsed.errors.length > 0) {
        return res.status(400).json({ error: "CSV parse errors", details: parsed.errors });
      }
      const rows = parsed.data as Record<string, any>[];
      totalRows += rows.length;

      for (let i = 0; i < rows.length; i++) {
        const raw = rows[i];

        // minimal mapping
        const symbol = raw.Symbol ?? raw.symbol ?? raw.Ticker ?? raw.ticker ?? raw["Trading Symbol"] ?? null;
        const quantity = toNumber(raw.Quantity ?? raw.quantity ?? raw.Qty ?? raw.qty);
        const entryPrice = toNumber(raw["Entry Price"] ?? raw.EntryPrice ?? raw.entryPrice ?? raw["Buy Price"]);
        const exitPrice = toNumber(raw["Exit Price"] ?? raw.ExitPrice ?? raw.exitPrice ?? raw["Sell Price"]);
        const entryDate = toDate(raw["Entry Date"] ?? raw.EntryDate ?? raw.entryDate ?? raw["Trade Date"] ?? raw.tradeDate);
        const exitDate = toDate(raw["Exit Date"] ?? raw.ExitDate ?? raw.exitDate);
        const brokerage = toNumber(raw.Brokerage ?? raw.brokerage ?? raw["Brokerage"] ?? raw.BrokerageAmt);

        // type mapping & inference
        const rawType = raw.Type ?? raw.type ?? raw["Trade Type"] ?? null;
        let type: "Buy" | "Sell" | undefined = undefined;
        if (rawType) {
          const t = String(rawType).trim().toLowerCase();
          if (t === "buy" || t === "b") type = "Buy";
          if (t === "sell" || t === "s") type = "Sell";
        }
        if (!type && entryPrice != null && exitPrice != null) {
          type = exitPrice > entryPrice ? "Buy" : "Sell";
        }

        // minimal validation
        if (!symbol) {
          skippedInvalid.push({ index: i + 1, reason: "missing symbol", raw });
          continue;
        }
        if (quantity == null) {
          skippedInvalid.push({ index: i + 1, reason: "missing/invalid quantity", raw });
          continue;
        }
        if (entryPrice == null) {
          skippedInvalid.push({ index: i + 1, reason: "missing/invalid entryPrice", raw });
          continue;
        }

        // normalize enum-like fields using mapping functions (returns undefined when invalid/empty)
        const sessionVal = mapSession(raw.Session ?? raw.session ?? raw["Session"] ?? "");
        const segmentVal = mapSegment(raw.Segment ?? raw.segment ?? raw["Segment"] ?? "");
        const tradeTypeVal = mapTradeType(raw["Trade Type"] ?? raw.tradeType ?? raw["TradeType"] ?? "");

        const tradeDate = toDate(raw["Trade Date"]) ?? entryDate ?? new Date();

        // Build doc; **only include enum fields if mapping produced a value** (prevents storing "" or invalid)
        const doc: any = {
          userId: req.user!._id,
          symbol,
          quantity,
          type,
          entryPrice,
          exitPrice,
          entryDate,
          exitDate,
          tradeDate,
          brokerage,
          pnl: computePnl(type, entryPrice, exitPrice, quantity, brokerage),
          strategy: raw.Strategy ?? raw.strategy ?? null,
          broker: raw.Broker ?? raw.broker ?? null,
          source: "importCSV",
          customFields: raw,
        };

        if (segmentVal) doc.segment = segmentVal;
        if (tradeTypeVal) doc.tradeType = tradeTypeVal;
        if (sessionVal) doc.session = sessionVal;

        prepared.push({ index: i + 1, doc, raw });
      }
    }

    // Insert individually so one failing doesn't stop others
    const successes: Array<{ index: number; id: string }> = [];
    const failures: Array<{ index: number; error: string; raw: any }> = [];

    const settled = await Promise.all(
      prepared.map(async (p) => {
        try {
          const created = await TradeModel.create(p.doc);
          successes.push({ index: p.index, id: String(created._id) });
        } catch (err: any) {
          failures.push({ index: p.index, error: err.message ?? String(err), raw: p.raw });
          console.error(`Row ${p.index} insert failed:`, err.message ?? err);
        }
      })
    );

    return res.json({
      status: "success",
      totalRows,
      preparedCount: prepared.length,
      inserted: successes.length,
      insertedRows: successes,
      failedCount: failures.length,
      failures,
      skippedInvalidCount: skippedInvalid.length,
      skippedInvalid,
      preparedPreview: prepared.map((p) => ({ index: p.index, symbol: p.doc.symbol, entryPrice: p.doc.entryPrice })),
    });
  } catch (err: any) {
    console.error("CSV import top-level error:", err);
    return res.status(500).json({ error: "Import failed", details: err.message ?? String(err) });
  }
};
