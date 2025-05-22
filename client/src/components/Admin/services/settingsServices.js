import { toast } from "react-hot-toast";
import { getAdminSystemSettings, updateAdminSystemSettings, deleteSelectedAdminSettings } from "../../../services/api";

export const fetchSettings = async (
  user,
  setLoading,
  setError,
  setSettings,
  getUserToken,
  handleSessionExpired,
  page = 1,
  limit = 10,
  sortConfig = { key: "", direction: "asc" }
) => {
  if (!user) return;
  setLoading(true);
  try {
    const token = await getUserToken();
    const response = await getAdminSystemSettings(token, limit, page, sortConfig);
    setSettings(response.settings || []);
  } catch (err) {
    setError("Failed to fetch settings: " + err.message);
    toast.error("Failed to fetch settings");
  } finally {
    setLoading(false);
  }
};

export const handleUpdateSetting = async (
  user,
  settingKey,
  settingValue,
  getUserToken,
  handleSessionExpired,
  fetchSettings
) => {
  if (!user) return handleSessionExpired();
  try {
    const token = await getUserToken();
    await updateAdminSystemSettings(settingKey, settingValue, token);
    toast.success("Setting updated successfully");
    fetchSettings();
  } catch (err) {
    toast.error("Failed to update setting: " + err.message);
  }
};

export const handleDeleteSelectedSettings = async (
  user,
  selectedRows,
  setLoading,
  setSelectedRows,
  fetchSettings,
  getUserToken,
  handleSessionExpired
) => {
  if (!user) return handleSessionExpired();
  if (!selectedRows.length) return toast.error("No settings selected");
  if (!window.confirm("Are you sure you want to delete the selected settings?")) return;

  setLoading(true);
  try {
    const token = await getUserToken();
    await deleteSelectedAdminSettings(selectedRows, token);
    toast.success("Selected settings deleted successfully");
    setSelectedRows([]);
    fetchSettings();
  } catch (err) {
    toast.error("Failed to delete selected settings: " + err.message);
  } finally {
    setLoading(false);
  }
};