import FoodDiary from "../models/food.models.js";
import { db as firebaseDb } from "../server.js";
import db from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import moment from "moment";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../");
const logDir = path.join(__dirname, "../utils");
const logFilePath = path.join(logDir, "fooddiarylogs.txt");

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

// Directory and base URL setup
const uploadDir = path.join(projectRoot, "Uploads");
const tempDir = path.join(projectRoot, "Temp");
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

class FoodDiaryController {
  static async addFoodLog(req, res) {
    logToFile(`Starting addFoodLog for user ${req.user.uid}`);
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        logToFile(`User not found for uid: ${firebaseUid}`, "ERROR");
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { food_name, calories, carbs, protein, fats, date_logged, meal_type } = req.body;
      const file = req.file;
      logToFile(`Received data: ${JSON.stringify({ food_name, calories, carbs, protein, fats, date_logged, meal_type })}`);

      if (!food_name || !calories || !meal_type) {
        logToFile("Missing required fields: food_name, calories, or meal_type", "ERROR");
        return res.status(404).json({ error: "Food name, calories, and meal type are required" });
      }

      let image_url = null;
      let image_data = null;
      if (file && file.buffer) {
        const fileName = `${firebaseUid}_${Date.now()}_${file.originalname.replace(/\s/g, "_")}`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, file.buffer);
        image_url = `${BASE_URL}/Uploads/${fileName}`;
        image_data = `data:image/jpeg;base64,${file.buffer.toString("base64")}`;
        logToFile(`Image saved at: ${filePath}`);
      } else if (file && !file.buffer) {
        logToFile("File uploaded but buffer is missing", "WARN");
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
      logToFile(`Food log added successfully with id: ${foodLog.id}`);

      await firebaseDb.ref(`food_logs/${firebaseUid}/${foodLog.id}`).set({
        id: foodLog.id,
        userId,
        food_name,
        calories: foodLog.calories,
        carbs: foodLog.carbs,
        protein: foodLog.protein,
        fats: foodLog.fats,
        image_data,
        date_logged: foodLog.date_logged.toISOString(),
        meal_type,
        createdAt: new Date().toISOString(),
      });
      logToFile(`Firebase sync completed for food log id: ${foodLog.id}`);

      const foodLogWithImageData = {
        ...foodLog,
        image_url: undefined,
        image_data,
      };

      req.io.emit("foodLogAdded", foodLogWithImageData);
      logToFile(`Socket event emitted: foodLogAdded for id ${foodLog.id}`);

      return res.status(201).json(foodLogWithImageData);
    } catch (error) {
      logToFile(`Error adding food log: ${error.message}\n${error.stack}`, "ERROR");
      return res.status(500).json({ error: "Failed to add food log" });
    }
  }

  static async getUserFoodLogs(req, res) {
    logToFile(`Starting getUserFoodLogs for user ${req.user?.uid || "unknown"}`);
    try {
      if (!req.user || !req.user.uid) {
        logToFile("Missing or invalid user authentication", "ERROR");
        return res.status(401).json({ error: "Unauthorized" });
      }
      const firebaseUid = req.user.uid;
  
      let userRows;
      try {
        [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      } catch (dbError) {
        logToFile(`Database query error: ${dbError.message}\n${dbError.stack}`, "ERROR");
        return res.status(500).json({ error: "Database query failed" });
      }
  
      if (!userRows || userRows.length === 0) {
        logToFile(`User not found for uid: ${firebaseUid}`, "ERROR");
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;
  
      let foodLogs;
      try {
        foodLogs = await FoodDiary.getByUser(userId);
      } catch (dbError) {
        logToFile(`Error fetching food logs: ${dbError.message}\n${dbError.stack}`, "ERROR");
        return res.status(500).json({ error: "Failed to fetch food logs from database" });
      }
      logToFile(`Retrieved ${foodLogs.length} food logs for user ${userId}`);
  
      const processedLogs = await Promise.all(
        foodLogs.map(async (log) => {
          let imageData = null;
          if (log.image_url) {
            try {
              const fileName = path.basename(log.image_url);
              const filePath = path.join(uploadDir, fileName);
              if (fs.existsSync(filePath)) {
                const fileBuffer = fs.readFileSync(filePath);
                imageData = `data:image/jpeg;base64,${fileBuffer.toString("base64")}`;
              } else {
                logToFile(`Image file not found: ${filePath}`, "WARN");
              }
            } catch (err) {
              logToFile(`Error reading image for log ${log.id}: ${err.message}`, "ERROR");
              imageData = null;
            }
          }
          return {
            ...log,
            image_url: undefined,
            image_data: imageData,
          };
        })
      );
  
      if (processedLogs.length > 0) {
        try {
          const updates = {};
          processedLogs.forEach((log) => {
            updates[`food_logs/${firebaseUid}/${log.id}`] = {
              id: log.id,
              userId: log.user_id,
              food_name: log.food_name,
              calories: log.calories,
              carbs: log.carbs,
              protein: log.protein,
              fats: log.fats,
              image_data: log.image_data,
              date_logged: log.date_logged.toISOString(),
              meal_type: log.meal_type,
              createdAt: log.createdAt ? log.createdAt.toISOString() : new Date().toISOString(),
            };
          });
          await firebaseDb.ref().update(updates);
          logToFile(`Firebase sync completed for ${processedLogs.length} food logs`);
        } catch (firebaseError) {
          logToFile(`Firebase sync error: ${firebaseError.message}\n${firebaseError.stack}`, "ERROR");
        }
      }
  
      return res.status(200).json(processedLogs);
    } catch (error) {
      logToFile(`Error getting food logs: ${error.message}\n${error.stack}`, "ERROR");
      return res.status(500).json({ error: "Failed to get food logs" });
    }
  }

  static async updateFoodLog(req, res) {
    logToFile(`Starting updateFoodLog for user ${req.user.uid}, food log id ${req.params.id}`);
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        logToFile(`User not found for uid: ${firebaseUid}`, "ERROR");
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id } = req.params;
      const { food_name, calories, carbs, protein, fats, date_logged, meal_type } = req.body;
      const file = req.file;
      logToFile(`Received update data: ${JSON.stringify({ food_name, calories, carbs, protein, fats, date_logged, meal_type })}`);

      const foodLogs = await FoodDiary.getByUser(userId);
      const foodLog = foodLogs.find((log) => log.id === parseInt(id));
      if (!foodLog) {
        logToFile(`Food log not found or unauthorized for id: ${id}`, "ERROR");
        return res.status(404).json({ error: "Food log not found or unauthorized" });
      }

      let image_url = foodLog.image_url;
      let image_data = null;
      if (file) {
        if (foodLog.image_url) {
          const oldFileName = path.basename(foodLog.image_url);
          const oldFilePath = path.join(uploadDir, oldFileName);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            logToFile(`Deleted old image at: ${oldFilePath}`);
          }
        }
        const fileName = `${firebaseUid}_${Date.now()}_${file.originalname.replace(/\s/g, "_")}`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, file.buffer);
        image_url = `${BASE_URL}/Uploads/${fileName}`;
        image_data = `data:image/jpeg;base64,${file.buffer.toString("base64")}`;
        logToFile(`New image saved at: ${filePath}`);
      } else if (foodLog.image_url) {
        const fileName = path.basename(foodLog.image_url);
        const filePath = path.join(uploadDir, fileName);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          image_data = `data:image/jpeg;base64,${fileBuffer.toString("base64")}`;
        }
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
      logToFile(`Food log updated successfully with id: ${id}`);

      const updatedFirebaseData = {
        id: parseInt(id),
        userId,
        food_name: updatedData.food_name,
        calories: updatedData.calories,
        carbs: updatedData.carbs,
        protein: updatedData.protein,
        fats: updatedData.fats,
        image_data,
        date_logged: updatedData.date_logged.toISOString(),
        meal_type: updatedData.meal_type,
        createdAt: foodLog.createdAt ? foodLog.createdAt.toISOString() : new Date().toISOString(),
      };

      const originalFirebaseData = (await firebaseDb.ref(`food_logs/${firebaseUid}/${id}`).once("value")).val();
      if (originalFirebaseData && JSON.stringify(originalFirebaseData) !== JSON.stringify(updatedFirebaseData)) {
        await firebaseDb.ref(`food_logs/${firebaseUid}/${id}`).set(updatedFirebaseData);
        logToFile(`Firebase sync completed for food log id: ${id}`);
      }

      const updatedFoodLogWithImageData = {
        ...updatedFoodLog,
        image_url: undefined,
        image_data,
      };

      req.io.emit("foodLogUpdated", updatedFoodLogWithImageData);
      logToFile(`Socket event emitted: foodLogUpdated for id ${id}`);

      return res.status(200).json(updatedFoodLogWithImageData);
    } catch (error) {
      logToFile(`Error updating food log: ${error.message}\n${error.stack}`, "ERROR");
      return res.status(500).json({ error: "Failed to update food log" });
    }
  }

  static async deleteFoodLog(req, res) {
    logToFile(`Starting deleteFoodLog for user ${req.user.uid}, food log id ${req.params.id}`);
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        logToFile(`User not found for uid: ${firebaseUid}`, "ERROR");
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id } = req.params;
      const foodLogs = await FoodDiary.getByUser(userId);
      const foodLog = foodLogs.find((log) => log.id === parseInt(id));

      if (!foodLog) {
        logToFile(`Food log not found or unauthorized for id: ${id}`, "ERROR");
        return res.status(404).json({ error: "Food log not found or unauthorized" });
      }

      if (foodLog.image_url) {
        try {
          const fileName = path.basename(foodLog.image_url);
          const filePath = path.join(uploadDir, fileName);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            logToFile(`Deleted image at: ${filePath}`);
          }
        } catch (fileError) {
          logToFile(`Error deleting image file: ${fileError.message}`, "ERROR");
        }
      }

      await FoodDiary.delete(id);
      logToFile(`Food log deleted successfully from MySQL with id: ${id}`);

      await firebaseDb.ref(`food_logs/${firebaseUid}/${id}`).remove();
      logToFile(`Food log removed from Firebase with id: ${id}`);

      req.io.emit("foodLogDeleted", id);
      logToFile(`Socket event emitted: foodLogDeleted for id ${id}`);

      return res.status(200).json({ message: "Food log deleted successfully" });
    } catch (error) {
      logToFile(`Error deleting food log: ${error.message}\n${error.stack}`, "ERROR");
      return res.status(500).json({ error: "Failed to delete food log" });
    }
  }

  static async getFoodStats(req, res) {
    logToFile(`Starting getFoodStats for user ${req.user.uid}`);
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        logToFile(`User not found for uid: ${firebaseUid}`, "ERROR");
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const stats = await FoodDiary.getStats(userId);
      logToFile(`Retrieved stats for user ${userId}`);

      if (stats && Object.keys(stats).length > 0) {
        await firebaseDb.ref(`food_stats/${firebaseUid}`).set(stats);
        logToFile(`Firebase sync completed for food stats`);
      }

      return res.status(200).json(stats);
    } catch (error) {
      logToFile(`Error getting food stats: ${error.message}\n${error.stack}`, "ERROR");
      return res.status(500).json({ error: "Failed to get food statistics" });
    }
  }

  static async copyFoodLog(req, res) {
    logToFile(`Starting copyFoodLog for user ${req.user.uid}, food log id ${req.body.id}`);
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        logToFile(`User not found for uid: ${firebaseUid}`, "ERROR");
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id, newDate } = req.body;
      logToFile(`Received copy data: ${JSON.stringify({ id, newDate })}`);

      const foodLogs = await FoodDiary.getByUser(userId);
      const foodLog = foodLogs.find((log) => log.id === parseInt(id));

      if (!foodLog) {
        logToFile(`Food log not found or unauthorized for id: ${id}`, "ERROR");
        return res.status(404).json({ error: "Food log not found or unauthorized" });
      }

      let image_data = null;
      if (foodLog.image_url) {
        const fileName = path.basename(foodLog.image_url);
        const filePath = path.join(uploadDir, fileName);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          image_data = `data:image/jpeg;base64,${fileBuffer.toString("base64")}`;
        }
      }

      const newId = await FoodDiary.copyEntry(id, new Date(newDate));
      logToFile(`New food log created with id: ${newId}`);

      const newLog = {
        ...foodLog,
        id: newId,
        date_logged: new Date(newDate),
      };

      await firebaseDb.ref(`food_logs/${firebaseUid}/${newId}`).set({
        id: newId,
        userId,
        food_name: newLog.food_name,
        calories: newLog.calories,
        carbs: newLog.carbs,
        protein: newLog.protein,
        fats: newLog.fats,
        image_data,
        date_logged: newLog.date_logged.toISOString(),
        meal_type: newLog.meal_type,
        createdAt: new Date().toISOString(),
      });
      logToFile(`Firebase sync completed for new food log id: ${newId}`);

      const newLogWithImageData = {
        ...newLog,
        image_url: undefined,
        image_data,
      };

      req.io.emit("foodLogAdded", newLogWithImageData);
      logToFile(`Socket event emitted: foodLogAdded for id ${newId}`);

      return res.status(201).json(newLogWithImageData);
    } catch (error) {
      logToFile(`Error copying food log: ${error.message}\n${error.stack}`, "ERROR");
      return res.status(500).json({ error: "Failed to copy food log" });
    }
  }

  static async predictCaloricIntake(req, res) {
    logToFile(`Starting predictCaloricIntake for user ${req.user.uid}`);
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        logToFile(`User not found for uid: ${firebaseUid}`, "ERROR");
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const [rows] = await db.query(
        "SELECT DATE(date_logged) as logDate, SUM(calories) as totalCalories FROM food_logs WHERE user_id = ? AND date_logged >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY DATE(date_logged) ORDER BY logDate",
        [userId]
      );
      logToFile(`Retrieved ${rows.length} days of calorie data for user ${userId}`);

      let predictions = [];
      if (rows.length < 7) {
        logToFile(`Insufficient data: only ${rows.length} days available`, "WARN");
        const lastDate = rows.length > 0 ? new Date(rows[rows.length - 1].logDate) : new Date();
        predictions = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(lastDate);
          date.setDate(lastDate.getDate() + i + 1);
          return {
            date: date.toISOString().split("T")[0],
            value: 1200,
          };
        });
      } else {
        const csvPath = path.join(tempDir, `calories_${firebaseUid}.csv`);
        const csvContent = [
          "date,calories\n",
          ...rows.map((row) => {
            const date = new Date(row.logDate);
            const formattedDate = date.toISOString().split("T")[0];
            return `${formattedDate},${row.totalCalories}\n`;
          }),
        ].join("");
        fs.writeFileSync(csvPath, csvContent);
        logToFile(`CSV file created at: ${csvPath}`);

        const pythonScriptPath = path.join(__dirname, "arima_predict.py");
        const outputPath = path.join(tempDir, `predictions_${firebaseUid}.json`);

        let pythonExecutable = path.join(projectRoot, ".venv", "Scripts", "python.exe");
        if (!fs.existsSync(pythonExecutable)) {
          logToFile(`Python executable not found at ${pythonExecutable}, trying system Python`, "WARN");
          pythonExecutable = "python";
        }

        const result = spawn(pythonExecutable, [pythonScriptPath, csvPath, outputPath]);

        let pythonOutput = "";
        let pythonError = "";

        result.stdout.on("data", (data) => {
          pythonOutput += data.toString();
        });

        result.stderr.on("data", (data) => {
          pythonError += data.toString();
        });

        const predictionPromise = new Promise((resolve, reject) => {
          result.on("close", (code) => {
            if (code === 0) {
              try {
                const outputContent = fs.readFileSync(outputPath, "utf-8");
                predictions = JSON.parse(outputContent);
                fs.unlinkSync(csvPath);
                fs.unlinkSync(outputPath);
                logToFile(`Predictions generated and files cleaned up`);
                resolve();
              } catch (parseError) {
                logToFile(`Failed to parse prediction output: ${parseError.message}`, "ERROR");
                reject(new Error(`Failed to parse prediction output: ${parseError.message}`));
              }
            } else {
              logToFile(`Prediction script failed with code ${code}: ${pythonError}`, "ERROR");
              reject(new Error(`Prediction script failed with code ${code}: ${pythonError}`));
            }
          });

          result.on("error", (err) => {
            logToFile(`Spawn error: ${err.message}`, "ERROR");
            reject(new Error(`Spawn error: ${err.message}`));
          });
        });

        await predictionPromise;
      }

      await firebaseDb.ref(`calorie_predictions/${firebaseUid}`).set(predictions);
      logToFile(`Firebase sync completed for calorie predictions`);

      return res.status(200).json(predictions);
    } catch (error) {
      logToFile(`Error predicting caloric intake: ${error.message}\n${error.stack}`, "ERROR");
      return res.status(500).json({ error: "Failed to predict caloric intake" });
    }
  }
}

export default FoodDiaryController;