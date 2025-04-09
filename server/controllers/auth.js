// AuthController.js
import User from "../models/user.js";
import { db } from "../server.js";
import bcrypt from "bcrypt";

class AuthController {
  static async register(req, res) {
    try {
      const { uid, username, email, displayName, password, role } = req.body;

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.register({
        uid,
        username,
        email,
        displayName,
        password: hashedPassword,
        role,
      });

      await db.ref(`users/${uid}`).set({
        username,
        email,
        displayName,
        role,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });

      res.status(201).json(newUser);
    } catch (error) {
      console.error("Registration error:", error);
      if (error.code === "ER_DUP_ENTRY") {
        res.status(400).json({ error: "Email already exists" });
      } else {
        res.status(500).json({ error: "Failed to register user" });
      }
    }
  }

  static async updateLastLogin(req, res) {
    try {
      const email = req.user.email;
      const { displayName, lastLogin } = req.body;

      const user = await User.updateLastLogin(email, lastLogin);
      await db.ref(`users/${req.user.uid}/lastLogin`).set(lastLogin);

      res.status(200).json({ email, displayName, lastLogin });
    } catch (error) {
      console.error("Error updating last login:", error);
      res.status(500).json({ error: "Failed to update last login" });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { email } = req.body;
      await User.resetPassword(email);
      res.status(200).json({ message: "Password reset link sent" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  }

  static async getUser(req, res) {
    try {
      const email = req.user.email;
      const user = await User.getByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(200).json(user);
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  }

  static async updateProfile(req, res) {
    try {
      const email = req.user.email;
      const { username, email: newEmail, displayName, role } = req.body;

      const updatedUser = await User.updateProfile(email, { username, email: newEmail, displayName, role });

      await db.ref(`users/${req.user.uid}`).set({
        username: updatedUser.username,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        role: updatedUser.role,
        lastLogin: updatedUser.lastLogin || new Date().toISOString(),
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
}

export default AuthController;