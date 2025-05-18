import { useState, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { auth } from "../../firebase/config";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  getAllAdminUsers,
  searchAdminUsers,
  bulkDeleteAdminUsers,
  getAllAdminMedications,
  getAdminMedicationAdherence,
  getAllAdminReminders,
  updateAdminReminderStatus,
  getAllAdminFoodLogs,
  getAdminFoodStats,
  getAllAdminExercises,
  getAdminExerciseStats,
  getAdminSystemSettings,
  updateAdminSystemSettings,
  getAdminUserActivityTrends,
  exportAdminData,
  getAdminAuditLogs,
  registerUser,
  updateProfile,
  resetPassword,
  createMedication,
  updateMedication,
  deleteMedication,
  createReminder,
  updateReminder,
  deleteReminder,
  createFoodLog,
  updateFoodLog,
  deleteFoodLog,
  createExercise,
  updateExercise,
  deleteExercise,
} from "../../services/api";
import {
  FaUser,
  FaPills,
  FaBell,
  FaUtensils,
  FaRunning,
  FaSpinner,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaCog,
  FaFileExport,
  FaHistory,
  FaSearch,
  FaTrash,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import logo from "../../assets/logo.png";
import favicon from "../../assets/favicon.png";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Reusable DataTable Component
const DataTable = ({ columns, data, totalCount, onEdit, onDelete, onSelect, selectedRows, setSelectedRows, onSort, sortConfig, fetchPage }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Default to 10 for smaller fetches
  const pageSizeOptions = [10, 25, 50];

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    const sorted = [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data, sortConfig]);

  useEffect(() => {
    fetchPage(currentPage, itemsPerPage, sortConfig);
  }, [currentPage, itemsPerPage, sortConfig, fetchPage]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(sortedData.map((item) => item.id));
    } else {
      setSelectedRows([]);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Show</label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(parseInt(e.target.value));
              setCurrentPage(1); // Reset to first page
            }}
            className="border border-gray-300 rounded-md p-1"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span className="text-sm text-gray-600">entries</span>
        </div>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input
                type="checkbox"
                checked={selectedRows.length === sortedData.length && sortedData.length > 0}
                onChange={handleSelectAll}
              />
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={() => onSort(column.key)}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                {column.label}
                {sortConfig.key === column.key && (
                  <span>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>
                )}
              </th>
            ))}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((item) => (
            <tr key={item.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedRows.includes(item.id)}
                  onChange={() => onSelect(item.id)}
                />
              </td>
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {column.render ? column.render(item) : item[column.key] || "-"}
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => onEdit(item)}
                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between items-center p-4">
        <p className="text-sm text-gray-600">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} entries
        </p>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

