import Medication from "../models/medication.js";
import { db as firebaseDb } from "../server.js"; // Firebase Realtime Database
import db from "../config/db.js"; // MySQL connection pool

class MedicationController {
  static async addMedication(req, res) {
    try {
      const firebaseUid = req.user.uid;
      console.log(`Firebase UID: ${firebaseUid}`);

      // Fetch the user's id from the users table using the Firebase UID
      const userQuery = `
        SELECT id FROM users
        WHERE uid = ?
      `;
      const [userRows] = await db.query(userQuery, [firebaseUid]);

      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }

      const userId = userRows[0].id;

      const { medication_name, dosage, frequency, times_per_day, times, doses, start_date, end_date, notes } = req.body;

      if (!medication_name || !dosage || !frequency || !times_per_day || !times || !doses || !start_date || !end_date) {
        return res.status(400).json({ error: "All required fields must be provided" });
      }

      // Validate frequency
      const validFrequencies = ['daily', 'weekly', 'monthly'];
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

      // Validate doses array
      if (!Array.isArray(doses) || doses.length !== times_per_day) {
        return res.status(400).json({ error: "doses must be an array with length equal to times_per_day" });
      }
      if (!doses.every((dose) => dose.time && typeof dose.taken === 'boolean' && typeof dose.missed === 'boolean')) {
        return res.status(400).json({ error: "Each dose must have time, taken, and missed properties" });
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
        return res.status(400).json({ error: "Dates must be in YYYY-MM-DD format (e.g., 2025-04-09)" });
      }

      const medicationData = {
        userId,
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

      const newMedication = await Medication.add(medicationData);

      await firebaseDb.ref(`medications/${firebaseUid}/${newMedication.id}`).set({
        ...medicationData,
        id: newMedication.id,
      });

      res.status(201).json(newMedication);
    } catch (error) {
      console.error("Error adding medication:", error.message, error.stack);
      res.status(500).json({ error: "Failed to add medication", details: error.message });
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
      res.status(200).json(medications);
    } catch (error) {
      console.error("Error getting medications:", error);
      res.status(500).json({ error: "Failed to get medications" });
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
        ...updatedData,
        id: parseInt(id),
        userId,
      });

      res.status(200).json(updatedMedication);
    } catch (error) {
      console.error("Error updating medication:", error);
      res.status(500).json({ error: "Failed to update medication" });
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
      console.error("Error deleting medication:", error);
      res.status(500).json({ error: "Failed to delete medication" });
    }
  }

  static async updateTakenStatus(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id } = req.params;
      const { doseIndex, taken } = req.body;
      const medications = await Medication.getByUser(userId);
      if (!medications.some((med) => med.id === parseInt(id))) {
        return res.status(404).json({ error: "Medication not found" });
      }

      const updatedMedication = await Medication.updateTakenStatus(id, doseIndex, taken);

      await firebaseDb.ref(`medications/${firebaseUid}/${id}/doses`).set(updatedMedication.doses);

      res.status(200).json(updatedMedication);
    } catch (error) {
      console.error("Error updating medication status:", error);
      res.status(500).json({ error: "Failed to update medication status" });
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
      const { doseIndex, missed } = req.body;
      const medications = await Medication.getByUser(userId);
      if (!medications.some((med) => med.id === parseInt(id))) {
        return res.status(404).json({ error: "Medication not found" });
      }

      const updatedMedication = await Medication.markAsMissed(id, doseIndex, missed);

      await firebaseDb.ref(`medications/${firebaseUid}/${id}/doses`).set(updatedMedication.doses);

      res.status(200).json(updatedMedication);
    } catch (error) {
      console.error("Error marking medication as missed:", error);
      res.status(500).json({ error: "Failed to mark medication as missed" });
    }
  }
}

export default MedicationController;