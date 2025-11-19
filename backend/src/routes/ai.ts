// src/routes/ai.ts
import { Router } from "express";
import {
  createAISummary,
  listAISummaries,
  getAISummary,
  deleteAISummary,
  generateAISummary,   // <-- NEW
} from "../controllers/aiController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

// Protect all AI endpoints
router.use(authMiddleware);

/**
 * AI GENERATION ROUTE
 * POST /api/ai/generate
 * Body: { type: "trade" | "weekly", tradeId?, dateRange? }
 */
router.post("/generate", generateAISummary);  // <--- IMPORTANT


/**
 * EXISTING CRUD ROUTES (kept as-is)
 */
router.post("/", createAISummary);          // POST /api/ai
router.get("/", listAISummaries);          // GET /api/ai
router.get("/:id", getAISummary);          // GET /api/ai/:id
router.delete("/:id", deleteAISummary);    // DELETE /api/ai/:id

export default router;
