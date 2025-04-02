import { db } from "../services/firebase.js";

const COLLECTION_NAME = "exercises";

class Exercise {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.userId || null;
    this.type = data.type || "";
    this.duration = data.duration || 0;
    this.calories = data.calories || 0;
    this.date = data.date || new Date();
    this.notes = data.notes || "";
  }

  // Add a new exercise
  static async add(exerciseData) {
    try {
      const docRef = await db.collection(COLLECTION_NAME).add({
        ...exerciseData,
        date: exerciseData.date || new Date(),
        createdAt: new Date(),
      });
      return { id: docRef.id, ...exerciseData };
    } catch (error) {
      console.error("Error adding exercise: ", error);
      throw error;
    }
  }

  // Get all exercises for a user
  static async getByUser(userId) {
    try {
      const exercisesQuery = db
        .collection(COLLECTION_NAME)
        .where("userId", "==", userId);

      const querySnapshot = await exercisesQuery.get();
      const exercises = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        exercises.push({
          id: doc.id,
          ...data,
          date: data.date.toDate(),
        });
      });

      // Sort by date (newest first)
      return exercises.sort((a, b) => b.date - a.date);
    } catch (error) {
      console.error("Error getting exercises: ", error);
      throw error;
    }
  }

  // Update an exercise
  static async update(id, data) {
    try {
      const exerciseRef = db.collection(COLLECTION_NAME).doc(id);
      await exerciseRef.update({
        ...data,
        updatedAt: new Date(),
      });
      return { id, ...data };
    } catch (error) {
      console.error("Error updating exercise: ", error);
      throw error;
    }
  }

  // Delete an exercise
  static async delete(id) {
    try {
      const exerciseRef = db.collection(COLLECTION_NAME).doc(id);
      await exerciseRef.delete();
      return { id };
    } catch (error) {
      console.error("Error deleting exercise: ", error);
      throw error;
    }
  }

  // Get exercise statistics
  static async getStats(userId) {
    try {
      const exercises = await this.getByUser(userId);

      // Calculate statistics
      const totalCalories = exercises.reduce((sum, ex) => sum + ex.calories, 0);
      const totalDuration = exercises.reduce((sum, ex) => sum + ex.duration, 0);
      const totalSessions = exercises.length;

      // Exercise types breakdown
      const exerciseTypes = {};
      exercises.forEach((ex) => {
        if (!exerciseTypes[ex.type]) {
          exerciseTypes[ex.type] = {
            count: 0,
            totalDuration: 0,
            totalCalories: 0,
          };
        }
        exerciseTypes[ex.type].count += 1;
        exerciseTypes[ex.type].totalDuration += ex.duration;
        exerciseTypes[ex.type].totalCalories += ex.calories;
      });

      return {
        totalCalories,
        totalDuration,
        totalSessions,
        exerciseTypes,
      };
    } catch (error) {
      console.error("Error calculating stats: ", error);
      throw error;
    }
  }
}

export default Exercise;