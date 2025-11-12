// src/routes/strategyRoutes.ts
import { Router } from "express";
import {
  createStrategy,
  listStrategies,
  getStrategy,
  updateStrategy,
  deleteStrategy,
  addSectionItem,
  removeSectionItem,
} from "../controllers/strategyController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// CRUD
router.post("/", createStrategy);         // POST    /api/strategies
router.get("/", listStrategies);          // GET     /api/strategies
router.get("/:id", getStrategy);          // GET     /api/strategies/:id
router.put("/:id", updateStrategy);       // PUT     /api/strategies/:id
router.delete("/:id", deleteStrategy);    // DELETE  /api/strategies/:id

// Micro endpoints for UI convenience (add/remove single criterion)
router.post("/:id/sections/:section/add", addSectionItem);           // POST   /api/strategies/:id/sections/:section/add
router.delete("/:id/sections/:section/:index", removeSectionItem);  // DELETE /api/strategies/:id/sections/:section/:index

export default router;
