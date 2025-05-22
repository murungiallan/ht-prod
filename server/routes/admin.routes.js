import { Router } from "express";
import AdminController from "../controllers/admin.controllers.js";
import { logToFile } from "../controllers/admin.controllers.js";
import authMiddleware from "../middleware/auth.js";
import User from "../models/user.js";

const router = Router();

// Middleware to check if user has admin role
const checkAdminRole = (requiredRoles = "admin") => async (req, res, next) => {
  try {
    const user = await User.getByEmail(req.user.email);
    if (!user || !requiredRoles.includes(user.role)) {
      logToFile(
        `Access denied for user: ${req.user.uid}, role: ${user?.role}, required: ${requiredRoles}`,
        "ERROR"
      );
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }
    next();
  } catch (error) {
    logToFile(`Error checking admin role: ${error.message}`, "ERROR");
    res.status(500).json({ error: "Failed to verify admin permissions" });
  }
};

// Middleware to restrict write operations to admin
const restrictToFullAdmin = checkAdminRole(["admin"]);

// User Management
router.get("/users", authMiddleware, checkAdminRole(), AdminController.getAllUsers);
router.get("/users/search", authMiddleware, checkAdminRole(), AdminController.searchUsers);
router.post("/users/delete", authMiddleware, restrictToFullAdmin, AdminController.deleteSelectedUsers); // New route for checkbox deletion

// Medication Management
router.get("/medications", authMiddleware, checkAdminRole(), AdminController.getAllMedications);
router.get("/medications/search", authMiddleware, checkAdminRole(), AdminController.searchMedications);
router.post("/medications", authMiddleware, restrictToFullAdmin, AdminController.createMedication);
router.put("/medications/:id", authMiddleware, restrictToFullAdmin, AdminController.updateMedication);
router.delete("/medications/:id", authMiddleware, restrictToFullAdmin, AdminController.deleteMedication);
router.get("/medications/adherence", authMiddleware, checkAdminRole(), AdminController.getMedicationAdherence);
router.post("/medications/delete", authMiddleware, restrictToFullAdmin, AdminController.deleteSelectedMedications); // New route for checkbox deletion

// Reminder Management
router.get("/reminders", authMiddleware, checkAdminRole(), AdminController.getAllReminders);
router.get("/reminders/search", authMiddleware, checkAdminRole(), AdminController.searchReminders);
router.post("/reminders", authMiddleware, restrictToFullAdmin, AdminController.createReminder);
router.put("/reminders/:id", authMiddleware, restrictToFullAdmin, AdminController.updateReminder);
router.put("/reminders/:id/status", authMiddleware, restrictToFullAdmin, AdminController.updateReminderStatus);
router.delete("/reminders/:id", authMiddleware, restrictToFullAdmin, AdminController.deleteReminder);
router.post("/reminders/delete", authMiddleware, restrictToFullAdmin, AdminController.deleteSelectedReminders); // New route for checkbox deletion

// Food Log Management
router.get("/food-logs", authMiddleware, checkAdminRole(), AdminController.getAllFoodLogs);
router.get("/food-logs/search", authMiddleware, checkAdminRole(), AdminController.searchFoodLogs);
router.post("/food-logs", authMiddleware, restrictToFullAdmin, AdminController.createFoodLog);
router.put("/food-logs/:id", authMiddleware, restrictToFullAdmin, AdminController.updateFoodLog);
router.delete("/food-logs/:id", authMiddleware, restrictToFullAdmin, AdminController.deleteFoodLog);
router.get("/food-logs/stats", authMiddleware, checkAdminRole(), AdminController.getFoodStats);
router.post("/food-logs/delete", authMiddleware, restrictToFullAdmin, AdminController.deleteSelectedFoodLogs); // New route for checkbox deletion

// Exercise Management
router.get("/exercises", authMiddleware, checkAdminRole(), AdminController.getAllExercises);
router.get("/exercises/search", authMiddleware, checkAdminRole(), AdminController.searchExercises);
router.post("/exercises", authMiddleware, restrictToFullAdmin, AdminController.createExercise);
router.put("/exercises/:id", authMiddleware, restrictToFullAdmin, AdminController.updateExercise);
router.delete("/exercises/:id", authMiddleware, restrictToFullAdmin, AdminController.deleteExercise);
router.get("/exercises/stats", authMiddleware, checkAdminRole(), AdminController.getExerciseStats);
router.post("/exercises/delete", authMiddleware, restrictToFullAdmin, AdminController.deleteSelectedExercises); // New route for checkbox deletion

// System Settings
router.get("/settings", authMiddleware, checkAdminRole(), AdminController.getSystemSettings);
router.get("/settings/search", authMiddleware, checkAdminRole(), AdminController.searchSystemSettings);
router.put("/settings", authMiddleware, restrictToFullAdmin, AdminController.updateSystemSettings);
router.delete("/settings/:settingKey", authMiddleware, restrictToFullAdmin, AdminController.deleteSystemSetting);
router.post("/settings/delete", authMiddleware, restrictToFullAdmin, AdminController.deleteSelectedSystemSettings); // New route for checkbox deletion

// Analytics
router.get("/analytics/user-activity", authMiddleware, checkAdminRole(), AdminController.getUserActivityTrends);

// Data Export
router.get("/export/:table", authMiddleware, checkAdminRole(), AdminController.exportData);

// Audit Logs
router.get("/audit-logs", authMiddleware, checkAdminRole(), AdminController.getAuditLogs);

router.post("/users", authMiddleware, restrictToFullAdmin, AdminController.createUser);
router.put("/users/:id", authMiddleware, restrictToFullAdmin, AdminController.updateUser);
router.post("/users/:id/reset-password", authMiddleware, restrictToFullAdmin, AdminController.resetPassword);

export default router;