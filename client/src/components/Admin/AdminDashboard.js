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
import { FaUser, FaPills, FaBell, FaUtensils, FaRunning, FaSpinner, FaBars, FaTimes, FaSignOutAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import logo from "../../assets/logo.png";
import favicon from "../../assets/favicon.png";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// Sidebar Component
const Sidebar = ({ activeTab, setActiveTab, isMinimized, setIsMinimized, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    toast("You have been logged out");
    setIsMobileMenuOpen(false);
  };

  const tabs = [
    { id: "users", label: "Users", icon: <FaUser /> },
    { id: "medications", label: "Medications", icon: <FaPills /> },
    { id: "reminders", label: "Reminders", icon: <FaBell /> },
    { id: "foodLogs", label: "Food Logs", icon: <FaUtensils /> },
    { id: "exercises", label: "Exercises", icon: <FaRunning /> },
  ];

  // Define sidebar variants for desktop width
  const sidebarVariants = {
    minimized: {
      width: "6rem",
      transition: { type: "spring", stiffness: 300, damping: 30, mass: 1 },
    },
    expanded: {
      width: "16rem",
      transition: { type: "spring", stiffness: 300, damping: 30, mass: 1 },
    },
  };

  // Define text variants for opacity
  const textVariants = {
    minimized: { opacity: 0, transition: { duration: 0.2, ease: "easeOut" } },
    expanded: { opacity: 1, transition: { duration: 0.2, ease: "easeIn", delay: 0.1 } },
  };

  // Define icon variants
  const iconVariants = {
    minimized: { transition: { duration: 0.2, ease: "easeOut" } },
    expanded: { transition: { duration: 0.2, ease: "easeIn" } },
  };

  // Animation variants for mobile menu
  const mobileMenuVariants = {
    hidden: { x: "100%" },
    visible: { x: 0, transition: { duration: 0.3, ease: "easeInOut" } },
    exit: { x: "100%", transition: { duration: 0.3, ease: "easeInOut" } },
  };

  // Animation variants for overlay
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 0.5, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  // Animation variants for nav items
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.3 },
    }),
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        className="fixed top-6 right-4 z-50 lg:hidden text-gray-700"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      {/* Desktop Sidebar */}
      <motion.div
        className="hidden lg:block fixed top-0 left-0 h-screen bg-gray-100 text-black px-6 py-4 z-40"
        variants={sidebarVariants}
        animate={isMinimized ? "minimized" : "expanded"}
        onMouseEnter={() => setIsMinimized(false)}
        onMouseLeave={() => setIsMinimized(true)}
        layout
      >
        <div className="flex items-center justify-between mb-8 mt-16">
          {/* Logo section (commented out as in original) */}
          {/* <motion.div layout>
            {isMinimized ? (
              <img src={favicon} alt="Favicon" className="w-8 h-8 mx-auto" />
            ) : (
              <img src={logo} alt="Logo" className="w-32 h-auto" />
            )}
          </motion.div> */}
        </div>
        <nav className="space-y-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
              }}
              className={`flex items-center w-full p-2 my-4 rounded-md hover:bg-gray-600 hover:text-white transition-colors ${
                activeTab === tab.id ? "bg-gray-500 text-white" : ""
              }`}
              layout
            >
              <motion.span
                variants={iconVariants}
                animate={isMinimized ? "minimized" : "expanded"}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center mr-3"
              >
                {tab.icon}
              </motion.span>
              <motion.span
                variants={textVariants}
                animate={isMinimized ? "minimized" : "expanded"}
                className="text-sm font-medium flex-grow text-left"
                style={{ visibility: isMinimized ? "hidden" : "visible" }}
              >
                {tab.label}
              </motion.span>
            </motion.button>
          ))}
          <motion.button
            onClick={handleLogout}
            className="flex items-center w-full p-2 rounded-md hover:bg-red-600 hover:text-white transition-colors"
            layout
          >
            <motion.span
              variants={iconVariants}
              animate={isMinimized ? "minimized" : "expanded"}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center mr-3"
            >
              <FaSignOutAlt />
            </motion.span>
            <motion.span
              variants={textVariants}
              animate={isMinimized ? "minimized" : "expanded"}
              className="text-sm font-medium flex-grow text-left"
              style={{ visibility: isMinimized ? "hidden" : "visible" }}
            >
              Logout
            </motion.span>
          </motion.button>
        </nav>
      </motion.div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black z-40 lg:hidden"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Full-Page Mobile Menu */}
            <motion.nav
              className="fixed top-0 right-0 w-full h-screen bg-gray-100 z-50 lg:hidden"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="flex flex-col h-full">
                {/* Header Section with Logo and Close Button */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <img src={logo} alt="HealthTrack" className="h-10" />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-700 focus:outline-none"
                    aria-label="Close menu"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 flex flex-col justify-between p-4">
                  <div className="space-y-4">
                    {tabs.map((tab, index) => (
                      <motion.div
                        key={tab.id}
                        custom={index}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <button
                          onClick={() => {
                            setActiveTab(tab.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`block py-3 px-3 text-gray-700 text-lg font-medium hover:bg-gray-100 hover:text-blue-600 rounded-lg w-full text-left ${
                            activeTab === tab.id ? "bg-gray-200" : ""
                          }`}
                        >
                          {tab.label}
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  {/* Logout Button */}
                  <motion.div
                    custom={tabs.length}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <button
                      onClick={handleLogout}
                      className="w-full text-left py-3 px-3 text-gray-700 text-lg font-medium hover:bg-red-50 hover:text-red-600 border-t border-gray-200 rounded-lg"
                    >
                      Logout
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// Chart Component
const ChartComponent = ({ type, data, options, title }) => {
  const Component = type === "line" ? Line : Bar;
  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <Component data={data} options={options} />
    </div>
  );
};

// Statistics Card Component
const StatisticsCard = ({ title, value, change, icon }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4">
      <div className="text-3xl text-indigo-600">{icon}</div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {change && (
          <p className={`text-sm ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
            {change >= 0 ? "+" : ""}{change}% {change >= 0 ? "increase" : "decrease"}
          </p>
        )}
      </div>
    </div>
  );
};

// Paginated Table Component
const PaginatedTable = ({ data, columns, itemsPerPage = 5 }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="bg-white rounded-xl shadow-md mt-6 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider truncate max-w-[150px] sm:max-w-[200px]"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {paginatedData.map((item, index) => (
            <tr key={index}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-4 py-4 text-sm text-gray-800 truncate max-w-[150px] sm:max-w-[200px]"
                >
                  {col.render ? col.render(item) : item[col.key] || "N/A"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap justify-between items-center p-4 gap-4">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md disabled:opacity-50 hover:bg-gray-200 transition-colors"
        >
          Previous
        </button>
        <span className="text-gray-800">Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md disabled:opacity-50 hover:bg-gray-200 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

// Main AdminDashboard Component
const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [isMinimized, setIsMinimized] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [medications, setMedications] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [foodLogs, setFoodLogs] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(null);
  const [medicationStats, setMedicationStats] = useState({});
  const [foodStats, setFoodStats] = useState({});
  const [exerciseStats, setExerciseStats] = useState({});

  const getUserToken = async () => await auth.currentUser.getIdToken(true);
  const handleSessionExpired = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  // Fetch Functions
  const fetchUsers = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getUserToken();
      const userData = await getAllUsers(token);
      setUsers(userData);
      // toast.success("Users fetched successfully");
    } catch (err) {
      console.error("Error fetching users:", err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
      else {
        setError("Failed to fetch users: " + (err.message || "Unknown error"));
        toast.error("Failed to fetch users");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMedications = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getUserToken();
      // Fetch medications for all users (modify API to support this)
      const allMeds = await getUserMedications(token, { allUsers: true });
      // Group medications by user_id
      const medsByUser = allMeds.reduce((acc, med) => {
        acc[med.user_id] = acc[med.user_id] || [];
        acc[med.user_id].push(med);
        return acc;
      }, {});
      
      // Fetch history and streak for each user
      const adherenceByUser = {};
      const streakByUser = {};
      for (const userId of Object.keys(medsByUser)) {
        const history = await getTakenMedicationHistory(token, userId);
        const streak = await calculateMedicationStreak(token, userId);
        const adherence = history.length
          ? (history.reduce((acc, curr) => acc + (curr.taken ? 1 : 0), 0) / history.length) * 100
          : 0;
        adherenceByUser[userId] = adherence;
        streakByUser[userId] = streak;
      }
      
      // Calculate averages
      const totalUsers = users.length || 1; // Avoid division by zero
      const avgAdherence = Object.values(adherenceByUser).length
        ? Object.values(adherenceByUser).reduce((sum, val) => sum + val, 0) / Object.values(adherenceByUser).length
        : 0;
      const avgStreak = Object.values(streakByUser).length
        ? Object.values(streakByUser).reduce((sum, val) => sum + val, 0) / Object.values(streakByUser).length
        : 0;
      
      setMedications(allMeds);
      setMedicationStats({
        total: allMeds.length,
        history: [], // Aggregate history not needed for admin view
        streak: avgStreak,
        adherence: avgAdherence,
        medsByUser,
        adherenceByUser,
        streakByUser,
      });
      // toast.success("Medications fetched successfully");
    } catch (err) {
      console.error("Error fetching medications:", err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
      else {
        setError("Failed to fetch medications: " + (err.message || "Unknown error"));
        toast.error("Failed to fetch medications");
      }
    } finally {
      setLoading(false);
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
      // toast.success("Reminders fetched successfully");
    } catch (err) {
      console.error("Error fetching reminders:", err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
      else {
        setError("Failed to fetch reminders: " + (err.message || "Unknown error"));
        toast.error("Failed to fetch reminders");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFoodLogs = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getUserToken();
      const logs = await getUserFoodLogs(token);
      const stats = await getFoodStats(token);
      setFoodLogs(logs);
      setFoodStats(stats);
      // toast.success("Food logs fetched successfully");
    } catch (err) {
      console.error("Error fetching food logs:", err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
      else {
        setError("Failed to fetch food logs: " + (err.message || "Unknown error"));
        toast.error("Failed to fetch food logs");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchExercises = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getUserToken();
      const exercises = await getUserExercises(token);
      const stats = await getExerciseStats(token);
      setExercises(exercises);
      setExerciseStats(stats);
      // toast.success("Exercises fetched successfully");
    } catch (err) {
      console.error("Error fetching exercises:", err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
      else {
        setError("Failed to fetch exercises: " + (err.message || "Unknown error"));
        toast.error("Failed to fetch exercises");
      }
    } finally {
      setLoading(false);
    }
  };

  // CRUD Handlers
  const handleCreateUser = async (userData) => {
    if (!user) return handleSessionExpired();
    try {
      const token = await getUserToken();
      await registerUser(userData, token);
      toast.success("User created successfully");
      fetchUsers();
      setModalOpen(null);
    } catch (err) {
      console.error("Error creating user:", err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
      else toast.error("Failed to create user: " + (err.message || "Unknown error"));
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    if (!user) return handleSessionExpired();
    try {
      const token = await getUserToken();
      await updateProfile(userData, token);
      toast.success("User profile updated successfully");
      fetchUsers();
      setModalOpen(null);
    } catch (err) {
      console.error("Error updating user:", err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
      else toast.error("Failed to update user: " + (err.message || "Unknown error"));
    }
  };

  const handleSaveWeeklyGoals = async (foodGoal, exerciseGoal) => {
    if (!user) return handleSessionExpired();
    try {
      const token = await getUserToken();
      await saveWeeklyGoals(foodGoal, exerciseGoal, token);
      toast.success("Weekly goals saved successfully");
      setModalOpen(null);
    } catch (err) {
      console.error("Error saving weekly goals:", err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
      else toast.error("Failed to save weekly goals: " + (err.message || "Unknown error"));
    }
  };

  const handleCreateMedication = async (medicationData) => {
    if (!user) return handleSessionExpired();
    try {
      const token = await getUserToken();
      await createMedication(medicationData, token);
      toast.success("Medication created successfully");
      fetchMedications();
      setModalOpen(null);
    } catch (err) {
      console.error("Error creating medication:", err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
      else toast.error("Failed to create medication: " + (err.message || "Unknown error"));
    }
  };

  const handleUpdateMedication = async (id, medicationData) => {
    if (!user) return handleSessionExpired();
    try {
      const token = await getUserToken();
      await updateMedication(id, medicationData, token);
      toast.success("Medication updated successfully");
      fetchMedications();
    } catch (err) {
      console.error("Error updating medication:", err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
      else toast.error("Failed to update medication: " + (err.message || "Unknown error"));
    }
  };

  const handleDeleteMedication = async (id) => {
    if (!user) return handleSessionExpired();
    try {
      const token = await getUserToken();
      await deleteMedication(id, token);
      toast.success("Medication deleted successfully");
      fetchMedications();
    } catch (err) {
      console.error("Error deleting medication:", err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
      else toast.error("Failed to delete medication: " + (err.message || "Unknown error"));
    }
  };

  const handleCreateReminder = async (reminderData) => {
    if (!user) return handleSessionExpired();
    try {
      const token = await getUserToken();
      await createReminder(reminderData, token);
      toast.success("Reminder created successfully");
      fetchReminders();
      setModalOpen(null);
    } catch (err) {
      console.error("Error creating reminder:", err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
      else toast.error("Failed to create reminder: " + (err.message || "Unknown error"));
    }
  };

  const handleUpdateReminder = async (id, reminderData) => {
    if (!user) return handleSessionExpired();
    try {
      const token = await getUserToken();
      await updateReminder(id, reminderData, token);
      toast.success("Reminder updated successfully");
      fetchReminders();
    } catch (err) {
      console.error("Error updating reminder:", err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
      else toast.error("Failed to update reminder: " + (err.message || "Unknown error"));
    }
  };

  const handleDeleteReminder = async (id) => {
    if (!user) return handleSessionExpired();
    try {
      const token = await getUserToken();
      await deleteReminder(id, token);
      toast.success("Reminder deleted successfully");
      fetchReminders();
    } catch (err) {
      console.error("Error deleting reminder:", err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
      else toast.error("Failed to delete reminder: " + (err.message || "Unknown error"));
    }
  };

  const handleUpdateReminderStatus = async (id, status) => {
    if (!user) return handleSessionExpired();
    try {
      const token = await getUserToken();
      await updateReminderStatus(id, status, token);
      toast.success("Reminder status updated successfully");
      fetchReminders();
    } catch (err) {
      console.error("Error updating reminder status:", err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
      else toast.error("Failed to update reminder status: " + (err.message || "Unknown error"));
    }
  };

  const handleCreateFoodLog = async (foodData) => {
    if (!user) return handleSessionExpired();
    try {
      const token = await getUserToken();
      await createFoodLog(foodData, token);
      toast.success("Food log created successfully");
      fetchFoodLogs();
      setModalOpen(null);
    } catch (err) {
      console.error("Error creating food log:", err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
      else toast.error("Failed to create food log: " + (err.message || "Unknown error"));
    }
  };

  const handleUpdateFoodLog = async (id, foodData) => {
    if (!user) return handleSessionExpired();
    try {
      const token = await getUserToken();
      await updateFoodLog(id, foodData, token);
      toast.success("Food log updated successfully");
      fetchFoodLogs();
    } catch (err) {
      console.error("Error updating food log:", err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
      else toast.error("Failed to update food log: " + (err.message || "Unknown error"));
    }
  };

  const handleDeleteFoodLog = async (id) => {
    if (!user) return handleSessionExpired();
    try {
      const token = await getUserToken();
      await deleteFoodLog(id, token);
      toast.success("Food log deleted successfully");
      fetchFoodLogs();
    } catch (err) {
      console.error("Error deleting food log:", err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
      else toast.error("Failed to delete food log: " + (err.message || "Unknown error"));
    }
  };

  const handleCreateExercise = async (exerciseData) => {
    if (!user) return handleSessionExpired();
    try {
      const token = await getUserToken();
      await createExercise(exerciseData, token);
      toast.success("Exercise created successfully");
      fetchExercises();
      setModalOpen(null);
    } catch (err) {
      console.error("Error creating exercise:", err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
      else toast.error("Failed to create exercise: " + (err.message || "Unknown error"));
    }
  };

  const handleUpdateExercise = async (id, exerciseData) => {
    if (!user) return handleSessionExpired();
    try {
      const token = await getUserToken();
      await updateExercise(id, exerciseData, token);
      toast.success("Exercise updated successfully");
      fetchExercises();
    } catch (err) {
      console.error("Error updating exercise:", err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
      else toast.error("Failed to update exercise: " + (err.message || "Unknown error"));
    }
  };

  const handleDeleteExercise = async (id) => {
    if (!user) return handleSessionExpired();
    try {
      const token = await getUserToken();
      await deleteExercise(id, token);
      toast.success("Exercise deleted successfully");
      fetchExercises();
    } catch (err) {
      console.error("Error deleting exercise:", err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
      else toast.error("Failed to delete exercise: " + (err.message || "Unknown error"));
    }
  };

  const handleResetPassword = async (email) => {
    if (!user) return handleSessionExpired();
    try {
      await resetPassword(email);
      toast.success("Password reset email sent");
    } catch (err) {
      console.error("Error sending reset email:", err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
      else toast.error("Failed to send reset email: " + (err.message || "Unknown error"));
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const unsubscribe = auth.onIdTokenChanged(async (currentUser) => {
      if (!currentUser) handleSessionExpired();
      else {
        try {
          const tokenResult = await currentUser.getIdTokenResult();
          const expirationTime = new Date(tokenResult.expirationTime).getTime();
          const currentTime = Date.now();
          const timeUntilExpiration = expirationTime - currentTime;
          if (timeUntilExpiration <= 0) handleSessionExpired();
          else if (timeUntilExpiration < 5 * 60 * 1000) await currentUser.getIdToken(true);
        } catch (error) {
          console.error("Error checking token expiration:", error);
          handleSessionExpired();
        }
      }
    });

    return () => unsubscribe();
  }, [user, navigate, handleSessionExpired]);

  useEffect(() => {
    if (!user) return;
    switch (activeTab) {
      case "users": fetchUsers(); break;
      case "medications": fetchMedications(); break;
      case "reminders": fetchReminders(); break;
      case "foodLogs": fetchFoodLogs(); break;
      case "exercises": fetchExercises(); break;
      default: break;
    }
  }, [activeTab, user]);

  const medicationAdherenceData = {
    labels: medicationStats.history?.map((h) => new Date(h.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: "Adherence (%)",
        data: medicationStats.history?.map((h) => (h.taken ? 100 : 0)) || [],
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79, 70, 229, 0.2)",
        fill: true,
      },
    ],
  };

  const foodCalorieData = {
    labels: foodLogs.map((log) => new Date(log.date_logged).toLocaleDateString()),
    datasets: [
      {
        label: "Calories Consumed",
        data: foodLogs.map((log) => log.calories),
        backgroundColor: "#4f46e5",
      },
    ],
  };

  const exerciseData = {
    labels: exercises.map((ex) => new Date(ex.date_logged).toLocaleDateString()),
    datasets: [
      {
        label: "Calories Burned",
        data: exercises.map((ex) => ex.calories_burned),
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79, 70, 229, 0.2)",
        fill: true,
      },
      {
        label: "Duration (min)",
        data: exercises.map((ex) => ex.duration),
        borderColor: "#a855f7",
        backgroundColor: "rgba(168, 85, 247, 0.2)",
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: "top", labels: { color: "#1f2937" } }, title: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { color: "#1f2937" }, grid: { color: "rgba(0, 0, 0, 0.05)" } },
      x: { ticks: { color: "#1f2937" }, grid: { color: "rgba(0, 0, 0, 0.05)" } },
    },
  };

  const modalVariants = { hidden: { opacity: 0, y: -50 }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -50 } };

  return (
    <div className="min-h-screen text-gray-800">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-gray-100 text-black border-b border-gray-200 px-6 py-4 flex justify-start items-center z-50">
        <img src={logo} alt="HealthTrack" className="h-10" />
        {/* <div className="flex items-center space-x-4">
          <span className="text-sm">{user?.email || "User"}</span>
          <button
            onClick={() => logout()}
            className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div> */}
      </nav>

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMinimized={isMinimized}
        setIsMinimized={setIsMinimized}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content */}
      <main
        className={`p-4 sm:p-6 lg:pt-8 sm:pt-8 transition-all duration-300 lg:mt-4${
          isMinimized ? "lg:ml-16" : "lg:ml-48"
        } max-w-7xl mx-auto`}
      >
        {loading && (
          <div className="flex justify-center items-center py-10">
            <FaSpinner className="animate-spin text-4xl text-indigo-600" />
          </div>
        )}
        {error && !loading && (
          <div className="bg-red-100 border-l-4 border-red-600 p-4 mb-6 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        {!loading && !error && (
          <div className="flex flex-col space-y-6">
            {activeTab === "users" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Manage Users</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                  <StatisticsCard
                    title="Total Users"
                    value={users.length}
                    change={((users.length - (users.length * 0.9)) / (users.length * 0.9) * 100).toFixed(1)}
                    icon={<FaUser />}
                  />
                  <StatisticsCard
                    title="Active Users"
                    value={users.filter((u) => u.last_login).length}
                    icon={<FaUser />}
                  />
                  <StatisticsCard
                    title="Admins"
                    value={users.filter((u) => u.role === "admin").length}
                    icon={<FaUser />}
                  />
                  <StatisticsCard
                    title="Avg Medications/User"
                    value={(medications.length / (users.length || 1)).toFixed(1)}
                    icon={<FaPills />}
                  />
                  <StatisticsCard
                    title="Avg Reminders/User"
                    value={(reminders.length / (users.length || 1)).toFixed(1)}
                    icon={<FaBell />}
                  />
                  <StatisticsCard
                    title="Avg Food Logs/User"
                    value={(foodLogs.length / (users.length || 1)).toFixed(1)}
                    icon={<FaUtensils />}
                  />
                  <StatisticsCard
                    title="Avg Exercises/User"
                    value={(exercises.length / (users.length || 1)).toFixed(1)}
                    icon={<FaRunning />}
                  />
                </div>
                {/* Rest of the users tab (buttons and table) remains unchanged */}
              </div>
            )}
            {activeTab === "medications" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Manage Medications</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                  <StatisticsCard
                    title="Total Users"
                    value={users.length}
                    icon={<FaUser />}
                  />
                  <StatisticsCard
                    title="Total Medications"
                    value={medicationStats.total || 0}
                    icon={<FaPills />}
                  />
                  <StatisticsCard
                    title="Avg Medications/User"
                    value={(medicationStats.total / (users.length || 1)).toFixed(1)}
                    icon={<FaPills />}
                  />
                  <StatisticsCard
                    title="Avg Adherence Rate"
                    value={`${medicationStats.adherence?.toFixed(1) || 0}%`}
                    change={((medicationStats.adherence - 75) / 75 * 100).toFixed(1)}
                    icon={<FaPills />}
                  />
                  <StatisticsCard
                    title="Avg Streak"
                    value={`${medicationStats.streak?.toFixed(1) || 0} days`}
                    icon={<FaPills />}
                  />
                </div>
                <ChartComponent
                  type="line"
                  data={medicationAdherenceData}
                  options={chartOptions}
                  title="Medication Adherence Over Time"
                />
                <div className="mb-6">
                  <button
                    onClick={() => setModalOpen("addMedication")}
                    className="bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Add Medication
                  </button>
                </div>
                <PaginatedTable
                  data={medications}
                  columns={[
                    { key: "id", label: "ID" },
                    { key: "user_id", label: "User ID" },
                    { key: "medication_name", label: "Name" },
                    { key: "dosage", label: "Dosage" },
                    { key: "frequency", label: "Frequency" },
                    { key: "times_per_day", label: "Times/Day" },
                    {
                      key: "times",
                      label: "Times",
                      render: (item) => (item.times ? item.times.join(", ") : "N/A"),
                    },
                    {
                      key: "doses",
                      label: "Doses",
                      render: (item) => {
                        try {
                          const dosesArray = typeof item.doses === "string" ? JSON.parse(item.doses) : item.doses;
                          return Array.isArray(dosesArray) ? dosesArray.join(", ") : "N/A";
                        } catch (e) {
                          console.error("Error parsing doses:", e);
                          return "N/A";
                        }
                      },
                    },
                    { key: "start_date", label: "Start Date" },
                    { key: "end_date", label: "End Date" },
                    { key: "notes", label: "Notes" },
                    {
                      key: "actions",
                      label: "Actions",
                      render: (item) => (
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              handleUpdateMedication(item.id, {
                                user_id: item.user_id,
                                medication_name: item.medication_name,
                                dosage: item.dosage,
                                frequency: item.frequency,
                                times_per_day: item.times_per_day,
                                times: item.times,
                                doses: item.doses,
                                start_date: item.start_date,
                                end_date: item.end_date,
                                notes: item.notes,
                              })
                            }
                            className="text-indigo-600 hover:text-indigo-500 font-medium"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => handleDeleteMedication(item.id)}
                            className="text-red-600 hover:text-red-500 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            )}
            {activeTab === "reminders" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Manage Reminders</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                  <StatisticsCard
                    title="Total Users"
                    value={users.length}
                    icon={<FaUser />}
                  />
                  <StatisticsCard
                    title="Total Reminders"
                    value={reminders.length}
                    icon={<FaBell />}
                  />
                  <StatisticsCard
                    title="Avg Reminders/User"
                    value={(reminders.length / (users.length || 1)).toFixed(1)}
                    icon={<FaBell />}
                  />
                  <StatisticsCard
                    title="Pending Reminders"
                    value={reminders.filter((r) => r.status === "pending").length}
                    icon={<FaBell />}
                  />
                  <StatisticsCard
                    title="Sent Reminders"
                    value={reminders.filter((r) => r.status === "sent").length}
                    icon={<FaBell />}
                  />
                </div>
                <div className="mb-6">
                  <button
                    onClick={() => setModalOpen("addReminder")}
                    className="bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Add Reminder
                  </button>
                </div>
                <PaginatedTable
                  data={reminders}
                  columns={[
                    { key: "id", label: "ID" },
                    { key: "user_id", label: "User ID" },
                    { key: "medication_id", label: "Medication ID" },
                    { key: "dose_index", label: "Dose Index" },
                    { key: "reminder_time", label: "Time" },
                    { key: "date", label: "Date" },
                    { key: "type", label: "Type" },
                    { key: "status", label: "Status" },
                    {
                      key: "actions",
                      label: "Actions",
                      render: (item) => (
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              handleUpdateReminderStatus(
                                item.id,
                                item.status === "pending" ? "sent" : "pending"
                              )
                            }
                            className="text-indigo-600 hover:text-indigo-500 font-medium"
                          >
                            Toggle Status
                          </button>
                          <button
                            onClick={() => handleDeleteReminder(item.id)}
                            className="text-red-600 hover:text-red-500 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            )}
            {activeTab === "foodLogs" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Manage Food Logs</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                  <StatisticsCard
                    title="Total Users"
                    value={users.length}
                    icon={<FaUser />}
                  />
                  <StatisticsCard
                    title="Total Food Logs"
                    value={foodLogs.length}
                    icon={<FaUtensils />}
                  />
                  <StatisticsCard
                    title="Avg Food Logs/User"
                    value={(foodLogs.length / (users.length || 1)).toFixed(1)}
                    icon={<FaUtensils />}
                  />
                  <StatisticsCard
                    title="Total Calories"
                    value={foodStats.totalCalories || 0}
                    icon={<FaUtensils />}
                  />
                  <StatisticsCard
                    title="Avg Calories/Day"
                    value={foodStats.avgCaloriesPerDay?.toFixed(1) || 0}
                    icon={<FaUtensils />}
                  />
                </div>
                <ChartComponent
                  type="bar"
                  data={foodCalorieData}
                  options={chartOptions}
                  title="Calorie Intake Over Time"
                />
                <div className="mb-6">
                  <button
                    onClick={() => setModalOpen("addFoodLog")}
                    className="bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Add Food Log
                  </button>
                </div>
                <PaginatedTable
                  data={foodLogs}
                  columns={[
                    { key: "id", label: "ID" },
                    { key: "user_id", label: "User ID" },
                    { key: "food_name", label: "Food Name" },
                    { key: "portion_size", label: "Portion Size" },
                    { key: "calories", label: "Calories" },
                    {
                      key: "date_logged",
                      label: "Date Logged",
                      render: (item) => new Date(item.date_logged).toLocaleString(),
                    },
                    { key: "notes", label: "Notes" },
                    {
                      key: "actions",
                      label: "Actions",
                      render: (item) => (
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              handleUpdateFoodLog(item.id, {
                                user_id: item.user_id,
                                food_name: item.food_name,
                                portion_size: item.portion_size,
                                calories: item.calories,
                                date_logged: item.date_logged,
                                notes: item.notes,
                              })
                            }
                            className="text-indigo-600 hover:text-indigo-500 font-medium"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => handleDeleteFoodLog(item.id)}
                            className="text-red-600 hover:text-red-500 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            )}
            {activeTab === "exercises" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Manage Exercises</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                  <StatisticsCard
                    title="Total Users"
                    value={users.length}
                    icon={<FaUser />}
                  />
                  <StatisticsCard
                    title="Total Exercises"
                    value={exercises.length}
                    icon={<FaRunning />}
                  />
                  <StatisticsCard
                    title="Avg Exercises/User"
                    value={(exercises.length / (users.length || 1)).toFixed(1)}
                    icon={<FaRunning />}
                  />
                  <StatisticsCard
                    title="Total Calories Burned"
                    value={exerciseStats.totalCaloriesBurned || 0}
                    icon={<FaRunning />}
                  />
                  <StatisticsCard
                    title="Avg Duration/Day"
                    value={`${exerciseStats.avgDurationPerDay?.toFixed(1) || 0} min`}
                    icon={<FaRunning />}
                  />
                </div>
                <ChartComponent
                  type="line"
                  data={exerciseData}
                  options={chartOptions}
                  title="Exercise Stats Over Time"
                />
                <div className="mb-6">
                  <button
                    onClick={() => setModalOpen("addExercise")}
                    className="bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Add Exercise
                  </button>
                </div>
                <PaginatedTable
                  data={exercises}
                  columns={[
                    { key: "id", label: "ID" },
                    { key: "user_id", label: "User ID" },
                    { key: "activity", label: "Activity" },
                    { key: "duration", label: "Duration (min)" },
                    { key: "calories_burned", label: "Calories Burned" },
                    {
                      key: "date_logged",
                      label: "Date Logged",
                      render: (item) => new Date(item.date_logged).toLocaleString(),
                    },
                    {
                      key: "actions",
                      label: "Actions",
                      render: (item) => (
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              handleUpdateExercise(item.id, {
                                user_id: item.user_id,
                                activity: item.activity,
                                duration: item.duration,
                                calories_burned: item.calories_burned,
                                date_logged: item.date_logged,
                              })
                            }
                            className="text-indigo-600 hover:text-indigo-500 font-medium"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => handleDeleteExercise(item.id)}
                            className="text-red-600 hover:text-red-500 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {modalOpen === "createUser" && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">Create New User</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  handleCreateUser({
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
                  name="username"
                  placeholder="Username"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <input
                  type="text"
                  name="displayName"
                  placeholder="Display Name"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <select
                  name="role"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors"
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">Update User Profile</h3>
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
                  name="username"
                  placeholder="Username"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <input
                  type="text"
                  name="displayName"
                  placeholder="Display Name"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <select
                  name="role"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors"
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">Set Weekly Goals</h3>
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
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <input
                  type="number"
                  name="exerciseGoal"
                  placeholder="Exercise Calorie Goal"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Save Goals
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {modalOpen === "addMedication" && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">Add Medication</h3>
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
                    times: formData.get("times").split(",").map((time) => time.trim()),
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
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <input
                  type="text"
                  name="medication_name"
                  placeholder="Medication Name"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <input
                  type="text"
                  name="dosage"
                  placeholder="Dosage"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <select
                  name="frequency"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <input
                  type="text"
                  name="times"
                  placeholder="Times (comma-separated, e.g. 08:00,12:00)"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <input
                  type="date"
                  name="start_date"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <input
                  type="date"
                  name="end_date"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <textarea
                  name="notes"
                  placeholder="Notes"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Add Medication
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {modalOpen === "addReminder" && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">Add Reminder</h3>
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
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <input
                  type="number"
                  name="medication_id"
                  placeholder="Medication ID"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <input
                  type="number"
                  name="dose_index"
                  placeholder="Dose Index"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <input
                  type="time"
                  name="reminder_time"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <input
                  type="date"
                  name="date"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <select
                  name="type"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="single">Single</option>
                  <option value="daily">Daily</option>
                </select>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Add Reminder
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {modalOpen === "addFoodLog" && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">Add Food Log</h3>
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
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <input
                  type="text"
                  name="food_name"
                  placeholder="Food Name"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <input
                  type="text"
                  name="portion_size"
                  placeholder="Portion Size"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="number"
                  name="calories"
                  placeholder="Calories"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="date"
                  name="date_logged"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <textarea
                  name="notes"
                  placeholder="Notes"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Add Food Log
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {modalOpen === "addExercise" && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">Add Exercise</h3>
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
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <input
                  type="text"
                  name="activity"
                  placeholder="Activity"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <input
                  type="number"
                  name="duration"
                  placeholder="Duration (minutes)"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <input
                  type="number"
                  name="calories_burned"
                  placeholder="Calories Burned"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <input
                  type="date"
                  name="date_logged"
                  className="w-full p-3 border border-gray-200 bg-gray-50 text-gray-800 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Add Exercise
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;