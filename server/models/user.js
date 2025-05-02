import db from "../config/db.js";

class User {
  static async register({ uid, username, email, displayName, password, role }) {
    const query = `
      INSERT INTO users (uid, username, email, display_name, password, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [uid, username, email, displayName, password, role, new Date()];
    const [result] = await db.query(query, values);
    return { id: result.insertId, uid, username, email, displayName, role };
  }

  static async updateLastLogin(userId, lastLogin) {
    const query = `
      UPDATE users
      SET last_login = ?
      WHERE uid = ?
    `;
    await db.query(query, [new Date(lastLogin), userId]);
    return { uid: userId, lastLogin };
  }

  static async resetPassword(email) {
    const user = await this.getByEmail(email);
    if (!user) {
      throw new Error("No account found with this email");
    }
    return true;
  }

  static async getByEmail(email) {
    const query = `
      SELECT * FROM users
      WHERE email = ?
    `;
    const [rows] = await db.query(query, [email]);
    return rows[0] || null;
  }

  static async getAllUsers() {
    const query = `
      SELECT id, uid, username, email, display_name, role, created_at, last_login, weekly_food_calorie_goal, weekly_exercise_calorie_goal
      FROM users
    `;
    const [rows] = await db.query(query);
    return rows;
  }

  static async updateProfile(userId, { username, email, displayName, role }) {
    const query = `
      UPDATE users
      SET username = ?, email = ?, display_name = ?, role = ?
      WHERE uid = ?
    `;
    await db.query(query, [username, email, displayName, role, userId]);
    return { uid: userId, username, email, displayName, role };
  }

  static async saveWeeklyGoals(userId, { weeklyFoodCalorieGoal, weeklyExerciseCalorieGoal }) {
    const query = `
      UPDATE users
      SET weekly_food_calorie_goal = ?, weekly_exercise_calorie_goal = ?
      WHERE uid = ?
    `;
    await db.query(query, [weeklyFoodCalorieGoal, weeklyExerciseCalorieGoal, userId]);
    return { weeklyFoodCalorieGoal, weeklyExerciseCalorieGoal };
  }

  static async getWeeklyGoals(userId) {
    const query = `
      SELECT weekly_food_calorie_goal, weekly_exercise_calorie_goal
      FROM users
      WHERE uid = ?
    `;
    const [rows] = await db.query(query, [userId]);
    return rows[0] || { weekly_food_calorie_goal: null, weekly_exercise_calorie_goal: null };
  }
}

export default User;