import db from "../config/db.js";

class FoodDiary {
  static async add(foodData) {
    const { userId, food_name, calories, carbs, protein, fats, image_url, date_logged, meal_type } = foodData;
    const query = `
      INSERT INTO food_logs (user_id, food_name, calories, carbs, protein, fats, image_url, date_logged, meal_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [userId, food_name, calories, carbs, protein, fats, image_url || null, date_logged, meal_type];
    const [result] = await db.query(query, values);
    return { id: result.insertId, ...foodData };
  }

  static async getByUser(userId) {
    const query = `
      SELECT * FROM food_logs
      WHERE user_id = ?
      ORDER BY date_logged DESC
    `;
    const [rows] = await db.query(query, [userId]);
    return rows;
  }

  static async update(id, updatedData) {
    const { food_name, calories, carbs, protein, fats, image_url, date_logged, meal_type } = updatedData;
    const query = `
      UPDATE food_logs
      SET food_name = ?, calories = ?, carbs = ?, protein = ?, fats = ?, image_url = ?, date_logged = ?, meal_type = ?
      WHERE id = ?
    `;
    await db.query(query, [food_name, calories, carbs, protein, fats, image_url || null, date_logged, meal_type, id]);
    return { id: parseInt(id), ...updatedData };
  }

  static async delete(id) {
    const query = `
      DELETE FROM food_logs
      WHERE id = ?
    `;
    await db.query(query, [id]);
    return true;
  }

  static async getStats(userId) {
    const query = `
      SELECT 
        SUM(calories) as totalCalories,
        SUM(carbs) as totalCarbs,
        SUM(protein) as totalProtein,
        SUM(fats) as totalFats,
        DATE(date_logged) as logDate,
        meal_type
      FROM food_logs
      WHERE user_id = ?
      GROUP BY DATE(date_logged), meal_type
    `;
    const [rows] = await db.query(query, [userId]);
    return rows;
  }

  static async copyEntry(id, newDate) {
    const query = `
      INSERT INTO food_logs (user_id, food_name, calories, carbs, protein, fats, image_url, date_logged, meal_type)
      SELECT user_id, food_name, calories, carbs, protein, fats, image_url, ?, meal_type
      FROM food_logs
      WHERE id = ?
    `;
    const [result] = await db.query(query, [newDate, id]);
    return result.insertId;
  }
}

export default FoodDiary;