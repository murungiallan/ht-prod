import User from "../models/user.js";

class AuthController {
  // Register a new user
  static async register(req, res) {
    try {
      const { email, displayName } = req.body;
      const uid = req.user.uid;
      
      const newUser = await User.register(uid, email, displayName);
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  }

  // Update last login
  static async updateLastLogin(req, res) {
    try {
      const userId = req.user.uid;
      const user = await User.updateLastLogin(userId);
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update last login" });
    }
  }

  // Reset password
  static async resetPassword(req, res) {
    try {
      const { email } = req.body;
      await User.resetPassword(email);
      res.status(200).json({ message: "Password reset link sent" });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset password" });
    }
  }

  // Get user by ID
  static async getUser(req, res) {
    try {
      const userId = req.user.uid;
      const user = await User.getById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const userId = req.user.uid;
      const userData = req.body;
      const updatedUser = await User.updateProfile(userId, userData);
      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  }

  // Update user preferences
  static async updatePreferences(req, res) {
    try {
      const userId = req.user.uid;
      const preferences = req.body;
      const updatedPreferences = await User.updatePreferences(userId, preferences);
      res.status(200).json(updatedPreferences);
    } catch (error) {
      res.status(500).json({ error: "Failed to update preferences" });
    }
  }
}

export default AuthController;