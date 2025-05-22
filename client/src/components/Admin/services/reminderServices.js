import { toast } from "react-hot-toast";
import {
  getAllAdminReminders,
  createReminder,
  updateAdminReminderStatus,
  deleteSelectedAdminReminders, // Updated import
} from "../../../services/api";

export const fetchReminders = async (
  user,
  setLoading,
  setError,
  setReminders,
  setTotalReminders,
  getUserToken,
  handleSessionExpired,
  page = 1,
  limit = 10,
  sortConfig = { key: "", direction: "asc" }
) => {
  if (!user) return;
  setLoading(true);
  setError(null);
  try {
    const token = await getUserToken();
    const response = await getAllAdminReminders(token, limit, page, sortConfig);
    setReminders(response.reminders || []);
    setTotalReminders(response.total || 0);
  } catch (err) {
    setError("Failed to fetch reminders: " + err.message);
    toast.error("Failed to fetch reminders");
  } finally {
    setLoading(false);
  }
};

export const handleCreateReminder = async (
  user,
  reminderData,
  getUserToken,
  handleSessionExpired,
  fetchReminders
) => {
  if (!user) return handleSessionExpired();
  try {
    const token = await getUserToken();
    await createReminder(reminderData, token);
    toast.success("Reminder created successfully");
    fetchReminders();
  } catch (err) {
    toast.error("Failed to create reminder: " + err.message);
  }
};

export const handleUpdateReminderStatus = async (
  user,
  ids,
  status,
  fetchReminders,
  setSelectedRows,
  getUserToken,
  handleSessionExpired
) => {
  if (!user) return handleSessionExpired();
  try {
    const token = await getUserToken();
    await updateAdminReminderStatus(ids, status, token);
    toast.success("Reminder status updated successfully");
    fetchReminders();
    setSelectedRows([]);
  } catch (err) {
    toast.error("Failed to update reminder status: " + err.message);
  }
};

export const handleDeleteReminder = async (
  user,
  id,
  fetchReminders,
  getUserToken,
  handleSessionExpired
) => {
  if (!user) return handleSessionExpired();
  if (!window.confirm("Are you sure you want to delete this reminder?")) return;
  try {
    const token = await getUserToken();
    await deleteSelectedAdminReminders([id], token); // Updated to use deleteSelectedAdminReminders
    toast.success("Reminder deleted successfully");
    fetchReminders();
  } catch (err) {
    toast.error("Failed to delete reminder: " + err.message);
  }
};

export const handleDeleteSelectedReminders = async (
  user,
  selectedRows,
  setLoading,
  setSelectedRows,
  fetchReminders,
  getUserToken,
  handleSessionExpired
) => {
  if (!user) return handleSessionExpired();
  if (!selectedRows.length) return toast.error("No reminders selected");
  if (!window.confirm("Are you sure you want to delete the selected reminders?")) return;

  setLoading(true);
  try {
    const token = await getUserToken();
    await deleteSelectedAdminReminders(selectedRows, token);
    toast.success("Selected reminders deleted successfully");
    setSelectedRows([]);
    fetchReminders();
  } catch (err) {
    toast.error("Failed to delete selected reminders: " + err.message);
  } finally {
    setLoading(false);
  }
};