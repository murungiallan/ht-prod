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

  static async updateProfile(userId, { username, email, displayName, role }) {
    const query = `
      UPDATE users
      SET username = ?, email = ?, display_name = ?, role = ?
      WHERE uid = ?
    `;
    await db.query(query, [username, email, displayName, role, userId]);
    return { uid: userId, username, email, displayName, role };
  }
}

export default User;