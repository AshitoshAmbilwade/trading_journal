import express from "express";
import { createExportLog, getExportLogs, deleteExportLog } from "../controllers/exportLogController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware); // protect all routes

router.post("/", createExportLog);
router.get("/", getExportLogs);
router.delete("/:id", deleteExportLog);

export default router;
