// src/routes/analyticsRoutes.ts
import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getSummary,
  getTimeSeries,
  getDistribution,
  getTrades, // 👈 import new controller
} from "../controllers/analyticsController.js";

const router = Router();

// ✅ All analytics endpoints require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/analytics/summary
 * @desc    Overview KPIs (total pnl, win rate, etc.)
 * @query   from, to (ISO date strings)
 */
router.get("/summary", getSummary);

/**
 * @route   GET /api/analytics/timeseries
 * @desc    Aggregated performance over time
 * @query   interval=daily|weekly|monthly, from, to
 */
router.get("/timeseries", getTimeSeries);

/**
 * @route   GET /api/analytics/distribution
 * @desc    Distribution of PnL grouped by field
 * @query   by=segment|strategy|tradeType|type|session
 */
router.get("/distribution", getDistribution);

/**
 * @route   GET /api/analytics/trades
 * @desc    Return all trades within date range (per-trade data)
 * @query   from, to (ISO strings), optional filters (segment, symbol, etc.)
 * @example GET /api/analytics/trades?from=2025-11-01&to=2025-11-09
 */
router.get("/trades", getTrades); // 👈 NEW route

export default router;
