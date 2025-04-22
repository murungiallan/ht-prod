import db from "../config/db.js";

class Exercise {
  static async add(exerciseData) {
    const { userId, activity, duration, calories_burned, date_logged} = exerciseData;
    const query = `
      INSERT INTO exercises (user_id, activity, duration, calories_burned, date_logged)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [userId, activity, duration, calories_burned || null, date_logged];
    const [result] = await db.query(query, values);
    return { id: result.insertId, ...exerciseData };
  }

  static async getByUser(userId) {
    const query = `
      SELECT * FROM exercises
      WHERE user_id = ?
    `;
    const [rows] = await db.query(query, [userId]);
    return rows;
  }

  static async update(id, updatedData) {
    const { activity, duration, calories_burned, date_logged } = updatedData;
    const query = `
      UPDATE exercises
      SET activity = ?, duration = ?, calories_burned = ?, date_logged = ?
      WHERE id = ?
    `;
    await db.query(query, [activity, duration, calories_burned || null, date_logged, id]);
    return { id: parseInt(id), ...updatedData };
  }

  static async delete(id) {
    const query = `
      DELETE FROM exercises
      WHERE id = ?
    `;
    await db.query(query, [id]);
    return true;
  }

  static async getStats(userId) {
    const query = `
      SELECT 
        COUNT(*) as totalExercises,
        SUM(duration) as totalDuration,
        SUM(calories_burned) as totalCaloriesBurned
      FROM exercises
      WHERE user_id = ?
    `;
    const [rows] = await db.query(query, [userId]);
    return rows[0];
  }
}

export default Exercise;