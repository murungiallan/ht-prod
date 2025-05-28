import { useState, useCallback, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import { auth } from '../../firebase/config';
import {
  getUserReminders,
  createReminder,
  updateReminderStatus,
  deleteReminder as apiDeleteReminder,
} from '../../services/api';

export const useReminderManager = ({ medications, promptedDoses, openModal, setPromptedDoses }) => {
  const { user } = useContext(AuthContext);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);

  const getUserToken = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');
    return await auth.currentUser.getIdToken(true);
  }, [user]);

  const fetchReminders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getUserToken();
      const userReminders = await getUserReminders(token);
      setReminders(userReminders);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast.error('Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  }, [user, getUserToken]);

  const createNewReminder = useCallback(async (reminderData) => {
    setLoading(true);
    try {
      const token = await getUserToken();
      const createdReminder = await createReminder(reminderData, token);
      if (createdReminder) {
        setReminders((prev) => [createdReminder, ...prev]);
        await fetchReminders();
        toast.success(`Reminder set successfully`);
        return createdReminder;
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast.error('Failed to create reminder');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getUserToken, fetchReminders]);

  const deleteReminder = useCallback(async (reminderId) => {
    setLoading(true);
    try {
      const token = await getUserToken();
      await apiDeleteReminder(reminderId, token);
      setReminders((prev) => prev.filter((reminder) => reminder.id !== reminderId));
      toast.success('Reminder deleted successfully');
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast.error('Failed to delete reminder');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getUserToken]);

  const handleMarkReminderAsSent = useCallback(async (reminderId) => {
    setLoading(true);
    try {
      const token = await getUserToken();
      await updateReminderStatus(reminderId, 'sent', token);
      setReminders((prev) =>
        prev.map((reminder) =>
          reminder.id === reminderId ? { ...reminder, status: 'sent' } : reminder
        )
      );
      toast.success('Reminder marked as sent');
    } catch (error) {
      console.error('Error marking reminder as sent:', error);
      toast.error('Failed to mark reminder as sent');
    } finally {
      setLoading(false);
    }
  }, [getUserToken]);

  const checkReminders = useCallback(() => {
    const now = moment().local();
    const currentDateKey = now.format('YYYY-MM-DD');

    reminders.forEach((reminder) => {
      if (reminder.status === 'sent') return;

      const reminderTimeParts = reminder.reminderTime.split(':');
      const hours = parseInt(reminderTimeParts[0], 10);
      const minutes = parseInt(reminderTimeParts[1], 10);
      const seconds = reminderTimeParts[2] ? parseInt(reminderTimeParts[2], 10) : 0;

      let reminderDateTime;
      if (reminder.type === 'daily') {
        reminderDateTime = moment(currentDateKey, 'YYYY-MM-DD').set({
          hour: hours,
          minute: minutes,
          second: seconds,
          millisecond: 0,
        });
      } else {
        reminderDateTime = moment(reminder.date, 'YYYY-MM-DD').set({
          hour: hours,
          minute: minutes,
          second: seconds,
          millisecond: 0,
        });
      }

      const windowStart = moment(reminderDateTime).subtract(30, 'seconds');
      const windowEnd = moment(reminderDateTime).add(30, 'seconds');
      const isTimeToTrigger = now.isBetween(windowStart, windowEnd, undefined, '[]');

      if (isTimeToTrigger) {
        const med = medications.find((m) => m.id === reminder.medicationId);
        const doseKey = `${reminder.medicationId}-${currentDateKey}-${reminder.doseIndex}`;
        if (!promptedDoses.has(doseKey)) {
          const message = `Reminder: Time to take your ${med?.medication_name} dose at ${reminder.reminderTime}`;
          toast(message);
          openModal('showTakePrompt', {
            medicationId: reminder.medicationId,
            doseIndex: reminder.doseIndex,
            doseTime: reminder.reminderTime,
          });
          setPromptedDoses((prev) => new Set(prev).add(doseKey));
          handleMarkReminderAsSent(reminder.id);
        }
      }
    });
  }, [reminders, medications, promptedDoses, openModal, setPromptedDoses, handleMarkReminderAsSent]);

  return {
    reminders,
    loading,
    fetchReminders,
    createNewReminder,
    deleteReminder,
    handleMarkReminderAsSent,
    checkReminders,
  };
};