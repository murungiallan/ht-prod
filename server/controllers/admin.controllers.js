import User from "../models/user.js";
import Medication from "../models/medication.models.js";
import Reminder from "../models/reminder.models.js";
import FoodDiary from "../models/food.models.js";
import Exercise from "../models/exercise.models.js";
import AdminModel from "../models/admin.model.js";
import moment from "moment-timezone";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "../config/db.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.join(__dirname, "../utils");
const logFilePath = path.join(logDir, "adminlogs.txt");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export const logToFile = (message, level = "INFO") => {
  const timestamp = moment().tz("Asia/Singapore").format("YYYY-MM-DD HH:mm:ss");
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  try {
    const stats = fs.statSync(logFilePath);
    if (stats.size > 10 * 1024 * 1024) {
      // 10MB limit
      fs.renameSync(logFilePath, `${logFilePath}.${timestamp}.bak`);
    }
    fs.appendFileSync(logFilePath, logMessage);
  } catch (error) {
    console.error(`Failed to write to log file: ${error.message}`);
  }
};

class AdminController {
  // User Management
  static async getAllUsers(req, res) {
    const { page = 1, pageSize = 10, sortKey = "created_at", sortDirection = "DESC" } = req.query;
    logToFile(`Fetching users: page=${page}, pageSize=${pageSize}, sort=${sortKey} ${sortDirection}`);
    try {
      const result = await AdminModel.getAllUsers(page, pageSize, sortKey, sortDirection);
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error fetching users: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }

  static async searchUsers(req, res) {
    const { query, page = 1, pageSize = 10, sortKey = "created_at", sortDirection = "DESC" } = req.query;
    logToFile(`Searching users: query=${query}, page=${page}, pageSize=${pageSize}, sort=${sortKey} ${sortDirection}`);
    try {
      const result = await AdminModel.searchUsers(query, page, pageSize, sortKey, sortDirection);
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error searching users: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to search users" });
    }
  }

  static async deleteSelectedUsers(req, res) {
    const { uids } = req.body;
    if (!uids || !Array.isArray(uids) || uids.length === 0) {
      return res.status(400).json({ error: "No users selected for deletion" });
    }
    logToFile(`Deleting selected users: ${uids.join(", ")}`);
    try {
      await db.beginTransaction();
      for (const uid of uids) {
        await AdminModel.deleteUser(uid);
      }
      await db.commit();
      res.status(200).json({ message: "Selected users deleted successfully" });
    } catch (error) {
      await db.rollback();
      logToFile(`Error deleting selected users: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to delete selected users" });
    }
  }

  // Medication Management
  static async getAllMedications(req, res) {
    const { page = 1, pageSize = 10, sortKey = "start_date", sortDirection = "DESC" } = req.query;
    logToFile(`Fetching medications: page=${page}, pageSize=${pageSize}, sort=${sortKey} ${sortDirection}`);
    try {
      const result = await AdminModel.getAllMedications(page, pageSize, sortKey, sortDirection);
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error fetching medications: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to fetch medications" });
    }
  }

  static async searchMedications(req, res) {
    const { query, page = 1, pageSize = 10, sortKey = "start_date", sortDirection = "DESC" } = req.query;
    logToFile(`Searching medications: query=${query}, page=${page}, pageSize=${pageSize}, sort=${sortKey} ${sortDirection}`);
    try {
      const result = await AdminModel.searchMedications(query, page, pageSize, sortKey, sortDirection);
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error searching medications: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to search medications" });
    }
  }

  static async createMedication(req, res) {
    const { user_id, medication_name, dosage, frequency, times_per_day, times, start_date, end_date, notes } = req.body;
    if (!user_id || !medication_name || !dosage || !frequency || !times_per_day) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    logToFile(`Creating medication for user: ${user_id}, name: ${medication_name}`);
    try {
      const result = await AdminModel.createMedication({
        user_id,
        medication_name,
        dosage,
        frequency,
        times_per_day,
        times,
        start_date,
        end_date,
        notes,
      });
      res.status(201).json(result);
    } catch (error) {
      logToFile(`Error creating medication: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to create medication" });
    }
  }

  static async updateMedication(req, res) {
    const { id } = req.params;
    const { user_id, medication_name, dosage, frequency, times_per_day, times, start_date, end_date, notes } = req.body;
    if (!user_id || !medication_name || !dosage || !frequency || !times_per_day) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    logToFile(`Updating medication id: ${id}`);
    try {
      const result = await AdminModel.updateMedication(id, {
        user_id,
        medication_name,
        dosage,
        frequency,
        times_per_day,
        times,
        start_date,
        end_date,
        notes,
      });
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error updating medication: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to update medication" });
    }
  }

  static async deleteMedication(req, res) {
    const { id } = req.params;
    logToFile(`Deleting medication id: ${id}`);
    try {
      const result = await AdminModel.deleteMedication(id);
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error deleting medication: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to delete medication" });
    }
  }

  static async getMedicationAdherence(req, res) {
    logToFile("Fetching medication adherence stats");
    try {
      const result = await AdminModel.getMedicationAdherence();
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error fetching adherence stats: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to fetch adherence stats" });
    }
  }

  static async deleteSelectedMedications(req, res) {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No medications selected for deletion" });
    }
    logToFile(`Deleting selected medications: ${ids.join(", ")}`);
    try {
      await db.beginTransaction();
      for (const id of ids) {
        await AdminModel.deleteMedication(id);
      }
      await db.commit();
      res.status(200).json({ message: "Selected medications deleted successfully" });
    } catch (error) {
      await db.rollback();
      logToFile(`Error deleting selected medications: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to delete selected medications" });
    }
  }

  // Reminder Management
  static async getAllReminders(req, res) {
    const { page = 1, pageSize = 10, sortKey = "date", sortDirection = "DESC" } = req.query;
    logToFile(`Fetching reminders: page=${page}, pageSize=${pageSize}, sort=${sortKey} ${sortDirection}`);
    try {
      const result = await AdminModel.getAllReminders(page, pageSize, sortKey, sortDirection);
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error fetching reminders: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to fetch reminders" });
    }
  }

  static async searchReminders(req, res) {
    const { query, page = 1, pageSize = 10, sortKey = "date", sortDirection = "DESC" } = req.query;
    logToFile(`Searching reminders: query=${query}, page=${page}, pageSize=${pageSize}, sort=${sortKey} ${sortDirection}`);
    try {
      const result = await AdminModel.searchReminders(query, page, pageSize, sortKey, sortDirection);
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error searching reminders: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to search reminders" });
    }
  }

  static async createReminder(req, res) {
    const { user_id, medication_id, dose_index, reminder_time, date, status } = req.body;
    if (!user_id || !medication_id || dose_index === undefined || !reminder_time || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    logToFile(`Creating reminder for user: ${user_id}, medication: ${medication_id}`);
    try {
      const result = await AdminModel.createReminder({ user_id, medication_id, dose_index, reminder_time, date, status });
      res.status(201).json(result);
    } catch (error) {
      logToFile(`Error creating reminder: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to create reminder" });
    }
  }

  static async updateReminder(req, res) {
    const { id } = req.params;
    const { user_id, medication_id, dose_index, reminder_time, date, status } = req.body;
    if (!user_id || !medication_id || dose_index === undefined || !reminder_time || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    logToFile(`Updating reminder id: ${id}`);
    try {
      const result = await AdminModel.updateReminder(id, { user_id, medication_id, dose_index, reminder_time, date, status });
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error updating reminder: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to update reminder" });
    }
  }

  static async updateReminderStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;
    if (!["pending", "sent"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'pending' or 'sent'" });
    }
    logToFile(`Updating reminder status for id: ${id} to ${status}`);
    try {
      const result = await AdminModel.updateReminderStatus(id, status);
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error updating reminder status: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to update reminder status" });
    }
  }

  static async deleteReminder(req, res) {
    const { id } = req.params;
    logToFile(`Deleting reminder id: ${id}`);
    try {
      const result = await AdminModel.deleteReminder(id);
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error deleting reminder: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to delete reminder" });
    }
  }

  static async deleteSelectedReminders(req, res) {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No reminders selected for deletion" });
    }
    logToFile(`Deleting selected reminders: ${ids.join(", ")}`);
    try {
      await db.beginTransaction();
      for (const id of ids) {
        await AdminModel.deleteReminder(id);
      }
      await db.commit();
      res.status(200).json({ message: "Selected reminders deleted successfully" });
    } catch (error) {
      await db.rollback();
      logToFile(`Error deleting selected reminders: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to delete selected reminders" });
    }
  }

  // Food Log Management
  static async getAllFoodLogs(req, res) {
    const { page = 1, pageSize = 10, sortKey = "date_logged", sortDirection = "DESC" } = req.query;
    logToFile(`Fetching food logs: page=${page}, pageSize=${pageSize}, sort=${sortKey} ${sortDirection}`);
    try {
      const result = await AdminModel.getAllFoodLogs(page, pageSize, sortKey, sortDirection);
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error fetching food logs: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to fetch food logs" });
    }
  }

  static async searchFoodLogs(req, res) {
    const { query, page = 1, pageSize = 10, sortKey = "date_logged", sortDirection = "DESC" } = req.query;
    logToFile(`Searching food logs: query=${query}, page=${page}, pageSize=${pageSize}, sort=${sortKey} ${sortDirection}`);
    try {
      const result = await AdminModel.searchFoodLogs(query, page, pageSize, sortKey, sortDirection);
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error searching food logs: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to search food logs" });
    }
  }

  static async createFoodLog(req, res) {
    const { user_id, food_name, calories, carbs, protein, fats, date_logged, meal_type } = req.body;
    if (!user_id || !food_name || !calories || !date_logged || !meal_type) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    logToFile(`Creating food log for user: ${user_id}, food: ${food_name}`);
    try {
      const result = await AdminModel.createFoodLog({ user_id, food_name, calories, carbs, protein, fats, date_logged, meal_type });
      res.status(201).json(result);
    } catch (error) {
      logToFile(`Error creating food log: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to create food log" });
    }
  }

  static async updateFoodLog(req, res) {
    const { id } = req.params;
    const { user_id, food_name, calories, carbs, protein, fats, date_logged, meal_type } = req.body;
    if (!user_id || !food_name || !calories || !date_logged || !meal_type) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    logToFile(`Updating food log id: ${id}`);
    try {
      const result = await AdminModel.updateFoodLog(id, { user_id, food_name, calories, carbs, protein, fats, date_logged, meal_type });
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error updating food log: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to update food log" });
    }
  }

  static async deleteFoodLog(req, res) {
    const { id } = req.params;
    logToFile(`Deleting food log id: ${id}`);
    try {
      const result = await AdminModel.deleteFoodLog(id);
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error deleting food log: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to delete food log" });
    }
  }

  static async getFoodStats(req, res) {
    logToFile("Fetching food statistics");
    try {
      const result = await AdminModel.getFoodStats();
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error fetching food stats: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to fetch food stats" });
    }
  }

  static async deleteSelectedFoodLogs(req, res) {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No food logs selected for deletion" });
    }
    logToFile(`Deleting selected food logs: ${ids.join(", ")}`);
    try {
      await db.beginTransaction();
      for (const id of ids) {
        await AdminModel.deleteFoodLog(id);
      }
      await db.commit();
      res.status(200).json({ message: "Selected food logs deleted successfully" });
    } catch (error) {
      await db.rollback();
      logToFile(`Error deleting selected food logs: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to delete selected food logs" });
    }
  }

  // Exercise Management
  static async getAllExercises(req, res) {
    const { page = 1, pageSize = 10, sortKey = "date_logged", sortDirection = "DESC" } = req.query;
    logToFile(`Fetching exercises: page=${page}, pageSize=${pageSize}, sort=${sortKey} ${sortDirection}`);
    try {
      const result = await AdminModel.getAllExercises(page, pageSize, sortKey, sortDirection);
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error fetching exercises: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  }

  static async searchExercises(req, res) {
    const { query, page = 1, pageSize = 10, sortKey = "date_logged", sortDirection = "DESC" } = req.query;
    logToFile(`Searching exercises: query=${query}, page=${page}, pageSize=${pageSize}, sort=${sortKey} ${sortDirection}`);
    try {
      const result = await AdminModel.searchExercises(query, page, pageSize, sortKey, sortDirection);
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error searching exercises: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to search exercises" });
    }
  }

  static async createExercise(req, res) {
    const { user_id, activity, duration, calories_burned, date_logged } = req.body;
    if (!user_id || !activity || !duration || !calories_burned || !date_logged) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    logToFile(`Creating exercise for user: ${user_id}, activity: ${activity}`);
    try {
      const result = await AdminModel.createExercise({ user_id, activity, duration, calories_burned, date_logged });
      res.status(201).json(result);
    } catch (error) {
      logToFile(`Error creating exercise: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to create exercise" });
    }
  }

  static async updateExercise(req, res) {
    const { id } = req.params;
    const { user_id, activity, duration, calories_burned, date_logged } = req.body;
    if (!user_id || !activity || !duration || !calories_burned || !date_logged) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    logToFile(`Updating exercise id: ${id}`);
    try {
      const result = await AdminModel.updateExercise(id, { user_id, activity, duration, calories_burned, date_logged });
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error updating exercise: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to update exercise" });
    }
  }

  static async deleteExercise(req, res) {
    const { id } = req.params;
    logToFile(`Deleting exercise id: ${id}`);
    try {
      const result = await AdminModel.deleteExercise(id);
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error deleting exercise: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to delete exercise" });
    }
  }

  static async getExerciseStats(req, res) {
    logToFile("Fetching exercise statistics");
    try {
      const result = await AdminModel.getExerciseStats();
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error fetching exercise stats: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to fetch exercise stats" });
    }
  }

  static async deleteSelectedExercises(req, res) {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No exercises selected for deletion" });
    }
    logToFile(`Deleting selected exercises: ${ids.join(", ")}`);
    try {
      await db.beginTransaction();
      for (const id of ids) {
        await AdminModel.deleteExercise(id);
      }
      await db.commit();
      res.status(200).json({ message: "Selected exercises deleted successfully" });
    } catch (error) {
      await db.rollback();
      logToFile(`Error deleting selected exercises: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to delete selected exercises" });
    }
  }

  // System Settings
  static async getSystemSettings(req, res) {
    const { page = 1, pageSize = 10, sortKey = "setting_key", sortDirection = "ASC" } = req.query;
    logToFile(`Fetching system settings: page=${page}, pageSize=${pageSize}, sort=${sortKey} ${sortDirection}`);
    try {
      const result = await AdminModel.getSystemSettings(page, pageSize, sortKey, sortDirection);
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error fetching system settings: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to fetch system settings" });
    }
  }

  static async searchSystemSettings(req, res) {
    const { query, page = 1, pageSize = 10, sortKey = "setting_key", sortDirection = "ASC" } = req.query;
    logToFile(`Searching system settings: query=${query}, page=${page}, pageSize=${pageSize}, sort=${sortKey} ${sortDirection}`);
    try {
      const result = await AdminModel.searchSystemSettings(query, page, pageSize, sortKey, sortDirection);
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error searching system settings: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to search system settings" });
    }
  }

  static async updateSystemSettings(req, res) {
    const { settingKey, settingValue } = req.body;
    if (!settingKey || settingValue === undefined) {
      return res.status(400).json({ error: "settingKey and settingValue are required" });
    }
    logToFile(`Updating system setting: ${settingKey} to ${settingValue}`);
    try {
      const result = await AdminModel.updateSystemSetting(settingKey, settingValue);
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error updating system setting: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to update system setting" });
    }
  }

  static async deleteSystemSetting(req, res) {
    const { settingKey } = req.params;
    logToFile(`Deleting system setting: ${settingKey}`);
    try {
      const result = await AdminModel.deleteSystemSetting(settingKey);
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error deleting system setting: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to delete system setting" });
    }
  }

  static async deleteSelectedSystemSettings(req, res) {
    const { settingKeys } = req.body;
    if (!settingKeys || !Array.isArray(settingKeys) || settingKeys.length === 0) {
      return res.status(400).json({ error: "No settings selected for deletion" });
    }
    logToFile(`Deleting selected system settings: ${settingKeys.join(", ")}`);
    try {
      await db.beginTransaction();
      for (const settingKey of settingKeys) {
        await AdminModel.deleteSystemSetting(settingKey);
      }
      await db.commit();
      res.status(200).json({ message: "Selected settings deleted successfully" });
    } catch (error) {
      await db.rollback();
      logToFile(`Error deleting selected system settings: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to delete selected system settings" });
    }
  }

  // Analytics
  static async getUserActivityTrends(req, res) {
    logToFile("Fetching user activity trends");
    try {
      const result = await AdminModel.getUserActivityTrends();
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error fetching user activity trends: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to fetch user activity trends" });
    }
  }

  // Data Export
  static async exportData(req, res) {
    const { table } = req.params;
    logToFile(`Exporting data from table: ${table}`);
    try {
      const result = await AdminModel.exportData(table);
      if (result.data === "No data to export") {
        return res.status(200).send(result.data);
      }
      res.header("Content-Type", "text/csv");
      res.attachment(result.filename);
      res.send(result.data);
    } catch (error) {
      logToFile(`Error exporting data: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to export data" });
    }
  }

  // Audit Logs
  static async getAuditLogs(req, res) {
    const { page = 1, pageSize = 10, sortKey = "timestamp", sortDirection = "DESC", query = "" } = req.query;
    logToFile(`Fetching last 200 audit logs: query=${query}, page=${page}, pageSize=${pageSize}, sort=${sortKey} ${sortDirection}`);
    try {
      const result = await AdminModel.getAuditLogs(page, pageSize, sortKey, sortDirection, query);
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error fetching last 200 audit logs: ${error.message}`, "ERROR");
      res.status(500).json({ error: `Failed to fetch audit logs: ${error.message}`, stack: error.stack });
    }
  }

  static async createUser(req, res) {
    const { username, email, role, password } = req.body;
    if (!username || !email || !role || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    logToFile(`Creating user: ${email}`);
    try {
      const result = await AdminModel.createUser({ username, email, role, password });
      res.status(201).json(result);
    } catch (error) {
      logToFile(`Error creating user: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to create user" });
    }
  }

  static async updateUser(req, res) {
    const { id } = req.params;
    const { username, email, role } = req.body;
    if (!username || !email || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    logToFile(`Updating user id: ${id}`);
    try {
      const result = await AdminModel.updateUser(id, { username, email, role });
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error updating user: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to update user" });
    }
  }

  static async resetPassword(req, res) {
    const { id } = req.params;
    logToFile(`Resetting password for user id: ${id}`);
    try {
      const result = await AdminModel.resetPassword(id);
      res.status(200).json(result);
    } catch (error) {
      logToFile(`Error resetting password: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to reset password" });
    }
  }
}

export default AdminController;