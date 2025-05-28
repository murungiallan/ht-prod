import User from "../models/user.js";
import { getAuth } from "firebase-admin/auth";
import { db as firebaseDb } from "../server.js";
import db from "../config/db.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import moment from "moment-timezone";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.join(__dirname, "../utils");
const logFilePath = path.join(logDir, "authlogs.txt");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logToFile = (message, level = "INFO") => {
  const timestamp = moment().tz("Asia/Singapore").format("YYYY-MM-DD HH:mm:ss");
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  try {
    fs.appendFileSync(logFilePath, logMessage);
  } catch (error) {
    console.error(`Failed to write to log file: ${error.message}`);
    console.error(message);
  }
};

class AuthController {
  static async updateProfile(req, res) {
    logToFile(`Starting updateProfile for user ${req.user.uid} at 07:15 PM +08 on May 28, 2025`);
    try {
      const { username, displayName, role, phone, address, height, weight } = req.body;
      const userId = req.user.uid;
      logToFile(`Received data: ${JSON.stringify({ username, displayName, role, phone, address, height, weight })}`);

      let profile_image = null;
      if (req.file) {
        profile_image = `/uploads/${req.file.filename}`;
        logToFile(`Profile image uploaded: ${profile_image}`);
      } else if (req.body.profile_image) {
        profile_image = req.body.profile_image;
        if (profile_image.startsWith("data:image")) {
          throw new Error("Base64 images are not allowed. Please upload the image file.");
        }
      }

      const updatedUser = await User.updateProfile(userId, {
        username,
        displayName,
        role,
        phone,
        address,
        height,
        weight,
        profile_image,
      });
      logToFile(`Profile updated successfully for user ${userId} in MySQL`);

      await firebaseDb.ref(`users/${userId}`).update({
        username,
        displayName,
        role,
        phone: phone || null,
        address: address || null,
        height: height || null,
        weight: weight || null,
        profile_image: profile_image || null,
      });
      logToFile(`Firebase sync completed for user ${userId}`);

      res.status(200).json(updatedUser);
    } catch (error) {
      logToFile(`Error updating profile: ${error.message}\n${error.stack}`, "ERROR");
      res.status(500).json({ error: "Failed to update profile", details: error.message });
    }
  }
  static async register(req, res) {
    logToFile(`Starting register for uid ${req.body.uid}`);
    try {
      const { uid, username, email, displayName, password, role, phone, address, height, weight, profile_image } = req.body;
      logToFile(`Received data: ${JSON.stringify({ uid, username, email, displayName, role, phone, address, height, weight, profile_image })}`);

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
        profile_image,
      });
      logToFile(`User registered successfully with uid: ${uid}`);

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
        profile_image: profile_image || null,
      });
      logToFile(`Firebase sync completed for user ${uid}`);

      res.status(201).json(newUser);
    } catch (error) {
      logToFile(`Registration error: ${error.message}\n${error.stack}`, "ERROR");
      if (error.code === "ER_DUP_ENTRY") {
        res.status(400).json({ error: "Email already exists" });
      } else {
        res.status(500).json({ error: "Failed to register user" });
      }
    }
  }

  static async updateLastLogin(req, res) {
    logToFile(`Starting updateLastLogin for user ${req.user.email}`);
    try {
      const email = req.user.email;
      const { displayName, lastLogin } = req.body;
      logToFile(`Received data: ${JSON.stringify({ displayName, lastLogin })}`);

      const user = await User.updateLastLogin(email, lastLogin);
      logToFile(`Last login updated for user ${email}`);

      await firebaseDb.ref(`users/${req.user.uid}/lastLogin`).set(lastLogin);
      logToFile(`Firebase sync completed for user ${req.user.uid}`);

      res.status(200).json({ email, displayName, lastLogin });
      logToFile(`User last login updated: ${lastLogin}`);
    } catch (error) {
      logToFile(`Error updating last login: ${error.message}\n${error.stack}`, "ERROR");
      res.status(500).json({ error: "Failed to update last login" });
    }
  }

  static async resetPassword(req, res) {
    logToFile(`Starting resetPassword for email ${req.body.email}`);
    try {
      const { email } = req.body;
      logToFile(`Received email: ${email}`);
      if (!email) {
        logToFile("Missing email parameter", "ERROR");
        return res.status(400).json({ error: "Email is required" });
      }

      await User.resetPassword(email);
      logToFile(`Password reset initiated for ${email}`);

      const auth = getAuth();
      const actionCodeSettings = {
        url: "http://127.0.0.1:3000/login",
        handleCodeInApp: true,
      };
      const resetLink = await auth.generatePasswordResetLink(email, actionCodeSettings);
      logToFile(`Generated reset link: ${resetLink}`);

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
      logToFile(`Password reset email sent to ${email}`);

      res.status(200).json({ message: "Password reset link sent to your email" });
    } catch (error) {
      logToFile(`Error resetting password: ${error.message}\n${error.stack}`, "ERROR");
      if (error.message === "No account found with this email") {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to send password reset email" });
      }
    }
  }

  static async getUser(req, res) {
    logToFile(`Starting getUser for email ${req.user.email}`);
    try {
      const email = req.user.email;
      const user = await User.getByEmail(email);
      logToFile(`Retrieved user data for ${email}`);

      if (!user) {
        logToFile(`User not found for email: ${email}`, "ERROR");
        return res.status(404).json({ error: "User not found" });
      }
      res.status(200).json(user);
    } catch (error) {
      logToFile(`Error getting user: ${error.message}\n${error.stack}`, "ERROR");
      res.status(500).json({ error: "Failed to get user" });
    }
  }

  static async getAllUsers(req, res) {
    logToFile("Starting getAllUsers");
    try {
      const users = await User.getAllUsers();
      logToFile(`Retrieved ${users.length} users`);

      res.status(200).json(users);
    } catch (error) {
      logToFile(`Error fetching all users: ${error.message}\n${error.stack}`, "ERROR");
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }

  static async saveFcmToken(req, res) {
    logToFile(`Starting saveFcmToken for uid ${req.body.uid}`);
    try {
      const { uid, fcmToken } = req.body;
      logToFile(`Received data: ${JSON.stringify({ uid, fcmToken })}`);

      if (!uid || !fcmToken) {
        logToFile("Missing uid or fcmToken", "ERROR");
        return res.status(400).json({ error: "uid and fcmToken are required" });
      }

      const [result] = await db.query("UPDATE users SET fcm_token = ? WHERE uid = ?", [fcmToken, uid]);
      if (result.affectedRows === 0) {
        logToFile(`User not found in MySQL for uid: ${uid}`, "ERROR");
        return res.status(404).json({ error: "User not found in MySQL" });
      }
      logToFile(`FCM token updated in MySQL for uid: ${uid}`);

      await firebaseDb.ref(`users/${uid}/fcmToken`).set(fcmToken);
      logToFile(`Firebase sync completed for uid: ${uid}`);

      res.status(200).json({ message: "FCM token saved successfully" });
    } catch (error) {
      logToFile(`Error saving FCM token: ${error.message}\n${error.stack}`, "ERROR");
      res.status(500).json({ error: "Failed to save FCM token", details: error.message });
    }
  }

  static async saveWeeklyGoals(req, res) {
    logToFile(`Starting saveWeeklyGoals for user ${req.user.uid}`);
    try {
      const { weeklyFoodCalorieGoal, weeklyExerciseCalorieGoal } = req.body;
      const uid = req.user.uid;
      logToFile(`Received data: ${JSON.stringify({ weeklyFoodCalorieGoal, weeklyExerciseCalorieGoal })}`);

      if (weeklyFoodCalorieGoal == null || weeklyExerciseCalorieGoal == null) {
        logToFile("Missing weekly goals", "ERROR");
        return res.status(400).json({ error: "Both weekly food and exercise calorie goals are required" });
      }

      const goals = await User.saveWeeklyGoals(uid, { weeklyFoodCalorieGoal, weeklyExerciseCalorieGoal });
      logToFile(`Weekly goals saved for user ${uid}`);

      await firebaseDb.ref(`users/${uid}/weeklyGoals`).set({
        weeklyFoodCalorieGoal,
        weeklyExerciseCalorieGoal,
      });
      logToFile(`Firebase sync completed for user ${uid}`);

      res.status(200).json({ message: "Weekly goals saved successfully", goals });
    } catch (error) {
      logToFile(`Error saving weekly goals: ${error.message}\n${error.stack}`, "ERROR");
      res.status(500).json({ error: "Failed to save weekly goals" });
    }
  }

  static async getWeeklyGoals(req, res) {
    logToFile(`Starting getWeeklyGoals for user ${req.user.uid}`);
    try {
      const uid = req.user.uid;
      const goals = await User.getWeeklyGoals(uid);
      logToFile(`Retrieved weekly goals for user ${uid}`);

      res.status(200).json(goals);
    } catch (error) {
      logToFile(`Error fetching weekly goals: ${error.message}\n${error.stack}`, "ERROR");
      res.status(500).json({ error: "Failed to fetch weekly goals" });
    }
  }
}

export default AuthController;