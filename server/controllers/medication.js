import Medication from "../models/medication.js";
import { db as firebaseDb } from "../server.js"; // Firebase Realtime Database
import db from "../config/db.js"; // MySQL connection pool

class MedicationController {
  static async addMedication(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { medication_name, dosage, frequency, times_per_day, times, start_date, end_date, notes } = req.body;

      // Validate required fields
      if (!medication_name || !dosage || !frequency || !times_per_day || !times || !start_date) {
        return res.status(400).json({ error: "All required fields must be provided" });
      }

      // Validate frequency
      const validFrequencies = ["daily", "weekly", "monthly"];
      if (!validFrequencies.includes(frequency)) {
        return res.status(400).json({ error: "Frequency must be one of: daily, weekly, monthly" });
      }

      // Validate times_per_day
      if (!Number.isInteger(times_per_day) || times_per_day < 1 || times_per_day > 3) {
        return res.status(400).json({ error: "times_per_day must be an integer between 1 and 3" });
      }

      // Validate times array
      if (!Array.isArray(times) || times.length !== times_per_day) {
        return res.status(400).json({ error: "times must be an array with length equal to times_per_day" });
      }
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
      if (!times.every((time) => timeRegex.test(time))) {
        return res.status(400).json({ error: "Each time must be in HH:mm:ss format (e.g., 08:00:00)" });
      }

      // Validate dates
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(start_date) || (end_date && !dateRegex.test(end_date))) {
        return res.status(400).json({ error: "Dates must be in YYYY-MM-DD format (e.g., 2025-04-09)" });
      }

      const medicationData = {
        userId,
        medication_name,
        dosage,
        frequency,
        times_per_day,
        times,
        start_date,
        end_date,
        notes,
      };

      const newMedication = await Medication.add(medicationData);

      await firebaseDb.ref(`medications/${firebaseUid}/${newMedication.id}`).set({
        id: newMedication.id,
        userId,
        medication_name,
        dosage,
        frequency,
        times_per_day,
        times,
        doses: newMedication.doses || {},
        start_date,
        end_date,
        notes,
      });

