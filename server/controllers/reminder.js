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

      // Check for existing reminders for the same dose (medicationId, doseIndex, date)
      const [existingReminders] = await db.query(
        "SELECT id, reminder_time FROM reminders WHERE user_id = ? AND medication_id = ? AND dose_index = ? AND date = ?",
        [userId, medicationId, doseIndex, date]
      );

      let newReminder;
      let responseMessage = "Reminder added successfully";
      let statusCode = 201;

      if (existingReminders && existingReminders.length > 0) {
        // Update the existing reminder
        const existingReminderId = existingReminders[0].id;
        console.log(`Found existing reminder ID ${existingReminderId} for dose, updating...`);

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
        message: responseMessage,
        reminder: newReminder,
      });
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
      console.log(`Starting to send reminder notification for user ${userId}, medication ${medicationId}`);
      
      // Fetch the reminder to get its ID
      const [reminderRows] = await db.query(
        "SELECT id FROM reminders WHERE user_id = ? AND medication_id = ? AND dose_index = ? AND reminder_time = ? AND date = ?",
        [userId, medicationId, doseIndex, reminderTime, date]
      );
      
      if (!reminderRows || reminderRows.length === 0) {
        console.error(`No reminder found for user ${userId}, medication ${medicationId}, dose ${doseIndex}`);
        return;
      }
      const reminderId = reminderRows[0].id;

      // Fetch user information
      const [userRows] = await db.query("SELECT email, uid FROM users WHERE id = ?", [userId]);
      if (!userRows || userRows.length === 0) {
        console.error(`User not found for userId: ${userId}`);
        return;
      }
      
      const userEmail = userRows[0].email;
      const firebaseUid = userRows[0].uid;
      
      if (!userEmail) {
        console.error(`No email found for user: ${userId}`);
        return;
      }
      
      console.log(`User email found: ${userEmail}`);

      // Get medication information
      const [medRows] = await db.query("SELECT medication_name, doses FROM medications WHERE id = ?", [medicationId]);
      if (!medRows || medRows.length === 0) {
        console.error(`Medication not found: ${medicationId}`);
        return;
      }

      const medicationName = medRows[0].medication_name;
      const doses = JSON.parse(medRows[0].doses || '{}');
      const doseSchedule = doses[date] || [];
      if (doseIndex >= doseSchedule.length) {
        console.error(`Invalid doseIndex ${doseIndex} for medication ${medicationId} on ${date}`);
        return;
      }
      const doseTime = doseSchedule[doseIndex].time;

      // Validate medicationName and doseTime
      if (!medicationName) {
        console.error(`Medication name is missing for medication ${medicationId}`);
        return;
      }
      if (!doseTime) {
        console.error(`Dose time is missing for doseIndex ${doseIndex} on ${date} for medication ${medicationId}`);
        return;
      }

      // Format date and time for user-friendly display
      const reminderDateTime = moment(`${date} ${reminderTime}`, "YYYY-MM-DD HH:mm:ss");
      const doseDateTime = moment(`${date} ${doseTime}`, "YYYY-MM-DD HH:mm:ss");
      const formattedDate = moment(date, "YYYY-MM-DD").format("D MMMM"); // e.g., "5 May"
      const formattedReminderTime = reminderDateTime.format("h:mm A"); // e.g., "4:00 PM"
      const formattedDoseTime = doseDateTime.format("h:mm A"); // e.g., "4:00 PM"
      
      console.log(`Sending notification for medication: ${medicationName} at dose time: ${formattedDoseTime}`);

      // Try to send push notification if FCM token exists
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
          console.log(`FCM Notification sent successfully: ${fcmResult}`);
        } else {
          console.log(`No FCM token found for user: ${userId}, continuing with email only`);
        }
      } catch (fcmError) {
        console.error(`FCM notification failed but continuing with email: ${fcmError.message}`);
      }

      // Sanitize medication name
      const sanitizeHtml = (str) => {
        if (str == null) return "";
        return str
          .toString()
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      };
      
      const sanitizedMedicationName = sanitizeHtml(medicationName);

      // Check if email credentials are available
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("EMAIL_USER or EMAIL_PASS environment variables are missing");
        return;
      }
      
      console.log(`Creating email transport with user: ${process.env.EMAIL_USER}`);

      // Create transporter
      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 465, // SSL
        secure: true, // SSL
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        logger: true,
        debug: true,
      });

      // Verify the transporter
      try {
        await transporter.verify();
        console.log("Email transporter verified successfully");
      } catch (verifyError) {
        console.error(`Email transporter verification failed: ${verifyError.message}`);
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
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .header { background: #007bff; color: #ffffff; padding: 20px; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { padding: 20px; }
              .content h2 { color: #333333; font-size: 20px; margin-top: 0; }
              .content p { color: #666666; line-height: 1.6; font-size: 16px; }
              .cta { display: inline-block; padding: 10px 20px; background: #28a745; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 16px; margin: 20px 0; }
              .footer { background: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #999999; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>HealthTrack Reminder</h1>
              </div>
              <div class="content">
                <h2>Time for Your Medication</h2>
                <p>Hi there,</p>
                <p>Just a friendly reminder to take your <strong>${sanitizedMedicationName}</strong> on <strong>${formattedDate}</strong> at <strong>${formattedDoseTime}</strong>. We sent this reminder at ${formattedReminderTime} to help you stay on track!</p>
                <a href="#" class="cta">Mark as Taken</a>
                <p>If you've already taken your dose, great job! Keep up the good work.</p>
              </div>
              <div class="footer">
                <p>You're receiving this email because you're part of the HealthTrack community. Need help? Contact us at support@healthtrack.com.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Your HealthTrack Medication Reminder

Hi there,

Just a friendly reminder to take your ${medicationName} on ${formattedDate} at ${formattedDoseTime}. We sent this reminder at ${formattedReminderTime} to help you stay on track!

If you've already taken your dose, great job! Keep up the good work.

Need help? Contact us at support@healthtrack.com.`
      };

      console.log(`Sending email to: ${userEmail}`);
      
      const emailResult = await transporter.sendMail(mailOptions);
      console.log(`Email successfully sent: ${JSON.stringify(emailResult)}`);

      // Update reminder status
      await db.query(
        "UPDATE reminders SET status = 'sent' WHERE id = ?",
        [reminderId]
      );
      
      // Sync with Firebase
      await firebaseDb.ref(`reminders/${firebaseUid}/${reminderId}`).update({ status: "sent" });
      console.log(`Reminder status updated to 'sent' for reminder ID: ${reminderId}`);
      
      return true;
    } catch (error) {
      console.error(`Error sending reminder notification: ${error.message}`);
      console.error(error.stack);
      
      // Log specific error information for debugging
      if (error.code === 'EAUTH') {
        console.error("Authentication error - check your email credentials");
      } else if (error.code === 'ESOCKET') {
        console.error("Socket error - check your network connection");
      } else if (error.code === 'ECONNECTION') {
        console.error("Connection error - check your SMTP settings");
      }
      
      return false;
    }
  }

  static scheduleReminders() {
    // Check email environment variables on startup
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("WARNING: Email environment variables (EMAIL_USER, EMAIL_PASS) are not configured!");
    } else {
      console.log("Email configuration detected: Using " + process.env.EMAIL_USER);
    }

    cron.schedule("* * * * *", async () => {
      try {
        console.log("Running reminder check at: " + moment().format("YYYY-MM-DD HH:mm:ss"));
        const now = moment().local();
        const currentDateKey = now.format("YYYY-MM-DD");
        
        // Get all pending reminders directly from MySQL
        const [allReminders] = await db.query(`
          SELECT 
            r.id, r.user_id, r.medication_id, r.dose_index, r.reminder_time, 
            r.date, r.type, r.status, u.uid as firebase_uid
          FROM reminders r
          JOIN users u ON r.user_id = u.id
          WHERE r.status = 'pending'
        `);
        
        console.log(`Found ${allReminders.length} pending reminders`);
        
        // Filter reminders that should trigger now
        const remindersToProcess = [];
        
        for (const reminder of allReminders) {
          let reminderDateTime;
          
          if (reminder.type === "daily") {
            reminderDateTime = moment(`${currentDateKey} ${reminder.reminder_time}`, "YYYY-MM-DD HH:mm:ss");
          } else { // single
            reminderDateTime = moment(`${reminder.date} ${reminder.reminder_time}`, "YYYY-MM-DD HH:mm:ss");
            
            // Skip if the date is different for single reminders
            if (reminder.date !== currentDateKey) {
              continue;
            }
          }
          
          // 1-minute window for triggering (30 seconds before and after the exact time)
          const windowStart = moment(reminderDateTime).subtract(30, "seconds");
          const windowEnd = moment(reminderDateTime).add(30, "seconds");
          
          if (now.isBetween(windowStart, windowEnd, undefined, "[]")) {
            remindersToProcess.push(reminder);
            console.log(`Reminder scheduled for processing: ID ${reminder.id}, Medication ${reminder.medication_id}`);
          }
        }
        
        // Process reminders sequentially with delay between each
        for (let i = 0; i < remindersToProcess.length; i++) {
          const reminder = remindersToProcess[i];
          
          try {
            console.log(`Processing reminder ${i+1}/${remindersToProcess.length}: ID ${reminder.id}`);
            
            const result = await this.sendReminderNotification(
              reminder.user_id,
              reminder.medication_id,
              reminder.dose_index,
              reminder.reminder_time,
              reminder.date
            );
            
            if (result) {
              console.log(`Successfully processed reminder ID ${reminder.id}`);
            } else {
              console.error(`Failed to process reminder ID ${reminder.id}`);
            }
            
            // Add delay between emails to avoid rate limiting (5 seconds)
            if (i < remindersToProcess.length - 1) {
              console.log("Waiting 5 seconds before processing next reminder...");
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
          } catch (reminderError) {
            console.error(`Error processing reminder ${reminder.id}: ${reminderError.message}`);
          }
        }
        
        console.log("Reminder processing cycle completed");
      } catch (error) {
        console.error(`Error in reminder cron job: ${error.message}`);
        console.error(error.stack);
      }
    });
    
    console.log("Reminder scheduler initialized successfully");
  }
}

// Start the cron job when the controller is loaded
ReminderController.scheduleReminders();

export default ReminderController;