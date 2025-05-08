import FoodDiary from "../models/food.models.js";
import { db as firebaseDb } from "../server.js";
import db from "../config/db.js";
import fs from "fs";
import path from "path";

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory to store uploaded images
const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// Base URL for accessing uploaded images (adjust based on your server setup)
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

class FoodDiaryController {
  static async addFoodLog(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { food_name, calories, carbs, protein, fats, date_logged, meal_type } = req.body;
      const file = req.file;

      if (!food_name || !calories || !meal_type) {
        return res.status(400).json({ error: "Food name, calories, and meal type are required" });
      }

      let image_url = null;
      if (file) {
        const fileName = `${firebaseUid}_${Date.now()}_${file.originalname}`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, file.buffer); // Save the file locally
        image_url = `${BASE_URL}/uploads/${fileName}`; // Generate URL for the file
      }

      const foodData = {
        userId,
        food_name,
        calories: parseFloat(calories),
        carbs: carbs ? parseFloat(carbs) : null,
        protein: protein ? parseFloat(protein) : null,
        fats: fats ? parseFloat(fats) : null,
        image_url,
        date_logged: date_logged ? new Date(date_logged) : new Date(),
        meal_type,
      };

      const foodLog = await FoodDiary.add(foodData);

      // Sync with Firebase, including createdAt timestamp
      await firebaseDb.ref(`food_logs/${firebaseUid}/${foodLog.id}`).set({
        ...foodData,
        id: foodLog.id,
        createdAt: new Date().toISOString(), // Add createdAt timestamp
      });

      req.io.emit("foodLogAdded", foodLog);

      return res.status(201).json(foodLog);
    } catch (error) {
      console.error("Error adding food log:", error);
      return res.status(500).json({ error: "Failed to add food log" });
    }
  }

  static async getUserFoodLogs(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const foodLogs = await FoodDiary.getByUser(userId);

      // Sync with Firebase, matching ExerciseController structure
      const updates = {};
      foodLogs.forEach((log) => {
        updates[`food_logs/${firebaseUid}/${log.id}`] = {
          id: log.id,
          userId: log.user_id,
          food_name: log.food_name,
          calories: log.calories,
          carbs: log.carbs,
          protein: log.protein,
          fats: log.fats,
          image_url: log.image_url,
          date_logged: log.date_logged.toISOString(),
          meal_type: log.meal_type,
          createdAt: log.createdAt ? log.createdAt.toISOString() : new Date().toISOString(), // Ensure createdAt exists
        };
      });
      await firebaseDb.ref().update(updates);

      return res.status(200).json(foodLogs);
    } catch (error) {
      console.error("Error getting food logs:", error);
      return res.status(500).json({ error: "Failed to get food logs" });
    }
  }

  static async updateFoodLog(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id } = req.params;
      const { food_name, calories, carbs, protein, fats, date_logged, meal_type } = req.body;
      const file = req.file;

      const foodLogs = await FoodDiary.getByUser(userId);
      const foodLog = foodLogs.find((log) => log.id === parseInt(id));
      if (!foodLog) {
        return res.status(404).json({ error: "Food log not found or unauthorized" });
      }

      let image_url = foodLog.image_url;
      if (file) {
        const fileName = `${firebaseUid}_${Date.now()}_${file.originalname}`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, file.buffer); // Save the file locally
        image_url = `${BASE_URL}/uploads/${fileName}`; // Generate URL for the file
      }

      const updatedData = {
        food_name: food_name || foodLog.food_name,
        calories: calories ? parseFloat(calories) : foodLog.calories,
        carbs: carbs ? parseFloat(carbs) : foodLog.carbs,
        protein: protein ? parseFloat(protein) : foodLog.protein,
        fats: fats ? parseFloat(fats) : foodLog.fats,
        image_url,
        date_logged: date_logged ? new Date(date_logged) : foodLog.date_logged,
        meal_type: meal_type || foodLog.meal_type,
      };

      const updatedFoodLog = await FoodDiary.update(id, updatedData);

      // Sync with Firebase, preserving createdAt
      await firebaseDb.ref(`food_logs/${firebaseUid}/${id}`).set({
        ...updatedData,
        id: parseInt(id),
        userId,
        createdAt: foodLog.createdAt ? foodLog.createdAt.toISOString() : new Date().toISOString(), // Preserve or set createdAt
      });

      req.io.emit("foodLogUpdated", updatedFoodLog);
      return res.status(200).json(updatedFoodLog);
    } catch (error) {
      console.error("Error updating food log:", error);
      return res.status(500).json({ error: "Failed to update food log" });
    }
  }

  static async deleteFoodLog(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id } = req.params;
      const foodLogs = await FoodDiary.getByUser(userId);
      const foodLog = foodLogs.find((log) => log.id === parseInt(id));

      if (!foodLog) {
        return res.status(404).json({ error: "Food log not found or unauthorized" });
      }

      // Delete the image file if it exists
      if (foodLog.image_url) {
        const fileName = path.basename(foodLog.image_url);
        const filePath = path.join(uploadDir, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); // Remove the image file
        }
      }

      await FoodDiary.delete(id);

      await firebaseDb.ref(`food_logs/${firebaseUid}/${id}`).remove();

      req.io.emit("foodLogDeleted", id);

      return res.status(200).json({ message: "Food log deleted successfully" });
    } catch (error) {
      console.error("Error deleting food log:", error);
      return res.status(500).json({ error: "Failed to delete food log" });
    }
  }

  static async getFoodStats(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const stats = await FoodDiary.getStats(userId);

      await firebaseDb.ref(`food_stats/${firebaseUid}`).set(stats);

      return res.status(200).json(stats);
    } catch (error) {
      console.error("Error getting food stats:", error);
      return res.status(500).json({ error: "Failed to get food statistics" });
    }
  }

  static async copyFoodLog(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id, newDate } = req.body;
      const foodLogs = await FoodDiary.getByUser(userId);
      const foodLog = foodLogs.find((log) => log.id === parseInt(id));

      if (!foodLog) {
        return res.status(404).json({ error: "Food log not found or unauthorized" });
      }

      const newId = await FoodDiary.copyEntry(id, new Date(newDate));
      const newLog = {
        ...foodLog,
        id: newId,
        date_logged: new Date(newDate),
      };

      // Sync with Firebase, including createdAt
      await firebaseDb.ref(`food_logs/${firebaseUid}/${newId}`).set({
        ...newLog,
        userId,
        date_logged: newLog.date_logged.toISOString(),
        createdAt: new Date().toISOString(), // Add createdAt for new log
      });

      req.io.emit("foodLogAdded", newLog);

      return res.status(201).json(newLog);
    } catch (error) {
      console.error("Error copying food log:", error);
      return res.status(500).json({ error: "Failed to copy food log" });
    }
  }
}

export default FoodDiaryController;