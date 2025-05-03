import { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { auth } from "../../firebase/config";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  getAllUsers,
  updateProfile,
  resetPassword,
  saveWeeklyGoals,
  getWeeklyGoals,
  createMedication,
  getUserMedications,
  updateMedication,
  deleteMedication,
  getTakenMedicationHistory,
  calculateMedicationStreak,
  createReminder,
  getUserReminders,
  updateReminder,
  deleteReminder,
  updateReminderStatus,
  createFoodLog,
  getUserFoodLogs,
  updateFoodLog,
  deleteFoodLog,
  getFoodStats,
  createExercise,
  getUserExercises,
  updateExercise,
  deleteExercise,
  getExerciseStats,
  registerUser,
} from "../../services/api";
import { FaUser, FaPills, FaBell, FaUtensils, FaRunning, FaSpinner } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [medications, setMedications] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [foodLogs, setFoodLogs] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(null);

  const getUserToken = async () => {
    return await auth.currentUser.getIdToken(true);
  };

  const handleSessionExpired = useCallback(() => {
    toast.error("Your session has expired. Please log in again.");
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const fetchUsers = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getUserToken();
      const userData = await getAllUsers(token);
      setUsers(userData);
      toast.success("Users fetched successfully");
    } catch (err) {
      console.error("Error fetching users:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        setError("Failed to fetch users: " + (err.message || "Unknown error"));
        toast.error("Failed to fetch users");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData) => {
    if (!user) {
      handleSessionExpired();
      return;
    }
    try {
      const token = await getUserToken();
      await registerUser(userData, token);
      toast.success("User created successfully");
      fetchUsers();
      setModalOpen(null);
    } catch (err) {
      console.error("Error creating user:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to create user: " + (err.message || "Unknown error"));
      }
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    if (!user) {
      handleSessionExpired();
      return;
    }
    try {
      const token = await getUserToken();
      await updateProfile(userData, token);
      toast.success("User profile updated successfully");
      fetchUsers();
      setModalOpen(null);
    } catch (err) {
      console.error("Error updating user:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to update user: " + (err.message || "Unknown error"));
      }
    }
  };

  const handleSaveWeeklyGoals = async (foodGoal, exerciseGoal) => {
    if (!user) {
      handleSessionExpired();
      return;
    }
    try {
      const token = await getUserToken();
      await saveWeeklyGoals(foodGoal, exerciseGoal, token);
      toast.success("Weekly goals saved successfully");
      setModalOpen(null);
    } catch (err) {
      console.error("Error saving weekly goals:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to save weekly goals: " + (err.message || "Unknown error"));
      }
    }
  };

  const fetchMedications = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getUserToken();
      const medications = await getUserMedications(token);
      setMedications(medications);
      toast.success("Medications fetched successfully");
    } catch (err) {
      console.error("Error fetching medications:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        setError("Failed to fetch medications: " + (err.message || "Unknown error"));
        toast.error("Failed to fetch medications");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMedication = async (medicationData) => {
    if (!user) {
      handleSessionExpired();
      return;
    }
    try {
      const token = await getUserToken();
      await createMedication(medicationData, token);
      toast.success("Medication created successfully");
      fetchMedications();
      setModalOpen(null);
    } catch (err) {
      console.error("Error creating medication:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to create medication: " + (err.message || "Unknown error"));
      }
    }
  };

  const handleUpdateMedication = async (id, medicationData) => {
    if (!user) {
      handleSessionExpired();
      return;
    }
    try {
      const token = await getUserToken();
      await updateMedication(id, medicationData, token);
      toast.success("Medication updated successfully");
      fetchMedications();
    } catch (err) {
      console.error("Error updating medication:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to update medication: " + (err.message || "Unknown error"));
      }
    }
  };

  const handleDeleteMedication = async (id) => {
    if (!user) {
      handleSessionExpired();
      return;
    }
    try {
      const token = await getUserToken();
      await deleteMedication(id, token);
      toast.success("Medication deleted successfully");
      fetchMedications();
    } catch (err) {
      console.error("Error deleting medication:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to delete medication: " + (err.message || "Unknown error"));
      }
    }
  };

  const fetchReminders = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getUserToken();
      const reminders = await getUserReminders(token);
      setReminders(reminders);
      toast.success("Reminders fetched successfully");
    } catch (err) {
      console.error("Error fetching reminders:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        setError("Failed to fetch reminders: " + (err.message || "Unknown error"));
        toast.error("Failed to fetch reminders");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReminder = async (reminderData) => {
    if (!user) {
      handleSessionExpired();
      return;
    }
    try {
      const token = await getUserToken();
      await createReminder(reminderData, token);
      toast.success("Reminder created successfully");
      fetchReminders();
      setModalOpen(null);
    } catch (err) {
      console.error("Error creating reminder:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to create reminder: " + (err.message || "Unknown error"));
      }
    }
  };

  const handleUpdateReminder = async (id, reminderData) => {
    if (!user) {
      handleSessionExpired();
      return;
    }
    try {
      const token = await getUserToken();
      await updateReminder(id, reminderData, token);
      toast.success("Reminder updated successfully");
      fetchReminders();
    } catch (err) {
      console.error("Error updating reminder:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to update reminder: " + (err.message || "Unknown error"));
      }
    }
  };

  const handleDeleteReminder = async (id) => {
    if (!user) {
      handleSessionExpired();
      return;
    }
    try {
      const token = await getUserToken();
      await deleteReminder(id, token);
      toast.success("Reminder deleted successfully");
      fetchReminders();
    } catch (err) {
      console.error("Error deleting reminder:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to delete reminder: " + (err.message || "Unknown error"));
      }
    }
  };

  const handleUpdateReminderStatus = async (id, status) => {
    if (!user) {
      handleSessionExpired();
      return;
    }
    try {
      const token = await getUserToken();
      await updateReminderStatus(id, status, token);
      toast.success("Reminder status updated successfully");
      fetchReminders();
    } catch (err) {
      console.error("Error updating reminder status:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to update reminder status: " + (err.message || "Unknown error"));
      }
    }
  };

  const fetchFoodLogs = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getUserToken();
      const logs = await getUserFoodLogs(token);
      setFoodLogs(logs);
      toast.success("Food logs fetched successfully");
    } catch (err) {
      console.error("Error fetching food logs:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        setError("Failed to fetch food logs: " + (err.message || "Unknown error"));
        toast.error("Failed to fetch food logs");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFoodLog = async (foodData) => {
    if (!user) {
      handleSessionExpired();
      return;
    }
    try {
      const token = await getUserToken();
      await createFoodLog(foodData, token);
      toast.success("Food log created successfully");
      fetchFoodLogs();
      setModalOpen(null);
    } catch (err) {
      console.error("Error creating food log:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to create food log: " + (err.message || "Unknown error"));
      }
    }
  };

  const handleUpdateFoodLog = async (id, foodData) => {
    if (!user) {
      handleSessionExpired();
      return;
    }
    try {
      const token = await getUserToken();
      await updateFoodLog(id, foodData, token);
      toast.success("Food log updated successfully");
      fetchFoodLogs();
    } catch (err) {
      console.error("Error updating food log:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to update food log: " + (err.message || "Unknown error"));
      }
    }
  };

  const handleDeleteFoodLog = async (id) => {
    if (!user) {
      handleSessionExpired();
      return;
    }
    try {
      const token = await getUserToken();
      await deleteFoodLog(id, token);
      toast.success("Food log deleted successfully");
      fetchFoodLogs();
    } catch (err) {
      console.error("Error deleting food log:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to delete food log: " + (err.message || "Unknown error"));
      }
    }
  };

  const fetchExercises = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getUserToken();
      const exercises = await getUserExercises(token);
      setExercises(exercises);
      toast.success("Exercises fetched successfully");
    } catch (err) {
      console.error("Error fetching exercises:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        setError("Failed to fetch exercises: " + (err.message || "Unknown error"));
        toast.error("Failed to fetch exercises");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExercise = async (exerciseData) => {
    if (!user) {
      handleSessionExpired();
      return;
    }
    try {
      const token = await getUserToken();
      await createExercise(exerciseData, token);
      toast.success("Exercise created successfully");
      fetchExercises();
      setModalOpen(null);
    } catch (err) {
      console.error("Error creating exercise:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to create exercise: " + (err.message || "Unknown error"));
      }
    }
  };

  const handleUpdateExercise = async (id, exerciseData) => {
    if (!user) {
      handleSessionExpired();
      return;
    }
    try {
      const token = await getUserToken();
      await updateExercise(id, exerciseData, token);
      toast.success("Exercise updated successfully");
      fetchExercises();
    } catch (err) {
      console.error("Error updating exercise:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to update exercise: " + (err.message || "Unknown error"));
      }
    }
  };

  const handleDeleteExercise = async (id) => {
    if (!user) {
      handleSessionExpired();
      return;
    }
    try {
      const token = await getUserToken();
      await deleteExercise(id, token);
      toast.success("Exercise deleted successfully");
      fetchExercises();
    } catch (err) {
      console.error("Error deleting exercise:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to delete exercise: " + (err.message || "Unknown error"));
      }
    }
  };

  const handleResetPassword = async (email) => {
    if (!user) {
      handleSessionExpired();
      return;
    }
    try {
      await resetPassword(email);
      toast.success("Password reset email sent");
    } catch (err) {
      console.error("Error sending reset email:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to send reset email: " + (err.message || "Unknown error"));
      }
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const unsubscribe = auth.onIdTokenChanged(async (currentUser) => {
      if (!currentUser) {
        handleSessionExpired();
        return;
      }
      try {
        const tokenResult = await currentUser.getIdTokenResult();
        const expirationTime = new Date(tokenResult.expirationTime).getTime();
        const currentTime = Date.now();
        const timeUntilExpiration = expirationTime - currentTime;
        if (timeUntilExpiration <= 0) {
          handleSessionExpired();
          return;
        }
        if (timeUntilExpiration < 5 * 60 * 1000) {
          await currentUser.getIdToken(true);
        }
      } catch (error) {
        console.error("Error checking token expiration:", error);
        handleSessionExpired();
      }
    });

    return () => unsubscribe();
  }, [user, navigate, handleSessionExpired]);

  useEffect(() => {
    if (!user) return;

    switch (activeTab) {
      case "users":
        fetchUsers();
        break;
      case "medications":
        fetchMedications();
        break;
      case "reminders":
        fetchReminders();
        break;
      case "foodLogs":
        fetchFoodLogs();
        break;
      case "exercises":
        fetchExercises();
        break;
      default:
        break;
    }
  }, [activeTab, user]);

  const modalVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap border-b border-gray-200 mb-8">
          {[
            { id: "users", label: "Users", icon: <FaUser className="mr-2" /> },
            { id: "medications", label: "Medications", icon: <FaPills className="mr-2" /> },
            { id: "reminders", label: "Reminders", icon: <FaBell className="mr-2" /> },
            { id: "foodLogs", label: "Food Logs", icon: <FaUtensils className="mr-2" /> },
            { id: "exercises", label: "Exercises", icon: <FaRunning className="mr-2" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-10">
            <FaSpinner className="animate-spin text-4xl text-blue-600" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <div className="space-y-8">
            {activeTab === "users" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Manage Users</h2>
                <div className="flex space-x-4 mb-6">
                  <button
                    onClick={() => setModalOpen("createUser")}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all duration-200"
                  >
                    Create New User
                  </button>
                  <button
                    onClick={() => setModalOpen("updateUser")}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all duration-200"
                  >
                    Update User
                  </button>
                  <button
                    onClick={() => setModalOpen("weeklyGoals")}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all duration-200"
                  >
                    Set Weekly Goals
                  </button>
                </div>

                {/* Modals */}
                <AnimatePresence>
                  {modalOpen === "createUser" && (
                    <motion.div
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 mb-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="bg-white rounded-lg p-6 w-full max-w-md"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <h3 className="text-lg font-medium text-gray-700 mb-4">Create New User</h3>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            handleCreateUser({
                              uid: formData.get("uid"),
                              username: formData.get("username"),
                              email: formData.get("email"),
                              displayName: formData.get("displayName"),
                              password: formData.get("password"),
                              role: formData.get("role"),
                            });
                          }}
                          className="space-y-4"
                        >
                          <input
                            type="text"
                            name="uid"
                            placeholder="User ID (Firebase UID)"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="text"
                            name="displayName"
                            placeholder="Display Name"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <select
                            name="role"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                          <div className="flex justify-end space-x-4">
                            <button
                              type="button"
                              onClick={() => setModalOpen(null)}
                              className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all duration-200"
                            >
                              Create User
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </motion.div>
                  )}

                  {modalOpen === "updateUser" && (
                    <motion.div
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 mb-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="bg-white rounded-lg p-6 w-full max-w-md"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <h3 className="text-lg font-medium text-gray-700 mb-4">Update User Profile</h3>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            handleUpdateUser(formData.get("uid"), {
                              username: formData.get("username"),
                              email: formData.get("email"),
                              displayName: formData.get("displayName"),
                              role: formData.get("role"),
                            });
                          }}
                          className="space-y-4"
                        >
                          <input
                            type="text"
                            name="uid"
                            placeholder="User ID (Firebase UID)"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="text"
                            name="displayName"
                            placeholder="Display Name"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <select
                            name="role"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                          <div className="flex justify-end space-x-4">
                            <button
                              type="button"
                              onClick={() => setModalOpen(null)}
                              className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all duration-200"
                            >
                              Update User
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </motion.div>
                  )}

                  {modalOpen === "weeklyGoals" && (
                    <motion.div
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 mb-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="bg-white rounded-lg p-6 w-full max-w-md"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <h3 className="text-lg font-medium text-gray-700 mb-4">Set Weekly Goals</h3>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            handleSaveWeeklyGoals(
                              parseInt(formData.get("foodGoal")),
                              parseInt(formData.get("exerciseGoal"))
                            );
                          }}
                          className="space-y-4"
                        >
                          <input
                            type="number"
                            name="foodGoal"
                            placeholder="Food Calorie Goal"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="number"
                            name="exerciseGoal"
                            placeholder="Exercise Calorie Goal"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <div className="flex justify-end space-x-4">
                            <button
                              type="button"
                              onClick={() => setModalOpen(null)}
                              className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all duration-200"
                            >
                              Save Goals
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* User List */}
                <div className="bg-white rounded-lg shadow-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-16 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UID</th>
                        <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                        <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name</th>
                        <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                        <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                        <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Food Goal</th>
                        <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exercise Goal</th>
                        <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td className="w-16 px-4 py-4 text-sm text-gray-900 break-words">{u.id}</td>
                          <td className="w-32 px-4 py-4 text-sm text-gray-900 break-words">{u.uid}</td>
                          <td className="w-28 px-4 py-4 text-sm text-gray-900 break-words">{u.username}</td>
                          <td className="w-32 px-4 py-4 text-sm text-gray-900 break-words">{u.email}</td>
                          <td className="w-28 px-4 py-4 text-sm text-gray-900 break-words">{u.display_name || "N/A"}</td>
                          <td className="w-20 px-4 py-4 text-sm text-gray-900 break-words">{u.role}</td>
                          <td className="w-32 px-4 py-4 text-sm text-gray-900 break-words">
                            {new Date(u.created_at).toLocaleString()}
                          </td>
                          <td className="w-32 px-4 py-4 text-sm text-gray-900 break-words">
                            {u.last_login ? new Date(u.last_login).toLocaleString() : "N/A"}
                          </td>
                          <td className="w-28 px-4 py-4 text-sm text-gray-900 break-words">
                            {u.weekly_food_calorie_goal || "Not set"}
                          </td>
                          <td className="w-28 px-4 py-4 text-sm text-gray-900 break-words">
                            {u.weekly_exercise_calorie_goal || "Not set"}
                          </td>
                          <td className="w-28 px-4 py-4 text-sm">
                            <button
                              onClick={() => handleResetPassword(u.email)}
                              className="text-red-600 hover:text-red-800 font-medium break-words"
                            >
                              Reset Password
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "medications" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Manage Medications</h2>
                <div className="mb-6">
                  <button
                    onClick={() => setModalOpen("addMedication")}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all duration-200"
                  >
                    Add Medication
                  </button>
                </div>

                {/* Add Medication Modal */}
                <AnimatePresence>
                  {modalOpen === "addMedication" && (
                    <motion.div
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 mb-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="bg-white rounded-lg p-6 w-full max-w-md"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <h3 className="text-lg font-medium text-gray-700 mb-4">Add Medication</h3>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            handleCreateMedication({
                              user_id: parseInt(formData.get("user_id")),
                              medication_name: formData.get("medication_name"),
                              dosage: formData.get("dosage"),
                              frequency: formData.get("frequency"),
                              times_per_day: parseInt(formData.get("times_per_day")),
                              times: formData.get("times").split(",").map(time => time.trim()),
                              doses: JSON.stringify(Array(parseInt(formData.get("times_per_day"))).fill(false)),
                              start_date: formData.get("start_date"),
                              end_date: formData.get("end_date"),
                              notes: formData.get("notes"),
                            });
                          }}
                          className="space-y-4"
                        >
                          <input
                            type="number"
                            name="user_id"
                            placeholder="User ID"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="text"
                            name="medication_name"
                            placeholder="Medication Name"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="text"
                            name="dosage"
                            placeholder="Dosage"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <select
                            name="frequency"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                          <input
                            type="number"
                            name="times_per_day"
                            placeholder="Times per Day"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="text"
                            name="times"
                            placeholder="Times (comma-separated, e.g. 08:00,12:00)"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="date"
                            name="start_date"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="date"
                            name="end_date"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <textarea
                            name="notes"
                            placeholder="Notes"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <div className="flex justify-end space-x-4">
                            <button
                              type="button"
                              onClick={() => setModalOpen(null)}
                              className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all duration-200"
                            >
                              Add Medication
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Medication List */}
                <div className="bg-white rounded-lg shadow-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-16 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                        <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage</th>
                        <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                        <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Times/Day</th>
                        <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Times</th>
                        <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doses</th>
                        <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                        <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                        <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {medications.map((med) => (
                        <tr key={med.id}>
                          <td className="w-16 px-4 py-4 text-sm text-gray-900 break-words">{med.id}</td>
                          <td className="w-20 px-4 py-4 text-sm text-gray-900 break-words">{med.user_id}</td>
                          <td className="w-28 px-4 py-4 text-sm text-gray-900 break-words">{med.medication_name}</td>
                          <td className="w-24 px-4 py-4 text-sm text-gray-900 break-words">{med.dosage}</td>
                          <td className="w-24 px-4 py-4 text-sm text-gray-900 break-words">{med.frequency}</td>
                          <td className="w-20 px-4 py-4 text-sm text-gray-900 break-words">{med.times_per_day}</td>
                          <td className="w-28 px-4 py-4 text-sm text-gray-900 break-words">
                            {med.times ? med.times.join(", ") : "N/A"}
                          </td>
                          <td className="w-28 px-4 py-4 text-sm text-gray-900 break-words">
                            {med.doses ? med.doses.join(", ") : "N/A"}
                          </td>
                          <td className="w-28 px-4 py-4 text-sm text-gray-900 break-words">{med.start_date}</td>
                          <td className="w-28 px-4 py-4 text-sm text-gray-900 break-words">{med.end_date}</td>
                          <td className="w-32 px-4 py-4 text-sm text-gray-900 break-words">{med.notes || "N/A"}</td>
                          <td className="w-28 px-4 py-4 text-sm">
                            <button
                              onClick={() =>
                                handleUpdateMedication(med.id, {
                                  user_id: med.user_id,
                                  medication_name: med.medication_name,
                                  dosage: med.dosage,
                                  frequency: med.frequency,
                                  times_per_day: med.times_per_day,
                                  times: med.times,
                                  doses: med.doses,
                                  start_date: med.start_date,
                                  end_date: med.end_date,
                                  notes: med.notes,
                                })
                              }
                              className="text-blue-600 hover:text-blue-800 font-medium mr-4 break-words"
                            >
                              Update
                            </button>
                            <button
                              onClick={() => handleDeleteMedication(med.id)}
                              className="text-red-600 hover:text-red-800 font-medium break-words"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "reminders" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Manage Reminders</h2>
                <div className="mb-6">
                  <button
                    onClick={() => setModalOpen("addReminder")}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all duration-200"
                  >
                    Add Reminder
                  </button>
                </div>

                {/* Add Reminder Modal */}
                <AnimatePresence>
                  {modalOpen === "addReminder" && (
                    <motion.div
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 mb-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="bg-white rounded-lg p-6 w-full max-w-md"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <h3 className="text-lg font-medium text-gray-700 mb-4">Add Reminder</h3>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            handleCreateReminder({
                              user_id: parseInt(formData.get("user_id")),
                              medication_id: parseInt(formData.get("medication_id")),
                              dose_index: parseInt(formData.get("dose_index")),
                              reminder_time: formData.get("reminder_time"),
                              date: formData.get("date"),
                              type: formData.get("type"),
                            });
                          }}
                          className="space-y-4"
                        >
                          <input
                            type="number"
                            name="user_id"
                            placeholder="User ID"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="number"
                            name="medication_id"
                            placeholder="Medication ID"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="number"
                            name="dose_index"
                            placeholder="Dose Index"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="time"
                            name="reminder_time"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="date"
                            name="date"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <select
                            name="type"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="single">Single</option>
                            <option value="daily">Daily</option>
                          </select>
                          <div className="flex justify-end space-x-4">
                            <button
                              type="button"
                              onClick={() => setModalOpen(null)}
                              className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all duration-200"
                            >
                              Add Reminder
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Reminder List */}
                <div className="bg-white rounded-lg shadow-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-16 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                        <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medication ID</th>
                        <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dose Index</th>
                        <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reminders.map((rem) => (
                        <tr key={rem.id}>
                          <td className="w-16 px-4 py-4 text-sm text-gray-900 break-words">{rem.id}</td>
                          <td className="w-20 px-4 py-4 text-sm text-gray-900 break-words">{rem.user_id}</td>
                          <td className="w-24 px-4 py-4 text-sm text-gray-900 break-words">{rem.medication_id}</td>
                          <td className="w-24 px-4 py-4 text-sm text-gray-900 break-words">{rem.dose_index}</td>
                          <td className="w-24 px-4 py-4 text-sm text-gray-900 break-words">{rem.reminder_time}</td>
                          <td className="w-28 px-4 py-4 text-sm text-gray-900 break-words">{rem.date}</td>
                          <td className="w-20 px-4 py-4 text-sm text-gray-900 break-words">{rem.type}</td>
                          <td className="w-24 px-4 py-4 text-sm text-gray-900 break-words">{rem.status}</td>
                          <td className="w-28 px-4 py-4 text-sm">
                            <button
                              onClick={() =>
                                handleUpdateReminderStatus(
                                  rem.id,
                                  rem.status === "pending" ? "sent" : "pending"
                                )
                              }
                              className="text-blue-600 hover:text-blue-800 font-medium mr-4 break-words"
                            >
                              Toggle Status
                            </button>
                            <button
                              onClick={() => handleDeleteReminder(rem.id)}
                              className="text-red-600 hover:text-red-800 font-medium break-words"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "foodLogs" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Manage Food Logs</h2>
                <div className="mb-6">
                  <button
                    onClick={() => setModalOpen("addFoodLog")}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all duration-200"
                  >
                    Add Food Log
                  </button>
                </div>

                {/* Add Food Log Modal */}
                <AnimatePresence>
                  {modalOpen === "addFoodLog" && (
                    <motion.div
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 mb-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="bg-white rounded-lg p-6 w-full max-w-md"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <h3 className="text-lg font-medium text-gray-700 mb-4">Add Food Log</h3>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            handleCreateFoodLog({
                              user_id: parseInt(formData.get("user_id")),
                              food_name: formData.get("food_name"),
                              portion_size: formData.get("portion_size"),
                              calories: parseInt(formData.get("calories")),
                              date_logged: formData.get("date_logged"),
                              notes: formData.get("notes"),
                            });
                          }}
                          className="space-y-4"
                        >
                          <input
                            type="number"
                            name="user_id"
                            placeholder="User ID"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="text"
                            name="food_name"
                            placeholder="Food Name"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="text"
                            name="portion_size"
                            placeholder="Portion Size"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            type="number"
                            name="calories"
                            placeholder="Calories"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            type="date"
                            name="date_logged"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <textarea
                            name="notes"
                            placeholder="Notes"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <div className="flex justify-end space-x-4">
                            <button
                              type="button"
                              onClick={() => setModalOpen(null)}
                              className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all duration-200"
                            >
                              Add Food Log
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Food Log List */}
                <div className="bg-white rounded-lg shadow-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-16 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                        <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Food Name</th>
                        <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portion Size</th>
                        <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calories</th>
                        <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Logged</th>
                        <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {foodLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="w-16 px-4 py-4 text-sm text-gray-900 break-words">{log.id}</td>
                          <td className="w-20 px-4 py-4 text-sm text-gray-900 break-words">{log.user_id}</td>
                          <td className="w-28 px-4 py-4 text-sm text-gray-900 break-words">{log.food_name}</td>
                          <td className="w-28 px-4 py-4 text-sm text-gray-900 break-words">{log.portion_size || "N/A"}</td>
                          <td className="w-20 px-4 py-4 text-sm text-gray-900 break-words">{log.calories || "N/A"}</td>
                          <td className="w-32 px-4 py-4 text-sm text-gray-900 break-words">
                            {new Date(log.date_logged).toLocaleString()}
                          </td>
                          <td className="w-32 px-4 py-4 text-sm text-gray-900 break-words">{log.notes || "N/A"}</td>
                          <td className="w-28 px-4 py-4 text-sm">
                            <button
                              onClick={() =>
                                handleUpdateFoodLog(log.id, {
                                  user_id: log.user_id,
                                  food_name: log.food_name,
                                  portion_size: log.portion_size,
                                  calories: log.calories,
                                  date_logged: log.date_logged,
                                  notes: log.notes,
                                })
                              }
                              className="text-blue-600 hover:text-blue-800 font-medium mr-4 break-words"
                            >
                              Update
                            </button>
                            <button
                              onClick={() => handleDeleteFoodLog(log.id)}
                              className="text-red-600 hover:text-red-800 font-medium break-words"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "exercises" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Manage Exercises</h2>
                <div className="mb-6">
                  <button
                    onClick={() => setModalOpen("addExercise")}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all duration-200"
                  >
                    Add Exercise
                  </button>
                </div>

                {/* Add Exercise Modal */}
                <AnimatePresence>
                  {modalOpen === "addExercise" && (
                    <motion.div
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 mb-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="bg-white rounded-lg p-6 w-full max-w-md"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        <h3 className="text-lg font-medium text-gray-700 mb-4">Add Exercise</h3>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            handleCreateExercise({
                              user_id: parseInt(formData.get("user_id")),
                              activity: formData.get("activity"),
                              duration: parseInt(formData.get("duration")),
                              calories_burned: parseInt(formData.get("calories_burned")),
                              date_logged: formData.get("date_logged"),
                            });
                          }}
                          className="space-y-4"
                        >
                          <input
                            type="number"
                            name="user_id"
                            placeholder="User ID"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="text"
                            name="activity"
                            placeholder="Activity"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="number"
                            name="duration"
                            placeholder="Duration (minutes)"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="number"
                            name="calories_burned"
                            placeholder="Calories Burned"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <input
                            type="date"
                            name="date_logged"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <div className="flex justify-end space-x-4">
                            <button
                              type="button"
                              onClick={() => setModalOpen(null)}
                              className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all duration-200"
                            >
                              Add Exercise
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Exercise List */}
                <div className="bg-white rounded-lg shadow-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-16 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                        <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                        <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration (min)</th>
                        <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calories Burned</th>
                        <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Logged</th>
                        <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {exercises.map((ex) => (
                        <tr key={ex.id}>
                          <td className="w-16 px-4 py-4 text-sm text-gray-900 break-words">{ex.id}</td>
                          <td className="w-20 px-4 py-4 text-sm text-gray-900 break-words">{ex.user_id}</td>
                          <td className="w-28 px-4 py-4 text-sm text-gray-900 break-words">{ex.activity}</td>
                          <td className="w-24 px-4 py-4 text-sm text-gray-900 break-words">{ex.duration}</td>
                          <td className="w-28 px-4 py-4 text-sm text-gray-900 break-words">{ex.calories_burned}</td>
                          <td className="w-32 px-4 py-4 text-sm text-gray-900 break-words">
                            {new Date(ex.date_logged).toLocaleString()}
                          </td>
                          <td className="w-28 px-4 py-4 text-sm">
                            <button
                              onClick={() =>
                                handleUpdateExercise(ex.id, {
                                  user_id: ex.user_id,
                                  activity: ex.activity,
                                  duration: ex.duration,
                                  calories_burned: ex.calories_burned,
                                  date_logged: ex.date_logged,
                                })
                              }
                              className="text-blue-600 hover:text-blue-800 font-medium mr-4 break-words"
                            >
                              Update
                            </button>
                            <button
                              onClick={() => handleDeleteExercise(ex.id)}
                              className="text-red-600 hover:text-red-800 font-medium break-words"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;