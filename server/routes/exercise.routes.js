import { Router } from "express";
import ExerciseController from "../controllers/exercise.controllers.js";
import authMiddleware from "../middleware/auth.js";

const router = Router();

router.post("/add", authMiddleware, ExerciseController.addExercise);
router.get("/get-exercises", authMiddleware, ExerciseController.getUserExercises);
router.put("/update/:id", authMiddleware, ExerciseController.updateExercise);
router.delete("/delete/:id", authMiddleware, ExerciseController.deleteExercise);
router.get("/exercise-stats", authMiddleware, ExerciseController.getExerciseStats);

export default router;