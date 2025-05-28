import { Router } from "express";
import AuthController from "../controllers/user.controllers.js";
import authMiddleware from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

// Configure multer for file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../uploads");

// Create uploads directory if it doesn't exist
import fs from "fs";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user.uid}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only JPEG, JPG, and PNG images are allowed"));
  },
});

const router = Router();

router.post("/register", AuthController.register);
router.post("/last-login", authMiddleware, AuthController.updateLastLogin);
router.post("/reset-password", AuthController.resetPassword);
router.get("/", authMiddleware, AuthController.getUser);
router.get("/all", authMiddleware, AuthController.getAllUsers);
router.put("/profile", authMiddleware, upload.single("profile_image"), AuthController.updateProfile);
router.post("/save-fcm-token", authMiddleware, AuthController.saveFcmToken);
router.post("/weekly-goals", authMiddleware, AuthController.saveWeeklyGoals);
router.get("/weekly-goals", authMiddleware, AuthController.getWeeklyGoals);

export default router;