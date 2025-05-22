import { toast } from "react-hot-toast";
import {
  getAllAdminExercises,
  createExercise,
  updateExercise,
  deleteSelectedAdminExercises, // Updated import
} from "../../../services/api";

export const fetchExercises = async (
  user,
  setLoading,
  setError,
  setExercises,
  setTotalExercises,
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
    const response = await getAllAdminExercises(token, limit, page, sortConfig);
    setExercises(response.exercises || []);
    setTotalExercises(response.total || 0);
  } catch (err) {
    setError("Failed to fetch exercises: " + err.message);
    toast.error("Failed to fetch exercises");
  } finally {
    setLoading(false);
  }
};

export const handleCreateExercise = async (
  user,
  exerciseData,
  getUserToken,
  handleSessionExpired,
  fetchExercises
) => {
  if (!user) return handleSessionExpired();
  try {
    const token = await getUserToken();
    await createExercise(exerciseData, token);
    toast.success("Exercise created successfully");
    fetchExercises();
  } catch (err) {
    toast.error("Failed to create exercise: " + err.message);
  }
};

export const handleUpdateExercise = async (
  user,
  id,
  exerciseData,
  getUserToken,
  handleSessionExpired,
  fetchExercises
) => {
  if (!user) return handleSessionExpired();
  try {
    const token = await getUserToken();
    await updateExercise(id, exerciseData, token);
    toast.success("Exercise updated successfully");
    fetchExercises();
  } catch (err) {
    toast.error("Failed to update exercise: " + err.message);
  }
};

export const handleDeleteExercise = async (
  user,
  id,
  fetchExercises,
  getUserToken,
  handleSessionExpired
) => {
  if (!user) return handleSessionExpired();
  if (!window.confirm("Are you sure you want to delete this exercise?")) return;
  try {
    const token = await getUserToken();
    await deleteSelectedAdminExercises([id], token); // Updated to use deleteSelectedAdminExercises
    toast.success("Exercise deleted successfully");
    fetchExercises();
  } catch (err) {
    toast.error("Failed to delete exercise: " + err.message);
  }
};

export const handleDeleteSelectedExercises = async (
  user,
  selectedRows,
  setLoading,
  setSelectedRows,
  fetchExercises,
  getUserToken,
  handleSessionExpired
) => {
  if (!user) return handleSessionExpired();
  if (!selectedRows.length) return toast.error("No exercises selected");
  if (!window.confirm("Are you sure you want to delete the selected exercises?")) return;

  setLoading(true);
  try {
    const token = await getUserToken();
    await deleteSelectedAdminExercises(selectedRows, token); // Updated to use deleteSelectedAdminExercises
    toast.success("Selected exercises deleted successfully");
    setSelectedRows([]);
    fetchExercises();
  } catch (err) {
    toast.error("Failed to delete selected exercises: " + err.message);
  } finally {
    setLoading(false);
  }
};