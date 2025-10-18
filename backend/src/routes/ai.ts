// src/routes/ai.ts
import { Router } from "express";
import {
  createAISummary,
  listAISummaries,
  getAISummary,
  deleteAISummary,
} from "../controllers/aiController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

// protect all AI endpoints
router.use(authMiddleware);

router.post("/", createAISummary);        // POST /api/ai
router.get("/", listAISummaries);        // GET /api/ai
router.get("/:id", getAISummary);        // GET /api/ai/:id
router.delete("/:id", deleteAISummary); // DELETE /api/ai/:id

export default router;
