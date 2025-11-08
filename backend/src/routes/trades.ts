// src/routes/trades.ts
import { Router } from "express";
import {
  createTrade,
  getTrades,
  getTrade,
  updateTrade,
  deleteTrade,
} from "../controllers/tradeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadSingle } from "../utils/cloudinary.js";

const router = Router();

// ✅ All routes protected
router.use(authMiddleware);

// ✅ Trade CRUD routes (with single image upload support)
router.post("/", uploadSingle, createTrade);
router.get("/", getTrades);
router.get("/:id", getTrade);
router.put("/:id", uploadSingle, updateTrade);
router.delete("/:id", deleteTrade);

export default router;
