import Reminder from "../models/reminder.js";
import Medication from "../models/medication.js";
import { db as firebaseDb } from "../server.js"; // Firebase Realtime Database
import db from "../config/db.js"; // MySQL connection pool
import moment from "moment";
import admin from "firebase-admin";
import cron from "node-cron";
import nodemailer from "nodemailer"; // Import nodemailer for email sending

class ReminderController {
  static async addReminder(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { medicationId, doseIndex, reminderTime, date, type } = req.body;

      console.log("Received reminder data:", { medicationId, doseIndex, reminderTime, date, type });

      // Validation
      if (!medicationId || !Number.isInteger(doseIndex) || doseIndex < 0 || !reminderTime || !date || !type) {
        console.log("Missing required fields:", { medicationId, doseIndex, reminderTime, date, type });
        return res.status(400).json({ error: "All required fields (medicationId, doseIndex, reminderTime, date, type) must be provided" });
      }

      if (!["single", "daily"].includes(type)) {
        console.log("Invalid type:", type);
        return res.status(400).json({ error: "Type must be 'single' or 'daily'" });
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        console.log("Invalid date format:", date);
        return res.status(400).json({ error: "Date must be in YYYY-MM-DD format" });
      }

      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
      if (!timeRegex.test(reminderTime)) {
        console.log("Invalid time format:", reminderTime);
        return res.status(400).json({ error: "Reminder time must be in HH:mm:ss format" });
      }

      const medications = await Medication.getByUser(userId);
      const medication = medications.find((med) => med.id === parseInt(medicationId));
      if (!medication) {
        console.log("Medication not found:", medicationId);
        return res.status(404).json({ error: "Medication not found" });
      }

      const doses = medication.doses[date] || [];
      if (doseIndex >= doses.length) {
        console.log("Invalid doseIndex:", doseIndex, "for doses length:", doses.length);
        return res.status(400).json({ error: "Invalid doseIndex" });
      }
      const doseTime = doses[doseIndex].time;
      const doseDateTime = moment(`${date} ${doseTime}`, "YYYY-MM-DD HH:mm:ss");
      const reminderDateTime = moment(`${date} ${reminderTime}`, "YYYY-MM-DD HH:mm:ss");
      const now = moment().local();
      const today = now.format("YYYY-MM-DD");

      // Validation 1: Reminder time must be within 2 hours before the dose time (and not after)
      const windowStart = moment(doseDateTime).subtract(2, "hours");
      if (reminderDateTime.isBefore(windowStart) || reminderDateTime.isAfter(doseDateTime)) {
        console.log("Reminder time outside the 2-hour window before dose time:", {
          reminderTime,
          doseTime,
          windowStart: windowStart.format(),
        });
        return res.status(400).json({ error: "Reminder time must be within 2 hours before the medication dose time and not after the dose time" });
      }

      // Validation 2: If reminder time is after dose time, allow only if the date is in the future
      if (reminderDateTime.isAfter(doseDateTime)) {
        if (moment(date, "YYYY-MM-DD").isSameOrBefore(moment(today, "YYYY-MM-DD"))) {
          console.log("Reminder time is after dose time and date is not in the future:", { reminderTime, doseTime, date, today });
          return res.status(400).json({ error: `Please select a reminder time that is before the dose time ${doseDateTime.format("YYYY-MM-DD HH:mm:ss")} or set it for a future date` });
        }
      }

      const reminderData = {
        userId,
        medication_id: medicationId,
        dose_index: doseIndex,
        reminder_time: reminderTime,
        date,
        type,
        status: "pending",
      };

      const newReminder = await Reminder.add(reminderData);

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

      res.status(201).json(newReminder);
    } catch (error) {
      console.error("Error adding reminder:", error.message, error.stack);
      res.status(500).json({ error: "Failed to add reminder", details: error.message });
    }
  }

  static async updateReminder(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id } = req.params;
      const { reminderTime, date, type, status } = req.body;

      const reminders = await Reminder.getByUser(userId);
      if (!reminders.some((rem) => rem.id === parseInt(id))) {
        return res.status(404).json({ error: "Reminder not found" });
      }

      const reminder = reminders.find((rem) => rem.id === parseInt(id));
      const med = await Medication.getByUser(userId);
      const medication = med.find((m) => m.id === reminder.medication_id);
      if (!medication) {
        return res.status(404).json({ error: "Medication not found" });
      }

      const finalReminderTime = reminderTime || reminder.reminder_time;
      const finalDate = date || reminder.date;
      const finalType = type || reminder.type;

      if (!["single", "daily"].includes(finalType)) {
        return res.status(400).json({ error: "Type must be 'single' or 'daily'" });
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(finalDate)) {
        return res.status(400).json({ error: "Date must be in YYYY-MM-DD format" });
      }

      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
      if (!timeRegex.test(finalReminderTime)) {
        return res.status(400).json({ error: "Reminder time must be in HH:mm:ss format" });
      }

      const doses = medication.doses[finalDate] || [];
      if (reminder.dose_index >= doses.length) {
        return res.status(400).json({ error: "Invalid doseIndex" });
      }
      const doseTime = doses[reminder.dose_index].time;
      const doseDateTime = moment(`${finalDate} ${doseTime}`, "YYYY-MM-DD HH:mm:ss");
      const reminderDateTime = moment(`${finalDate} ${finalReminderTime}`, "YYYY-MM-DD HH:mm:ss");
      const now = moment().local();
      const today = now.format("YYYY-MM-DD");

      // Validation 1: Reminder time must be within 2 hours before the dose time (and not after)
      const windowStart = moment(doseDateTime).subtract(2, "hours");
      if (reminderDateTime.isBefore(windowStart) || reminderDateTime.isAfter(doseDateTime)) {
        console.log("Reminder time outside the 2-hour window before dose time:", {
          finalReminderTime,
          doseTime,
          windowStart: windowStart.format(),
        });
        return res.status(400).json({ error: "Reminder time must be within 2 hours before the medication dose time and not after the dose time" });
      }

      // Validation 2: If reminder time is after dose time, allow only if the date is in the future
      if (reminderDateTime.isAfter(doseDateTime)) {
        if (moment(finalDate, "YYYY-MM-DD").isSameOrBefore(moment(today, "YYYY-MM-DD"))) {
          console.log("Reminder time is after dose time and date is not in the future:", { finalReminderTime, doseTime, finalDate, today });
          return res.status(400).json({ error: `Please select a reminder time that is before the dose time ${doseDateTime.format("YYYY-MM-DD HH:mm:ss")} or set it for a future date` });
        }
      }

      const updatedReminder = await Reminder.update(id, { reminder_time: finalReminderTime, date: finalDate, type: finalType, status });

      await firebaseDb.ref(`reminders/${firebaseUid}/${id}`).update({
        reminderTime: updatedReminder.reminder_time,
        date: updatedReminder.date,
        type: updatedReminder.type,
        status: updatedReminder.status,
      });

      res.status(200).json(updatedReminder);
    } catch (error) {
      console.error("Error updating reminder:", error.message, error.stack);
      res.status(500).json({ error: "Failed to update reminder", details: error.message });
    }
  }

  static async getUserReminders(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
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

      res.status(200).json(reminders);
    } catch (error) {
      console.error("Error getting reminders:", error.message, error.stack);
      res.status(500).json({ error: "Failed to get reminders", details: error.message });
    }
  }

  static async deleteReminder(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id } = req.params;
      const reminders = await Reminder.getByUser(userId);
      if (!reminders.some((rem) => rem.id === parseInt(id))) {
        return res.status(404).json({ error: "Reminder not found" });
      }

      await Reminder.delete(id);

      await firebaseDb.ref(`reminders/${firebaseUid}/${id}`).remove();

      res.status(200).json({ message: "Reminder deleted successfully" });
    } catch (error) {
      console.error("Error deleting reminder:", error.message, error.stack);
      res.status(500).json({ error: "Failed to delete reminder", details: error.message });
    }
  }

  static async updateReminderStatus(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const [userRows] = await db.query("SELECT id FROM users WHERE uid = ?", [firebaseUid]);
      if (!userRows || userRows.length === 0) {
        return res.status(404).json({ error: "User not found in the database" });
      }
      const userId = userRows[0].id;

      const { id } = req.params;
      const { status } = req.body;

      if (!["pending", "sent"].includes(status)) {
        return res.status(400).json({ error: "Status must be 'pending' or 'sent'" });
      }

      const reminders = await Reminder.getByUser(userId);
      if (!reminders.some((rem) => rem.id === parseInt(id))) {
        return res.status(404).json({ error: "Reminder not found" });
      }

      const updatedReminder = await Reminder.updateStatus(id, status);

      await firebaseDb.ref(`reminders/${firebaseUid}/${id}`).update({ status });

      res.status(200).json(updatedReminder);
    } catch (error) {
      console.error("Error updating reminder status:", error.message, error.stack);
      res.status(500).json({ error: "Failed to update reminder status", details: error.message });
    }
  }

  static async sendReminderNotification(userId, medicationId, doseIndex, reminderTime, date) {
    try {
      // Fetch the reminder to get its ID
      const [reminderRows] = await db.query(
        "SELECT id FROM reminders WHERE user_id = ? AND medication_id = ? AND dose_index = ? AND reminder_time = ? AND date = ?",
        [userId, medicationId, doseIndex, reminderTime, date]
      );
      if (!reminderRows || reminderRows.length === 0) {
        console.log("Reminder not found for user:", userId);
        return;
      }
      const reminderId = reminderRows[0].id;
  
      // Fetch FCM token, uid, and email from Firebase and MySQL
      const userSnapshot = await firebaseDb.ref(`users`).orderByChild('id').equalTo(userId).once('value');
      const userData = userSnapshot.val();
      if (!userData) {
        console.log("No user found in Firebase for userId:", userId);
        return;
      }
  
      const firebaseUid = Object.keys(userData)[0];
      const fcmToken = userData[firebaseUid].fcm_token;
      if (!fcmToken) {
        console.log("No FCM token found for user:", userId);
        return;
      }
  
      const [userRows] = await db.query("SELECT email FROM users WHERE id = ?", [userId]);
      if (!userRows || userRows.length === 0) {
        console.log("User email not found for userId:", userId);
        return;
      }
      const userEmail = userRows[0].email;
      if (!userEmail) {
        console.log("No email found for user:", userId);
        return;
      }
  
      const [medRows] = await db.query("SELECT medication_name FROM medications WHERE id = ?", [medicationId]);
      if (!medRows || medRows.length === 0) {
        console.log("Medication not found:", medicationId);
        return;
      }
  
      const medicationName = medRows[0].medication_name;
      const reminderDateTime = moment(`${date} ${reminderTime}`, "YYYY-MM-DD HH:mm:ss");
      const doseTime = moment(reminderDateTime).add(2, "hours"); // Reminder is 2 hours before the dose
  
      // Send FCM notification
      const message = {
        notification: {
          title: "Medication Reminder",
          body: `Take your ${medicationName} in 2 hours at ${doseTime.format("HH:mm")}`,
        },
        token: fcmToken,
      };
      const fcmResult = await admin.messaging().send(message);
      console.log("FCM Notification sent to:", fcmToken, "Details:", fcmResult);
  
      // Sanitize medication name to prevent HTML injection or Gmail rejection
      const sanitizeHtml = (str) => {
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      };
      const sanitizedMedicationName = sanitizeHtml(medicationName);
  
      // Create the transporter with additional options for reliability
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        logger: true, // Enable logging for debugging
        debug: true, // Include debug output in logs
        connectionTimeout: 10000, // 10 seconds timeout
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });
  
      // Verify the transporter before sending
      await transporter.verify();
      console.log("ReminderController: Email transporter verified successfully");
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: "HealthTrack Medication Reminder",
        html: `
          <h2>Medication Reminder</h2>
          <p>Don't forget to take your <strong>${sanitizedMedicationName}</strong> at ${doseTime.format("HH:mm")} on ${date}.</p>
          <p>Stay on track with your health goals!</p>
        `,
      };
  
      const emailResult = await transporter.sendMail(mailOptions);
      console.log("ReminderController: Email reminder sent to:", userEmail, "Details:", emailResult);
  
      // Update reminder status in MySQL
      await db.query(
        "UPDATE reminders SET status = 'sent' WHERE user_id = ? AND medication_id = ? AND dose_index = ? AND reminder_time = ? AND date = ?",
        [userId, medicationId, doseIndex, reminderTime, date]
      );
      // Sync with Firebase
      await firebaseDb.ref(`reminders/${firebaseUid}/${reminderId}`).update({ status: "sent" });
    } catch (error) {
      console.error("ReminderController: Error sending reminder notification:", error.message, error.stack);
      if (error.response) {
        console.error("ReminderController: Email-specific error response:", error.response);
      }
      throw error;
    }
  }

  static scheduleReminders() {
    console.log("Cron Job: EMAIL_USER:", process.env.EMAIL_USER);
    console.log("Cron Job: EMAIL_PASS:", process.env.EMAIL_PASS);
  
    cron.schedule("* * * * *", async () => {
      try {
        const now = moment().local();
        const currentDateKey = now.format("YYYY-MM-DD");
  
        const usersSnapshot = await firebaseDb.ref("users").once("value");
        const users = usersSnapshot.val() || {};
  
        for (const firebaseUid in users) {
          const userId = users[firebaseUid].id;
          const remindersRef = firebaseDb.ref(`reminders/${firebaseUid}`);
          const snapshot = await remindersRef.once("value");
          const reminders = [];
  
          snapshot.forEach((childSnapshot) => {
            const reminder = childSnapshot.val();
            if (reminder.status === "pending") {
              let reminderDateTime;
              if (reminder.type === "daily") {
                reminderDateTime = moment(`${currentDateKey} ${reminder.reminderTime}`, "YYYY-MM-DD HH:mm:ss");
              } else {
                reminderDateTime = moment(`${reminder.date} ${reminder.reminderTime}`, "YYYY-MM-DD HH:mm:ss");
              }
  
              const windowStart = moment(reminderDateTime).subtract(30, "seconds");
              const windowEnd = moment(reminderDateTime).add(30, "seconds");
              const isTimeToTrigger = now.isBetween(windowStart, windowEnd, undefined, "[]");
  
              if (isTimeToTrigger) {
                reminders.push({ id: childSnapshot.key, firebaseUid, userId, ...reminder });
              }
            }
          });
  
          // Add a delay between each email send to avoid rate limiting
          for (let i = 0; i < reminders.length; i++) {
            const reminder = reminders[i];
            try {
              await this.sendReminderNotification(
                reminder.userId,
                reminder.medicationId,
                reminder.doseIndex,
                reminder.reminderTime,
                reminder.date
              );
              // Add a 5-second delay between emails (12 emails/minute, <Gmail limits>)
              if (i < reminders.length - 1) {
                console.log(`Waiting 5 seconds before sending the next email...`);
                await new Promise((resolve) => setTimeout(resolve, 5000));
              }
            } catch (error) {
              console.error(`Failed to process reminder ${reminder.id} for user ${firebaseUid}:`, error.message, error.stack);
            }
          }
        }
      } catch (error) {
        console.error("Error in reminder cron job:", error.message, error.stack);
      }
    });
  }
}

// Start the cron job when the controller is loaded
ReminderController.scheduleReminders();

export default ReminderController;
