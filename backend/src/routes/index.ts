// src/routes/index.ts
import { Router,Request, Response  } from "express";
import authRoutes from "./auth.js";
import tradesRoutes from "./trades.js";        // To be created
//import dashboardRoutes from "./dashboard";  // To be created
//import aiRoutes from "./ai";                // To be created
//import exportRoutes from "./export";        // To be created
//import brokerRoutes from "./broker";        // To be created

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.send("Trading Journal API is running 🚀");
});
// Mount routes
router.use("/auth", authRoutes);
router.use("/trades", tradesRoutes);
//router.use("/dashboard", dashboardRoutes);
//router.use("/ai", aiRoutes);
//router.use("/export", exportRoutes);
//router.use("/broker", brokerRoutes);

export default router;