      res.status(201).json(newMedication);
    } catch (error) {
      console.error("Error adding medication:", error.message, error.stack);
      res.status(500).json({ error: "Failed to add medication", details: error.message });
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
        doses[date] = times.map((time) => ({
          time,
          taken: false,
          missed: false,
          takenAt: null,
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
        missed: taken ? false : false,
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

  static async getUserMedications(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const medications = await Medication.getByUser(userId);
      medications.forEach((med) => {
        firebaseDb.ref(`medications/${firebaseUid}/${med.id}`).set({
          id: med.id,
          userId: med.user_id,
          medication_name: med.medication_name,
          dosage: med.dosage,
          frequency: med.frequency,
          times_per_day: med.times_per_day,
          times: med.times,
          doses: med.doses,
          start_date: med.start_date,
          end_date: med.end_date,
          notes: med.notes,
        });
      });
      res.status(200).json(medications);
    } catch (error) {
      console.error("Error getting medications:", error.message, error.stack);
      res.status(500).json({ error: "Failed to get medications", details: error.message });
    }
  }

  static async updateMedication(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id } = req.params;
      const { medication_name, dosage, frequency, times_per_day, times, doses, start_date, end_date, notes } = req.body;

      const medications = await Medication.getByUser(userId);
      if (!medications.some((med) => med.id === parseInt(id))) {
        return res.status(404).json({ error: "Medication not found" });
      }

      // Validate frequency
      if (frequency) {
        const validFrequencies = ["daily", "weekly", "monthly"];
        if (!validFrequencies.includes(frequency)) {
          return res.status(400).json({ error: "Frequency must be one of: daily, weekly, monthly" });
        }
      }

      // Validate times_per_day
      if (times_per_day && (!Number.isInteger(times_per_day) || times_per_day < 1 || times_per_day > 3)) {
        return res.status(400).json({ error: "times_per_day must be an integer between 1 and 3" });
      }

      // Validate times array
      if (times) {
        if (!Array.isArray(times) || (times_per_day && times.length !== times_per_day)) {
          return res.status(400).json({ error: "times must be an array with length equal to times_per_day" });
        }
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
        if (!times.every((time) => timeRegex.test(time))) {
          return res.status(400).json({ error: "Each time must be in HH:mm:ss format (e.g., 08:00:00)" });
        }
      }

      // Validate doses object
      if (doses) {
        if (typeof doses !== "object" || Array.isArray(doses)) {
          return res.status(400).json({ error: "doses must be an object with date keys (e.g., { 'YYYY-MM-DD': [{ time, taken, missed }, ...] })" });
        }
        for (const date in doses) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ error: "Dose date keys must be in YYYY-MM-DD format" });
          }
          if (!Array.isArray(doses[date])) {
            return res.status(400).json({ error: `doses[${date}] must be an array` });
          }
          const expectedLength = times_per_day || medications.find((med) => med.id === parseInt(id)).times_per_day;
          if (doses[date].length !== expectedLength) {
            return res.status(400).json({ error: `doses[${date}] length must equal times_per_day (${expectedLength})` });
          }
          if (
            !doses[date].every(
              (dose) =>
                dose.time &&
                typeof dose.taken === "boolean" &&
                typeof dose.missed === "boolean" &&
                (dose.takenAt === null || typeof dose.takenAt === "string")
            )
          ) {
            return res.status(400).json({
              error: "Each dose must have time (HH:mm:ss), taken (boolean), missed (boolean), and takenAt (string or null) properties",
            });
          }
        }
      }

      // Validate date format
      if (start_date || end_date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if ((start_date && !dateRegex.test(start_date)) || (end_date && !dateRegex.test(end_date))) {
          return res.status(400).json({ error: "Dates must be in YYYY-MM-DD format (e.g., 2025-04-09)" });
        }
      }

      const updatedData = {
        medication_name,
        dosage,
        frequency,
        times_per_day,
        times,
        doses,
        start_date,
        end_date,
        notes,
      };

      const updatedMedication = await Medication.update(id, updatedData);

      await firebaseDb.ref(`medications/${firebaseUid}/${id}`).set({
        id: updatedMedication.id,
        userId: updatedMedication.userId,
        medication_name: updatedMedication.medication_name,
        dosage: updatedMedication.dosage,
        frequency: updatedMedication.frequency,
        times_per_day: updatedMedication.times_per_day,
        times: updatedMedication.times,
        doses: updatedMedication.doses,
        start_date: updatedMedication.start_date,
        end_date: updatedMedication.end_date,
        notes: updatedMedication.notes,
      });

      res.status(200).json(updatedMedication);
    } catch (error) {
      console.error("Error updating medication:", error.message, error.stack);
      res.status(500).json({ error: "Failed to update medication", details: error.message });
    }
  }

  static async deleteMedication(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id } = req.params;
      const medications = await Medication.getByUser(userId);
      if (!medications.some((med) => med.id === parseInt(id))) {
        return res.status(404).json({ error: "Medication not found" });
      }

      await Medication.delete(id);

      await firebaseDb.ref(`medications/${firebaseUid}/${id}`).remove();

      res.status(200).json({ message: "Medication deleted successfully" });
    } catch (error) {
      console.error("Error deleting medication:", error.message, error.stack);
      res.status(500).json({ error: "Failed to delete medication", details: error.message });
    }
  }

  static async markAsMissed(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id } = req.params;
      const { doseIndex, missed, date } = req.body;

      if (!Number.isInteger(doseIndex) || doseIndex < 0) {
        return res.status(400).json({ error: "doseIndex must be a non-negative integer" });
      }
      if (typeof missed !== "boolean") {
        return res.status(400).json({ error: "missed must be a boolean value" });
      }
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: "date must be in YYYY-MM-DD format" });
      }

      const medications = await Medication.getByUser(userId);
      if (!medications.some((med) => med.id === parseInt(id))) {
        return res.status(404).json({ error: "Medication not found" });
      }

      const updatedMedication = await Medication.markAsMissed(id, doseIndex, missed, date);

      await firebaseDb.ref(`medications/${firebaseUid}/${id}`).set({
        id: updatedMedication.id,
        userId: updatedMedication.userId,
        medication_name: updatedMedication.medication_name,
        dosage: updatedMedication.dosage,
        frequency: updatedMedication.frequency,
        times_per_day: updatedMedication.times_per_day,
        times: updatedMedication.times,
        doses: updatedMedication.doses,
        start_date: updatedMedication.start_date,
        end_date: updatedMedication.end_date,
        notes: updatedMedication.notes,
      });

      res.status(200).json(updatedMedication);
    } catch (error) {
      console.error("Error marking medication as missed:", error.message, error.stack);
      res.status(500).json({ error: "Failed to mark medication as missed", details: error.message });
    }
  }
}

export default MedicationController;