import schedule from "node-schedule";
import ReminderController from "../controllers/reminder.js";
import db from "../config/db.js";
import moment from "moment";

const scheduleReminders = async () => {
  console.log("Starting reminder scheduler...");

  // Run every minute to check for pending reminders
  schedule.scheduleJob("*/1 * * * *", async () => {
    try {
      const [reminders] = await db.query(`
        SELECT r.*, u.id as user_id
        FROM reminders r
        JOIN users u ON r.user_id = u.id
        WHERE r.status = 'pending'
      `);

      for (const reminder of reminders) {
        const reminderDateTime = moment(`${reminder.date} ${reminder.reminder_time}`, "YYYY-MM-DD HH:mm:ss");
        const now = moment().local();

        // Check if the reminder time is within the current minute
        if (now.isSame(reminderDateTime, "minute")) {
          await ReminderController.sendReminderNotification(
            reminder.user_id,
            reminder.medication_id,
            reminder.dose_index,
            reminder.reminder_time
          );
        }
      }
    } catch (error) {
      console.error("Error in reminder scheduler:", error);
    }
  });
};

export default scheduleReminders;