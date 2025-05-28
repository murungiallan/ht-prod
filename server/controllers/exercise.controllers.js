import Exercise from "../models/exercise.models.js";
import { db as firebaseDb } from "../server.js";
import db from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import moment from "moment-timezone";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.join(__dirname, "../utils");
const logFilePath = path.join(logDir, "exerciselogs.txt");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logToFile = (message, level = "INFO") => {
  const timestamp = moment().tz("Asia/Singapore").format("YYYY-MM-DD HH:mm:ss");
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  try {
    fs.appendFileSync(logFilePath, logMessage);
  } catch (error) {
    console.error(`Failed to write to log file: ${error.message}`);
    console.error(message);
  }
};

class ExerciseController {
  static async addExercise(req, res) {
    logToFile(`Starting addExercise for user ${req.user.uid}`);
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        logToFile(`User not found for uid: ${firebaseUid}`, "ERROR");
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { activity, duration, calories_burned, date_logged } = req.body;
      logToFile(`Received data: ${JSON.stringify({ activity, duration, calories_burned, date_logged })}`);

      if (!activity || !duration) {
        logToFile("Missing required fields: activity or duration", "ERROR");
        return res.status(400).json({ error: "Activity and duration are required" });
      }

      const exerciseData = {
        userId,
        activity,
        duration: parseInt(duration),
        calories_burned: calories_burned ? parseInt(calories_burned) : null,
        date_logged: date_logged ? new Date(date_logged) : new Date(),
      };

      const exercise = await Exercise.add(exerciseData);
      logToFile(`Exercise added successfully with id: ${exercise.id}`);

      await firebaseDb.ref(`exercises/${firebaseUid}/${exercise.id}`).set({
        ...exerciseData,
        id: exercise.id,
      });
      logToFile(`Firebase sync completed for exercise id: ${exercise.id}`);

      req.io.emit("exerciseAdded", exercise);
      logToFile(`Socket event emitted: exerciseAdded for id ${exercise.id}`);

      return res.status(201).json(exercise);
    } catch (error) {
      logToFile(`Error adding exercise: ${error.message}\n${error.stack}`, "ERROR");
      return res.status(500).json({ error: "Failed to add exercise" });
    }
  }

  static async getUserExercises(req, res) {
    logToFile(`Starting getUserExercises for user ${req.user.uid}`);
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        logToFile(`User not found for uid: ${firebaseUid}`, "ERROR");
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const exercises = await Exercise.getByUser(userId);
      logToFile(`Retrieved ${exercises.length} exercises for user ${userId}`);

      const updates = {};
      exercises.forEach((exercise) => {
        updates[`exercises/${firebaseUid}/${exercise.id}`] = {
          id: exercise.id,
          userId: exercise.user_id,
          activity: exercise.activity,
          duration: exercise.duration,
          calories_burned: exercise.calories_burned,
          date_logged: exercise.date_logged,
        };
      });
      await firebaseDb.ref().update(updates);
      logToFile(`Firebase sync completed for ${exercises.length} exercises`);

      return res.status(200).json(exercises);
    } catch (error) {
      logToFile(`Error getting exercises: ${error.message}\n${error.stack}`, "ERROR");
      return res.status(500).json({ error: "Failed to get exercises" });
    }
  }

  static async updateExercise(req, res) {
    logToFile(`Starting updateExercise for user ${req.user.uid}, exercise id ${req.params.id}`);
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        logToFile(`User not found for uid: ${firebaseUid}`, "ERROR");
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id } = req.params;
      const { activity, duration, calories_burned, date_logged } = req.body;
      logToFile(`Received update data: ${JSON.stringify({ activity, duration, calories_burned, date_logged })}`);

      const exercises = await Exercise.getByUser(userId);
      const exercise = exercises.find((ex) => ex.id === parseInt(id));
      if (!exercise) {
        logToFile(`Exercise not found or unauthorized for id: ${id}`, "ERROR");
        return res.status(404).json({ error: "Exercise not found or unauthorized" });
      }

      const updatedData = {
        activity: activity || exercise.activity,
        duration: duration ? parseInt(duration) : exercise.duration,
        calories_burned: calories_burned ? parseInt(calories_burned) : exercise.calories_burned,
        date_logged: date_logged ? new Date(date_logged) : exercise.date_logged,
      };

      const updatedExercise = await Exercise.update(id, updatedData);
      logToFile(`Exercise updated successfully with id: ${id}`);

      await firebaseDb.ref(`exercises/${firebaseUid}/${id}`).set({
        ...updatedData,
        id: parseInt(id),
        userId,
        createdAt: exercise.createdAt || new Date().toISOString(),
      });
      logToFile(`Firebase sync completed for exercise id: ${id}`);

      req.io.emit("exerciseUpdated", updatedExercise);
      logToFile(`Socket event emitted: exerciseUpdated for id ${id}`);

      return res.status(200).json(updatedExercise);
    } catch (error) {
      logToFile(`Error updating exercise: ${error.message}\n${error.stack}`, "ERROR");
      return res.status(500).json({ error: "Failed to update exercise" });
    }
  }

  static async deleteExercise(req, res) {
    logToFile(`Starting deleteExercise for user ${req.user.uid}, exercise id ${req.params.id}`);
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        logToFile(`User not found for uid: ${firebaseUid}`, "ERROR");
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id } = req.params;
      const exercises = await Exercise.getByUser(userId);
      const exercise = exercises.find((ex) => ex.id === parseInt(id));

      if (!exercise) {
        logToFile(`Exercise not found or unauthorized for id: ${id}`, "ERROR");
        return res.status(404).json({ error: "Exercise not found or unauthorized" });
      }

      await Exercise.delete(id);
      logToFile(`Exercise deleted successfully from MySQL with id: ${id}`);

      await firebaseDb.ref(`exercises/${firebaseUid}/${id}`).remove();
      logToFile(`Exercise removed from Firebase with id: ${id}`);

      req.io.emit("exerciseDeleted", id);
      logToFile(`Socket event emitted: exerciseDeleted for id ${id}`);

      return res.status(200).json({ message: "Exercise deleted successfully" });
    } catch (error) {
      logToFile(`Error deleting exercise: ${error.message}\n${error.stack}`, "ERROR");
      return res.status(500).json({ error: "Failed to delete exercise" });
    }
  }

  static async getExerciseStats(req, res) {
    logToFile(`Starting getExerciseStats for user ${req.user.uid}`);
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        logToFile(`User not found for uid: ${firebaseUid}`, "ERROR");
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const stats = await Exercise.getStats(userId);
      logToFile(`Retrieved stats for user ${userId}`);

      await firebaseDb.ref(`exercise_stats/${firebaseUid}`).set(stats);
      logToFile(`Firebase sync completed for exercise stats`);

      return res.status(200).json(stats);
    } catch (error) {
      logToFile(`Error getting exercise stats: ${error.message}\n${error.stack}`, "ERROR");
      return res.status(500).json({ error: "Failed to get exercise statistics" });
    }
  }
}

export default ExerciseController;