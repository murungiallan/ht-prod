import User from "../models/user.js";
import { getAuth } from "firebase-admin/auth";
import { db as firebaseDb } from "../server.js";
import db from "../config/db.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

class AuthController {
  static async register(req, res) {
    try {
      const { uid, username, email, displayName, password, role, phone, address, height, weight, profile_image } = req.body;

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.register({
        uid,
        username,
        email,
        displayName,
        password: hashedPassword,
        role,
        phone,
        address,
        height,
        weight,
        profile_image
      });

      await firebaseDb.ref(`users/${uid}`).set({
        username,
        email,
        displayName,
        role,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        phone: phone || null,
        address: address || null,
        height: height || null,
        weight: weight || null,
        profile_image: profile_image || null
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
      await firebaseDb.ref(`users/${req.user.uid}/lastLogin`).set(lastLogin);

      res.status(200).json({ email, displayName, lastLogin });
      console.log(`User last login updated: ${lastLogin}`)
    } catch (error) {
      console.error("Error updating last login:", error);
      res.status(500).json({ error: "Failed to update last login" });
    }
  }

  static async resetPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      await User.resetPassword(email);

      const auth = getAuth();
      const actionCodeSettings = {
        url: "http://127.0.0.1:3000/login",
        handleCodeInApp: true,
      };
      const resetLink = await auth.generatePasswordResetLink(email, actionCodeSettings);
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "HealthTrack Password Reset",
        html: `
          <h2>Reset Your HealthTrack Password</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({ message: "Password reset link sent to your email" });
    } catch (error) {
      console.error("Error resetting password:", error);
      if (error.message === "No account found with this email") {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to send password reset email" });
      }
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

  static async getAllUsers(req, res) {
    try {
      const users = await User.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }

  static async updateProfile(req, res) {
    try {
      const { username, displayName, role, phone, address, height, weight, profile_image } = req.body;
      const userId = req.user.uid;

      const updatedUser = await User.updateProfile(userId, {
        username,
        displayName,
        role,
        phone,
        address,
        height,
        weight,
        profile_image
      });

      await firebaseDb.ref(`users/${userId}`).update({
        username,
        displayName,
        role,
        phone: phone || null,
        address: address || null,
        height: height || null,
        weight: weight || null,
        profile_image: profile_image || null
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }

  static async saveFcmToken(req, res) {
    try {
      const { uid, fcmToken } = req.body;

      if (!uid || !fcmToken) {
        return res.status(400).json({ error: "uid and fcmToken are required" });
      }

      const [result] = await db.query("UPDATE users SET fcm_token = ? WHERE uid = ?", [fcmToken, uid]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found in MySQL" });
      }

      await firebaseDb.ref(`users/${uid}/fcmToken`).set(fcmToken);

      res.status(200).json({ message: "FCM token saved successfully" });
    } catch (error) {
      console.error("Error saving FCM token:", error);
      res.status(500).json({ error: "Failed to save FCM token", details: error.message });
    }
  }

  static async saveWeeklyGoals(req, res) {
    try {
      const { weeklyFoodCalorieGoal, weeklyExerciseCalorieGoal } = req.body;
      const uid = req.user.uid;

      if (weeklyFoodCalorieGoal == null || weeklyExerciseCalorieGoal == null) {
        return res.status(400).json({ error: "Both weekly food and exercise calorie goals are required" });
      }

      const goals = await User.saveWeeklyGoals(uid, { weeklyFoodCalorieGoal, weeklyExerciseCalorieGoal });

      await firebaseDb.ref(`users/${uid}/weeklyGoals`).set({
        weeklyFoodCalorieGoal,
        weeklyExerciseCalorieGoal,
      });

      res.status(200).json({ message: "Weekly goals saved successfully", goals });
    } catch (error) {
      console.error("Error saving weekly goals:", error);
      res.status(500).json({ error: "Failed to save weekly goals" });
    }
  }

  static async getWeeklyGoals(req, res) {
    try {
      const uid = req.user.uid;
      const goals = await User.getWeeklyGoals(uid);
      res.status(200).json(goals);
    } catch (error) {
      console.error("Error fetching weekly goals:", error);
      res.status(500).json({ error: "Failed to fetch weekly goals" });
    }
  }
}

export default AuthController;