import db from "../config/db.js";
import moment from "moment";

class Medication {
  static safeParseJSON(jsonString, defaultValue = {}) {
    if (!jsonString || jsonString === "") {
      return defaultValue;
    }
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error(`Error parsing JSON: ${jsonString}`, error.message);
      return defaultValue;
    }
  }

  static validateDoses(doses, times_per_day) {
    if (typeof doses !== "object" || Array.isArray(doses) || !doses) {
      return false;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const date in doses) {
      if (!dateRegex.test(date)) return false;
      if (!Array.isArray(doses[date]) || doses[date].length !== times_per_day) return false;
      if (
        !doses[date].every(
          (dose) =>
            typeof dose.time === "string" &&
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(dose.time) &&
            typeof dose.taken === "boolean" &&
            typeof dose.missed === "boolean" &&
            (dose.takenAt === null || typeof dose.takenAt === "string")
        )
      ) {
        return false;
      }
    }
    return true;
  }

  static async add(medicationData) {
    const { userId, medication_name, dosage, frequency, times_per_day, times, start_date, end_date, notes } = medicationData;
    if (!times || !Array.isArray(times) || times.length !== times_per_day) {
      throw new Error("Invalid times array or times_per_day mismatch");
    }

    const initialDoses = {
      [start_date]: times.map((time) => ({
        time,
        taken: false,
        missed: false,
        takenAt: null,
      })),
    };

    if (!this.validateDoses(initialDoses, times_per_day)) {
      throw new Error("Invalid initial doses structure");
    }

    const query = `
      INSERT INTO medications (user_id, medication_name, dosage, frequency, times_per_day, times, doses, start_date, end_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      userId,
      medication_name,
      dosage,
      frequency,
      times_per_day,
      JSON.stringify(times),
      JSON.stringify(initialDoses),
      start_date,
      end_date,
      notes || null,
    ];

    try {
      const [result] = await db.query(query, values);
      return { id: result.insertId, ...medicationData, doses: initialDoses };
    } catch (error) {
      console.error("Database error in Medication.add:", error.message, error.sqlMessage);
      throw new Error(`Failed to add medication to database: ${error.message}`);
    }
  }

  static async getByUser(userId) {
    try {
      const query = `
        SELECT * FROM medications
        WHERE user_id = ?
      `;
      const [rows] = await db.query(query, [userId]);

      const updatedRows = [];

      for (const row of rows) {
        let doses = this.safeParseJSON(row.doses, {});
        const times = this.safeParseJSON(row.times, []);

        if (!this.validateDoses(doses, row.times_per_day)) {
          console.warn(`Invalid doses for medication ${row.id}, resetting to default`);
          doses = {};
        }

        // Initialize doses for all dates between start_date and end_date
        const startDate = new Date(row.start_date);
        const endDate = new Date(row.end_date || new Date());
        const currentDate = new Date(startDate);
        let dosesUpdated = false;

        while (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split("T")[0];
          if (!doses[dateStr] && new Date(dateStr) >= startDate && new Date(dateStr) <= endDate) {
            doses[dateStr] = times.map((time) => ({
              time,
              taken: false,
              missed: false,
              takenAt: null,
            }));
            dosesUpdated = true;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        if (dosesUpdated) {
          await db.query("UPDATE medications SET doses = ? WHERE id = ?", [JSON.stringify(doses), row.id]);
        }

        updatedRows.push({
          ...row,
          times,
          doses,
        });
      }

      return updatedRows;
    } catch (error) {
      console.error("Database error in Medication.getByUser:", error.message, error.sqlMessage);
      throw new Error(`Failed to fetch medications for user: ${error.message}`);
    }
  }

  static async update(id, updatedData) {
    try {
      const { medication_name, dosage, frequency, times_per_day, times, doses, start_date, end_date, notes } = updatedData;
      if (times && (!Array.isArray(times) || times.length !== times_per_day)) {
        throw new Error("Invalid times array or times_per_day mismatch");
      }
      if (doses && !this.validateDoses(doses, times_per_day)) {
        throw new Error("Invalid doses structure");
      }

      const query = `
        UPDATE medications
        SET medication_name = ?, dosage = ?, frequency = ?, times_per_day = ?, times = ?, doses = ?, start_date = ?, end_date = ?, notes = ?
        WHERE id = ?
      `;
      const values = [
        medication_name,
        dosage,
        frequency,
        times_per_day,
        times ? JSON.stringify(times) : null,
        doses ? JSON.stringify(doses) : null,
        start_date,
        end_date,
        notes || null,
        id,
      ];
      await db.query(query, values);
      return this.getById(id);
    } catch (error) {
      console.error("Database error in Medication.update:", error.message, error.sqlMessage);
      throw new Error(`Failed to update medication: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const query = `
        SELECT * FROM medications
        WHERE id = ?
      `;
      const [rows] = await db.query(query, [id]);
      if (rows.length === 0) {
        throw new Error("Medication not found");
      }
      const row = rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        medication_name: row.medication_name,
        dosage: row.dosage,
        frequency: row.frequency,
        times_per_day: row.times_per_day,
        times: this.safeParseJSON(row.times, []),
        doses: this.safeParseJSON(row.doses, {}),
        start_date: row.start_date,
        end_date: row.end_date,
        notes: row.notes,
      };
    } catch (error) {
      console.error("Database error in Medication.getById:", error.message, error.sqlMessage);
      throw error;
    }
  }

  static async update(id, updatedData) {
    try {
      const { medication_name, dosage, frequency, times_per_day, times, doses, start_date, end_date, notes } = updatedData;
      if (times && (!Array.isArray(times) || times.length !== times_per_day)) {
        throw new Error("Invalid times array or times_per_day mismatch");
      }
      if (doses && (typeof doses !== "object" || Array.isArray(doses))) {
        throw new Error("Doses must be an object with date keys");
      }

      const query = `
        UPDATE medications
        SET medication_name = ?, dosage = ?, frequency = ?, times_per_day = ?, times = ?, doses = ?, start_date = ?, end_date = ?, notes = ?
        WHERE id = ?
      `;
      const values = [
        medication_name,
        dosage,
        frequency,
        times_per_day,
        JSON.stringify(times || []),
        JSON.stringify(doses || {}),
        start_date,
        end_date,
        notes || null,
        id,
      ];
      await db.query(query, values);
      return this.getById(id);
    } catch (error) {
      console.error("Database error in Medication.update:", error.message, error.sqlMessage);
      throw new Error(`Failed to update medication: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const query = `
        DELETE FROM medications
        WHERE id = ?
      `;
      const [result] = await db.query(query, [id]);
      if (result.affectedRows === 0) {
        throw new Error("Medication not found");
      }
      return true;
    } catch (error) {
      console.error("Database error in Medication.delete:", error.message, error.sqlMessage);
      throw new Error(`Failed to delete medication: ${error.message}`);
    }
  }

  static async updateTakenStatus(id, doseIndex, taken, date) {
    try {
      const [rows] = await db.query("SELECT doses, times FROM medications WHERE id = ?", [id]);
      if (rows.length === 0) {
        throw new Error("Medication not found");
      }
      const doses = this.safeParseJSON(rows[0].doses, {});
      const times = this.safeParseJSON(rows[0].times, []);

      if (!doses[date]) {
        doses[date] = times.map((time) => ({
          time,
          taken: false,
          missed: false,
          takenAt: null,
        }));
      }
      if (doseIndex >= doses[date].length || doseIndex < 0) {
        throw new Error(`Invalid doseIndex: ${doseIndex}. Must be between 0 and ${doses[date].length - 1}`);
      }

      // Validate 2-hour window
      if (taken) {
        const doseTime = doses[date][doseIndex].time;
        const doseDateTime = moment(`${date} ${doseTime}`, "YYYY-MM-DD HH:mm:ss");
        const now = moment.tz.setDefault();
        const hoursDiff = Math.abs(doseDateTime.diff(now, "hours", true));
        if (hoursDiff > 2) {
          throw new Error("Can only mark medication as taken within 2 hours of the scheduled time");
        }
      }

      doses[date][doseIndex] = {
        ...doses[date][doseIndex],
        taken,
        missed: taken ? false : doses[date][doseIndex].missed,
        takenAt: taken ? new Date().toISOString() : null,
      };

      const query = `
        UPDATE medications
        SET doses = ?
        WHERE id = ?
      `;
      await db.query(query, [JSON.stringify(doses), id]);
      return this.getById(id);
    } catch (error) {
      console.error("Database error in Medication.updateTakenStatus:", error.message, error.sqlMessage);
      throw new Error(`Failed to update taken status: ${error.message}`);
    }
  }

  static async markAsMissed(id, doseIndex, missed, date) {
    try {
      const [rows] = await db.query("SELECT doses, times FROM medications WHERE id = ?", [id]);
      if (rows.length === 0) {
        throw new Error("Medication not found");
      }
      const doses = this.safeParseJSON(rows[0].doses, {});
      const times = this.safeParseJSON(rows[0].times, []);

      if (!doses[date]) {
        doses[date] = times.map((time) => ({
          time,
          taken: false,
          missed: false,
          takenAt: null,
        }));
      }
      if (doseIndex >= doses[date].length || doseIndex < 0) {
        throw new Error(`Invalid doseIndex: ${doseIndex}. Must be between 0 and ${doses[date].length - 1}`);
      }

      doses[date][doseIndex] = {
        ...doses[date][doseIndex],
        missed,
        taken: missed ? false : doses[date][doseIndex].taken,
        takenAt: missed ? null : doses[date][doseIndex].takenAt,
      };

      const query = `
        UPDATE medications
        SET doses = ?
        WHERE id = ?
      `;
      await db.query(query, [JSON.stringify(doses), id]);
      return this.getById(id);
    } catch (error) {
      console.error("Database error in Medication.markAsMissed:", error.message, error.sqlMessage);
      throw new Error(`Failed to mark as missed: ${error.message}`);
    }
  }
}

export default Medication;