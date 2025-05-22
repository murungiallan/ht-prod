import { toast } from "react-hot-toast";
import {
  getAllAdminFoodLogs,
  createFoodLog,
  updateFoodLog,
  deleteSelectedAdminFoodLogs, // Updated import
} from "../../../services/api";

export const fetchFoodLogs = async (
  user,
  setLoading,
  setError,
  setFoodLogs,
  setTotalFoodLogs,
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
    const response = await getAllAdminFoodLogs(token, limit, page, sortConfig);
    setFoodLogs(response.foodLogs || []);
    setTotalFoodLogs(response.total || 0);
  } catch (err) {
    setError("Failed to fetch food logs: " + err.message);
    toast.error("Failed to fetch food logs");
  } finally {
    setLoading(false);
  }
};

export const handleCreateFoodLog = async (
  user,
  foodData,
  getUserToken,
  handleSessionExpired,
  fetchFoodLogs
) => {
  if (!user) return handleSessionExpired();
  try {
    const token = await getUserToken();
    await createFoodLog(foodData, token);
    toast.success("Food log created successfully");
    fetchFoodLogs();
  } catch (err) {
    toast.error("Failed to create food log: " + err.message);
  }
};

export const handleUpdateFoodLog = async (
  user,
  id,
  foodData,
  getUserToken,
  handleSessionExpired,
  fetchFoodLogs
) => {
  if (!user) return handleSessionExpired();
  try {
    const token = await getUserToken();
    await updateFoodLog(id, foodData, token);
    toast.success("Food log updated successfully");
    fetchFoodLogs();
  } catch (err) {
    toast.error("Failed to update food log: " + err.message);
  }
};

export const handleDeleteFoodLog = async (
  user,
  id,
  fetchFoodLogs,
  getUserToken,
  handleSessionExpired
) => {
  if (!user) return handleSessionExpired();
  if (!window.confirm("Are you sure you want to delete this food log?")) return;
  try {
    const token = await getUserToken();
    await deleteSelectedAdminFoodLogs([id], token); // Updated to use deleteSelectedAdminFoodLogs
    toast.success("Food log deleted successfully");
    fetchFoodLogs();
  } catch (err) {
    toast.error("Failed to delete food log: " + err.message);
  }
};

export const handleDeleteSelectedFoodLogs = async (
  user,
  selectedRows,
  setLoading,
  setSelectedRows,
  fetchFoodLogs,
  getUserToken,
  handleSessionExpired
) => {
  if (!user) return handleSessionExpired();
  if (!selectedRows.length) return toast.error("No food logs selected");
  if (!window.confirm("Are you sure you want to delete the selected food logs?")) return;

  setLoading(true);
  try {
    const token = await getUserToken();
    await deleteSelectedAdminFoodLogs(selectedRows, token); // Updated to use deleteSelectedAdminFoodLogs
    toast.success("Selected food logs deleted successfully");
    setSelectedRows([]);
    fetchFoodLogs();
  } catch (err) {
    toast.error("Failed to delete selected food logs: " + err.message);
  } finally {
    setLoading(false);
  }
};