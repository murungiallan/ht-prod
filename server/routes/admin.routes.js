import { Router } from "express";
import AdminController from "../controllers/admin.controllers.js";
import authMiddleware from "../middleware/auth.js";
import User from "../models/user.js";

const router = Router();

// Middleware to check if user has admin role
const checkAdminRole = (requiredRoles = ["admin", "full_admin", "view_only_admin"]) => async (req, res, next) => {
  try {
    const user = await User.getByEmail(req.user.email);
    if (!user || !requiredRoles.includes(user.role)) {
      AdminController.logToFile(
        `Access denied for user: ${req.user.uid}, role: ${user?.role}, required: ${requiredRoles.join(", ")}`,
        "ERROR",
        req.user.uid
      );
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }
    next();
  } catch (error) {
    AdminController.logToFile(`Error checking admin role: ${error.message}`, "ERROR", req.user.uid);
    res.status(500).json({ error: "Failed to verify admin permissions" });
  }
};

// Middleware to restrict write operations to full_admin
const restrictToFullAdmin = checkAdminRole(["full_admin"]);

// Apply authMiddleware and checkAdminRole to all routes
// User Management
router.get("/users", authMiddleware, checkAdminRole(), AdminController.getAllUsers);
router.get("/users/search", authMiddleware, checkAdminRole(), AdminController.searchUsers);
router.delete("/users/bulk", authMiddleware, restrictToFullAdmin, AdminController.bulkDeleteUsers);

// Medication Management
router.get("/medications", authMiddleware, checkAdminRole(), AdminController.getAllMedications);
router.get("/medications/adherence", authMiddleware, checkAdminRole(), AdminController.getMedicationAdherence);

// Reminder Management
router.get("/reminders", authMiddleware, checkAdminRole(), AdminController.getAllReminders);
router.put("/reminders/:id/status", authMiddleware, restrictToFullAdmin, AdminController.updateReminderStatus);

// Food AdminController.log Management
router.get("/food-AdminController.logs", authMiddleware, checkAdminRole(), AdminController.getAllFoodLogs);
router.get("/food-stats", authMiddleware, checkAdminRole(), AdminController.getFoodStats);

// Exercise Management
router.get("/exercises", authMiddleware, checkAdminRole(), AdminController.getAllExercises);
router.get("/exercise-stats", authMiddleware, checkAdminRole(), AdminController.getExerciseStats);

// System Settings
router.get("/settings", authMiddleware, checkAdminRole(), AdminController.getSystemSettings);
router.put("/settings", authMiddleware, restrictToFullAdmin, AdminController.updateSystemSettings);

// Analytics
router.get("/activity-trends", authMiddleware, checkAdminRole(), AdminController.getUserActivityTrends);

// Data Export
router.get("/export/:table", authMiddleware, checkAdminRole(), AdminController.exportData);

// Audit AdminController.logs
router.get("/audit-AdminController.logs", authMiddleware, checkAdminRole(), AdminController.getAuditLogs);

export default router;