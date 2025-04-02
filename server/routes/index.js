import { Router } from "express";
import authenticate from "../middleware/auth.js";
import exerciseRoutes from "./exercise.js";
import medicationRoutes from "./medication.js";
import userRoutes from "./user.js";

const router = Router();

// Test protected route
router.get("/protected", authenticate, (req, res) => {
  res.json({ message: "Protected route", user: req.user });
});

// Mount routes
router.use("/exercises", exerciseRoutes);
router.use("/medications", medicationRoutes);
router.use("/users", userRoutes);

export default router;