// src/routes/index.ts
import { Router,Request, Response  } from "express";
import authRoutes from "./auth.js";
import tradesRoutes from "./trades.js";        
//import dashboardRoutes from "./dashboard";  // To be created
import aiRoutes from "./ai.js";                
import exportLogRoutes from "./exportLogRoutes.js";      
import gamificationRoutes from "./gamificationRoutes.js";
//import brokerRoutes from "./broker";        // To be created

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.send("Trading Journal API is running 🚀");
});
// Mount routes
router.use("/auth", authRoutes);
router.use("/trades", tradesRoutes);
//router.use("/dashboard", dashboardRoutes);
router.use("/ai-summaries", aiRoutes);
router.use("/export-logs", exportLogRoutes);
router.use("/gamification", gamificationRoutes);

//router.use("/broker", brokerRoutes);

export default router;
