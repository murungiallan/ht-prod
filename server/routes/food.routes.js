import { Router } from "express";
import FoodDiaryController from "../controllers/food.controllers.js";
import authMiddleware from "../middleware/auth.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post("/add", authMiddleware, upload.single("image"), FoodDiaryController.addFoodLog);
router.get("/get-food-logs", authMiddleware, FoodDiaryController.getUserFoodLogs);
router.put("/update/:id", authMiddleware, upload.single("image"), FoodDiaryController.updateFoodLog);
router.delete("/delete/:id", authMiddleware, FoodDiaryController.deleteFoodLog);
router.get("/food-stats", authMiddleware, FoodDiaryController.getFoodStats);
router.get("/predict-calories", authMiddleware, FoodDiaryController.predictCaloricIntake);
router.post("/copy", authMiddleware, FoodDiaryController.copyFoodLog);

export default router;