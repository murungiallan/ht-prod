import { Router } from "express";
import ReminderController from "../controllers/reminder.controllers.js";
import authMiddleware from "../middleware/auth.js";

const router = Router();

router.post("/add", authMiddleware, ReminderController.addReminder);
router.get("/get-reminders", authMiddleware, ReminderController.getUserReminders);
router.delete("/delete/:id", authMiddleware, ReminderController.deleteReminder);
router.put("/update/:id", authMiddleware, ReminderController.updateReminder);
router.put("/update/:id/status", authMiddleware, ReminderController.updateReminderStatus);

export default router;