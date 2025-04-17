import db from "../config/db.js";

class Food {
  static async add(foodData) {
    const { userId, food_name, portion_size, calories, date_logged } = foodData;
    const query = `
      INSERT INTO exercises (user_id, food_name, portion_size, calories, date_logged)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [userId, food_name, portion_size, calories || null, date_logged];
    const [result] = await db.query(query, values);
    return { id: result.insertId, ...foodData };
  }

  static async getByUser(userId) {
    const query = `
      SELECT * FROM food_diary
      WHERE user_id = ?
    `;
    const [rows] = await db.query(query, [userId]);
    return rows;
  }

  static async update(id, updatedData) {
    const { food_name, portion_size, calories, date_logged } = updatedData;
    const query = `
      UPDATE food_diary
      SET food_name = ?, portion_size = ?, calories = ?, date_logged = ?
      WHERE id = ?
    `;
    await db.query(query, [food_name, portion_size, calories || null, date_logged, id]);
    return { id: parseInt(id), ...updatedData };
  }

  static async delete(id) {
    const query = `
      DELETE FROM food_diary
      WHERE id = ?
    `;
    await db.query(query, [id]);
    return true;
  }

  static async getStats(userId) {
    const query = `
      SELECT 
        COUNT(*) as totalExercises,
        SUM(calories) as totalCalories
      FROM food_diary
      WHERE user_id = ?
    `;
    const [rows] = await db.query(query, [userId]);
    return rows[0];
  }
}

export default Food;