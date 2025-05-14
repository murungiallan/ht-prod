import { Router } from "express";
import FoodDiaryController from "../controllers/food.controllers.js";
import authMiddleware from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../../Uploads');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const firebaseUid = req.user.uid;
    const fileName = `${firebaseUid}_${Date.now()}_${file.originalname.replace(/\s/g, '_')}`;
    cb(null, fileName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and GIF images are allowed'));
    }
  },
});

// Middleware to handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds the limit of 5MB' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

const router = Router();

// Apply authMiddleware to all routes, and upload middleware where needed
router.post("/add", authMiddleware, upload.single("image"), handleMulterError, FoodDiaryController.addFoodLog);
router.get("/get-food-logs", authMiddleware, FoodDiaryController.getUserFoodLogs);
router.put("/update/:id", authMiddleware, upload.single("image"), handleMulterError, FoodDiaryController.updateFoodLog);
router.delete("/delete/:id", authMiddleware, FoodDiaryController.deleteFoodLog);
router.get("/food-stats", authMiddleware, FoodDiaryController.getFoodStats);
router.get("/predict-calories", authMiddleware, FoodDiaryController.predictCaloricIntake);
router.post("/copy", authMiddleware, FoodDiaryController.copyFoodLog);

export default router;