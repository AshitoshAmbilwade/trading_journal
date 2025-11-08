import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getSummary, getTimeSeries, getDistribution } from "../controllers/analyticsController.js";

const router = Router();

router.get("/summary", authMiddleware, getSummary);
router.get("/timeseries", authMiddleware, getTimeSeries);
router.get("/distribution", authMiddleware, getDistribution);

export default router;
