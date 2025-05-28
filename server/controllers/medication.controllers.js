import Medication from "../models/medication.models.js";
import { db as firebaseDb } from "../server.js";
import db from "../config/db.js";
import moment from "moment-timezone";

// Helper functions
const safeParseJSON = (input, defaultValue = {}) => {
  try {
    if (typeof input === "object") {
      return input === null ? defaultValue : input;
    }
    return input ? JSON.parse(input) : defaultValue;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return defaultValue;
  }
};

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.join(__dirname, "../utils");
const logFilePath = path.join(logDir, "medicationlogs.txt");

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

class MedicationController {
  static async addMedication(req, res) {
    logToFile(`Starting addMedication for user ${req.user.uid}`);
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        logToFile(`User not found for uid: ${firebaseUid}`, "ERROR");
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { medication_name, dosage, frequency, times_per_day, times, start_date, end_date, notes } = req.body;
      logToFile(`Received data: ${JSON.stringify({ medication_name, dosage, frequency, times_per_day, times, start_date, end_date, notes })}`);

      if (!medication_name || !dosage || !frequency || !times_per_day || !times || !start_date) {
        logToFile("Missing required fields", "ERROR");
        return res.status(400).json({ error: "All required fields must be provided" });
      }

      const validFrequencies = ["daily", "weekly", "monthly"];
      if (!validFrequencies.includes(frequency)) {
        logToFile(`Invalid frequency: ${frequency}`, "ERROR");
        return res.status(400).json({ error: "Frequency must be one of: daily, weekly, monthly" });
      }

      if (!Number.isInteger(times_per_day) || times_per_day < 1 || times_per_day > 3) {
        logToFile(`Invalid times_per_day: ${times_per_day}`, "ERROR");
        return res.status(400).json({ error: "times_per_day must be an integer between 1 and 3" });
      }

      if (!Array.isArray(times) || times.length !== times_per_day) {
        logToFile(`Invalid times array: ${JSON.stringify(times)}`, "ERROR");
        return res.status(400).json({ error: "times must be an array with length equal to times_per_day" });
      }
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
      if (!times.every((time) => timeRegex.test(time))) {
        logToFile(`Invalid time format in times: ${JSON.stringify(times)}`, "ERROR");
        return res.status(400).json({ error: "Each time must be in HH:mm:ss format (e.g., 08:00:00)" });
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(start_date) || (end_date && !dateRegex.test(end_date))) {
        logToFile(`Invalid date format: ${start_date} or ${end_date}`, "ERROR");
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
      logToFile(`Medication added successfully with id: ${newMedication.id}`);

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
      logToFile(`Firebase sync completed for medication id: ${newMedication.id}`);

      res.status(201).json(newMedication);
    } catch (error) {
      logToFile(`Error adding medication: ${error.message}\n${error.stack}`, "ERROR");
      res.status(500).json({ error: "Failed to add medication", details: error.message });
    }
  }

  static async getById(id) {
    logToFile(`Starting getById for medication id ${id}`);
    try {
      const [rows] = await db.query(
        "SELECT m.*, u.uid as firebase_uid FROM medications m JOIN users u ON m.user_id = u.id WHERE m.id = ?",
        [id]
      );

      if (rows.length === 0) {
        logToFile(`Medication not found for id: ${id}`, "ERROR");
        throw new Error("Medication not found");
      }

      const medication = rows[0];
      const result = {
        id: medication.id,
        userId: medication.user_id,
        medication_name: medication.medication_name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        times_per_day: medication.times_per_day,
        times: safeParseJSON(medication.times, []),
        doses: safeParseJSON(medication.doses, {}),
        start_date: medication.start_date,
        end_date: medication.end_date,
        notes: medication.notes,
      };
      logToFile(`Retrieved medication with id: ${id}`);
      return result;
    } catch (error) {
      logToFile(`Error getting medication by ID: ${error.message}\n${error.stack}`, "ERROR");
      throw error;
    }
  }

