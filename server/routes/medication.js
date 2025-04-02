import { Router } from "express";
import MedicationController from "../controllers/medication.js";
import authMiddleware from "../middleware/auth.js";

const router = Router();

router.post("/add", authMiddleware, MedicationController.addMedication);
router.get("/get-medications", authMiddleware, MedicationController.getUserMedications);
router.put("/update/:id", authMiddleware, MedicationController.updateMedication);
router.delete("/delete/:id", authMiddleware, MedicationController.deleteMedication);
router.put("/:id/taken", authMiddleware, MedicationController.updateTakenStatus);
router.put("/:id/missed", authMiddleware, MedicationController.markAsMissed);

export default router;