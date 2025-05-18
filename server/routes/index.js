import { Router } from "express";
import authenticate from "../middleware/auth.js";
import exerciseRoutes from "./exercise.routes.js";
import medicationRoutes from "./medication.routes.js";
import userRoutes from "./user.routes.js";
import reminderRoutes from "./reminder.routes.js";
import foodRoutes from "./food.routes.js";
import adminRoutes from "./admin.routes.js";

const router = Router();

// Test protected route
router.get("/protected", authenticate, (req, res) => {
  res.json({ message: "Protected route", user: req.user });
});

// Mount routes
router.use("/exercises", exerciseRoutes);
router.use("/medications", medicationRoutes);
router.use("/users", userRoutes);
router.use("/reminders", reminderRoutes);
router.use("/food-logs", foodRoutes);
router.use("/admin", adminRoutes);

export default router;