  static async updateTakenStatus(req, res) {
    logToFile(`Starting updateTakenStatus for user ${req.user.uid}, medication id ${req.params.id}`);
    try {
      const { id } = req.params;
      const { date, doseIndex, taken } = req.body;
      const firebaseUid = req.user.uid;
      logToFile(`Received data: ${JSON.stringify({ id, date, doseIndex, taken })}`);
  
      if (!id || date === undefined || doseIndex === undefined || taken === undefined) {
        logToFile("Missing required parameters", "ERROR");
        return res.status(400).json({ error: "Missing required parameters" });
      }
  
      const [userMedRows] = await db.query(
        "SELECT m.*, u.uid as firebase_uid FROM medications m JOIN users u ON m.user_id = u.id WHERE m.id = ? AND u.uid = ?",
        [id, firebaseUid]
      );
      logToFile("Medication lookup: ", {
        medicationId: id,
        firebaseUid,
        foundRows: userMedRows ? userMedRows.length : 0,
        firstRow: userMedRows && userMedRows[0] ? { id: userMedRows[0].id, user_id: userMedRows[0].user_id, firebase_uid: userMedRows[0].firebase_uid } : null,
      });
  
      if (!userMedRows || userMedRows.length === 0) {
        const [medRows] = await db.query("SELECT * FROM medications WHERE id = ?", [id]);
        if (medRows && medRows.length > 0) {
          logToFile(`Unauthorized access to medication id: ${id}`, "ERROR");
          return res.status(403).json({
            error: "Unauthorized: Medication exists but does not belong to this user",
            details: { medicationId: id, firebaseUid },
          });
        }
        logToFile(`Medication not found for id: ${id}`, "ERROR");
        return res.status(404).json({
          error: "Medication not found",
          details: { medicationId: id, firebaseUid },
        });
      }
  
      const medication = userMedRows[0];
      let doses = safeParseJSON(medication.doses);
      const times = safeParseJSON(medication.times, []);
      const times_per_day = medication.times_per_day;
  
      if (!doses[date]) {
        doses[date] = Array.from({ length: times_per_day }, (_, index) => ({
          time: times[index] || "",
          taken: false,
          missed: false,
          takenAt: null,
        }));
      }
  
      if (doseIndex >= times_per_day || doseIndex < 0) {
        logToFile(`Invalid doseIndex: ${doseIndex}`, "ERROR");
        return res.status(400).json({ error: `Invalid doseIndex: ${doseIndex}. Must be between 0 and ${times_per_day - 1}` });
      }
  
      if (!doses[date][doseIndex]) {
        doses[date][doseIndex] = {
          time: times[doseIndex] || "",
          taken: false,
          missed: false,
          takenAt: null,
        };
      }
  
      if (taken && times[doseIndex]) {
        const doseTime = times[doseIndex];
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
        if (!timeRegex.test(doseTime)) {
          logToFile(`Invalid doseTime format: ${doseTime}`, "ERROR");
          return res.status(400).json({ error: `Invalid doseTime format: ${doseTime}. Expected HH:mm:ss (e.g., 08:00:00)` });
        }
        const doseDateTime = moment.tz(`${date} ${doseTime}`, "YYYY-MM-DD HH:mm:ss", "Asia/Singapore");
        if (!doseDateTime.isValid()) {
          logToFile(`Failed to parse doseDateTime: ${date} ${doseTime}`, "ERROR");
          return res.status(400).json({ error: `Failed to parse doseDateTime: ${date} ${doseTime}` });
        }
        const now = moment().tz("Asia/Singapore");
        const hoursDiff = Math.abs(doseDateTime.diff(now, "hours", true));
        if (hoursDiff > 2) {
          logToFile(`Taken status outside 2-hour window: ${hoursDiff} hours`, "ERROR");
          return res.status(400).json({ error: "Can only mark medication as taken within 2 hours of the scheduled time" });
        }
      }
  
      doses[date][doseIndex] = {
        ...doses[date][doseIndex],
        taken,
        missed: taken ? false : doses[date][doseIndex].missed,
        takenAt: taken ? new Date().toISOString() : null,
      };
  
      await db.query("UPDATE medications SET doses = ? WHERE id = ?", [JSON.stringify(doses), id]);
      logToFile(`Updated doses for medication id: ${id}`);
  
      const updatedMedication = {
        ...medication,
        doses,
        times,
      };
  
      await firebaseDb.ref(`medications/${firebaseUid}/${id}`).update({
        doses,
        times,
      });
      logToFile(`Firebase sync completed for medication id: ${id}`);
  
      return res.status(200).json(updatedMedication);
    } catch (error) {
      logToFile(`Error updating taken status: ${error.message}\n${error.stack}`, "ERROR");
      return res.status(500).json({
        error: "Failed to update taken status",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }

  static async getUserMedications(req, res) {
    logToFile(`Starting getUserMedications for user ${req.user.uid}`);
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        logToFile(`User not found for uid: ${firebaseUid}`, "ERROR");
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const medications = await Medication.getByUser(userId);
      logToFile(`Retrieved ${medications.length} medications for user ${userId}`);

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
      logToFile(`Firebase sync completed for ${medications.length} medications`);

      res.status(200).json(medications);
    } catch (error) {
      logToFile(`Error getting medications: ${error.message}\n${error.stack}`, "ERROR");
      res.status(500).json({ error: "Failed to get medications", details: error.message });
    }
  }

  static async updateMedication(req, res) {
    logToFile(`Starting updateMedication for user ${req.user.uid}, medication id ${req.params.id}`);
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        logToFile(`User not found for uid: ${firebaseUid}`, "ERROR");
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id } = req.params;
      const { medication_name, dosage, frequency, times_per_day, times, doses, start_date, end_date, notes } = req.body;
      logToFile(`Received update data: ${JSON.stringify({ medication_name, dosage, frequency, times_per_day, times, doses, start_date, end_date, notes })}`);

      const medications = await Medication.getByUser(userId);
      if (!medications.some((med) => med.id === parseInt(id))) {
        logToFile(`Medication not found for id: ${id}`, "ERROR");
        return res.status(404).json({ error: "Medication not found" });
      }

      if (frequency) {
        const validFrequencies = ["daily", "weekly", "monthly"];
        if (!validFrequencies.includes(frequency)) {
          logToFile(`Invalid frequency: ${frequency}`, "ERROR");
          return res.status(400).json({ error: "Frequency must be one of: daily, weekly, monthly" });
        }
      }

      if (times_per_day && (!Number.isInteger(times_per_day) || times_per_day < 1 || times_per_day > 3)) {
        logToFile(`Invalid times_per_day: ${times_per_day}`, "ERROR");
        return res.status(400).json({ error: "times_per_day must be an integer between 1 and 3" });
      }

      if (times) {
        if (!Array.isArray(times) || (times_per_day && times.length !== times_per_day)) {
          logToFile(`Invalid times array: ${JSON.stringify(times)}`, "ERROR");
          return res.status(400).json({ error: "times must be an array with length equal to times_per_day" });
        }
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
        if (!times.every((time) => timeRegex.test(time))) {
          logToFile(`Invalid time format in times: ${JSON.stringify(times)}`, "ERROR");
          return res.status(400).json({ error: "Each time must be in HH:mm:ss format (e.g., 08:00:00)" });
        }
      }

      if (doses) {
        if (typeof doses !== "object" || Array.isArray(doses)) {
          logToFile(`Invalid doses format: ${JSON.stringify(doses)}`, "ERROR");
          return res.status(400).json({ error: "doses must be an object with date keys (e.g., { 'YYYY-MM-DD': [{ time, taken, missed }, ...] })" });
        }
        const expectedLength = times_per_day || medications.find((med) => med.id === parseInt(id)).times_per_day;
        for (const date in doses) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            logToFile(`Invalid dose date key: ${date}`, "ERROR");
            return res.status(400).json({ error: "Dose date keys must be in YYYY-MM-DD format" });
          }
          if (!Array.isArray(doses[date])) {
            logToFile(`Invalid doses[${date}] format`, "ERROR");
            return res.status(400).json({ error: `doses[${date}] must be an array` });
          }
          if (doses[date].length !== expectedLength) {
            logToFile(`Invalid doses[${date}] length: ${doses[date].length}`, "ERROR");
            return res.status(400).json({ error: `doses[${date}] length must equal times_per_day (${expectedLength})` });
          }
          if (
            !doses[date].every(
              (dose) =>
                dose.time && typeof dose.taken === "boolean" && typeof dose.missed === "boolean" && (dose.takenAt === null || typeof dose.takenAt === "string")
            )
          ) {
            logToFile(`Invalid dose properties in doses[${date}]`, "ERROR");
            return res.status(400).json({
              error: "Each dose must have time (HH:mm:ss), taken (boolean), missed (boolean), and takenAt (string or null) properties",
            });
          }
        }
      }

