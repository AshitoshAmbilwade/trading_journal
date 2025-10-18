import { Router } from "express";
import {
  createTrade,
  getTrades,
  getTrade,
  updateTrade,
  deleteTrade,
} from "../controllers/tradeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

// Protect all trade routes
router.use(authMiddleware);

router.post("/", createTrade);
router.get("/", getTrades);
router.get("/:id", getTrade);
router.put("/:id", updateTrade);
router.delete("/:id", deleteTrade);

export default router;
