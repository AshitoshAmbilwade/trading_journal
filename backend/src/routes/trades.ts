// src/routes/trades.ts
import { Router, RequestHandler, Request, Response, NextFunction } from "express";
import {
  createTrade,
  getTrades,
  getTrade,
  updateTrade,
  deleteTrade,
} from "../controllers/tradeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadSingle } from "../utils/cloudinary.js"; // single-file middleware

const router = Router();

// Local request type for this file: multer may attach `file` (single) or `files` (map/array)
interface LocalAuthRequest extends Request {
  user?: any;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

// Simple wrapper to forward async errors to next()
const wrap =
  (fn: (...args: any[]) => Promise<any>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req as LocalAuthRequest, res, next)).catch(next);

// Apply auth middleware for all trade routes
router.use(authMiddleware);

// Routes — single image field name is "image"
router.post("/", uploadSingle, wrap(createTrade));
router.get("/", wrap(getTrades));
router.get("/:id", wrap(getTrade));
router.put("/:id", uploadSingle, wrap(updateTrade));
router.delete("/:id", wrap(deleteTrade));

export default router;
