import db from "../config/db.js";
import moment from "moment";

class Medication {
  static safeParseJSON(jsonString, defaultValue = {}) {
    if (jsonString && typeof jsonString === "object") {
      return jsonString;
    }
    if (!jsonString || jsonString === "") {
      return defaultValue;
    }
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      if (typeof jsonString === "string" && jsonString.includes(",")) {
        const times = jsonString.split(",").map(time => time.trim());
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
        if (times.every(time => timeRegex.test(time))) {
          return times;
        }
      }
      console.error(`Error parsing JSON: ${jsonString}`, error.message);
      return defaultValue;
    }
  }

  static validateDoses(doses, times_per_day, times) {
    if (typeof doses !== "object" || Array.isArray(doses) || !doses) {
      return false;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const date in doses) {
      if (!dateRegex.test(date)) return false;
      if (!Array.isArray(doses[date])) return false;
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
      [start_date]: times.map((time, index) => ({
        time,
        taken: false,
        missed: false,
        takenAt: null,
        doseIndex: index,
      })),
    };

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
        let times = this.safeParseJSON(row.times, []);
        if (typeof times === "string") {
          times = this.safeParseJSON(times, []);
        }
        if (!Array.isArray(times)) {
          console.warn(`Invalid times for medication ${row.id}, resetting to empty array`);
          times = [];
        }

        let doses = this.safeParseJSON(row.doses, {});
        let dosesUpdated = false;

        // Validate and fix doses
        if (!this.validateDoses(doses, row.times_per_day, times)) {
          console.warn(`Invalid doses for medication ${row.id}, attempting to repair`);
          const newDoses = {};
          for (const date in doses) {
            if (!Array.isArray(doses[date])) {
              newDoses[date] = times.map((time) => ({
                time,
                taken: false,
                missed: false,
                takenAt: null,

              }));
              dosesUpdated = true;
            } else if (doses[date].length !== row.times_per_day) {
              newDoses[date] = times.map((time) => ({
                time,
                taken: false,
                missed: false,
                takenAt: null,

              }));
              dosesUpdated = true;
            } else {
              newDoses[date] = doses[date];
            }
          }
          doses = newDoses;
        }

        // Initialize doses for all dates between start_date and end_date
        const startDate = new Date(row.start_date);
        const endDate = new Date(row.end_date || new Date());
        const currentDate = new Date(startDate);

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

        if (dosesUpdated || !Array.isArray(row.times)) {
          await db.query("UPDATE medications SET times = ?, doses = ? WHERE id = ?", [
            JSON.stringify(times),
            JSON.stringify(doses),
            row.id,
          ]);
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
      if (times && (!Array.isArray(times) || (times_per_day && times.length !== times_per_day))) {
        throw new Error("Invalid times array or times_per_day mismatch");
      }

      const existing = await this.getById(id);
      const updatedTimes = times || existing.times;
      const updatedDoses = doses || existing.doses;
      const updatedTimesPerDay = times_per_day || existing.times_per_day;

      for (const date in updatedDoses) {
        if (updatedDoses[date].length !== updatedTimesPerDay) {
          updatedDoses[date] = updatedTimes.map((time) => ({
            time,
            taken: false,
            missed: false,
            takenAt: null,
          }));
        }
      }

      const query = `
        UPDATE medications
        SET medication_name = ?, dosage = ?, frequency = ?, times_per_day = ?, times = ?, doses = ?, start_date = ?, end_date = ?, notes = ?
        WHERE id = ?
      `;
      const values = [
        medication_name || existing.medication_name,
        dosage || existing.dosage,
        frequency || existing.frequency,
        updatedTimesPerDay,
        JSON.stringify(updatedTimes),
        JSON.stringify(updatedDoses),
        start_date || existing.start_date,
        end_date || existing.end_date,
        notes || existing.notes,
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
      const [rows] = await db.query("SELECT doses, times, times_per_day FROM medications WHERE id = ?", [id]);
      if (rows.length === 0) {
        throw new Error("Medication not found");
      }
      let doses = this.safeParseJSON(rows[0].doses, {});
      const times = this.safeParseJSON(rows[0].times, []);
      const times_per_day = rows[0].times_per_day;

      if (!doses[date]) {
        doses[date] = times.map((time, index) => ({
          time,
          taken: false,
          missed: false,
          takenAt: null,
          doseIndex: index,
        }));
      }
      if (!doses[date] || doses[date].length !== times_per_day) {
        throw new Error(`Doses for date ${date} are invalid or do not match times_per_day (${times_per_day})`);
      }
      if (doseIndex >= times_per_day || doseIndex < 0) {
        throw new Error(`Invalid doseIndex: ${doseIndex}. Must be between 0 and ${times_per_day - 1}`);
      }

      if (taken) {
        const doseTime = doses[date][doseIndex].time;
        const doseDateTime = moment(`${date} ${doseTime}`, "YYYY-MM-DD HH:mm:ss");
        const now = moment().local();
        console.log(`Time now according to updateTakenStatus in medication model: ${now}`);
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
      const [rows] = await db.query("SELECT doses, times, times_per_day FROM medications WHERE id = ?", [id]);
      if (rows.length === 0) {
        throw new Error("Medication not found");
      }
      let doses = this.safeParseJSON(rows[0].doses, {});
      const times = this.safeParseJSON(rows[0].times, []);
      const times_per_day = rows[0].times_per_day;

      if (!doses[date]) {
        doses[date] = times.map((time, index) => ({
          time,
          taken: false,
          missed: false,
          takenAt: null,
          doseIndex: index,
        }));
      }
      if (!doses[date] || doses[date].length !== times_per_day) {
        throw new Error(`Doses for date ${date} are invalid or do not match times_per_day (${times_per_day})`);
      }
      if (doseIndex >= times_per_day || doseIndex < 0) {
        throw new Error(`Invalid doseIndex: ${doseIndex}. Must be between 0 and ${times_per_day - 1}`);
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