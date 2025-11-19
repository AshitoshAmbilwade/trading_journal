import { Router, Request, Response } from "express";
import authRoutes from "./auth.js";
import tradesRoutes from "./trades.js";
import aiRoutes from "./ai.js";
import exportLogRoutes from "./exportLogRoutes.js";
import gamificationRoutes from "./gamificationRoutes.js";
import analyticsRoutes from "./analytics.js"; 
import strategyRoutes from "./strategyRoutes.js";
import importCsvRoutes from "./importCsv.js";

const router = Router();

// Base health check
router.get("/", (req: Request, res: Response) => {
  res.send("Trading Journal API is running 🚀");
});

// Mount route modules
router.use("/auth", authRoutes);
router.use("/trades", tradesRoutes);
router.use("/ai", aiRoutes);
router.use("/export-logs", exportLogRoutes);
router.use("/gamification", gamificationRoutes);
router.use("/analytics", analyticsRoutes); 
router.use("/strategies", strategyRoutes);
router.use("/import", importCsvRoutes);

export default router;
