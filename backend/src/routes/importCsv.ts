// backend/src/routes/importCsvRoutes.ts
import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { importCsvController } from "../controllers/importCsvController.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Accept MULTIPLE CSV files: field name MUST be "files"
router.post(
  "/import-csv",
  authMiddleware,
  upload.array("files", 10),
  importCsvController
);

export default router;