      if (start_date || end_date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if ((start_date && !dateRegex.test(start_date)) || (end_date && !dateRegex.test(end_date))) {
          logToFile(`Invalid date format: ${start_date} or ${end_date}`, "ERROR");
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
      logToFile(`Medication updated successfully with id: ${id}`);

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
      logToFile(`Firebase sync completed for medication id: ${id}`);

      res.status(200).json(updatedMedication);
    } catch (error) {
      logToFile(`Error updating medication: ${error.message}\n${error.stack}`, "ERROR");
      res.status(500).json({ error: "Failed to update medication", details: error.message });
    }
  }

  static async deleteMedication(req, res) {
    logToFile(`Starting deleteMedication for user ${req.user.uid}, medication id ${req.params.id}`);
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        logToFile(`User not found for uid: ${firebaseUid}`, "ERROR");
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id } = req.params;
      const medications = await Medication.getByUser(userId);
      if (!medications.some((med) => med.id === parseInt(id))) {
        logToFile(`Medication not found for id: ${id}`, "ERROR");
        return res.status(404).json({ error: "Medication not found" });
      }

      await Medication.delete(id);
      logToFile(`Medication deleted successfully from MySQL with id: ${id}`);

      await firebaseDb.ref(`medications/${firebaseUid}/${id}`).remove();
      logToFile(`Medication removed from Firebase with id: ${id}`);

