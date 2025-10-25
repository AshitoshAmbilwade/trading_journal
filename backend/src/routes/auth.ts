import { Router } from "express";
import { register, login, getMe,updateMe } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);
router.put("/update", authMiddleware, updateMe);

export default router;
