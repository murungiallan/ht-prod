import Food from "../models/food.js";
import { db } from "../server.js";  

class FoodController {
  static async addExercise(req, res) {
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
      const userId = req.user.uid;
      const exercises = await Exercise.getByUser(userId);
      return res.status(200).json(exercises);
    } catch (error) {
      console.error("Error getting exercises:", error);
      return res.status(500).json({ error: "Failed to get exercises" });
    }
  }

  static async updateExercise(req, res) {
    try {
      const userId = req.user.uid;
      const { id } = req.params;
      const { food_name, portion_size, calories, date_logged } = req.body;
      const foods = await Exercise.getByUser(userId);
      const food = foods.find((ex) => ex.id === parseInt(id));

      if (!food) {
        return res.status(404).json({ error: "Exercise not found or unauthorized" });
      }

      const updatedData = {
        activity: activity || exercise.activity,
        duration: duration ? parseInt(duration) : exercise.duration,
        calories_burned: calories_burned ? parseInt(calories_burned) : exercise.calories_burned,
        date_logged: date_logged ? new Date(date_logged) : exercise.date_logged,
      };

      const updatedExercise = await Exercise.update(id, updatedData);

      await db.ref(`exercises/${userId}/${id}`).set({
        ...updatedData,
        id: parseInt(id),
        userId,
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
      const userId = req.user.uid;
      const { id } = req.params;
      const exercises = await Exercise.getByUser(userId);
      const exercise = exercises.find((ex) => ex.id === parseInt(id));

      if (!exercise) {
        return res.status(404).json({ error: "Exercise not found or unauthorized" });
      }

      await Exercise.delete(id);

      await db.ref(`exercises/${userId}/${id}`).remove();

      req.io.emit("exerciseDeleted", id);

      return res.status(200).json({ message: "Exercise deleted successfully" });
    } catch (error) {
      console.error("Error deleting exercise:", error);
      return res.status(500).json({ error: "Failed to delete exercise" });
    }
  }

  static async getExerciseStats(req, res) {
    try {
      const userId = req.user.uid;
      const stats = await Exercise.getStats(userId);
      return res.status(200).json(stats);
    } catch (error) {
      console.error("Error getting exercise stats:", error);
      return res.status(500).json({ error: "Failed to get exercise statistics" });
    }
  }
}

export default ExerciseController;