import Reminder from "../models/reminder.models.js";
import Medication from "../models/medication.models.js";
import { db as firebaseDb } from "../server.js"; // Firebase Realtime Database
import db from "../config/db.js"; // MySQL connection pool
import moment from "moment-timezone";
import admin from "firebase-admin";
import cron from "node-cron";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.join(__dirname, "../utils");
const logFilePath = path.join(logDir, "reminderlogs.txt");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom logging function
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

class ReminderController {
  static async addReminder(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ success: false, message: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { medicationId, doseIndex, reminderTime, date, type } = req.body;

      logToFile(`Received reminder data: ${JSON.stringify({ medicationId, doseIndex, reminderTime, date, type })}`);

      // Validation
      if (!medicationId || !Number.isInteger(doseIndex) || doseIndex < 0 || !reminderTime || !date || !type) {
        logToFile(`Missing required fields: ${JSON.stringify({ medicationId, doseIndex, reminderTime, date, type })}`, "ERROR");
        return res.status(400).json({ success: false, message: "All required fields (medicationId, doseIndex, reminderTime, date, type) must be provided" });
      }

      if (!["single", "daily"].includes(type)) {
        logToFile(`Invalid reminder type: ${type}`, "ERROR");
        return res.status(400).json({ success: false, message: "Type must be 'single' or 'daily'" });
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        logToFile(`Invalid date format: ${date}`, "ERROR");
        return res.status(400).json({ success: false, message: "Date must be in YYYY-MM-DD format" });
      }

      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
      if (!timeRegex.test(reminderTime)) {
        logToFile(`Invalid time format: ${reminderTime}`, "ERROR");
        return res.status(400).json({ success: false, message: "Reminder time must be in HH:mm:ss format" });
      }

      const medications = await Medication.getByUser(userId);
      const medication = medications.find((med) => med.id === parseInt(medicationId));
      if (!medication) {
        logToFile(`Medication not found: ${medicationId}`, "ERROR");
        return res.status(404).json({ success: false, message: "Medication not found" });
      }

      const doses = medication.doses[date] || [];
      if (doseIndex >= doses.length) {
        logToFile(`Invalid doseIndex: ${doseIndex} for doses length: ${doses.length}`, "ERROR");
        return res.status(400).json({ success: false, message: "Invalid doseIndex" });
      }
      const doseTime = doses[doseIndex].time;
      const doseDateTime = moment(`${date} ${doseTime}`, "YYYY-MM-DD HH:mm:ss");
      const reminderDateTime = moment(`${date} ${reminderTime}`, "YYYY-MM-DD HH:mm:ss");
      const now = moment().tz("Asia/Singapore");
      const today = now.format("YYYY-MM-DD");

      // Check for past time
      if (reminderDateTime.isBefore(now) && moment(date).isSameOrBefore(moment(today))) {
        logToFile(`Reminder time is in the past: ${reminderDateTime.format()}`, "ERROR");
        return res.status(400).json({ success: false, message: "Reminder time cannot be set for a past medication." });
      }

      // Validation 1: Reminder time must be within 2 hours before the dose time (and not after)
      const windowStart = moment(doseDateTime).subtract(2, "hours");
      if (reminderDateTime.isBefore(windowStart) || reminderDateTime.isAfter(doseDateTime)) {
        logToFile(
          `Reminder time outside the 2-hour window: ${JSON.stringify({
            reminderTime,
            doseTime,
            windowStart: windowStart.format(),
          })}`,
          "ERROR"
        );
        return res.status(400).json({ success: false, message: "Reminder time must be within 2 hours before the medication dose time and not after the dose time" });
      }

      // Validation 2: If reminder time is after dose time, allow only if the date is in the future
      if (reminderDateTime.isAfter(doseDateTime)) {
        if (moment(date, "YYYY-MM-DD").isSameOrBefore(moment(today, "YYYY-MM-DD"))) {
          logToFile(
            `Reminder time is after dose time and date is not in the future: ${JSON.stringify({ reminderTime, doseTime, date, today })}`,
            "ERROR"
          );
          return res.status(400).json({ success: false, message: `Please select a reminder time that is before the dose time ${doseDateTime.format("YYYY-MM-DD HH:mm:ss")} or set it for a future date` });
        }
      }

      // Check for existing reminders
      const [existingReminders] = await db.query(
        "SELECT id, type FROM reminders WHERE user_id = ? AND medication_id = ? AND dose_index = ? AND date = ?",
        [userId, medicationId, doseIndex, date]
      );

      if (existingReminders && existingReminders.length > 0) {
        const existingType = existingReminders[0].type;
        if (existingType !== type) {
          logToFile(`Type mismatch: ${JSON.stringify({ existingType, newType: type })}`, "ERROR");
          return res.status(400).json({ success: false, message: `A ${existingType} reminder exists for this dose. Please delete it first before setting a ${type} reminder.` });
        }
      }

      let newReminder;
      let responseMessage = "Reminder added successfully";
      let statusCode = 201;

      if (existingReminders && existingReminders.length > 0) {
        // Update the existing reminder (same type only)
        const existingReminderId = existingReminders[0].id;
        logToFile(`Found existing reminder ID ${existingReminderId} for dose, updating...`);

        const reminderData = {
          reminder_time: reminderTime,
          type,
          status: "pending",
        };

        newReminder = await Reminder.update(existingReminderId, reminderData);

        // Sync with Firebase
        await firebaseDb.ref(`reminders/${firebaseUid}/${existingReminderId}`).update({
          reminderTime,
          type,
          status: "pending",
        });

        responseMessage = `Previous reminder for dose at ${doseDateTime.format("HH:mm")} on ${date} has been updated`;
        statusCode = 200;
      } else {
        // Create a new reminder
        const reminderData = {
          userId,
          medication_id: medicationId,
          dose_index: doseIndex,
          reminder_time: reminderTime,
          date,
          type,
          status: "pending",
        };

        newReminder = await Reminder.add(reminderData);

        // Sync with Firebase
        await firebaseDb.ref(`reminders/${firebaseUid}/${newReminder.id}`).set({
          id: newReminder.id,
          userId,
          medicationId,
          doseIndex,
          reminderTime,
          date,
          type,
          status: newReminder.status,
        });
      }

      res.status(statusCode).json({
        success: true,
        message: responseMessage,
        reminder: newReminder,
      });
    } catch (error) {
      logToFile(`Error adding reminder: ${error.message}\n${error.stack}`, "ERROR");
      res.status(500).json({ success: false, message: "Failed to add reminder", details: error.message });
    }
  }

  static async updateReminder(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ success: false, message: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id } = req.params;
      const { reminderTime, date, type, status } = req.body;

      const reminders = await Reminder.getByUser(userId);
      if (!reminders.some((rem) => rem.id === parseInt(id))) {
        return res.status(404).json({ success: false, message: "Reminder not found" });
      }

      const reminder = reminders.find((rem) => rem.id === parseInt(id));
      const med = await Medication.getByUser(userId);
      const medication = med.find((m) => m.id === reminder.medication_id);
      if (!medication) {
        return res.status(404).json({ success: false, message: "Medication not found" });
      }

      const finalReminderTime = reminderTime || reminder.reminder_time;
      const finalDate = date || reminder.date;
      const finalType = type || reminder.type;

      if (!["single", "daily"].includes(finalType)) {
        logToFile(`Invalid reminder type: ${finalType}`, "ERROR");
        return res.status(400).json({ success: false, message: "Type must be 'single' or 'daily'" });
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(finalDate)) {
        logToFile(`Invalid date format: ${finalDate}`, "ERROR");
        return res.status(400).json({ success: false, message: "Date must be in YYYY-MM-DD format" });
      }

      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
      if (!timeRegex.test(finalReminderTime)) {
        logToFile(`Invalid time format: ${finalReminderTime}`, "ERROR");
        return res.status(400).json({ success: false, message: "Reminder time must be in HH:mm:ss format" });
      }

      const doses = medication.doses[finalDate] || [];
      if (reminder.dose_index >= doses.length) {
        logToFile(`Invalid doseIndex: ${reminder.dose_index} for doses length: ${doses.length}`, "ERROR");
        return res.status(400).json({ success: false, message: "Invalid doseIndex" });
      }
      const doseTime = doses[reminder.dose_index].time;
      const doseDateTime = moment(`${finalDate} ${doseTime}`, "YYYY-MM-DD HH:mm:ss");
      const reminderDateTime = moment(`${finalDate} ${finalReminderTime}`, "YYYY-MM-DD HH:mm:ss");
      const now = moment().tz("Asia/Singapore");
      const today = now.format("YYYY-MM-DD");

      // Check for past time
      if (reminderDateTime.isBefore(now) && moment(finalDate).isSameOrBefore(moment(today))) {
        logToFile(`Reminder time is in the past: ${reminderDateTime.format()}`, "ERROR");
        return res.status(400).json({ success: false, message: "Reminder time cannot be set in the past" });
      }

      // Validation 1: Reminder time must be within 2 hours before the dose time (and not after)
      const windowStart = moment(doseDateTime).subtract(2, "hours");
      if (reminderDateTime.isBefore(windowStart) || reminderDateTime.isAfter(doseDateTime)) {
        logToFile(
          `Reminder time outside the 2-hour window: ${JSON.stringify({
            finalReminderTime,
            doseTime,
            windowStart: windowStart.format(),
          })}`,
          "ERROR"
        );
        return res.status(400).json({ success: false, message: "Reminder time must be within 2 hours before the medication dose time and not after the dose time" });
      }

      // Validation 2: If reminder time is after dose time, allow only if the date is in the future
      if (reminderDateTime.isAfter(doseDateTime)) {
        if (moment(finalDate, "YYYY-MM-DD").isSameOrBefore(moment(today, "YYYY-MM-DD"))) {
          logToFile(
            `Reminder time is after dose time and date is not in the future: ${JSON.stringify({ finalReminderTime, doseTime, finalDate, today })}`,
            "ERROR"
          );
          return res.status(400).json({ success: false, message: `Please select a reminder time that is before the dose time ${doseDateTime.format("YYYY-MM-DD HH:mm:ss")} or set it for a future date` });
        }
      }

      // Check for duplicate reminder time
      const [duplicateCheck] = await db.query(
        "SELECT id FROM reminders WHERE user_id = ? AND medication_id = ? AND dose_index = ? AND reminder_time = ? AND date = ? AND id != ?",
        [userId, reminder.medication_id, reminder.dose_index, finalReminderTime, finalDate, id]
      );
      if (duplicateCheck.length > 0) {
        logToFile(`Duplicate reminder time found: ${finalReminderTime}`, "ERROR");
        return res.status(400).json({ success: false, message: "A reminder with this time already exists for the same dose" });
      }

      // Check type consistency
      if (reminder.type !== finalType) {
        logToFile(`Type mismatch: ${JSON.stringify({ existingType: reminder.type, newType: finalType })}`, "ERROR");
        return res.status(400).json({ success: false, message: `Cannot update a ${reminder.type} reminder to ${finalType}. Please delete the existing reminder first.` });
      }

      const updatedReminder = await Reminder.update(id, { reminder_time: finalReminderTime, date: finalDate, type: finalType, status });

      await firebaseDb.ref(`reminders/${firebaseUid}/${id}`).update({
        reminderTime: updatedReminder.reminder_time,
        date: updatedReminder.date,
        type: updatedReminder.type,
        status: updatedReminder.status,
      });

      res.status(200).json({ success: true, message: "Reminder updated successfully", reminder: updatedReminder });
    } catch (error) {
      logToFile(`Error updating reminder: ${error.message}\n${error.stack}`, "ERROR");
      res.status(500).json({ success: false, message: "Failed to update reminder", details: error.message });
    }
  }

  static async getUserReminders(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ success: false, message: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const reminders = await Reminder.getByUser(userId);
      reminders.forEach((reminder) => {
        firebaseDb.ref(`reminders/${firebaseUid}/${reminder.id}`).set({
          id: reminder.id,
          userId: reminder.user_id,
          medicationId: reminder.medication_id,
          doseIndex: reminder.dose_index,
          reminderTime: reminder.reminder_time,
          date: reminder.date,
          type: reminder.type,
          status: reminder.status,
        });
      });

      res.status(200).json({ success: true, message: "Reminders retrieved successfully", reminders });
    } catch (error) {
      logToFile(`Error getting reminders: ${error.message}\n${error.stack}`, "ERROR");
      res.status(500).json({ success: false, message: "Failed to get reminders", details: error.message });
    }
  }

  static async deleteReminder(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ success: false, message: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id } = req.params;
      const reminders = await Reminder.getByUser(userId);
      if (!reminders.some((rem) => rem.id === parseInt(id))) {
        return res.status(404).json({ success: false, message: "Reminder not found" });
      }

      await Reminder.delete(id);

      await firebaseDb.ref(`reminders/${firebaseUid}/${id}`).remove();

      res.status(200).json({ success: true, message: "Reminder deleted successfully" });
    } catch (error) {
      logToFile(`Error deleting reminder: ${error.message}\n${error.stack}`, "ERROR");
      res.status(500).json({ success: false, message: "Failed to delete reminder", details: error.message });
    }
  }

  static async updateReminderStatus(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ success: false, message: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id } = req.params;
      const { status } = req.body;

      if (!["pending", "sent"].includes(status)) {
        return res.status(400).json({ success: false, message: "Status must be 'pending' or 'sent'" });
      }

      const reminders = await Reminder.getByUser(userId);
      if (!reminders.some((rem) => rem.id === parseInt(id))) {
        return res.status(404).json({ success: false, message: "Reminder not found" });
      }

      const updatedReminder = await Reminder.updateStatus(id, status);

      await firebaseDb.ref(`reminders/${firebaseUid}/${id}`).update({ status });

      res.status(200).json({ success: true, message: "Reminder status updated successfully", reminder: updatedReminder });
    } catch (error) {
      logToFile(`Error updating reminder status: ${error.message}\n${error.stack}`, "ERROR");
      res.status(500).json({ success: false, message: "Failed to update reminder status", details: error.message });
    }
  }

  static async sendReminderNotification(userId, medicationId, doseIndex, reminderTime, date, type) {
    try {
      logToFile(`Starting to send reminder notification for user ${userId}, medication ${medicationId}`);
      
      const [reminderRows] = await db.query(
        "SELECT id FROM reminders WHERE user_id = ? AND medication_id = ? AND dose_index = ? AND reminder_time = ? AND date = ?",
        [userId, medicationId, doseIndex, reminderTime, date]
      );
      
      if (!reminderRows || reminderRows.length === 0) {
        logToFile(`No reminder found for user ${userId}, medication ${medicationId}, dose ${doseIndex}`, "ERROR");
        return false;
      }
      const reminderId = reminderRows[0].id;

      const [userRows] = await db.query("SELECT email, uid FROM users WHERE id = ?", [userId]);
      if (!userRows || userRows.length === 0) {
        logToFile(`User not found for userId: ${userId}`, "ERROR");
        return false;
      }
      
      const userEmail = userRows[0].email;
      const firebaseUid = userRows[0].uid;
      
      if (!userEmail) {
        logToFile(`No email found for user: ${userId}`, "ERROR");
        return false;
      }
      
      logToFile(`User email found: ${userEmail}`);

      const [medRows] = await db.query("SELECT medication_name, doses FROM medications WHERE id = ?", [medicationId]);
      if (!medRows || medRows.length === 0) {
        logToFile(`Medication not found: ${medicationId}`, "ERROR");
        return false;
      }

      const medicationName = medRows[0].medication_name;
      
      // Checks if doses is already an object or needs parsing
      let doses;
      if (typeof medRows[0].doses === 'string') {
        doses = JSON.parse(medRows[0].doses || '{}');
      } else {
        doses = medRows[0].doses || {};
      }
      
      const doseSchedule = doses[date] || [];
      if (doseIndex >= doseSchedule.length) {
        logToFile(`Invalid doseIndex ${doseIndex} for medication ${medicationId} on ${date}`, "ERROR");
        return false;
      }
      const doseTime = doseSchedule[doseIndex].time;

      if (!medicationName) {
        logToFile(`Medication name is missing for medication ${medicationId}`, "ERROR");
        return false;
      }
      if (!doseTime) {
        logToFile(`Dose time is missing for doseIndex ${doseIndex} on ${date} for medication ${medicationId}`, "ERROR");
        return false;
      }

      const reminderDateTime = moment(`${date} ${reminderTime}`, "YYYY-MM-DD HH:mm:ss");
      const doseDateTime = moment(`${date} ${doseTime}`, "YYYY-MM-DD HH:mm:ss");
      const formattedDate = moment(date, "YYYY-MM-DD").format("D MMMM");
      const formattedReminderTime = reminderDateTime.format("h:mm A");
      const formattedDoseTime = doseDateTime.format("h:mm A");
      
      logToFile(`Sending notification for medication: ${medicationName} at dose time: ${formattedDoseTime}`);

      try {
        const userSnapshot = await firebaseDb.ref(`users/${firebaseUid}`).once('value');
        const userData = userSnapshot.val();
        
        if (userData && userData.fcm_token) {
          const message = {
            notification: {
              title: "Medication Reminder",
              body: `Take your ${medicationName} on ${formattedDate} at ${formattedDoseTime}`,
            },
            token: userData.fcm_token,
          };
          
          const fcmResult = await admin.messaging().send(message);
          logToFile(`FCM Notification sent successfully: ${fcmResult}`);
        } else {
          logToFile(`No FCM token found for user: ${userId}, continuing with email only`);
        }
      } catch (fcmError) {
        logToFile(`FCM notification failed but continuing with email: ${fcmError.message}`, "ERROR");
      }

      const sanitizeHtml = (str) => {
        if (str == null) return "";
        return str
          .toString()
          .replace(/&/g, "&")
          .replace(/</g, "<")
          .replace(/>/g, ">")
          .replace(/"/g, '"')
          .replace(/'/g, "'");
      };
      
      const sanitizedMedicationName = sanitizeHtml(medicationName);

      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        logToFile("EMAIL_USER or EMAIL_PASS environment variables are missing", "ERROR");
        return false;
      }
      
      logToFile(`Creating email transport with user: ${process.env.EMAIL_USER}`);

      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        logger: true,
        debug: true,
        tls: {
          // Temporary fallback for SSL issues
          rejectUnauthorized: false
        }
      });

      try {
        await transporter.verify();
        logToFile("Email transporter verified successfully");
      } catch (verifyError) {
        logToFile(`Email transporter verification failed: ${verifyError.message}`, "ERROR");
        if (verifyError.code === 'EAUTH') {
          logToFile("Authentication failed. Please verify EMAIL_USER and EMAIL_PASS in .env file and ensure an App Password is used with 2-Step Verification enabled.", "ERROR");
        }
        throw verifyError;
      }

      const mailOptions = {
        from: `"HealthTrack" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: "Your HealthTrack Medication Reminder",
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
              
              body { 
                font-family: 'Montserrat', Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f8f8f8;
                color: #333;
              }
              
              .container {
                max-width: 600px;
                margin: 20px auto;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.08);
              }
              
              .header {
                padding: 25px 20px;
                text-align: center;
                position: relative;
              }
              
              .header:after {
                content: "";
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 6px;
              }
              
              .logo {
                width: 40px;
                height: 40px;
                background-color: #fff;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 10px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
              }
              
              .logo-inner {
                width: 30px;
                height: 30px;
                background-color: #000;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-weight: bold;
                font-size: 14px;
              }
              
              .header h1 {
                margin: 10px 0 0;
                font-size: 28px;
                font-weight: 700;
                letter-spacing: 1px;
              }
              
              .content {
                padding: 35px 30px;
                background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23f0f0f0' fill-opacity='0.3' fill-rule='evenodd'/%3E%3C/svg%3E");
              }
              
              .reminder-box {
                background: #fff;
                border-left: 4px solid #000;
                padding: 20px 25px;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.05);
                margin: 25px 0;
              }
              
              .content h2 {
                color: #000000;
                font-size: 22px;
                margin-top: 0;
                margin-bottom: 20px;
                font-weight: 600;
                position: relative;
                display: inline-block;
              }
              
              .content h2:after {
                content: "";
                position: absolute;
                bottom: -4px;
                left: 0;
                width: 60px;
                height: 3px;
                background: #000;
              }
              
              .content p {
                color: #555555;
                line-height: 1.7;
                font-size: 16px;
                margin-bottom: 15px;
              }
              
              .med-details {
                background: #f8f8f8;
                border-radius: 8px;
                padding: 15px 20px;
                margin: 20px 0;
                border: 1px solid #eaeaea;
              }
              
              .med-detail-item {
                display: flex;
                margin-bottom: 10px;
                align-items: center;
              }
              
              .med-detail-label {
                min-width: 120px;
                font-weight: 600;
                color: #000;
              }
              
              .med-detail-value {
                color: #333;
              }
              
              .footer {
                color: #000;
                padding: 20px;
                text-align: center;
                font-size: 13px;
                position: relative;
              }
              
              .footer:before {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 6px;
              }
              
              .social-links {
                margin: 15px 0;
              }
              
              .social-icon {
                display: inline-block;
                width: 30px;
                height: 30px;
                background: #fff;
                border-radius: 50%;
                margin: 0 5px;
                text-align: center;
                line-height: 30px;
                color: #000;
                font-weight: bold;
                text-decoration: none;
              }
              
              @media only screen and (max-width: 480px) {
                .container {
                  width: 95%;
                  margin: 10px auto;
                }
                .content {
                  padding: 25px 15px;
                }
                .med-detail-item {
                  flex-direction: column;
                  align-items: flex-start;
                }
                .med-detail-label {
                  margin-bottom: 5px;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="content">
                <h2>Time for Your Medication</h2>
                <p>Hi there,</p>
                <p>Just a friendly reminder that it's time for your medication:</p>
                
                <div class="reminder-box">
                  <div class="med-details">
                    <div class="med-detail-item">
                      <div class="med-detail-label">Medication:</div>
                      <div class="med-detail-value"><strong>${sanitizedMedicationName}</strong></div>
                    </div>
                    <div class="med-detail-item">
                      <div class="med-detail-label">Date:</div>
                      <div class="med-detail-value"><strong>${formattedDate}</strong></div>
                    </div>
                    <div class="med-detail-item">
                      <div class="med-detail-label">Time to Take:</div>
                      <div class="med-detail-value"><strong>${formattedDoseTime}</strong></div>
                    </div>
                    <div class="med-detail-item">
                      <div class="med-detail-label">Reminder Sent:</div>
                      <div class="med-detail-value">${formattedReminderTime}</div>
                    </div>
                  </div>
                </div>
                
                <p>Keeping up with your medication schedule is an important part of your health journey. If you've already taken your dose, great job! Keep up the good work.</p>
                
              </div>
              <div class="footer">
                <p>You're receiving this email because you're part of the HealthTrack community.<br>Need help? Contact us at <a href="mailto:healthtrack.noreply@gmail.com" style="text-decoration: underline;">healthtrack.noreply@gmail.com</a></p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Your HealthTrack Medication Reminder

        Hi there,

        Just a friendly reminder to take your ${medicationName} on ${formattedDate} at ${formattedDoseTime}. We sent this reminder at ${formattedReminderTime} to help you stay on track!

        If you've already taken your dose, great job! Keep up the good work.

        Need help? Contact us at healthtrack.noreply@gmail.com.`
      };

      logToFile(`Sending email to: ${userEmail}`);
      
      const emailResult = await transporter.sendMail(mailOptions);
      logToFile(`Email successfully sent: ${JSON.stringify(emailResult)}`);

      if (type === "single") {
        await db.query(
          "UPDATE reminders SET status = 'sent' WHERE id = ?",
          [reminderId]
        );
        
        await firebaseDb.ref(`reminders/${firebaseUid}/${reminderId}`).update({ status: "sent" });
        logToFile(`Reminder status updated to 'sent' for reminder ID: ${reminderId}`);
      } else {
        logToFile(`Daily reminder ID ${reminderId} status not updated; will be reset at midnight`);
      }
      
      return true;
    } catch (error) {
      logToFile(`Error sending reminder notification: ${error.message}`, "ERROR");
      logToFile(error.stack, "ERROR");
      
      if (error.code === 'EAUTH') {
        logToFile("Authentication error - check your email credentials in .env file. Ensure you are using an App Password with 2-Step Verification enabled.", "ERROR");
      } else if (error.code === 'ESOCKET') {
        logToFile("Socket error - check your network connection and ensure port 465 is open.", "ERROR");
      } else if (error.code === 'ECONNECTION') {
        logToFile("Connection error - verify SMTP host (smtp.gmail.com) and port (465) settings.", "ERROR");
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        logToFile("Connection timed out or refused - check your firewall or network settings.", "ERROR");
      }
      
      return false;
    }
  }

  static scheduleReminders() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      logToFile("WARNING: Email environment variables (EMAIL_USER, EMAIL_PASS) are not configured! Email notifications will be disabled.", "ERROR");
    } else {
      logToFile("Email configuration detected: Using " + process.env.EMAIL_USER);
    }

    cron.schedule("* * * * *", async () => {
      try {
        logToFile("Running reminder check at: " + moment().format("YYYY-MM-DD HH:mm:ss"));
        const now = moment().tz("Asia/Singapore");
        const currentDateKey = now.format("YYYY-MM-DD");
        
        const [allReminders] = await db.query(`
          SELECT 
            r.id, r.user_id, r.medication_id, r.dose_index, r.reminder_time, 
            r.date, r.type, r.status, u.uid as firebase_uid
          FROM reminders r
          JOIN users u ON r.user_id = u.id
          WHERE r.status = 'pending'
        `);
        
        logToFile(`Found ${allReminders.length} pending reminders`);
        
        const remindersToProcess = [];
        
        for (const reminder of allReminders) {
          let reminderDateTime;
          
          if (reminder.type === "daily") {
            reminderDateTime = moment(`${currentDateKey} ${reminder.reminder_time}`, "YYYY-MM-DD HH:mm:ss");
          } else {
            reminderDateTime = moment(`${reminder.date} ${reminder.reminder_time}`, "YYYY-MM-DD HH:mm:ss");
            if (reminder.date !== currentDateKey) {
              continue;
            }
          }
          
          const windowStart = moment(reminderDateTime).subtract(30, "seconds");
          const windowEnd = moment(reminderDateTime).add(30, "seconds");
          
          if (now.isBetween(windowStart, windowEnd, undefined, "[]")) {
            remindersToProcess.push(reminder);
            logToFile(`Reminder scheduled for processing: ID ${reminder.id}, Medication ${reminder.medication_id}, Type ${reminder.type}`);
          }
        }
        
        for (let i = 0; i < remindersToProcess.length; i++) {
          const reminder = remindersToProcess[i];
          
          try {
            logToFile(`Processing reminder ${i+1}/${remindersToProcess.length}: ID ${reminder.id}`);
            
            const result = await this.sendReminderNotification(
              reminder.user_id,
              reminder.medication_id,
              reminder.dose_index,
              reminder.reminder_time,
              currentDateKey,
              reminder.type
            );
            
            if (result) {
              logToFile(`Successfully processed reminder ID ${reminder.id}`);
            } else {
              logToFile(`Failed to process reminder ID ${reminder.id}`, "ERROR");
            }
            
            if (i < remindersToProcess.length - 1) {
              logToFile("Waiting 5 seconds before processing next reminder...");
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
          } catch (reminderError) {
            logToFile(`Error processing reminder ${reminder.id}: ${reminderError.message}`, "ERROR");
          }
        }
        
        logToFile("Reminder processing cycle completed");
      } catch (error) {
        logToFile(`Error in reminder cron job: ${error.message}`, "ERROR");
        logToFile(error.stack, "ERROR");
      }
    });

    cron.schedule("0 0 * * *", async () => {
      try {
        logToFile("Running daily reminder reset at: " + moment().format("YYYY-MM-DD HH:mm:ss"));
        
        const [resetResult] = await db.query(`
          UPDATE reminders 
          SET status = 'pending' 
          WHERE type = 'daily' AND status = 'sent'
        `);
        
        logToFile(`Reset ${resetResult.affectedRows} daily reminders to pending`);

        const [dailyReminders] = await db.query(`
          SELECT r.id, r.user_id, r.medication_id, r.dose_index, r.reminder_time, 
                 r.date, r.type, r.status, u.uid as firebase_uid
          FROM reminders r
          JOIN users u ON r.user_id = u.id
          WHERE r.type = 'daily' AND r.status = 'pending'
        `);

        for (const reminder of dailyReminders) {
          await firebaseDb.ref(`reminders/${reminder.firebase_uid}/${reminder.id}`).update({
            status: "pending",
          });
        }

        logToFile("Daily reminder reset and Firebase sync completed");
      } catch (error) {
        logToFile(`Error in daily reminder reset cron job: ${error.message}`, "ERROR");
        logToFile(error.stack, "ERROR");
      }
    });
    
    logToFile("Reminder scheduler initialized successfully");
  }
}

// Start the cron job when the controller is loaded
ReminderController.scheduleReminders();

export default ReminderController;