import db from "../config/db.js";

class Reminder {
  static async add(data) {
    try {
      const { userId, medication_id, dose_index, reminder_time, date, type, status } = data;

      // Validate required fields
      if (!userId || !medication_id || !Number.isInteger(dose_index) || !reminder_time || !date || !type) {
        throw new Error("All required fields (userId, medication_id, dose_index, reminder_time, date, type) must be provided");
      }
      if (!["single", "daily"].includes(type)) {
        throw new Error("Type must be 'single' or 'daily'");
      }

      const query = `
        INSERT INTO reminders (user_id, medication_id, dose_index, reminder_time, date, type, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [userId, medication_id, dose_index, reminder_time, date, type, status || "pending"];
      console.log("Executing query:", query, "with values:", values);
      const [result] = await db.query(query, values);

      const [newReminder] = await db.query("SELECT * FROM reminders WHERE id = ?", [result.insertId]);
      return newReminder[0];
    } catch (error) {
      console.error("Database error in Reminder.add:", error.message, error.sqlMessage);
      throw new Error(`Failed to add reminder: ${error.message}`);
    }
  }

  static async update(id, data) {
    try {
      const { reminder_time, date, type, status } = data;
      const updates = [];
      const values = [];

      if (reminder_time) {
        updates.push("reminder_time = ?");
        values.push(reminder_time);
      }
      if (date) {
        updates.push("date = ?");
        values.push(date);
      }
      if (type) {
        updates.push("type = ?");
        values.push(type);
      }
      if (status) {
        updates.push("status = ?");
        values.push(status);
      }

      if (updates.length === 0) {
        throw new Error("No fields to update");
      }

      const query = `
        UPDATE reminders
        SET ${updates.join(", ")}
        WHERE id = ?
      `;
      values.push(id);

      const [result] = await db.query(query, values);
      if (result.affectedRows === 0) {
        throw new Error("Reminder not found");
      }

      const [updated] = await db.query("SELECT * FROM reminders WHERE id = ?", [id]);
      return updated[0];
    } catch (error) {
      console.error("Database error in Reminder.update:", error.message, error.sqlMessage);
      throw new Error(`Failed to update reminder: ${error.message}`);
    }
  }

  static async getByUser(userId) {
    try {
      const query = `
        SELECT * FROM reminders
        WHERE user_id = ?
      `;
      const [rows] = await db.query(query, [userId]);
      return rows;
    } catch (error) {
      console.error("Database error in Reminder.getByUser:", error.message, error.sqlMessage);
      throw new Error(`Failed to fetch reminders for user: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const query = `
        DELETE FROM reminders
        WHERE id = ?
      `;
      const [result] = await db.query(query, [id]);
      if (result.affectedRows === 0) {
        throw new Error("Reminder not found");
      }
      return true;
    } catch (error) {
      console.error("Database error in Reminder.delete:", error.message, error.sqlMessage);
      throw new Error(`Failed to delete reminder: ${error.message}`);
    }
  }

  static async updateStatus(id, status) {
    try {
      const query = `
        UPDATE reminders
        SET status = ?
        WHERE id = ?
      `;
      const [result] = await db.query(query, [status, id]);
      if (result.affectedRows === 0) {
        throw new Error("Reminder not found");
      }
      const [updated] = await db.query("SELECT * FROM reminders WHERE id = ?", [id]);
      return updated[0];
    } catch (error) {
      console.error("Database error in Reminder.updateStatus:", error.message, error.sqlMessage);
      throw new Error(`Failed to update reminder status: ${error.message}`);
    }
  }
}

export default Reminder;