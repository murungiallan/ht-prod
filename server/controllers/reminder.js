import Reminder from "../models/reminder.js";
import Medication from "../models/medication.js";
import { db as firebaseDb } from "../server.js"; // Firebase Realtime Database
import db from "../config/db.js"; // MySQL connection pool
import moment from "moment";
import admin from "firebase-admin";

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
      
          // Validation
          if (!medicationId || !Number.isInteger(doseIndex) || doseIndex < 0 || !reminderTime || !date || !type) {
            return res.status(400).json({ error: "All required fields (medicationId, doseIndex, reminderTime, date, type) must be provided" });
          }
      
          if (!["single", "daily"].includes(type)) {
            return res.status(400).json({ error: "Type must be 'single' or 'daily'" });
          }
      
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(date)) {
            return res.status(400).json({ error: "Date must be in YYYY-MM-DD format" });
          }
      
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
          if (!timeRegex.test(reminderTime)) {
            return res.status(400).json({ error: "Reminder time must be in HH:mm:ss format" });
          }
      
          const medications = await Medication.getByUser(userId);
          const medication = medications.find((med) => med.id === parseInt(medicationId));
          if (!medication) {
            return res.status(404).json({ error: "Medication not found" });
          }
      
          const doses = medication.doses[date] || [];
          if (doseIndex >= doses.length) {
            return res.status(400).json({ error: "Invalid doseIndex" });
          }
          const doseTime = doses[doseIndex].time;
          const doseDateTime = moment(`${date} ${doseTime}`, "YYYY-MM-DD HH:mm:ss");
          const reminderDateTime = moment(`${date} ${reminderTime}`, "YYYY-MM-DD HH:mm:ss");
      
          // Check if the reminder time is in the past
          const now = moment();
          if (reminderDateTime.isBefore(now)) {
            return res.status(400).json({ error: "Cannot set a reminder for a past time" });
          }
      
          // Check if the dose time has already passed
          if (doseDateTime.isBefore(now)) {
            return res.status(400).json({ error: "Cannot set a reminder for a dose that has already passed" });
          }
      
          const hoursDiff = doseDateTime.diff(reminderDateTime, "hours");
          if (hoursDiff < 0 || hoursDiff > 2) {
            return res.status(400).json({ error: "Reminder must be within 2 hours before the dose time" });
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
    
          // Validate updated fields
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
    
          const now = moment();
          if (reminderDateTime.isBefore(now)) {
            return res.status(400).json({ error: "Cannot set a reminder for a past time" });
          }
    
          if (doseDateTime.isBefore(now)) {
            return res.status(400).json({ error: "Cannot set a reminder for a dose that has already passed" });
          }
    
          const hoursDiff = doseDateTime.diff(reminderDateTime, "hours");
          if (hoursDiff < 0 || hoursDiff > 2) {
            return res.status(400).json({ error: "Reminder must be within 2 hours before the dose time" });
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
  
      // Sync with Firebase
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
  
      // Sync with Firebase
      await firebaseDb.ref(`reminders/${firebaseUid}/${id}`).update({ status });
  
      res.status(200).json(updatedReminder);
    } catch (error) {
      console.error("Error updating reminder status:", error.message, error.stack);
      res.status(500).json({ error: "Failed to update reminder status", details: error.message });
    }
  }

  static async sendReminderNotification(userId, medicationId, doseIndex, reminderTime) {
    try {
      // Fetch the reminder to get its ID
      const [reminderRows] = await db.query(
        "SELECT id FROM reminders WHERE user_id = ? AND medication_id = ? AND dose_index = ? AND reminder_time = ?",
        [userId, medicationId, doseIndex, reminderTime]
      );
      if (!reminderRows || reminderRows.length === 0) {
        console.log("Reminder not found for user:", userId);
        return;
      }
      const reminderId = reminderRows[0].id;

      const [userRows] = await db.query("SELECT fcm_token, uid FROM users WHERE id = ?", [userId]);
      if (!userRows || userRows.length === 0 || !userRows[0].fcm_token) {
        console.log("No FCM token found for user:", userId);
        return;
      }
      const fcmToken = userRows[0].fcm_token;
      const firebaseUid = userRows[0].uid;

      const [medRows] = await db.query("SELECT medication_name FROM medications WHERE id = ?", [medicationId]);
      if (!medRows || medRows.length === 0) {
        console.log("Medication not found:", medicationId);
        return;
      }

      const medicationName = medRows[0].medication_name;
      const message = {
        notification: {
          title: "Medication Reminder",
          body: `Take your ${medicationName} in 2 hours at ${moment(reminderTime).add(2, "hours").format("HH:mm")}`,
        },
        token: fcmToken,
      };

      await admin.messaging().send(message);
      console.log("Notification sent to:", fcmToken);

      // Update reminder status
      await db.query(
        "UPDATE reminders SET status = 'sent' WHERE user_id = ? AND medication_id = ? AND dose_index = ? AND reminder_time = ?",
        [userId, medicationId, doseIndex, reminderTime]
      );
      await firebaseDb.ref(`reminders/${firebaseUid}/${reminderId}`).update({ status: "sent" });
    } catch (error) {
      console.error("Error sending reminder notification:", error.message, error.stack);
    }
  }
}

export default ReminderController;