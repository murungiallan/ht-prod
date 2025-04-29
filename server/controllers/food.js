import Food from "../models/food.js";
import { db } from "../server.js";  

class FoodController {
  static async addFood(req, res) {
    try {
      const userId = req.user.uid;
      const { food_name, portion_size, calories, date_logged } = req.body;

      if (!food_name || !portion_size) {
        return res.status(400).json({ error: "Name and portion size are required" });
      }

      const foodData = {
        userId,
        food_name,
        portion_size: parseInt(portion_size),
        calories: calories ? parseInt(calories) : null,
        date_logged: date_logged ? new Date(date_logged) : new Date(),
      };

      const food = await Food.add(foodData);

      await db.ref(`food_diary/${userId}/${food.id}`).set({
        ...foodData,
        id: food.id,
      });

      req.io.emit("foodAdded", food);

      return res.status(201).json(food);
    } catch (error) {
      console.error("Error adding exercise:", error);
      return res.status(500).json({ error: "Failed to add exercise" });
    }
  }

  static async getUserFood(req, res) {
    try {
      const userId = req.user.uid;
      const foods = await Exercise.getByUser(userId);
      return res.status(200).json(foods);
    } catch (error) {
      console.error("Error getting food log:", error);
      return res.status(500).json({ error: "Failed to get food log" });
    }
  }

  static async updateFood(req, res) {
    try {
      const userId = req.user.uid;
      const { id } = req.params;
      const { food_name, portion_size, calories, date_logged } = req.body;
      const foods = await Food.getByUser(userId);
      const food = foods.find((ex) => ex.id === parseInt(id));

      if (!food) {
        return res.status(404).json({ error: "Food log not found or unauthorized" });
      }

      const updatedData = {
        food_name: food_name|| food.activity,
        portion_size: portion_size ? parseInt(portion_size) : food.portion_size,
        calories: calories ? parseInt(calories) : food.calories,
        date_logged: date_logged ? new Date(date_logged) : food.date_logged,
      };

      const updatedFood = await Food.update(id, updatedData);

      await db.ref(`food_diary/${userId}/${id}`).set({
        ...updatedData,
        id: parseInt(id),
        userId,
      });

      req.io.emit("foodUpdated", updatedFood);

      return res.status(200).json(updatedFood);
    } catch (error) {
      console.error("Error updating food log:", error);
      return res.status(500).json({ error: "Failed to update food log" });
    }
  }

  static async deleteFood(req, res) {
    try {
      const userId = req.user.uid;
      const { id } = req.params;
      const foods = await Food.getByUser(userId);
      const food = foods.find((ex) => ex.id === parseInt(id));

      if (!food) {
        return res.status(404).json({ error: "Food log not found or unauthorized" });
      }

      await Food.delete(id);

      await db.ref(`food_diary/${userId}/${id}`).remove();

      req.io.emit("foodDeleted", id);

      return res.status(200).json({ message: "Food log deleted successfully" });
    } catch (error) {
      console.error("Error deleting food log:", error);
      return res.status(500).json({ error: "Failed to delete food log" });
    }
  }

  static async getFoodStats(req, res) {
    try {
      const userId = req.user.uid;
      const stats = await Food.getStats(userId);
      return res.status(200).json(stats);
    } catch (error) {
      console.error("Error getting food log stats:", error);
      return res.status(500).json({ error: "Failed to get food log statistics" });
    }
  }
}

export default FoodController;