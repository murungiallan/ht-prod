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
      SELECT * FROM users
    `;
    const [rows] = await db.query(query);
    return rows;
  }

  static async updateProfile(userId, { username, displayName, role, phone, address, height, weight, profile_image }) {
    // Validate profile_image as a URL (basic validation)
    if (profile_image && !profile_image.startsWith("/uploads/") && !profile_image.startsWith("http")) {
      throw new Error("Invalid profile image URL");
    }

    const query = `
      UPDATE users
      SET username = ?, display_name = ?, role = ?, phone = ?, address = ?, height = ?, weight = ?, profile_image = ?
      WHERE uid = ?
    `;
    const [result] = await db.query(query, [
      username,
      displayName,
      role,
      phone || null,
      address || null,
      height || null,
      weight || null,
      profile_image || null,
      userId,
    ]);

    if (result.affectedRows === 0) {
      throw new Error("User not found");
    }

    return { uid: userId, username, displayName, role, phone, address, height, weight, profile_image };
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