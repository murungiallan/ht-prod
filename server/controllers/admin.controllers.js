import User from "../models/user.js";
import Medication from "../models/medication.models.js";
import Reminder from "../models/reminder.models.js";
import FoodDiary from "../models/food.models.js";
import Exercise from "../models/exercise.models.js";
import db from "../config/db.js";
import { db as firebaseDb } from "../server.js";
import moment from "moment";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.join(__dirname, "../utils");
const logFilePath = path.join(logDir, "adminlogs.txt");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logToFile = (message, level = "INFO") => {
  const timestamp = moment().format("YYYY-MM-DD HH:mm:ss");
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  try {
    fs.appendFileSync(logFilePath, logMessage);
  } catch (error) {
    console.error(`Failed to write to log file: ${error.message}`);
    console.error(message);
  }
};

class AdminController {
  // User Management
  static async getAllUsers(req, res) {
    logToFile("Fetching all users");
    try {
      const users = await User.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      logToFile(`Error fetching users: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }

  static async searchUsers(req, res) {
    const { query } = req.query;
    logToFile(`Searching users with query: ${query}`);
    try {
      const [users] = await db.query(
        "SELECT * FROM users WHERE username LIKE ? OR email LIKE ?",
        [`%${query}%`, `%${query}%`]
      );
      res.status(200).json(users);
    } catch (error) {
      logToFile(`Error searching users: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to search users" });
    }
  }

  static async bulkDeleteUsers(req, res) {
    const { uids } = req.body;
    logToFile(`Bulk deleting users: ${uids.join(", ")}`);
    try {
      await db.query("DELETE FROM users WHERE uid IN (?)", [uids]);
      uids.forEach(async (uid) => {
        await firebaseDb.ref(`users/${uid}`).remove();
      });
      res.status(200).json({ message: "Users deleted successfully" });
    } catch (error) {
      logToFile(`Error bulk deleting users: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to bulk delete users" });
    }
  }

  // Medication Management
  static async getAllMedications(req, res) {
    logToFile("Fetching all medications");
    try {
      const [medications] = await db.query("SELECT * FROM medications");
      res.status(200).json(medications.map(med => ({
        ...med,
        times: Medication.safeParseJSON(med.times, []),
        doses: Medication.safeParseJSON(med.doses, {})
      })));
    } catch (error) {
      logToFile(`Error fetching medications: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to fetch medications" });
    }
  }

  static async getMedicationAdherence(req, res) {
    logToFile("Fetching medication adherence stats");
    try {
      const [stats] = await db.query(`
        SELECT 
          COUNT(*) as totalDoses,
          SUM(CASE WHEN JSON_EXTRACT(doses, '$.*.taken') = true THEN 1 ELSE 0 END) as takenDoses
        FROM medications
      `);
      const adherenceRate = stats[0].totalDoses > 0 ? (stats[0].takenDoses / stats[0].totalDoses) * 100 : 0;
      res.status(200).json({ ...stats[0], adherenceRate });
    } catch (error) {
      logToFile(`Error fetching adherence stats: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to fetch adherence stats" });
    }
  }

  // Reminder Management
  static async getAllReminders(req, res) {
    logToFile("Fetching all reminders");
    try {
      const [reminders] = await db.query("SELECT * FROM reminders");
      res.status(200).json(reminders);
    } catch (error) {
      logToFile(`Error fetching reminders: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to fetch reminders" });
    }
  }

  static async updateReminderStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;
    logToFile(`Updating reminder status for id: ${id} to ${status}`);
    try {
      await Reminder.updateStatus(id, status);
      res.status(200).json({ message: "Reminder status updated" });
    } catch (error) {
      logToFile(`Error updating reminder status: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to update reminder status" });
    }
  }

  // Food Log Management
  static async getAllFoodLogs(req, res) {
    logToFile("Fetching all food logs");
    try {
      const [foodLogs] = await db.query("SELECT * FROM food_logs");
      res.status(200).json(foodLogs);
    } catch (error) {
      logToFile(`Error fetching food logs: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to fetch food logs" });
    }
  }

  static async getFoodStats(req, res) {
    logToFile("Fetching food statistics");
    try {
      const [stats] = await db.query(`
        SELECT 
          COUNT(*) as totalFoodLogs,
          AVG(calories) as avgCalories,
          AVG(carbs) as avgCarbs,
          AVG(protein) as avgProtein,
          AVG(fats) as avgFats
        FROM food_logs
      `);
      res.status(200).json(stats[0]);
    } catch (error) {
      logToFile(`Error fetching food stats: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to fetch food stats" });
    }
  }

  // Exercise Management
  static async getAllExercises(req, res) {
    logToFile("Fetching all exercises");
    try {
      const [exercises] = await db.query("SELECT * FROM exercises");
      res.status(200).json(exercises);
    } catch (error) {
      logToFile(`Error fetching exercises: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  }

  static async getExerciseStats(req, res) {
    logToFile("Fetching exercise statistics");
    try {
      const [stats] = await db.query(`
        SELECT 
          COUNT(*) as totalExercises,
          AVG(duration) as avgDuration,
          AVG(calories_burned) as avgCaloriesBurned
        FROM exercises
      `);
      res.status(200).json(stats[0]);
    } catch (error) {
      logToFile(`Error fetching exercise stats: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to fetch exercise stats" });
    }
  }

  // System Settings
  static async getSystemSettings(req, res) {
    logToFile("Fetching system settings");
    try {
      const [settings] = await db.query("SELECT * FROM system_settings");
      res.status(200).json(settings);
    } catch (error) {
      logToFile(`Error fetching system settings: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to fetch system settings" });
    }
  }

  static async updateSystemSettings(req, res) {
    const { settingKey, settingValue } = req.body;
    logToFile(`Updating system setting: ${settingKey} to ${settingValue}`);
    try {
      await db.query(
        "INSERT INTO system_settings (setting_key, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?",
        [settingKey, settingValue, settingValue]
      );
      res.status(200).json({ message: "System setting updated" });
    } catch (error) {
      logToFile(`Error updating system setting: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to update system setting" });
    }
  }

  // Analytics
  static async getUserActivityTrends(req, res) {
    logToFile("Fetching user activity trends");
    try {
      const [trends] = await db.query(`
        SELECT DATE(last_login) as date, COUNT(*) as activeUsers
        FROM users
        WHERE last_login IS NOT NULL
        GROUP BY DATE(last_login)
        ORDER BY date DESC
        LIMIT 30
      `);
      res.status(200).json(trends);
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
      const validTables = ["users", "medications", "reminders", "food_logs", "exercises"];
      if (!validTables.includes(table)) {
        return res.status(400).json({ error: "Invalid table name" });
      }
      const [rows] = await db.query(`SELECT * FROM ${table}`);
      const csvContent = [Object.keys(rows[0]).join(",")]
        .concat(rows.map(row => Object.values(row).join(",")))
        .join("\n");
      res.header("Content-Type", "text/csv");
      res.attachment(`${table}_export_${moment().format("YYYYMMDD")}.csv`);
      res.send(csvContent);
    } catch (error) {
      logToFile(`Error exporting data: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to export data" });
    }
  }

  // Audit Logs
  static async getAuditLogs(req, res) {
    logToFile("Fetching audit logs");
    try {
      const logs = fs.readFileSync(logFilePath, "utf8").split("\n").filter(line => line);
      res.status(200).json(logs);
    } catch (error) {
      logToFile(`Error fetching audit logs: ${error.message}`, "ERROR");
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  }
}

export default AdminController;