import db from "../config/db.js";
import moment from "moment";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility function to safely parse JSON from database
const safeParseJSON = (jsonString, defaultValue = {}) => {
  try {
    return jsonString ? JSON.parse(jsonString) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

class AdminModel {
  // User Management
  static async getAllUsers(page = 1, pageSize = 10, sortKey = "created_at", sortDirection = "DESC") {
    const offset = (page - 1) * pageSize;
    const safeSortKey = ["uid", "username", "email", "role", "created_at", "last_login"].includes(sortKey)
      ? sortKey
      : "created_at";
    const safeSortDirection = sortDirection.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const [users] = await db.query(
      `SELECT uid, username, email, role, created_at, last_login
       FROM users
       ORDER BY ?? ${safeSortDirection}
       LIMIT ? OFFSET ?`,
      [safeSortKey, parseInt(pageSize), offset]
    );
    const [[{ total }]] = await db.query("SELECT COUNT(*) as total FROM users");

    return { data: users, total, page: parseInt(page), pageSize: parseInt(pageSize) };
  }

  static async searchUsers(query, page = 1, pageSize = 10, sortKey = "created_at", sortDirection = "DESC") {
    const offset = (page - 1) * pageSize;
    const safeSortKey = ["uid", "username", "email", "role", "created_at", "last_login"].includes(sortKey)
      ? sortKey
      : "created_at";
    const safeSortDirection = sortDirection.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const [users] = await db.query(
      `SELECT uid, username, email, role, created_at, last_login
       FROM users
       WHERE username LIKE ? OR email LIKE ?
       ORDER BY ?? ${safeSortDirection}
       LIMIT ? OFFSET ?`,
      [`%${query}%`, `%${query}%`, safeSortKey, parseInt(pageSize), offset]
    );
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) as total FROM users WHERE username LIKE ? OR email LIKE ?",
      [`%${query}%`, `%${query}%`]
    );

    return { data: users, total, page: parseInt(page), pageSize: parseInt(pageSize) };
  }

  static async deleteUser(uid) {
    await db.query("DELETE FROM users WHERE uid = ?", [uid]);
    return { message: "User deleted successfully" };
  }

  static async createUser({ username, email, role, password }) {
    if (!username || !email || !role || !password) {
      throw new Error("Missing required fields");
    }

    const [result] = await db.query(
      `INSERT INTO users (uid, username, email, role, password, created_at)
       VALUES (UUID(), ?, ?, ?, ?, NOW())`,
      [username, email, role, password]
    );
    return { message: "User created successfully", id: result.insertId };
  }

  static async updateUser(uid, { username, email, role }) {
    if (!username || !email || !role) {
      throw new Error("Missing required fields");
    }

    await db.query(
      `UPDATE users SET username = ?, email = ?, role = ? WHERE uid = ?`,
      [username, email, role, uid]
    );
    return { message: "User updated successfully" };
  }

  static async resetPassword(uid) {
    // Placeholder implementation - replace with actual password reset logic
    return { message: "Password reset initiated" };
  }

  // Medication Management
  static async getAllMedications(page = 1, pageSize = 10, sortKey = "start_date", sortDirection = "DESC") {
    const offset = (page - 1) * pageSize;
    const safeSortKey = ["id", "user_id", "medication_name", "dosage", "frequency", "start_date", "end_date"].includes(sortKey)
      ? sortKey
      : "start_date";
    const safeSortDirection = sortDirection.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const [medications] = await db.query(
      `SELECT id, user_id, medication_name, dosage, frequency, times_per_day, times, start_date, end_date, notes
       FROM medications
       ORDER BY ?? ${safeSortDirection}
       LIMIT ? OFFSET ?`,
      [safeSortKey, parseInt(pageSize), offset]
    );
    const [[{ total }]] = await db.query("SELECT COUNT(*) as total FROM medications");

    return {
      data: medications.map((med) => ({
        ...med,
        times: safeParseJSON(med.times, []),
        doses: safeParseJSON(med.doses, {}),
      })),
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    };
  }

  static async searchMedications(query, page = 1, pageSize = 10, sortKey = "start_date", sortDirection = "DESC") {
    const offset = (page - 1) * pageSize;
    const safeSortKey = ["id", "user_id", "medication_name", "dosage", "frequency", "start_date", "end_date"].includes(sortKey)
      ? sortKey
      : "start_date";
    const safeSortDirection = sortDirection.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const [medications] = await db.query(
      `SELECT id, user_id, medication_name, dosage, frequency, times_per_day, times, start_date, end_date, notes
       FROM medications
       WHERE medication_name LIKE ?
       ORDER BY ?? ${safeSortDirection}
       LIMIT ? OFFSET ?`,
      [`%${query}%`, safeSortKey, parseInt(pageSize), offset]
    );
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) as total FROM medications WHERE medication_name LIKE ?",
      [`%${query}%`]
    );

    return {
      data: medications.map((med) => ({
        ...med,
        times: safeParseJSON(med.times, []),
        doses: safeParseJSON(med.doses, {}),
      })),
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    };
  }

  static async createMedication({
    user_id,
    medication_name,
    dosage,
    frequency,
    times_per_day,
    times,
    start_date,
    end_date,
    notes,
  }) {
    if (!user_id || !medication_name || !dosage || !frequency || !times_per_day) {
      throw new Error("Missing required fields");
    }

    const [result] = await db.query(
      `INSERT INTO medications (user_id, medication_name, dosage, frequency, times_per_day, times, start_date, end_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        medication_name,
        dosage,
        frequency,
        times_per_day,
        JSON.stringify(times || []),
        start_date || null,
        end_date || null,
        notes || null,
      ]
    );
    return { message: "Medication created successfully", id: result.insertId };
  }

  static async updateMedication(id, {
    user_id,
    medication_name,
    dosage,
    frequency,
    times_per_day,
    times,
    start_date,
    end_date,
    notes,
  }) {
    if (!user_id || !medication_name || !dosage || !frequency || !times_per_day) {
      throw new Error("Missing required fields");
    }

    await db.query(
      `UPDATE medications
       SET user_id = ?, medication_name = ?, dosage = ?, frequency = ?, times_per_day = ?,
           times = ?, start_date = ?, end_date = ?, notes = ?
       WHERE id = ?`,
      [
        user_id,
        medication_name,
        dosage,
        frequency,
        times_per_day,
        JSON.stringify(times || []),
        start_date || null,
        end_date || null,
        notes || null,
        id,
      ]
    );
    return { message: "Medication updated successfully" };
  }

  static async deleteMedication(id) {
    await db.query("DELETE FROM medications WHERE id = ?", [id]);
    return { message: "Medication deleted successfully" };
  }

  static async getMedicationAdherence() {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as totalDoses,
        SUM(CASE WHEN JSON_EXTRACT(doses, '$.*.taken') = true THEN 1 ELSE 0 END) as takenDoses
      FROM medications
    `);
    const adherenceRate = stats[0].totalDoses > 0 ? (stats[0].takenDoses / stats[0].totalDoses) * 100 : 0;
    return { totalDoses: stats[0].totalDoses, takenDoses: stats[0].takenDoses, adherenceRate };
  }

  // Reminder Management
  static async getAllReminders(page = 1, pageSize = 10, sortKey = "date", sortDirection = "DESC") {
    const offset = (page - 1) * pageSize;
    const safeSortKey = ["id", "user_id", "medication_id", "reminder_time", "date", "status"].includes(sortKey)
      ? sortKey
      : "date";
    const safeSortDirection = sortDirection.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const [reminders] = await db.query(
      `SELECT id, user_id, medication_id, dose_index, reminder_time, date, status
       FROM reminders
       ORDER BY ?? ${safeSortDirection}
       LIMIT ? OFFSET ?`,
      [safeSortKey, parseInt(pageSize), offset]
    );
    const [[{ total }]] = await db.query("SELECT COUNT(*) as total FROM reminders");

    return { data: reminders, total, page: parseInt(page), pageSize: parseInt(pageSize) };
  }

  static async searchReminders(query, page = 1, pageSize = 10, sortKey = "date", sortDirection = "DESC") {
    const offset = (page - 1) * pageSize;
    const safeSortKey = ["id", "user_id", "medication_id", "reminder_time", "date", "status"].includes(sortKey)
      ? sortKey
      : "date";
    const safeSortDirection = sortDirection.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const [reminders] = await db.query(
      `SELECT id, user_id, medication_id, dose_index, reminder_time, date, status
       FROM reminders
       WHERE user_id LIKE ? OR medication_id LIKE ?
       ORDER BY ?? ${safeSortDirection}
       LIMIT ? OFFSET ?`,
      [`%${query}%`, `%${query}%`, safeSortKey, parseInt(pageSize), offset]
    );
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) as total FROM reminders WHERE user_id LIKE ? OR medication_id LIKE ?",
      [`%${query}%`, `%${query}%`]
    );

    return { data: reminders, total, page: parseInt(page), pageSize: parseInt(pageSize) };
  }

  static async createReminder({ user_id, medication_id, dose_index, reminder_time, date, status }) {
    if (!user_id || !medication_id || dose_index === undefined || !reminder_time || !date) {
      throw new Error("Missing required fields");
    }

    const [result] = await db.query(
      `INSERT INTO reminders (user_id, medication_id, dose_index, reminder_time, date, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, medication_id, dose_index, reminder_time, date, status || "pending"]
    );
    return { message: "Reminder created successfully", id: result.insertId };
  }

  static async updateReminder(id, { user_id, medication_id, dose_index, reminder_time, date, status }) {
    if (!user_id || !medication_id || dose_index === undefined || !reminder_time || !date) {
      throw new Error("Missing required fields");
    }

    await db.query(
      `UPDATE reminders
       SET user_id = ?, medication_id = ?, dose_index = ?, reminder_time = ?, date = ?, status = ?
       WHERE id = ?`,
      [user_id, medication_id, dose_index, reminder_time, date, status || "pending", id]
    );
    return { message: "Reminder updated successfully" };
  }

  static async updateReminderStatus(id, status) {
    if (!["pending", "sent"].includes(status)) {
      throw new Error("Status must be 'pending' or 'sent'");
    }

    await db.query("UPDATE reminders SET status = ? WHERE id = ?", [status, id]);
    return { message: "Reminder status updated" };
  }

  static async deleteReminder(id) {
    await db.query("DELETE FROM reminders WHERE id = ?", [id]);
    return { message: "Reminder deleted successfully" };
  }

  // Food Log Management
  static async getAllFoodLogs(page = 1, pageSize = 10, sortKey = "date_logged", sortDirection = "DESC") {
    const offset = (page - 1) * pageSize;
    const safeSortKey = ["id", "user_id", "food_name", "calories", "carbs", "protein", "fats", "date_logged", "created_at"].includes(sortKey)
      ? sortKey
      : "date_logged";
    const safeSortDirection = sortDirection.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const [foodLogs] = await db.query(
      `SELECT id, user_id, food_name, calories, carbs, protein, fats, date_logged, meal_type, created_at
       FROM food_logs
       ORDER BY ?? ${safeSortDirection}
       LIMIT ? OFFSET ?`,
      [safeSortKey, parseInt(pageSize), offset]
    );
    const [[{ total }]] = await db.query("SELECT COUNT(*) as total FROM food_logs");

    return { data: foodLogs, total, page: parseInt(page), pageSize: parseInt(pageSize) };
  }

  static async searchFoodLogs(query, page = 1, pageSize = 10, sortKey = "date_logged", sortDirection = "DESC") {
    const offset = (page - 1) * pageSize;
    const safeSortKey = ["id", "user_id", "food_name", "calories", "carbs", "protein", "fats", "date_logged", "created_at"].includes(sortKey)
      ? sortKey
      : "date_logged";
    const safeSortDirection = sortDirection.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const [foodLogs] = await db.query(
      `SELECT id, user_id, food_name, calories, carbs, protein, fats, date_logged, meal_type, created_at
       FROM food_logs
       WHERE food_name LIKE ? OR meal_type LIKE ?
       ORDER BY ?? ${safeSortDirection}
       LIMIT ? OFFSET ?`,
      [`%${query}%`, `%${query}%`, safeSortKey, parseInt(pageSize), offset]
    );
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) as total FROM food_logs WHERE food_name LIKE ? OR meal_type LIKE ?",
      [`%${query}%`, `%${query}%`]
    );

    return { data: foodLogs, total, page: parseInt(page), pageSize: parseInt(pageSize) };
  }

  static async createFoodLog({ user_id, food_name, calories, carbs, protein, fats, date_logged, meal_type }) {
    if (!user_id || !food_name || !calories || !date_logged || !meal_type) {
      throw new Error("Missing required fields");
    }

    const [result] = await db.query(
      `INSERT INTO food_logs (user_id, food_name, calories, carbs, protein, fats, date_logged, meal_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, food_name, calories, carbs || 0, protein || 0, fats || 0, date_logged, meal_type]
    );
    return { message: "Food log created successfully", id: result.insertId };
  }

  static async updateFoodLog(id, { user_id, food_name, calories, carbs, protein, fats, date_logged, meal_type }) {
    if (!user_id || !food_name || !calories || !date_logged || !meal_type) {
      throw new Error("Missing required fields");
    }

    await db.query(
      `UPDATE food_logs
       SET user_id = ?, food_name = ?, calories = ?, carbs = ?, protein = ?, fats = ?, date_logged = ?, meal_type = ?
       WHERE id = ?`,
      [user_id, food_name, calories, carbs || 0, protein || 0, fats || 0, date_logged, meal_type, id]
    );
    return { message: "Food log updated successfully" };
  }

  static async deleteFoodLog(id) {
    await db.query("DELETE FROM food_logs WHERE id = ?", [id]);
    return { message: "Food log deleted successfully" };
  }

  static async getFoodStats() {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as totalFoodLogs,
        AVG(calories) as avgCalories,
        AVG(carbs) as avgCarbs,
        AVG(protein) as avgProtein,
        AVG(fats) as avgFats
      FROM food_logs
    `);
    return {
      totalFoodLogs: stats[0].totalFoodLogs,
      avgCalories: parseFloat(stats[0].avgCalories) || 0,
      avgCarbs: parseFloat(stats[0].avgCarbs) || 0,
      avgProtein: parseFloat(stats[0].avgProtein) || 0,
      avgFats: parseFloat(stats[0].avgFats) || 0,
    };
  }

  // Exercise Management
  static async getAllExercises(page = 1, pageSize = 10, sortKey = "date_logged", sortDirection = "DESC") {
    const offset = (page - 1) * pageSize;
    const safeSortKey = ["id", "user_id", "activity", "duration", "calories_burned", "date_logged"].includes(sortKey)
      ? sortKey
      : "date_logged";
    const safeSortDirection = sortDirection.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const [exercises] = await db.query(
      `SELECT id, user_id, activity, duration, calories_burned, date_logged
       FROM exercises
       ORDER BY ?? ${safeSortDirection}
       LIMIT ? OFFSET ?`,
      [safeSortKey, parseInt(pageSize), offset]
    );
    const [[{ total }]] = await db.query("SELECT COUNT(*) as total FROM exercises");

    return { data: exercises, total, page: parseInt(page), pageSize: parseInt(pageSize) };
  }

  static async searchExercises(query, page = 1, pageSize = 10, sortKey = "date_logged", sortDirection = "DESC") {
    const offset = (page - 1) * pageSize;
    const safeSortKey = ["id", "user_id", "activity", "duration", "calories_burned", "date_logged"].includes(sortKey)
      ? sortKey
      : "date_logged";
    const safeSortDirection = sortDirection.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const [exercises] = await db.query(
      `SELECT id, user_id, activity, duration, calories_burned, date_logged
       FROM exercises
       WHERE activity LIKE ?
       ORDER BY ?? ${safeSortDirection}
       LIMIT ? OFFSET ?`,
      [`%${query}%`, safeSortKey, parseInt(pageSize), offset]
    );
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) as total FROM exercises WHERE activity LIKE ?",
      [`%${query}%`]
    );

    return { data: exercises, total, page: parseInt(page), pageSize: parseInt(pageSize) };
  }

  static async createExercise({ user_id, activity, duration, calories_burned, date_logged }) {
    if (!user_id || !activity || !duration || !calories_burned || !date_logged) {
      throw new Error("Missing required fields");
    }

    const [result] = await db.query(
      `INSERT INTO exercises (user_id, activity, duration, calories_burned, date_logged)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, activity, duration, calories_burned, date_logged]
    );
    return { message: "Exercise created successfully", id: result.insertId };
  }

  static async updateExercise(id, { user_id, activity, duration, calories_burned, date_logged }) {
    if (!user_id || !activity || !duration || !calories_burned || !date_logged) {
      throw new Error("Missing required fields");
    }

    await db.query(
      `UPDATE exercises
       SET user_id = ?, activity = ?, duration = ?, calories_burned = ?, date_logged = ?
       WHERE id = ?`,
      [user_id, activity, duration, calories_burned, date_logged, id]
    );
    return { message: "Exercise updated successfully" };
  }

  static async deleteExercise(id) {
    await db.query("DELETE FROM exercises WHERE id = ?", [id]);
    return { message: "Exercise deleted successfully" };
  }

  static async getExerciseStats() {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as totalExercises,
        AVG(duration) as avgDuration,
        AVG(calories_burned) as avgCaloriesBurned
      FROM exercises
    `);
    return {
      totalExercises: stats[0].totalExercises,
      avgDuration: parseFloat(stats[0].avgDuration) || 0,
      avgCaloriesBurned: parseFloat(stats[0].avgCaloriesBurned) || 0,
    };
  }

  // System Settings
  static async getSystemSettings(page = 1, pageSize = 10, sortKey = "setting_key", sortDirection = "ASC") {
    const offset = (page - 1) * pageSize;
    const safeSortKey = ["setting_key", "value"].includes(sortKey) ? sortKey : "setting_key";
    const safeSortDirection = sortDirection.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const [settings] = await db.query(
      `SELECT setting_key, value
       FROM system_settings
       ORDER BY ?? ${safeSortDirection}
       LIMIT ? OFFSET ?`,
      [safeSortKey, parseInt(pageSize), offset]
    );
    const [[{ total }]] = await db.query("SELECT COUNT(*) as total FROM system_settings");

    return { data: settings, total, page: parseInt(page), pageSize: parseInt(pageSize) };
  }

  static async searchSystemSettings(query, page = 1, pageSize = 10, sortKey = "setting_key", sortDirection = "ASC") {
    const offset = (page - 1) * pageSize;
    const safeSortKey = ["setting_key", "value"].includes(sortKey) ? sortKey : "setting_key";
    const safeSortDirection = sortDirection.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const [settings] = await db.query(
      `SELECT setting_key, value
       FROM system_settings
       WHERE setting_key LIKE ? OR value LIKE ?
       ORDER BY ?? ${safeSortDirection}
       LIMIT ? OFFSET ?`,
      [`%${query}%`, `%${query}%`, safeSortKey, parseInt(pageSize), offset]
    );
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) as total FROM system_settings WHERE setting_key LIKE ? OR value LIKE ?",
      [`%${query}%`, `%${query}%`]
    );

    return { data: settings, total, page: parseInt(page), pageSize: parseInt(pageSize) };
  }

  static async updateSystemSetting(settingKey, settingValue) {
    if (!settingKey || settingValue === undefined) {
      throw new Error("settingKey and settingValue are required");
    }

    const [existing] = await db.query("SELECT 1 FROM system_settings WHERE setting_key = ?", [settingKey]);
    if (existing.length > 0) {
      await db.query("UPDATE system_settings SET value = ? WHERE setting_key = ?", [settingValue, settingKey]);
    } else {
      await db.query("INSERT INTO system_settings (setting_key, value) VALUES (?, ?)", [settingKey, settingValue]);
    }
    return { message: "System setting updated successfully" };
  }

  static async deleteSystemSetting(settingKey) {
    await db.query("DELETE FROM system_settings WHERE setting_key = ?", [settingKey]);
    return { message: "Setting deleted successfully" };
  }

  static async deleteSystemSetting(settingKey) {
    await db.query("DELETE FROM system_settings WHERE setting_key = ?", [settingKey]);
    return { message: "Setting deleted successfully" };
  }

  // Analytics
  static async getUserActivityTrends() {
    const [trends] = await db.query(`
      SELECT DATE(last_login) as date, COUNT(*) as activeUsers
      FROM users
      WHERE last_login IS NOT NULL
      GROUP BY DATE(last_login)
      ORDER BY date DESC
      LIMIT 30
    `);
    return trends;
  }

  // Data Export
  static async exportData(table) {
    const validTables = ["users", "medications", "reminders", "food_logs", "exercises"];
    if (!validTables.includes(table)) {
      throw new Error("Invalid table name");
    }

    const [rows] = await db.query(`SELECT * FROM ??`, [table]);
    if (rows.length === 0) {
      return { data: "No data to export" };
    }

    const csvContent = [
      Object.keys(rows[0])
        .map((key) => `"${key}"`)
        .join(","),
      ...rows.map((row) =>
        Object.values(row)
          .map((val) => `"${val !== null ? val.toString().replace(/"/g, '""') : ""}"`)
          .join(",")
      ),
    ].join("\n");

    return { data: csvContent, filename: `${table}_export_${moment().format("YYYYMMDD")}.csv` };
  }

  // Audit Logs
  static async getAuditLogs(page = 1, pageSize = 10, sortKey = "timestamp", sortDirection = "DESC", query = "") {
    const logFilePath = path.join(__dirname, "../utils/adminlogs.txt");
    try {
      // Check if file exists and is readable
      if (!fs.existsSync(logFilePath)) {
        return {
          logs: [],
          total: 0,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          message: "No audit logs available",
        };
      }
  
      let logs = fs.readFileSync(logFilePath, "utf8").split("\n").filter((line) => line.trim());
      if (logs.length === 0) {
        return {
          logs: [],
          total: 0,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          message: "No audit logs available",
        };
      }
  
      // Take the last 200 logs
      logs = logs.slice(-200);
      if (logs.length === 200) {
        console.log("200 logs fetched from adminlogs.txt");
      } else {
        console.log(`${logs.length} logs have been fetched`);
      }
  
      if (query) {
        logs = logs.filter((log) => log.toLowerCase().includes(query.toLowerCase()));
      }
  
      const safeSortDirection = sortDirection.toUpperCase() === "ASC" ? 1 : -1;
      logs.sort((a, b) => {
        const matchA = a.match(/\[(.+?)\]/);
        const matchB = b.match(/\[(.+?)\]/);
        const timeA = matchA ? moment(matchA[1], "YYYY-MM-DD HH:mm:ss", true).unix() : 0;
        const timeB = matchB ? moment(matchB[1], "YYYY-MM-DD HH:mm:ss", true).unix() : 0;
        if (isNaN(timeA) || isNaN(timeB)) {
          console.warn(`Invalid timestamp in log: ${a} or ${b}`);
        }
        return (timeA - timeB) * safeSortDirection;
      });
  
      const total = logs.length;
      const start = (page - 1) * pageSize;
      const paginatedLogs = logs.slice(start, start + parseInt(pageSize));
  
      return {
        logs: paginatedLogs.map((log) => {
          const match = log.match(/\[(.+?)\]/);
          const timestamp = match
            ? moment(match[1], "YYYY-MM-DD HH:mm:ss", true).isValid()
              ? match[1]
              : "Invalid Date"
            : "Invalid Date";
          return { log, timestamp };
        }),
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      };
    } catch (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }
  }
}

export default AdminModel;