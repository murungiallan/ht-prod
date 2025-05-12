import FoodDiary from "../models/food.models.js";
import { db as firebaseDb } from "../server.js";
import db from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory to store uploaded images and temporary files
const uploadDir = path.join(__dirname, '../../Uploads');
const tempDir = path.join(__dirname, '../../Temp');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Base URL for accessing uploaded images
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
        fs.writeFileSync(filePath, file.buffer);
        image_url = `${BASE_URL}/Uploads/${fileName}`;
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

      await firebaseDb.ref(`food_logs/${firebaseUid}/${foodLog.id}`).set({
        ...foodData,
        id: foodLog.id,
        createdAt: new Date().toISOString(),
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
          createdAt: log.createdAt ? log.createdAt.toISOString() : new Date().toISOString(),
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
        fs.writeFileSync(filePath, file.buffer);
        image_url = `${BASE_URL}/Uploads/${fileName}`;
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

      await firebaseDb.ref(`food_logs/${firebaseUid}/${id}`).set({
        ...updatedData,
        id: parseInt(id),
        userId,
        createdAt: foodLog.createdAt ? foodLog.createdAt.toISOString() : new Date().toISOString(),
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

      if (foodLog.image_url) {
        const fileName = path.basename(foodLog.image_url);
        const filePath = path.join(uploadDir, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
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

      await firebaseDb.ref(`food_logs/${firebaseUid}/${newId}`).set({
        ...newLog,
        userId,
        date_logged: newLog.date_logged.toISOString(),
        createdAt: new Date().toISOString(),
      });

      req.io.emit("foodLogAdded", newLog);

      return res.status(201).json(newLog);
    } catch (error) {
      console.error("Error copying food log:", error);
      return res.status(500).json({ error: "Failed to copy food log" });
    }
  }

  static async predictCaloricIntake(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      // Fetch daily calorie totals
      const [rows] = await db.query(`
        SELECT DATE(date_logged) as logDate, SUM(calories) as totalCalories
        FROM food_logs
        WHERE user_id = ? AND date_logged >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(date_logged)
        ORDER BY logDate
      `, [userId]);

      let predictions = [];
      if (rows.length < 7) {
        console.warn(`Insufficient data for user ${firebaseUid}: only ${rows.length} days available`);
        // Generate default predictions (2000 kcal/day for 7 days)
        const lastDate = rows.length > 0 ? new Date(rows[rows.length - 1].logDate) : new Date();
        predictions = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(lastDate);
          date.setDate(lastDate.getDate() + i + 1);
          return {
            date: date.toISOString().split('T')[0],
            value: 2000, // Default calorie estimate
          };
        });
      } else {
        // Proceed with ARIMA prediction
        const csvPath = path.join(tempDir, `calories_${firebaseUid}.csv`);
        const csvContent = ['date,calories\n', ...rows.map(row => `${row.logDate},${row.totalCalories}\n`)];
        fs.writeFileSync(csvPath, csvContent.join(''));

        const pythonScriptPath = path.join(__dirname, 'arima_predict.py');
        const outputPath = path.join(tempDir, `predictions_${firebaseUid}.json`);
        const pythonExecutable = path.join(__dirname, 'venv', 'Scripts', 'python.exe');
        const result = spawnSync(pythonExecutable, [pythonScriptPath, csvPath, outputPath], { encoding: 'utf-8' });

        if (result.error || result.status !== 0) {
          console.error('Python script error:', result.stderr || result.error);
          return res.status(500).json({ error: "Failed to run prediction model" });
        }

        try {
          const outputContent = fs.readFileSync(outputPath, 'utf-8');
          predictions = JSON.parse(outputContent);
        } catch (err) {
          console.error('Error reading predictions:', err);
          return res.status(500).json({ error: "Failed to parse predictions" });
        }

        fs.unlinkSync(csvPath);
        fs.unlinkSync(outputPath);
      }

      // Store in Firebase
      await firebaseDb.ref(`calorie_predictions/${firebaseUid}`).set(predictions);

      return res.status(200).json(predictions);
    } catch (error) {
      console.error("Error predicting caloric intake:", error);
      return res.status(500).json({ error: "Failed to predict caloric intake" });
    }
  }
}

export default FoodDiaryController;