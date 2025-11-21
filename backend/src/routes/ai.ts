// src/routes/ai.ts
import { Router } from "express";
import {
  createAISummary,
  listAISummaries,
  getAISummary,
  deleteAISummary,
  generateAISummary, // NEW: job-enqueueing entrypoint
} from "../controllers/aiController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

// Protect all AI endpoints
router.use(authMiddleware);

/**
 * AI GENERATION ROUTE
 * POST /api/ai/generate
 * Body: { type: "trade" | "weekly" | "monthly", tradeId?, dateRange? }
 *
 * Returns:
 *  - 202 + { summaryId } when job was enqueued (draft AISummary created)
 *  - 4xx for validation / payment errors
 */
router.post("/generate", generateAISummary);

// CRUD routes for AISummaries (unchanged)
router.post("/", createAISummary);          // POST /api/ai
router.get("/", listAISummaries);          // GET /api/ai
router.get("/:id", getAISummary);          // GET /api/ai/:id
router.delete("/:id", deleteAISummary);    // DELETE /api/ai/:id

export default router;