// Sidebar Component
const Sidebar = ({ activeTab, setActiveTab, activeSubTab, setActiveSubTab, isMinimized, setIsMinimized, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    toast.success("You have been logged out");
    setIsMobileMenuOpen(false);
  };

  const tabs = [
    {
      id: "users",
      label: "Users",
      icon: <FaUser />,
      subTabs: [
        { id: "stats", label: "Statistics" },
        { id: "charts", label: "Charts" },
        { id: "all", label: "All Users" },
        { id: "bulk", label: "Bulk Operations" },
      ],
    },
    {
      id: "medications",
      label: "Medications",
      icon: <FaPills />,
      subTabs: [
        { id: "stats", label: "Statistics" },
        { id: "charts", label: "Charts" },
        { id: "all", label: "All Medications" },
        { id: "bulk", label: "Bulk Operations" },
      ],
    },
    {
      id: "reminders",
      label: "Reminders",
      icon: <FaBell />,
      subTabs: [
        { id: "stats", label: "Statistics" },
        { id: "all", label: "All Reminders" },
        { id: "bulk", label: "Bulk Operations" },
      ],
    },
    {
      id: "foodLogs",
      label: "Food Logs",
      icon: <FaUtensils />,
      subTabs: [
        { id: "stats", label: "Statistics" },
        { id: "charts", label: "Charts" },
        { id: "all", label: "All Food Logs" },
        { id: "bulk", label: "Bulk Operations" },
      ],
    },
    {
      id: "exercises",
      label: "Exercises",
      icon: <FaRunning />,
      subTabs: [
        { id: "stats", label: "Statistics" },
        { id: "charts", label: "Charts" },
        { id: "all", label: "All Exercises" },
        { id: "bulk", label: "Bulk Operations" },
      ],
    },
    {
      id: "settings",
      label: "Settings",
      icon: <FaCog />,
      subTabs: [
        { id: "system", label: "System Settings" },
      ],
    },
    {
      id: "audit",
      label: "Audit Logs",
      icon: <FaHistory />,
      subTabs: [
        { id: "logs", label: "View Logs" },
      ],
    },
    {
      id: "export",
      label: "Data Export",
      icon: <FaFileExport />,
      subTabs: [
        { id: "export", label: "Export Data" },
      ],
    },
  ];

  const sidebarVariants = {
    minimized: { width: "6rem" },
    expanded: { width: "16rem" },
  };

  const textVariants = {
    minimized: { opacity: 0 },
    expanded: { opacity: 1 },
  };

  const mobileMenuVariants = {
    hidden: { x: "100%" },
    visible: { x: 0 },
    exit: { x: "100%" },
  };

  return (
    <>
      <button
        className="fixed top-6 right-4 z-50 lg:hidden text-gray-700"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      <motion.div
        className="hidden lg:block fixed top-0 left-0 shadow-md h-screen bg-gray-100 text-black px-2 py-4 z-40"
        variants={sidebarVariants}
        animate={isMinimized ? "minimized" : "expanded"}
        onMouseEnter={() => setIsMinimized(false)}
        onMouseLeave={() => setIsMinimized(true)}
      >
        <div className="flex items-center justify-between mb-8 mt-16">
          {/* <motion.div>
            {isMinimized ? (
              <img src={favicon} alt="Favicon" className="w-8 h-8 mx-auto" />
            ) : (
              <img src={logo} alt="Logo" className="w-32 h-auto" />
            )}
          </motion.div> */}
        </div>
        <nav className="space-y-2">
          {tabs.map((tab) => (
            <div key={tab.id}>
              <motion.button
                onClick={() => {
                  setActiveTab(tab.id);
                  setActiveSubTab(tab.subTabs[0].id);
                }}
                className={`flex items-center w-full p-2 rounded-md hover:bg-gray-600 hover:text-white ${
                  activeTab === tab.id ? "bg-gray-500 text-white" : ""
                }`}
              >
                <span className="flex-shrink-0 w-6 h-6">{tab.icon}</span>
                <motion.span
                  variants={textVariants}
                  animate={isMinimized ? "minimized" : "expanded"}
                  className="text-sm font-medium flex-grow text-left"
                  style={{ visibility: isMinimized ? "hidden" : "visible" }}
                >
                  {tab.label}
                </motion.span>
              </motion.button>
              {activeTab === tab.id && !isMinimized && (
                <div className="ml-6 space-y-1 m-2">
                  {tab.subTabs.map((subTab) => (
                    <button
                      key={subTab.id}
                      onClick={() => setActiveSubTab(subTab.id)}
                      className={`flex items-center w-full p-2 rounded-md hover:bg-gray-500 hover:text-white text-sm ${
                        activeSubTab === subTab.id ? "bg-gray-400 text-white" : ""
                      }`}
                    >
                      {subTab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <motion.button
            onClick={handleLogout}
            className="flex items-center w-full p-2 rounded-md hover:bg-red-600 hover:text-white"
          >
            <span className="flex-shrink-0 w-6 h-6 mr-3"><FaSignOutAlt /></span>
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

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black z-40 lg:hidden"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 0.5 }, exit: { opacity: 0 } }}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.nav
              className="fixed top-0 right-0 w-full h-screen bg-gray-100 z-50 lg:hidden"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <img src={logo} alt="HealthTrack" className="h-10" />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-gray-700"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>
                <div className="flex-1 flex flex-col justify-between p-4">
                  <div className="space-y-4">
                    {tabs.map((tab) => (
                      <div key={tab.id}>
                        <button
                          onClick={() => {
                            setActiveTab(tab.id);
                            setActiveSubTab(tab.subTabs[0].id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`block py-3 px-3 text-gray-700 text-lg font-medium hover:bg-gray-100 hover:text-blue-600 rounded-lg w-full text-left ${
                            activeTab === tab.id ? "bg-gray-200" : ""
                          }`}
                        >
                          {tab.label}
                        </button>
                        {activeTab === tab.id && (
                          <div className="ml-4 space-y-2">
                            {tab.subTabs.map((subTab) => (
                              <button
                                key={subTab.id}
                                onClick={() => {
                                  setActiveSubTab(subTab.id);
                                  setIsMobileMenuOpen(false);
                                }}
                                className={`block py-2 px-3 text-gray-600 text-sm hover:bg-gray-100 rounded-lg w-full text-left ${
                                  activeSubTab === subTab.id ? "bg-gray-200" : ""
                                }`}
                              >
                                {subTab.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left py-3 px-3 text-gray-700 text-lg font-medium hover:bg-red-50 hover:text-red-600 border-t border-gray-200 rounded-lg"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// Main AdminDashboard Component
const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [activeSubTab, setActiveSubTab] = useState("stats");
  const [isMinimized, setIsMinimized] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalMedications, setTotalMedications] = useState(0);
  const [totalReminders, setTotalReminders] = useState(0);
  const [totalFoodLogs, setTotalFoodLogs] = useState(0);
  const [totalExercises, setTotalExercises] = useState(0);
  const [lastDoc, setLastDoc] = useState(null);
  const [medications, setMedications] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [foodLogs, setFoodLogs] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [settings, setSettings] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(null);
  const [modalData, setModalData] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [chartData, setChartData] = useState({});

  const getUserToken = async () => await auth.currentUser.getIdToken(true);
  const handleSessionExpired = () => {
    logout();
    navigate("/login");
    toast.error("Session expired. Please log in again.");
  };

  // Fetch Functions
  const fetchUsers = async (page = 1, limit = 10, sortConfig = { key: "", direction: "asc" }) => {
    if (!user) return;
    setLoading(true);
    setError(null); // Clear previous errors
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
  
  const fetchMedications = async (page = 1, limit = 10, sortConfig = { key: "", direction: "asc" }) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getUserToken();
      const response = await getAllAdminMedications(token, limit, page, sortConfig);
      setMedications(response.medications || []);
      setTotalMedications(response.total || 0); // New state for total count
    } catch (err) {
      setError("Failed to fetch medications: " + err.message);
      toast.error("Failed to fetch medications");
    } finally {
      setLoading(false);
    }
  };

  const fetchReminders = async (page = 1, limit = 10, sortConfig = { key: "", direction: "asc" }) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getUserToken();
      const reminders = await getAllAdminReminders(token, limit, page, sortConfig);
      setReminders(reminders);
      setTotalReminders(reminders.total || 0);
    } catch (err) {
      setError("Failed to fetch reminders: " + err.message);
      toast.error("Failed to fetch reminders");
    } finally {
      setLoading(false);
    }
  };

  const fetchFoodLogs = async (page = 1, limit = 10, sortConfig = { key: "", direction: "asc" }) => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getUserToken();
      const logs = await getAllAdminFoodLogs(token, limit, page, sortConfig);
      setFoodLogs(logs);
      setTotalMedications(response.total || 0);
    } catch (err) {
      setError("Failed to fetch food logs: " + err.message);
      toast.error("Failed to fetch food logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchExercises = async (page = 1, limit = 10, sortConfig = { key: "", direction: "asc" }) => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getUserToken();
      const exercises = await getAllAdminExercises(token, limit, page, sortConfig);
      setExercises(exercises);
    } catch (err) {
      setError("Failed to fetch exercises: " + err.message);
      toast.error("Failed to fetch exercises");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getUserToken();
      const settings = await getAdminSystemSettings(token);
      setSettings(settings);
    } catch (err) {
      setError("Failed to fetch settings: " + err.message);
      toast.error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getUserToken();
      const logs = await getAdminAuditLogs(token);
      setAuditLogs(logs);
    } catch (err) {
      setError("Failed to fetch audit logs: " + err.message);
      toast.error("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    if (!user) return;
    try {
      const token = await getUserToken();
      const [activityTrends, adherence, foodStats, exerciseStats] = await Promise.all([
        getAdminUserActivityTrends(token),
        getAdminMedicationAdherence(token),
        getAdminFoodStats(token),
        getAdminExerciseStats(token),
      ]);

      setChartData({
        activityTrends: {
          labels: activityTrends.map((t) => t.date),
          datasets: [
            {
              label: "User Actions",
              data: activityTrends.map((t) => t.count),
              borderColor: "rgb(75, 192, 192)",
              tension: 0.1,
            },
          ],
        },
        adherence: {
          labels: adherence.map((a) => a.user_id),
          datasets: [
            {
              label: "Adherence Rate (%)",
              data: adherence.map((a) => a.adherence_rate),
              backgroundColor: "rgba(54, 162, 235, 0.5)",
            },
          ],
        },
        foodStats: {
          labels: ["Carbs", "Protein", "Fats"],
          datasets: [
            {
              data: [
                foodStats.total_carbs,
                foodStats.total_protein,
                foodStats.total_fats,
              ],
              backgroundColor: [
                "rgba(255, 99, 132, 0.5)",
                "rgba(54, 162, 235, 0.5)",
                "rgba(255, 206, 86, 0.5)",
              ],
            },
          ],
        },
        exerciseStats: {
          labels: exerciseStats.map((e) => e.activity),
          datasets: [
            {
              data: exerciseStats.map((e) => e.count),
              backgroundColor: [
                "rgba(255, 99, 132, 0.5)",
                "rgba(54, 162, 235, 0.5)",
                "rgba(255, 206, 86, 0.5)",
                "rgba(75, 192, 192, 0.5)",
                "rgba(153, 102, 255, 0.5)",
              ],
            },
          ],
        },
      });
    } catch (err) {
      toast.error("Failed to fetch chart data: " + err.message);
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
      toast.error("Failed to create user: " + err.message);
    }
  };

  const handleUpdateUser = async (id, userData) => {
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
      setModalOpen(null);
    } catch (err) {
      toast.error("Failed to update user: " + err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!user) return handleSessionExpired();
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const token = await getUserToken();
      await bulkDeleteAdminUsers([id], token);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (err) {
      toast.error("Failed to delete user: " + err.message);
    }
  };

  // Updated handleBulkDeleteUsers with Batch Processing
  const handleBulkDeleteUsers = async () => {
    if (!user) return handleSessionExpired();
    if (!selectedRows.length) return toast.error("No users selected");
    if (!window.confirm("Are you sure you want to delete the selected users?")) return;
    
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < selectedRows.length; i += batchSize) {
      batches.push(selectedRows.slice(i, i + batchSize));
    }

    setLoading(true);
    try {
      const token = await getUserToken();
      for (const batch of batches) {
        await bulkDeleteAdminUsers(batch, token);
        toast.success(`Deleted ${batch.length} users`);
      }
      toast.success("All selected users deleted successfully");
      setSelectedRows([]);
      fetchUsers(1, 50, sortConfig);
    } catch (err) {
      if (err.message.includes("WRITE_TOO_BIG")) {
        toast.error("Batch too large. Try selecting fewer users.");
      } else {
        toast.error("Failed to delete users: " + err.message);
      }
    } finally {
      setLoading(false);
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
      toast.error("Failed to create medication: " + err.message);
    }
  };

  const handleUpdateMedication = async (id, medicationData) => {
    if (!user) return handleSessionExpired();
    try {
      const token = await getUserToken();
      await updateMedication(id, medicationData, token);
      toast.success("Medication updated successfully");
      fetchMedications();
      setModalOpen(null);
    } catch (err) {
      toast.error("Failed to update medication: " + err.message);
    }
  };

  const handleDeleteMedication = async (id) => {
    if (!user) return handleSessionExpired();
    if (!window.confirm("Are you sure you want to delete this medication?")) return;
    try {
      const token = await getUserToken();
      await deleteMedication(id, token);
      toast.success("Medication deleted successfully");
      fetchMedications();
    } catch (err) {
      toast.error("Failed to delete medication: " + err.message);
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
      toast.error("Failed to create reminder: " + err.message);
    }
  };

  const handleUpdateReminderStatus = async (ids, status) => {
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

  const handleDeleteReminder = async (id) => {
    if (!user) return handleSessionExpired();
    if (!window.confirm("Are you sure you want to delete this reminder?")) return;
    try {
      const token = await getUserToken();
      await deleteReminder(id, token);
      toast.success("Reminder deleted successfully");
      fetchReminders();
    } catch (err) {
      toast.error("Failed to delete reminder: " + err.message);
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
      toast.error("Failed to create food log: " + err.message);
    }
  };

  const handleUpdateFoodLog = async (id, foodData) => {
    if (!user) return handleSessionExpired();
    try {
      const token = await getUserToken();
      await updateFoodLog(id, foodData, token);
      toast.success("Food log updated successfully");
      fetchFoodLogs();
      setModalOpen(null);
    } catch (err) {
      toast.error("Failed to update food log: " + err.message);
    }
  };

  const handleDeleteFoodLog = async (id) => {
    if (!user) return handleSessionExpired();
    if (!window.confirm("Are you sure you want to delete this food log?")) return;
    try {
      const token = await getUserToken();
      await deleteFoodLog(id, token);
      toast.success("Food log deleted successfully");
      fetchFoodLogs();
    } catch (err) {
      toast.error("Failed to delete food log: " + err.message);
    }
  };

  const handleBulkDeleteFoodLogs = async () => {
    if (!user) return handleSessionExpired();
    if (!selectedRows.length) return toast.error("No food logs selected");
    if (!window.confirm("Are you sure you want to delete the selected food logs?")) return;
    try {
      const token = await getUserToken();
      await Promise.all(selectedRows.map((id) => deleteFoodLog(id, token)));
      toast.success("Food logs deleted successfully");
      fetchFoodLogs();
      setSelectedRows([]);
    } catch (err) {
      toast.error("Failed to delete food logs: " + err.message);
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
      toast.error("Failed to create exercise: " + err.message);
    }
  };

  const handleUpdateExercise = async (id, exerciseData) => {
    if (!user) return handleSessionExpired();
    try {
      const token = await getUserToken();
      await updateExercise(id, exerciseData, token);
      toast.success("Exercise updated successfully");
      fetchExercises();
      setModalOpen(null);
    } catch (err) {
      toast.error("Failed to update exercise: " + err.message);
    }
  };

  const handleDeleteExercise = async (id) => {
    if (!user) return handleSessionExpired();
    if (!window.confirm("Are you sure you want to delete this exercise?")) return;
    try {
      const token = await getUserToken();
      await deleteExercise(id, token);
      toast.success("Exercise deleted successfully");
      fetchExercises();
    } catch (err) {
      toast.error("Failed to delete exercise: " + err.message);
    }
  };

  const handleBulkDeleteExercises = async () => {
    if (!user) return handleSessionExpired();
    if (!selectedRows.length) return toast.error("No exercises selected");
    if (!window.confirm("Are you sure you want to delete the selected exercises?")) return;
    try {
      const token = await getUserToken();
      await Promise.all(selectedRows.map((id) => deleteExercise(id, token)));
      toast.success("Exercises deleted successfully");
      fetchExercises();
      setSelectedRows([]);
    } catch (err) {
      toast.error("Failed to delete exercises: " + err.message);
    }
  };

  const handleUpdateSetting = async (settingKey, settingValue) => {
    if (!user) return handleSessionExpired();
    try {
      const token = await getUserToken();
      await updateAdminSystemSettings(settingKey, settingValue, token);
      toast.success("Setting updated successfully");
      fetchSettings();
      setModalOpen(null);
    } catch (err) {
      toast.error("Failed to update setting: " + err.message);
    }
  };

  const handleExportData = async (type) => {
    if (!user) return handleSessionExpired();
    try {
      const token = await getUserToken();
      const data = await exportAdminData(type, token);
      const blob = new Blob([data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_export.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch (err) {
      toast.error("Failed to export data: " + err.message);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleRowSelect = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    switch (activeTab) {
      case "users":
        fetchUsers();
        if (activeSubTab === "charts") fetchChartData();
        break;
      case "medications":
        fetchMedications();
        if (activeSubTab === "charts") fetchChartData();
        break;
      case "reminders":
        fetchReminders();
        break;
      case "foodLogs":
        fetchFoodLogs();
        if (activeSubTab === "charts") fetchChartData();
        break;
      case "exercises":
        fetchExercises();
        if (activeSubTab === "charts") fetchChartData();
        break;
      case "settings":
        fetchSettings();
        break;
      case "audit":
        fetchAuditLogs();
        break;
      default:
        break;
    }
  }, [activeTab, activeSubTab, user, navigate, searchQuery]);

  const modalVariants = { hidden: { opacity: 0, y: -50 }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -50 } };

  // Table Columns
  const userColumns = [
    { key: "email", label: "Email" },
    { key: "name", label: "Name" },
    { key: "role", label: "Role" },
    {
      key: "created_at",
      label: "Created At",
      render: (item) => new Date(item.created_at).toLocaleDateString(),
    },
  ];

  const medicationColumns = [
    { key: "medication_name", label: "Medication Name" },
    { key: "user_id", label: "User ID" },
    { key: "dosage", label: "Dosage" },
    { key: "frequency", label: "Frequency" },
    { key: "times_per_day", label: "Times/Day" },
    {
      key: "start_date",
      label: "Start Date",
      render: (item) => item.start_date?.split("T")[0] || "-",
    },
  ];

  const reminderColumns = [
    { key: "user_id", label: "User ID" },
    { key: "medication_id", label: "Medication ID" },
    { key: "dose_index", label: "Dose Index" },
    { key: "reminder_time", label: "Time" },
    {
      key: "date",
      label: "Date",
      render: (item) => item.date?.split("T")[0] || "-",
    },
    { key: "status", label: "Status" },
  ];

  const foodLogColumns = [
    { key: "user_id", label: "User ID" },
    { key: "food_name", label: "Food Name" },
    { key: "calories", label: "Calories" },
    { key: "carbs", label: "Carbs (g)" },
    { key: "protein", label: "Protein (g)" },
    { key: "fats", label: "Fats (g)" },
    {
      key: "date_logged",
      label: "Date",
      render: (item) => item.date_logged?.split("T")[0] || "-",
    },
    { key: "meal_type", label: "Meal Type" },
  ];

  const exerciseColumns = [
    { key: "user_id", label: "User ID" },
    { key: "activity", label: "Activity" },
    { key: "duration", label: "Duration (min)" },
    { key: "calories_burned", label: "Calories Burned" },
    {
      key: "date_logged",
      label: "Date",
      render: (item) => item.date_logged?.split("T")[0] || "-",
    },
  ];

  const settingColumns = [
    { key: "setting_key", label: "Setting Key" },
    { key: "value", label: "Value" },
  ];

  const auditLogColumns = [
    { key: "user_id", label: "User ID" },
    { key: "action", label: "Action" },
    {
      key: "timestamp",
      label: "Timestamp",
      render: (item) => new Date(item.timestamp).toLocaleString(),
    },
    { key: "details", label: "Details" },
  ];

  return (
    <div className="min-h-screen text-gray-800">
      <nav className="fixed top-0 left-0 right-0 bg-gray-100 text-black border-b shadow-sm border-gray-200 px-6 py-4 flex justify-start items-center z-50">
        <img src={logo} alt="HealthTrack" className="h-10" />
      </nav>

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        isMinimized={isMinimized}
        setIsMinimized={setIsMinimized}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

<main className={`p-4 sm:p-6 lg:pt-8 sm:pt-8 transition-all duration-300 lg:mt-4 ${isMinimized ? "lg:ml-16" : "lg:ml-48"} max-w-7xl mx-auto`}>
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
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Admin Dashboard</h2>

            {/* Users Section */}
            {activeTab === "users" && (
              <>
                {activeSubTab === "stats" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold">Total Users</h3>
                      <p className="text-2xl font-bold text-indigo-600">{totalUsers}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold">Active Users</h3>
                      <p className="text-2xl font-bold text-indigo-600">
                        {users.filter((u) => u.status === "active").length}
                      </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold">Admins</h3>
                      <p className="text-2xl font-bold text-indigo-600">
                        {users.filter((u) => u.role === "admin").length}
                      </p>
                    </div>
                  </div>
                )}
                {activeSubTab === "charts" && chartData.activityTrends && (
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">User Activity Trends</h3>
                    <Line
                      data={chartData.activityTrends}
                      options={{
                        responsive: true,
                        plugins: { legend: { position: "top" }, title: { display: true, text: "User Activity Over Time" } },
                      }}
                    />
                  </div>
                )}
                {activeSubTab === "all" && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <button
                          onClick={() => setModalOpen("addUser")}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                        >
                          Add User
                        </button>
                      </div>
                      {selectedRows.length > 0 && (
                        <button
                          onClick={handleBulkDeleteUsers}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
                        >
                          <FaTrash className="mr-2" /> Delete Selected
                        </button>
                      )}
                    </div>
                    <DataTable
                      columns={userColumns}
                      data={users}
                      totalCount={totalUsers}
                      onEdit={(item) => {
                        setModalData(item);
                        setModalOpen("updateUser");
                      }}
                      onDelete={handleDeleteUser}
                      onSelect={handleRowSelect}
                      selectedRows={selectedRows}
                      setSelectedRows={setSelectedRows}
                      onSort={handleSort}
                      sortConfig={sortConfig}
                      fetchPage={fetchUsers}
                    />
                  </div>
                )}
                {activeSubTab === "bulk" && (
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Bulk User Operations</h3>
                    <button
                      onClick={handleBulkDeleteUsers}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                      disabled={!selectedRows.length}
                    >
                      Delete Selected Users
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Medications Section */}
            {activeTab === "medications" && (
              <>
                {activeSubTab === "stats" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold">Total Medications</h3>
                      <p className="text-2xl font-bold text-indigo-600">{medications.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold">Unique Medications</h3>
                      <p className="text-2xl font-bold text-indigo-600">
                        {new Set(medications.map((m) => m.medication_name)).size}
                      </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold">Active Prescriptions</h3>
                      <p className="text-2xl font-bold text-indigo-600">
                        {medications.filter((m) => !m.end_date || new Date(m.end_date) > new Date()).length}
                      </p>
                    </div>
                  </div>
                )}
                {activeSubTab === "charts" && chartData.adherence && (
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Medication Adherence</h3>
                    <Bar
                      data={chartData.adherence}
                      options={{
                        responsive: true,
                        plugins: { legend: { position: "top" }, title: { display: true, text: "Adherence Rate by User" } },
                      }}
                    />
                  </div>
                )}
                {activeSubTab === "all" && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <button
                        onClick={() => setModalOpen("addMedication")}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                      >
                        Add Medication
                      </button>
                    </div>
                    <DataTable
                      columns={medicationColumns}
                      data={medications}
                      onEdit={(item) => {
                        setModalData(item);
                        setModalOpen("updateMedication");
                      }}
                      onDelete={handleDeleteMedication}
                      onSelect={handleRowSelect}
                      selectedRows={selectedRows}
                      setSelectedRows={setSelectedRows}
                      onSort={handleSort}
                      sortConfig={sortConfig}
                    />
                  </div>
                )}
                {activeSubTab === "bulk" && (
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Bulk Medication Operations</h3>
                    <p className="text-gray-600">Select medications to update or delete in bulk.</p>
                  </div>
                )}
              </>
            )}

            {/* Reminders Section */}
            {activeTab === "reminders" && (
              <>
                {activeSubTab === "stats" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold">Total Reminders</h3>
                      <p className="text-2xl font-bold text-indigo-600">{reminders.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold">Pending Reminders</h3>
                      <p className="text-2xl font-bold text-indigo-600">
                        {reminders.filter((r) => r.status === "pending").length}
                      </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold">Sent Reminders</h3>
                      <p className="text-2xl font-bold text-indigo-600">
                        {reminders.filter((r) => r.status === "sent").length}
                      </p>
                    </div>
                  </div>
                )}
                {activeSubTab === "all" && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <button
                        onClick={() => setModalOpen("addReminder")}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                      >
                        Add Reminder
                      </button>
                      {selectedRows.length > 0 && (
                        <div className="flex space-x-4">
                          <button
                            onClick={() => handleUpdateReminderStatus(selectedRows, "sent")}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                          >
                            Mark as Sent
                          </button>
                          <button
                            onClick={() => handleUpdateReminderStatus(selectedRows, "pending")}
                            className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
                          >
                            Mark as Pending
                          </button>
                        </div>
                      )}
                    </div>
                    <DataTable
                      columns={reminderColumns}
                      data={reminders}
                      onEdit={(item) => {
                        setModalData(item);
                        setModalOpen("updateReminder");
                      }}
                      onDelete={handleDeleteReminder}
                      onSelect={handleRowSelect}
                      selectedRows={selectedRows}
                      setSelectedRows={setSelectedRows}
                      onSort={handleSort}
                      sortConfig={sortConfig}
                    />
                  </div>
                )}
                {activeSubTab === "bulk" && (
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Bulk Reminder Operations</h3>
                    <button
                      onClick={() => handleUpdateReminderStatus(selectedRows, "sent")}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 mr-4"
                      disabled={!selectedRows.length}
                    >
                      Mark Selected as Sent
                    </button>
                    <button
                      onClick={() => handleUpdateReminderStatus(selectedRows, "pending")}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
                      disabled={!selectedRows.length}
                    >
                      Mark Selected as Pending
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Food Logs Section */}
            {activeTab === "foodLogs" && (
              <>
                {activeSubTab === "stats" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold">Total Food Logs</h3>
                      <p className="text-2xl font-bold text-indigo-600">{foodLogs.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold">Total Calories</h3>
                      <p className="text-2xl font-bold text-indigo-600">
                        {foodLogs.reduce((sum, log) => sum + log.calories, 0).toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold">Unique Meals</h3>
                      <p className="text-2xl font-bold text-indigo-600">
                        {new Set(foodLogs.map((log) => log.food_name)).size}
                      </p>
                    </div>
                  </div>
                )}
                {activeSubTab === "charts" && chartData.foodStats && (
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Nutritional Breakdown</h3>
                    <Pie
                      data={chartData.foodStats}
                      options={{
                        responsive: true,
                        plugins: { legend: { position: "top" }, title: { display: true, text: "Macronutrient Distribution" } },
                      }}
                    />
                  </div>
                )}
                {activeSubTab === "all" && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <button
                        onClick={() => setModalOpen("addFoodLog")}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                      >
                        Add Food Log
                      </button>
                      {selectedRows.length > 0 && (
                        <button
                          onClick={handleBulkDeleteFoodLogs}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
                        >
                          <FaTrash className="mr-2" /> Delete Selected
                        </button>
                      )}
                    </div>
                    <DataTable
                      columns={foodLogColumns}
                      data={foodLogs}
                      onEdit={(item) => {
                        setModalData(item);
                        setModalOpen("updateFoodLog");
                      }}
                      onDelete={handleDeleteFoodLog}
                      onSelect={handleRowSelect}
                      selectedRows={selectedRows}
                      setSelectedRows={setSelectedRows}
                      onSort={handleSort}
                      sortConfig={sortConfig}
                    />
                  </div>
                )}
                {activeSubTab === "bulk" && (
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Bulk Food Log Operations</h3>
                    <button
                      onClick={handleBulkDeleteFoodLogs}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                      disabled={!selectedRows.length}
                    >
                      Delete Selected Food Logs
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Exercises Section */}
            {activeTab === "exercises" && (
              <>
                {activeSubTab === "stats" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold">Total Exercises</h3>
                      <p className="text-2xl font-bold text-indigo-600">{exercises.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold">Total Calories Burned</h3>
                      <p className="text-2xl font-bold text-indigo-600">
                        {exercises.reduce((sum, ex) => sum + ex.calories_burned, 0)}
                      </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold">Unique Activities</h3>
                      <p className="text-2xl font-bold text-indigo-600">
                        {new Set(exercises.map((ex) => ex.activity)).size}
                      </p>
                    </div>
                  </div>
                )}
                {activeSubTab === "charts" && chartData.exerciseStats && (
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Exercise Type Distribution</h3>
                    <Pie
                      data={chartData.exerciseStats}
                      options={{
                        responsive: true,
                        plugins: { legend: { position: "top" }, title: { display: true, text: "Exercise Types" } },
                      }}
                    />
                  </div>
                )}
                {activeSubTab === "all" && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <button
                        onClick={() => setModalOpen("addExercise")}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                      >
                        Add Exercise
                      </button>
                      {selectedRows.length > 0 && (
                        <button
                          onClick={handleBulkDeleteExercises}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
                        >
                          <FaTrash className="mr-2" /> Delete Selected
                        </button>
                      )}
                    </div>
                    <DataTable
                      columns={exerciseColumns}
                      data={exercises}
                      onEdit={(item) => {
                        setModalData(item);
                        setModalOpen("updateExercise");
                      }}
                      onDelete={handleDeleteExercise}
                      onSelect={handleRowSelect}
                      selectedRows={selectedRows}
                      setSelectedRows={setSelectedRows}
                      onSort={handleSort}
                      sortConfig={sortConfig}
                    />
                  </div>
                )}
                {activeSubTab === "bulk" && (
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Bulk Exercise Operations</h3>
                    <button
                      onClick={handleBulkDeleteExercises}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                      disabled={!selectedRows.length}
                    >
                      Delete Selected Exercises
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Settings Section */}
            {activeTab === "settings" && activeSubTab === "system" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">System Settings</h3>
                </div>
                <DataTable
                  columns={settingColumns}
                  data={settings}
                  onEdit={(item) => {
                    setModalData(item);
                    setModalOpen("updateSetting");
                  }}
                  onDelete={() => {}}
                  onSelect={() => {}}
                  selectedRows={[]}
                  setSelectedRows={() => {}}
                  onSort={handleSort}
                  sortConfig={sortConfig}
                />
              </div>
            )}

            {/* Audit Logs Section */}
            {activeTab === "audit" && activeSubTab === "logs" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Audit Logs</h3>
                </div>
                <DataTable
                  columns={auditLogColumns}
                  data={auditLogs}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onSelect={() => {}}
                  selectedRows={[]}
                  setSelectedRows={() => {}}
                  onSort={handleSort}
                  sortConfig={sortConfig}
                />
              </div>
            )}

            {/* Data Export Section */}
            {activeTab === "export" && activeSubTab === "export" && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Data Export</h3>
                <div className="space-y-4">
                  <button
                    onClick={() => handleExportData("users")}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Export Users
                  </button>
                  <button
                    onClick={() => handleExportData("medications")}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Export Medications
                  </button>
                  <button
                    onClick={() => handleExportData("foodLogs")}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Export Food Logs
                  </button>
                  <button
                    onClick={() => handleExportData("exercises")}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Export Exercises
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {modalOpen === "addUser" && (
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
              <h3 className="text-lg font-bold text-gray-800 mb-4">Add User</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  handleCreateUser({
                    email: formData.get("email"),
                    name: formData.get("name"),
                    password: formData.get("password"),
                    role: formData.get("role"),
                  });
                }}
                className="space-y-4"
              >
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <select
                  name="role"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
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
                    className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
                  >
                    Add User
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
              <h3 className="text-lg font-bold text-gray-800 mb-4">Update User</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  handleUpdateUser(modalData.id, {
                    email: formData.get("email"),
                    name: formData.get("name"),
                    role: formData.get("role"),
                    resetPassword: formData.get("resetPassword") === "on",
                  });
                }}
                className="space-y-4"
              >
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  defaultValue={modalData.email}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  defaultValue={modalData.name}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <select
                  name="role"
                  defaultValue={modalData.role}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="resetPassword"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Send Password Reset Email</span>
                </label>
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
                    className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
                  >
                    Update User
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
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="text"
                  name="medication_name"
                  placeholder="Medication Name"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="text"
                  name="dosage"
                  placeholder="Dosage (e.g., 500mg)"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="text"
                  name="frequency"
                  placeholder="Frequency (e.g., Daily)"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="number"
                  name="times_per_day"
                  placeholder="Times Per Day"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="text"
                  name="times"
                  placeholder="Times (e.g., 08:00, 20:00)"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="date"
                  name="start_date"
                  placeholder="Start Date"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="date"
                  name="end_date"
                  placeholder="End Date"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
                <textarea
                  name="notes"
                  placeholder="Notes"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
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
                    className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
                  >
                    Add Medication
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {modalOpen === "updateMedication" && (
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
              <h3 className="text-lg font-bold text-gray-800 mb-4">Update Medication</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  handleUpdateMedication(modalData.id, {
                    user_id: parseInt(formData.get("user_id")),
                    medication_name: formData.get("medication_name"),
                    dosage: formData.get("dosage"),
                    frequency: formData.get("frequency"),
                    times_per_day: parseInt(formData.get("times_per_day")),
                    times: formData.get("times").split(",").map((time) => time.trim()),
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
                  defaultValue={modalData.user_id}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="text"
                  name="medication_name"
                  placeholder="Medication Name"
                  defaultValue={modalData.medication_name}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="text"
                  name="dosage"
                  placeholder="Dosage (e.g., 500mg)"
                  defaultValue={modalData.dosage}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="text"
                  name="frequency"
                  placeholder="Frequency (e.g., Daily)"
                  defaultValue={modalData.frequency}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="number"
                  name="times_per_day"
                  placeholder="Times Per Day"
                  defaultValue={modalData.times_per_day}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="text"
                  name="times"
                  placeholder="Times (e.g., 08:00, 20:00)"
                  defaultValue={modalData.times?.join(", ")}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="date"
                  name="start_date"
                  placeholder="Start Date"
                  defaultValue={modalData.start_date?.split("T")[0]}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="date"
                  name="end_date"
                  placeholder="End Date"
                  defaultValue={modalData.end_date?.split("T")[0]}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
                <textarea
                  name="notes"
                  placeholder="Notes"
                  defaultValue={modalData.notes}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
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
                    className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
                  >
                    Update Medication
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
                    status: formData.get("status"),
                  });
                }}
                className="space-y-4"
              >
                <input
                  type="number"
                  name="user_id"
                  placeholder="User ID"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="number"
                  name="medication_id"
                  placeholder="Medication ID"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="number"
                  name="dose_index"
                  placeholder="Dose Index"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="time"
                  name="reminder_time"
                  placeholder="Reminder Time"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="date"
                  name="date"
                  placeholder="Date"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <select
                  name="status"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
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
                    className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
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
                    calories: parseFloat(formData.get("calories")),
                    carbs: parseFloat(formData.get("carbs")),
                    protein: parseFloat(formData.get("protein")),
                    fats: parseFloat(formData.get("fats")),
                    date_logged: formData.get("date_logged"),
                    meal_type: formData.get("meal_type"),
                  });
                }}
                className="space-y-4"
              >
                <input
                  type="number"
                  name="user_id"
                  placeholder="User ID"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="text"
                  name="food_name"
                  placeholder="Food Name"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="number"
                  name="calories"
                  placeholder="Calories"
                  step="0.1"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="number"
                  name="carbs"
                  placeholder="Carbs (g)"
                  step="0.1"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="number"
                  name="protein"
                  placeholder="Protein (g)"
                  step="0.1"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="number"
                  name="fats"
                  placeholder="Fats (g)"
                  step="0.1"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="date"
                  name="date_logged"
                  placeholder="Date Logged"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <select
                  name="meal_type"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
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
                    className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
                  >
                    Add Food Log
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {modalOpen === "updateFoodLog" && (
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
              <h3 className="text-lg font-bold text-gray-800 mb-4">Update Food Log</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  handleUpdateFoodLog(modalData.id, {
                    user_id: parseInt(formData.get("user_id")),
                    food_name: formData.get("food_name"),
                    calories: parseFloat(formData.get("calories")),
                    carbs: parseFloat(formData.get("carbs")),
                    protein: parseFloat(formData.get("protein")),
                    fats: parseFloat(formData.get("fats")),
                    date_logged: formData.get("date_logged"),
                    meal_type: formData.get("meal_type"),
                  });
                }}
                className="space-y-4"
              >
                <input
                  type="number"
                  name="user_id"
                  placeholder="User ID"
                  defaultValue={modalData.user_id}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="text"
                  name="food_name"
                  placeholder="Food Name"
                  defaultValue={modalData.food_name}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="number"
                  name="calories"
                  placeholder="Calories"
                  step="0.1"
                  defaultValue={modalData.calories}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="number"
                  name="carbs"
                  placeholder="Carbs (g)"
                  step="0.1"
                  defaultValue={modalData.carbs}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="number"
                  name="protein"
                  placeholder="Protein (g)"
                  step="0.1"
                  defaultValue={modalData.protein}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="number"
                  name="fats"
                  placeholder="Fats (g)"
                  step="0.1"
                  defaultValue={modalData.fats}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="date"
                  name="date_logged"
                  placeholder="Date Logged"
                  defaultValue={modalData.date_logged?.split("T")[0]}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <select
                  name="meal_type"
                  defaultValue={modalData.meal_type}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
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
                    className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
                  >
                    Update Food Log
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
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="text"
                  name="activity"
                  placeholder="Activity (e.g., Running)"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="number"
                  name="duration"
                  placeholder="Duration (minutes)"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="number"
                  name="calories_burned"
                  placeholder="Calories Burned"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="date"
                  name="date_logged"
                  placeholder="Date Logged"
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
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
                    className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
                  >
                    Add Exercise
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {modalOpen === "updateExercise" && (
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
              <h3 className="text-lg font-bold text-gray-800 mb-4">Update Exercise</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  handleUpdateExercise(modalData.id, {
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
                  defaultValue={modalData.user_id}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="text"
                  name="activity"
                  placeholder="Activity (e.g., Running)"
                  defaultValue={modalData.activity}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="number"
                  name="duration"
                  placeholder="Duration (minutes)"
                  defaultValue={modalData.duration}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="number"
                  name="calories_burned"
                  placeholder="Calories Burned"
                  defaultValue={modalData.calories_burned}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="date"
                  name="date_logged"
                  placeholder="Date Logged"
                  defaultValue={modalData.date_logged?.split("T")[0]}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
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
                    className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
                  >
                    Update Exercise
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {modalOpen === "updateSetting" && (
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
              <h3 className="text-lg font-bold text-gray-800 mb-4">Update Setting</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  handleUpdateSetting(
                    formData.get("setting_key"),
                    formData.get("value")
                  );
                }}
                className="space-y-4"
              >
                <input
                  type="text"
                  name="setting_key"
                  placeholder="Setting Key"
                  defaultValue={modalData.setting_key}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
                  readOnly
                />
                <input
                  type="text"
                  name="value"
                  placeholder="Value"
                  defaultValue={modalData.value}
                  className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
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
                    className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
                  >
                    Update Setting
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