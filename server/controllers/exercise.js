import Exercise from '../models/exercise.js';

class ExerciseController {
  // Add a new exercise
  static async addExercise(req, res) {
    try {
      const { type, duration, calories, date, notes } = req.body;
      const userId = req.user.uid; 
      
      // Validation
      if (!type || !duration || !calories) {
        return res.status(400).json({ error: 'Type, duration, and calories are required' });
      }
      
      const exerciseData = {
        userId,
        type,
        duration: parseInt(duration),
        calories: parseInt(calories),
        date: date ? new Date(date) : new Date(),
        notes
      };
      
      const exercise = await Exercise.add(exerciseData);
      return res.status(201).json(exercise);
    } catch (error) {
      console.error('Error adding exercise:', error);
      return res.status(500).json({ error: 'Failed to add exercise' });
    }
  }
  
  // Get all exercises for current user
  static async getUserExercises(req, res) {
    try {
      const userId = req.user.uid;
      const exercises = await Exercise.getByUser(userId);
      return res.status(200).json(exercises);
    } catch (error) {
      console.error('Error getting exercises:', error);
      return res.status(500).json({ error: 'Failed to get exercises' });
    }
  }
  
  // Update exercise
  static async updateExercise(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.uid;
      const { type, duration, calories, date, notes } = req.body;
      const exercises = await Exercise.getByUser(userId);
      const exercise = exercises.find(ex => ex.id === id);
      
      if (!exercise) {
        return res.status(404).json({ error: 'Exercise not found or unauthorized' });
      }
      
      const updatedData = {
        type: type || exercise.type,
        duration: duration ? parseInt(duration) : exercise.duration,
        calories: calories ? parseInt(calories) : exercise.calories,
        date: date ? new Date(date) : exercise.date,
        notes: notes !== undefined ? notes : exercise.notes
      };
      
      const updatedExercise = await Exercise.update(id, updatedData);
      return res.status(200).json(updatedExercise);
    } catch (error) {
      console.error('Error updating exercise:', error);
      return res.status(500).json({ error: 'Failed to update exercise' });
    }
  }
  
  // Delete exercise
  static async deleteExercise(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.uid;
      const exercises = await Exercise.getByUser(userId);
      const exercise = exercises.find(ex => ex.id === id);
      
      if (!exercise) {
        return res.status(404).json({ error: 'Exercise not found or unauthorized' });
      }
      
      await Exercise.delete(id);
      return res.status(200).json({ message: 'Exercise deleted successfully' });
    } catch (error) {
      console.error('Error deleting exercise:', error);
      return res.status(500).json({ error: 'Failed to delete exercise' });
    }
  }
  
  // Get exercise statistics
  static async getExerciseStats(req, res) {
    try {
      const userId = req.user.uid;
      const stats = await Exercise.getStats(userId);
      return res.status(200).json(stats);
    } catch (error) {
      console.error('Error getting exercise stats:', error);
      return res.status(500).json({ error: 'Failed to get exercise statistics' });
    }
  }
}

export default ExerciseController;