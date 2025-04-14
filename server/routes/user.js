import { Router } from "express";
import AuthController from "../controllers/auth.js";
import authMiddleware from "../middleware/auth.js";

const router = Router();

router.post("/register", AuthController.register);
router.post("/last-login", authMiddleware, AuthController.updateLastLogin);
router.post("/reset-password", AuthController.resetPassword);
router.get("/", authMiddleware, AuthController.getUser);
router.put("/profile", authMiddleware, AuthController.updateProfile);
router.post("/save-fcm-token", authMiddleware, AuthController.saveFcmToken);

export default router;