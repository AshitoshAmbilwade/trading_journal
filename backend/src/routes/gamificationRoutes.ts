import express from "express";
import { getGamification, updateGamification } from "../controllers/gamificationController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware); // protect all routes

router.get("/", getGamification);
router.put("/", updateGamification);

export default router;
