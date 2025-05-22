import { toast } from "react-hot-toast";
import {
  getAllAdminUsers,
  searchAdminUsers,
  deleteSelectedAdminUsers, // Updated import
  registerUser,
  updateProfile,
  resetPassword,
  getAdminUserActivityTrends,
} from "../../../services/api";

export const getUserToken = async (auth) => await auth.currentUser.getIdToken(true);

export const handleSessionExpired = (logout, navigate) => {
  logout();
  navigate("/login");
  toast.error("Session expired. Please log in again.");
};

export const fetchUsers = async (
  user,
  searchQuery,
  setLoading,
  setError,
  setUsers,
  setTotalUsers,
  setLastDoc,
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
    const response = searchQuery
      ? await searchAdminUsers(searchQuery, token, limit, page, sortConfig)
      : await getAllAdminUsers(token, limit, page, sortConfig);
    setUsers(response.users || []);
    setTotalUsers(response.total || 0);
    setLastDoc(response.lastDoc || null);
  } catch (err) {
    if (err.message.includes("WRITE_TOO_BIG")) {
      setError("Data too large to fetch. Please use search or reduce page size.");
      toast.error("Data too large. Try searching or reducing page size.");
    } else {
      setError("Failed to fetch users: " + err.message);
      toast.error("Failed to fetch users");
    }
  } finally {
    setLoading(false);
  }
};

export const handleCreateUser = async (
  user,
  userData,
  getUserToken,
  handleSessionExpired,
  fetchUsers
) => {
  if (!user) return handleSessionExpired();
  try {
    const token = await getUserToken();
    await registerUser(userData, token);
    toast.success("User created successfully");
    fetchUsers();
  } catch (err) {
    toast.error("Failed to create user: " + err.message);
  }
};

export const handleUpdateUser = async (
  user,
  id,
  userData,
  getUserToken,
  handleSessionExpired,
  fetchUsers
) => {
  if (!user) return handleSessionExpired();
  try {
    const token = await getUserToken();
    await updateProfile(id, userData, token);
    if (userData.resetPassword) {
      await resetPassword(id, token);
      toast.success("Password reset email sent");
    }
    toast.success("User updated successfully");
    fetchUsers();
  } catch (err) {
    toast.error("Failed to update user: " + err.message);
  }
};

export const handleDeleteUser = async (
  user,
  id,
  fetchUsers,
  getUserToken,
  handleSessionExpired
) => {
  if (!user) return handleSessionExpired();
  if (!window.confirm("Are you sure you want to delete this user?")) return;
  try {
    const token = await getUserToken();
    await deleteSelectedAdminUsers([id], token); // Updated to use deleteSelectedAdminUsers
    toast.success("User deleted successfully");
    fetchUsers();
  } catch (err) {
    toast.error("Failed to delete user: " + err.message);
  }
};

export const handleDeleteSelectedUsers = async (
  user,
  selectedRows,
  setLoading,
  setSelectedRows,
  fetchUsers,
  getUserToken,
  handleSessionExpired
) => {
  if (!user) return handleSessionExpired();
  if (!selectedRows.length) return toast.error("No users selected");
  if (!window.confirm("Are you sure you want to delete the selected users?")) return;

  setLoading(true);
  try {
    const token = await getUserToken();
    await deleteSelectedAdminUsers(selectedRows, token); // Updated to use deleteSelectedAdminUsers
    toast.success("Selected users deleted successfully");
    setSelectedRows([]);
    fetchUsers(1, 50);
  } catch (err) {
    toast.error("Failed to delete selected users: " + err.message);
  } finally {
    setLoading(false);
  }
};