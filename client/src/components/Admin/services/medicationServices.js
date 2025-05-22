import { toast } from "react-hot-toast";
import {
  getAllAdminMedications,
  createMedication,
  updateMedication,
  deleteSelectedAdminMedications, // Updated import
} from "../../../services/api";

export const fetchMedications = async (
  user,
  setLoading,
  setError,
  setMedications,
  setTotalMedications,
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
    const response = await getAllAdminMedications(token, limit, page, sortConfig);
    setMedications(response.medications || []);
    setTotalMedications(response.total || 0);
  } catch (err) {
    setError("Failed to fetch medications: " + err.message);
    toast.error("Failed to fetch medications");
  } finally {
    setLoading(false);
  }
};

export const handleCreateMedication = async (
  user,
  medicationData,
  getUserToken,
  handleSessionExpired,
  fetchMedications
) => {
  if (!user) return handleSessionExpired();
  try {
    const token = await getUserToken();
    await createMedication(medicationData, token);
    toast.success("Medication created successfully");
    fetchMedications();
  } catch (err) {
    toast.error("Failed to create medication: " + err.message);
  }
};

export const handleUpdateMedication = async (
  user,
  id,
  medicationData,
  getUserToken,
  handleSessionExpired,
  fetchMedications
) => {
  if (!user) return handleSessionExpired();
  try {
    const token = await getUserToken();
    await updateMedication(id, medicationData, token);
    toast.success("Medication updated successfully");
    fetchMedications();
  } catch (err) {
    toast.error("Failed to update medication: " + err.message);
  }
};

export const handleDeleteMedication = async (
  user,
  id,
  fetchMedications,
  getUserToken,
  handleSessionExpired
) => {
  if (!user) return handleSessionExpired();
  if (!window.confirm("Are you sure you want to delete this medication?")) return;
  try {
    const token = await getUserToken();
    await deleteSelectedAdminMedications([id], token); // Updated to use deleteSelectedAdminMedications
    toast.success("Medication deleted successfully");
    fetchMedications();
  } catch (err) {
    toast.error("Failed to delete medication: " + err.message);
  }
};

export const handleDeleteSelectedMedications = async (
  user,
  selectedRows,
  setLoading,
  setSelectedRows,
  fetchMedications,
  getUserToken,
  handleSessionExpired
) => {
  if (!user) return handleSessionExpired();
  if (!selectedRows.length) return toast.error("No medications selected");
  if (!window.confirm("Are you sure you want to delete the selected medications?")) return;

  setLoading(true);
  try {
    const token = await getUserToken();
    await deleteSelectedAdminMedications(selectedRows, token);
    toast.success("Selected medications deleted successfully");
    setSelectedRows([]);
    fetchMedications();
  } catch (err) {
    toast.error("Failed to delete selected medications: " + err.message);
  } finally {
    setLoading(false);
  }
};