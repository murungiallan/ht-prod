import Exercise from "../models/exercise.js";
import { db as firebaseDb } from "../server.js";
import db from "../config/db.js";

class ExerciseController {
  static async addExercise(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { activity, duration, calories_burned, date_logged } = req.body;

      if (!activity || !duration) {
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

      await firebaseDb.ref(`exercises/${firebaseUid}/${exercise.id}`).set({
        ...exerciseData,
        id: exercise.id,
      });

      req.io.emit("exerciseAdded", exercise);

      return res.status(201).json(exercise);
    } catch (error) {
      console.error("Error adding exercise:", error);
      return res.status(500).json({ error: "Failed to add exercise" });
    }
  }

  static async getUserExercises(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const exercises = await Exercise.getByUser(userId);

      // Sync with Firebase
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

      return res.status(200).json(exercises);
    } catch (error) {
      console.error("Error getting exercises:", error);
      return res.status(500).json({ error: "Failed to get exercises" });
    }
  }

  static async updateExercise(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id } = req.params;
      const { activity, duration, calories_burned, date_logged } = req.body;

      const exercises = await Exercise.getByUser(userId);
      const exercise = exercises.find((ex) => ex.id === parseInt(id));
      if (!exercise) {
        return res.status(404).json({ error: "Exercise not found or unauthorized" });
      }

      const updatedData = {
        activity: activity || exercise.activity,
        duration: duration ? parseInt(duration) : exercise.duration,
        calories_burned: calories_burned ? parseInt(calories_burned) : exercise.calories_burned,
        date_logged: date_logged ? new Date(date_logged) : exercise.date_logged,
      };

      const updatedExercise = await Exercise.update(id, updatedData);

      await firebaseDb.ref(`exercises/${firebaseUid}/${id}`).set({
        ...updatedData,
        id: parseInt(id),
        userId,
        createdAt: exercise.createdAt || new Date().toISOString(),
      });

      req.io.emit("exerciseUpdated", updatedExercise);
      return res.status(200).json(updatedExercise);
    } catch (error) {
      console.error("Error updating exercise:", error);
      return res.status(500).json({ error: "Failed to update exercise" });
    }
  }

  static async deleteExercise(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id } = req.params;
      const exercises = await Exercise.getByUser(userId);
      const exercise = exercises.find((ex) => ex.id === parseInt(id));

      if (!exercise) {
        return res.status(404).json({ error: "Exercise not found or unauthorized" });
      }

      await Exercise.delete(id);

      await firebaseDb.ref(`exercises/${firebaseUid}/${id}`).remove();

      req.io.emit("exerciseDeleted", id);

      return res.status(200).json({ message: "Exercise deleted successfully" });
    } catch (error) {
      console.error("Error deleting exercise:", error);
      return res.status(500).json({ error: "Failed to delete exercise" });
    }
  }

  static async getExerciseStats(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const stats = await Exercise.getStats(userId);

      await firebaseDb.ref(`exercise_stats/${firebaseUid}`).set(stats);

      return res.status(200).json(stats);
    } catch (error) {
      console.error("Error getting exercise stats:", error);
      return res.status(500).json({ error: "Failed to get exercise statistics" });
    }
  }
}

export default ExerciseController;