      res.status(200).json({ message: "Medication deleted successfully" });
    } catch (error) {
      logToFile(`Error deleting medication: ${error.message}\n${error.stack}`, "ERROR");
      res.status(500).json({ error: "Failed to delete medication", details: error.message });
    }
  }

  static async markAsMissed(req, res) {
    logToFile(`Starting markAsMissed for user ${req.user.uid}, medication id ${req.params.id}`);
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        logToFile(`User not found for uid: ${firebaseUid}`, "ERROR");
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id } = req.params;
      const { doseIndex, missed, date } = req.body;
      logToFile(`Received data: ${JSON.stringify({ doseIndex, missed, date })}`);

      if (!Number.isInteger(doseIndex) || doseIndex < 0) {
        logToFile(`Invalid doseIndex: ${doseIndex}`, "ERROR");
        return res.status(400).json({ error: "doseIndex must be a non-negative integer" });
      }
      if (typeof missed !== "boolean") {
        logToFile(`Invalid missed value: ${missed}`, "ERROR");
        return res.status(400).json({ error: "missed must be a boolean value" });
      }
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        logToFile(`Invalid date format: ${date}`, "ERROR");
        return res.status(400).json({ error: "date must be in YYYY-MM-DD format" });
      }

      const medications = await Medication.getByUser(userId);
      if (!medications.some((med) => med.id === parseInt(id))) {
        logToFile(`Medication not found for id: ${id}`, "ERROR");
        return res.status(404).json({ error: "Medication not found" });
      }

      const updatedMedication = await Medication.markAsMissed(id, doseIndex, missed, date);
      logToFile(`Marked dose as missed for medication id: ${id}`);

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
      logToFile(`Firebase sync completed for medication id: ${id}`);

      res.status(200).json(updatedMedication);
    } catch (error) {
      logToFile(`Error marking medication as missed: ${error.message}\n${error.stack}`, "ERROR");
      res.status(500).json({ error: "Failed to mark medication as missed", details: error.message });
    }
  }
}

export default MedicationController;