import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { auth } from "../../firebase/config";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaPills,
  FaBell,
  FaUtensils,
  FaRunning,
  FaSpinner,
  FaSearch,
  FaTrash,
} from "react-icons/fa";
import { AnimatePresence } from "framer-motion";
import DataTable from "./DataTable";
import Sidebar from "./Sidebar";
import logo from "../../assets/logo.png";
import ActivityChart from "./ActivityChart";
import moment from "moment";

// Import Modals
import AddUserModal from "./modals/addUser.js";
import UpdateUserModal from "./modals/updateUser.js";
import AddMedicationModal from "./modals/addMedication.js";
import UpdateMedicationModal from "./modals/updateMedication.js";
import AddReminderModal from "./modals/addReminder.js";
import AddFoodLogModal from "./modals/addFoodLog.js";
import UpdateFoodLogModal from "./modals/updateFoodLog.js";
import AddExerciseModal from "./modals/addExercise.js";
import UpdateExerciseModal from "./modals/updateExercise.js";
import UpdateSettingModal from "./modals/updateSettings.js";

// Import Service Functions
import {
  fetchUsers,
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser,
  handleDeleteSelectedUsers,
  getUserToken,
  handleSessionExpired,
} from "./services/userServices";
import {
  fetchMedications,
  handleCreateMedication,
  handleUpdateMedication,
  handleDeleteMedication,
  handleDeleteSelectedMedications,
} from "./services/medicationServices";
import {
  fetchReminders,
  handleCreateReminder,
  handleUpdateReminderStatus,
  handleDeleteReminder,
  handleDeleteSelectedReminders,
} from "./services/reminderServices";
import {
  fetchFoodLogs,
  handleCreateFoodLog,
  handleUpdateFoodLog,
  handleDeleteFoodLog,
  handleDeleteSelectedFoodLogs,
} from "./services/foodLogServices";
import {
  fetchExercises,
  handleCreateExercise,
  handleUpdateExercise,
  handleDeleteExercise,
  handleDeleteSelectedExercises,
} from "./services/exerciseServices";
import {
  fetchSettings,
  handleUpdateSetting,
  handleDeleteSelectedSettings,
} from "./services/settingsServices";
import { fetchAuditLogs } from "./services/auditServices";
import { handleExportData } from "./services/exportServices";

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
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
  const [auditLogs, setAuditLogs] = useState({ logs: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(null);
  const [modalData, setModalData] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });
  const [chartData, setChartData] = useState({
    usersJoinedWeekly: { labels: [], data: [], error: null },
    recentlyUsedMedicationsWeekly: { labels: [], data: [], error: null },
    takenVsMissedDosesWeekly: { labels: [], data: { takenDoses: [], missedDoses: [] }, error: null },
    averageCaloriesPerUserWeekly: { labels: [], data: [], error: null },
    macroNutrientsPerUserWeekly: { labels: [], data: [], error: null },
    averageExerciseDurationWeekly: { labels: [], data: [], error: null },
    exerciseTypeDistribution: { labels: [], data: [], error: null },
  });

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

  const handleSelectAll = (data, key) => {
    if (selectedRows.length === data.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data.map((item) => item[key]));
    }
  };

  const processChartData = (rawData, dataType) => {
    try {
      let labels = [];
      let data = {};
      let error = null;

      const groupByWeek = (items, dateKey) => {
        const weeklyData = {};
        items.forEach((item) => {
          const date = moment(item[dateKey], ["YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ss.SSSZ"]);
          if (!date.isValid()) return;
          const weekStart = date.startOf("week").format("YYYY-MM-DD");
          if (!weeklyData[weekStart]) weeklyData[weekStart] = [];
          weeklyData[weekStart].push(item);
        });
        return weeklyData;
      };

      switch (dataType) {
        case "usersJoinedWeekly":
          const usersByWeek = groupByWeek(rawData, "created_at");
          labels = Object.keys(usersByWeek).sort();
          data = labels.map((week) => usersByWeek[week].length);
          break;

        case "recentlyUsedMedicationsWeekly":
          const medsByWeek = groupByWeek(rawData, "start_date");
          labels = Object.keys(medsByWeek).sort();
          data = labels.map((week) => medsByWeek[week].length);
          break;

        case "takenVsMissedDosesWeekly":
          const dosesByWeek = {};
          rawData.forEach((med) => {
            if (!med.doses) return;
            Object.keys(med.doses).forEach((dateStr) => {
              const date = moment(dateStr, ["YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ss.SSSZ"]);
              if (!date.isValid()) return;
              const weekStart = date.startOf("week").format("YYYY-MM-DD");
              if (!dosesByWeek[weekStart]) dosesByWeek[weekStart] = { taken: 0, total: 0, missed: 0 };
              const doses = med.doses[dateStr] || [];
              dosesByWeek[weekStart].taken += doses.filter((dose) => dose.taken).length;
              dosesByWeek[weekStart].total += doses.length;
              dosesByWeek[weekStart].missed += doses.filter((dose) => !dose.taken).length;
            });
          });
          labels = Object.keys(dosesByWeek).sort();
          data = {
            takenDoses: labels.map((week) => dosesByWeek[week].taken),
            missedDoses: labels.map((week) => dosesByWeek[week].missed),
          };
          break;

        case "averageCaloriesPerUserWeekly":
          const caloriesByWeek = groupByWeek(rawData, "date_logged");
          labels = Object.keys(caloriesByWeek).sort();
          data = labels.map((week) => {
            const weekLogs = caloriesByWeek[week];
            const totalCalories = weekLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
            const uniqueUsers = new Set(weekLogs.map((log) => log.user_id)).size;
            return uniqueUsers > 0 ? totalCalories / uniqueUsers : 0;
          });
          break;

        case "macroNutrientsPerUserWeekly":
          const macrosByWeek = groupByWeek(rawData, "date_logged");
          labels = Object.keys(macrosByWeek).sort();
          data = labels.map((week) => {
            const weekLogs = macrosByWeek[week];
            const totalMacros = weekLogs.reduce(
              (sum, log) => sum + (log.carbs || 0) + (log.protein || 0) + (log.fats || 0),
              0
            );
            const uniqueUsers = new Set(weekLogs.map((log) => log.user_id)).size;
            return uniqueUsers > 0 ? totalMacros / uniqueUsers : 0;
          });
          break;

        case "averageExerciseDurationWeekly":
          const exercisesByWeek = groupByWeek(rawData, "date_logged");
          labels = Object.keys(exercisesByWeek).sort();
          data = labels.map((week) => {
            const weekExercises = exercisesByWeek[week];
            const totalDuration = weekExercises.reduce(
              (sum, ex) => sum + (ex.duration || 0),
              0
            );
            return weekExercises.length > 0 ? totalDuration / weekExercises.length : 0;
          });
          break;

        case "exerciseTypeDistribution":
          const typeCounts = rawData.reduce((acc, ex) => {
            const type = ex.activity || "Unknown";
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {});
          labels = Object.keys(typeCounts);
          data = Object.values(typeCounts);
          break;

        default:
          error = `Unsupported data type: ${dataType}`;
      }

      if (!error && Array.isArray(data) && labels.length !== data.length) {
        error = "Mismatch between labels and data length";
      }

      return { labels, data, error };
    } catch (err) {
      return {
        labels: [],
        data: dataType === "takenVsMissedDosesWeekly" ? { takenDoses: [], missedDoses: [] } : [],
        error: `Error processing ${dataType} data: ${err.message}`,
      };
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    switch (activeTab) {
      case "users":
        fetchUsers(
          user,
          searchQuery,
          setLoading,
          setError,
          setUsers,
          setTotalUsers,
          setLastDoc,
          () => getUserToken(auth),
          () => handleSessionExpired(logout, navigate),
          1,
          10,
          sortConfig
        ).then(() => {
          const processedData = processChartData(users, "usersJoinedWeekly");
          setChartData((prev) => ({
            ...prev,
            usersJoinedWeekly: processedData,
          }));
        });
        break;

      case "medications":
        fetchMedications(
          user,
          setLoading,
          setError,
          setMedications,
          setTotalMedications,
          () => getUserToken(auth),
          () => handleSessionExpired(logout, navigate),
          1,
          10,
          sortConfig
        ).then(() => {
          const recentlyUsed = processChartData(medications, "recentlyUsedMedicationsWeekly");
          const takenVsMissed = processChartData(medications, "takenVsMissedDosesWeekly");
          setChartData((prev) => ({
            ...prev,
            recentlyUsedMedicationsWeekly: recentlyUsed,
            takenVsMissedDosesWeekly: takenVsMissed,
          }));
        });
        break;

      case "reminders":
        fetchReminders(
          user,
          setLoading,
          setError,
          setReminders,
          setTotalReminders,
          () => getUserToken(auth),
          () => handleSessionExpired(logout, navigate),
          1,
          10,
          sortConfig
        );
        break;

      case "foodLogs":
        fetchFoodLogs(
          user,
          setLoading,
          setError,
          setFoodLogs,
          setTotalFoodLogs,
          () => getUserToken(auth),
          () => handleSessionExpired(logout, navigate),
          1,
          10,
          sortConfig
        ).then(() => {
          const avgCalories = processChartData(foodLogs, "averageCaloriesPerUserWeekly");
          const macroNutrients = processChartData(foodLogs, "macroNutrientsPerUserWeekly");
          setChartData((prev) => ({
            ...prev,
            averageCaloriesPerUserWeekly: avgCalories,
            macroNutrientsPerUserWeekly: macroNutrients,
          }));
        });
        break;

      case "exercises":
        fetchExercises(
          user,
          setLoading,
          setError,
          setExercises,
          setTotalExercises,
          () => getUserToken(auth),
          () => handleSessionExpired(logout, navigate),
          1,
          10,
          sortConfig
        ).then(() => {
          const avgDuration = processChartData(exercises, "averageExerciseDurationWeekly");
          const typeDistribution = processChartData(exercises, "exerciseTypeDistribution");
          setChartData((prev) => ({
            ...prev,
            averageExerciseDurationWeekly: avgDuration,
            exerciseTypeDistribution: typeDistribution,
          }));
        });
        break;

      case "settings":
        fetchSettings(
          user,
          setLoading,
          setError,
          setSettings,
          () => getUserToken(auth),
          () => handleSessionExpired(logout, navigate),
          1,
          10,
          sortConfig
        );
        break;

      case "audit":
        fetchAuditLogs(
          user,
          setLoading,
          setError,
          setAuditLogs,
          () => getUserToken(auth),
          () => handleSessionExpired(logout, navigate),
          1,
          10,
          sortConfig
        );
        break;

      default:
        break;
    }
  }, [activeTab, user, navigate, searchQuery, sortConfig]);

  // Table Columns
  const userColumns = [
    { key: "email", label: "Email" },
    { key: "username", label: "Name" },
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
        isMinimized={isMinimized}
        setIsMinimized={setIsMinimized}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <main
        className={`p-4 sm:p-6 lg:pt-8 sm:pt-8 transition-all duration-300 lg:mt-4 ${
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
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Admin Dashboard
            </h2>

            {/* Users Section */}
            {activeTab === "users" && (
              <div className="space-y-8">
                {/* Statistics */}
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

                {/* Charts */}
                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ActivityChart
                    type="line"
                    labels={chartData.usersJoinedWeekly.labels}
                    data={chartData.usersJoinedWeekly.data}
                    title="Users Joined Weekly"
                    error={chartData.usersJoinedWeekly.error}
                    loading={loading}
                  />
                </div> */}

                {/* User List */}
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold mb-4">All Users</h3>
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
                        onClick={() =>
                          handleDeleteSelectedUsers(
                            user,
                            selectedRows,
                            setLoading,
                            setSelectedRows,
                            () =>
                              fetchUsers(
                                user,
                                searchQuery,
                                setLoading,
                                setError,
                                setUsers,
                                setTotalUsers,
                                setLastDoc,
                                () => getUserToken(auth),
                                () => handleSessionExpired(logout, navigate),
                                1,
                                50,
                                sortConfig
                              ),
                            () => getUserToken(auth),
                            () => handleSessionExpired(logout, navigate)
                          )
                        }
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
                    onDelete={(id) =>
                      handleDeleteUser(
                        user,
                        id,
                        () =>
                          fetchUsers(
                            user,
                            searchQuery,
                            setLoading,
                            setError,
                            setUsers,
                            setTotalUsers,
                            setLastDoc,
                            () => getUserToken(auth),
                            () => handleSessionExpired(logout, navigate)
                          ),
                        () => getUserToken(auth),
                        () => handleSessionExpired(logout, navigate)
                      )
                    }
                    onSelect={handleRowSelect}
                    onSelectAll={() => handleSelectAll(users, "id")}
                    selectedRows={selectedRows}
                    setSelectedRows={setSelectedRows}
                    onSort={handleSort}
                    sortConfig={sortConfig}
                    fetchPage={(page, limit, sortConfig) =>
                      fetchUsers(
                        user,
                        searchQuery,
                        setLoading,
                        setError,
                        setUsers,
                        setTotalUsers,
                        setLastDoc,
                        () => getUserToken(auth),
                        () => handleSessionExpired(logout, navigate),
                        page,
                        limit,
                        sortConfig
                      )
                    }
                  />
                </div>
              </div>
            )}

            {/* Medications Section */}
            {activeTab === "medications" && (
              <div className="space-y-8">
                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold">Total Medications</h3>
                    <p className="text-2xl font-bold text-indigo-600">{totalMedications}</p>
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

                {/* Charts */}
                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ActivityChart
                    type="bar"
                    labels={chartData.recentlyUsedMedicationsWeekly.labels}
                    data={chartData.recentlyUsedMedicationsWeekly.data}
                    title="Recently Used Medications Weekly"
                    error={chartData.recentlyUsedMedicationsWeekly.error}
                    loading={loading}
                  />
                  {chartData.takenVsMissedDosesWeekly.data && typeof chartData.takenVsMissedDosesWeekly.data === "object" && Array.isArray(chartData.takenVsMissedDosesWeekly.data.takenDoses) && Array.isArray(chartData.takenVsMissedDosesWeekly.data.missedDoses) ? (
                    <ActivityChart
                      type="line"
                      labels={chartData.takenVsMissedDosesWeekly.labels}
                      data={{
                        takenDoses: chartData.takenVsMissedDosesWeekly.data.takenDoses,
                        missedDoses: chartData.takenVsMissedDosesWeekly.data.missedDoses,
                      }}
                      title="Taken vs Missed Doses Weekly"
                      error={chartData.takenVsMissedDosesWeekly.error}
                      loading={loading}
                    />
                  ) : null}
                </div> */}

                {/* Medication List */}
                <div>
                  <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">All Medications</h3>
                    <button
                      onClick={() => setModalOpen("addMedication")}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Add Medication
                    </button>
                    {selectedRows.length > 0 && (
                      <button
                        onClick={() =>
                          handleDeleteSelectedMedications(
                            user,
                            selectedRows,
                            setLoading,
                            setSelectedRows,
                            () =>
                              fetchMedications(
                                user,
                                setLoading,
                                setError,
                                setMedications,
                                setTotalMedications,
                                () => getUserToken(auth),
                                () => handleSessionExpired(logout, navigate)
                              ),
                            () => getUserToken(auth),
                            () => handleSessionExpired(logout, navigate)
                          )
                        }
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
                      >
                        <FaTrash className="mr-2" /> Delete Selected
                      </button>
                    )}
                  </div>
                  <DataTable
                    columns={medicationColumns}
                    data={medications}
                    totalCount={totalMedications}
                    onEdit={(item) => {
                      setModalData(item);
                      setModalOpen("updateMedication");
                    }}
                    onDelete={(id) =>
                      handleDeleteMedication(
                        user,
                        id,
                        () =>
                          fetchMedications(
                            user,
                            setLoading,
                            setError,
                            setMedications,
                            setTotalMedications,
                            () => getUserToken(auth),
                            () => handleSessionExpired(logout, navigate)
                          ),
                        () => getUserToken(auth),
                        () => handleSessionExpired(logout, navigate)
                      )
                    }
                    onSelect={handleRowSelect}
                    onSelectAll={() => handleSelectAll(medications, "id")}
                    selectedRows={selectedRows}
                    setSelectedRows={setSelectedRows}
                    onSort={handleSort}
                    sortConfig={sortConfig}
                    fetchPage={(page, limit, sortConfig) =>
                      fetchMedications(
                        user,
                        setLoading,
                        setError,
                        setMedications,
                        setTotalMedications,
                        () => getUserToken(auth),
                        () => handleSessionExpired(logout, navigate),
                        page,
                        limit,
                        sortConfig
                      )
                    }
                  />
                </div>
              </div>
            )}

            {/* Reminders Section */}
            {activeTab === "reminders" && (
              <div className="space-y-8">
                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold">Total Reminders</h3>
                    <p className="text-2xl font-bold text-indigo-600">{totalReminders}</p>
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

                {/* Reminder List */}
                <div>
                  <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">All Reminders</h3>
                    <button
                      onClick={() => setModalOpen("addReminder")}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Add Reminder
                    </button>
                    {selectedRows.length > 0 && (
                      <div className="flex space-x-4">
                        <button
                          onClick={() =>
                            handleUpdateReminderStatus(
                              user,
                              selectedRows,
                              "sent",
                              () =>
                                fetchReminders(
                                  user,
                                  setLoading,
                                  setError,
                                  setReminders,
                                  setTotalReminders,
                                  () => getUserToken(auth),
                                  () => handleSessionExpired(logout, navigate)
                                ),
                              setSelectedRows,
                              () => getUserToken(auth),
                              () => handleSessionExpired(logout, navigate)
                            )
                          }
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                        >
                          Mark as Sent
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateReminderStatus(
                              user,
                              selectedRows,
                              "pending",
                              () =>
                                fetchReminders(
                                  user,
                                  setLoading,
                                  setError,
                                  setReminders,
                                  setTotalReminders,
                                  () => getUserToken(auth),
                                  () => handleSessionExpired(logout, navigate)
                                ),
                              setSelectedRows,
                              () => getUserToken(auth),
                              () => handleSessionExpired(logout, navigate)
                            )
                          }
                          className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
                        >
                          Mark as Pending
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteSelectedReminders(
                              user,
                              selectedRows,
                              setLoading,
                              setSelectedRows,
                              () =>
                                fetchReminders(
                                  user,
                                  setLoading,
                                  setError,
                                  setReminders,
                                  setTotalReminders,
                                  () => getUserToken(auth),
                                  () => handleSessionExpired(logout, navigate)
                                ),
                              () => getUserToken(auth),
                              () => handleSessionExpired(logout, navigate)
                            )
                          }
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
                        >
                          <FaTrash className="mr-2" /> Delete Selected
                        </button>
                      </div>
                    )}
                  </div>
                  <DataTable
                    columns={reminderColumns}
                    data={reminders}
                    totalCount={totalReminders}
                    onEdit={(item) => {
                      setModalData(item);
                      setModalOpen("updateReminder");
                    }}
                    onDelete={(id) =>
                      handleDeleteReminder(
                        user,
                        id,
                        () =>
                          fetchReminders(
                            user,
                            setLoading,
                            setError,
                            setReminders,
                            setTotalReminders,
                            () => getUserToken(auth),
                            () => handleSessionExpired(logout, navigate)
                          ),
                        () => getUserToken(auth),
                        () => handleSessionExpired(logout, navigate)
                      )
                    }
                    onSelect={handleRowSelect}
                    onSelectAll={() => handleSelectAll(reminders, "id")}
                    selectedRows={selectedRows}
                    setSelectedRows={setSelectedRows}
                    onSort={handleSort}
                    sortConfig={sortConfig}
                    fetchPage={(page, limit, sortConfig) =>
                      fetchReminders(
                        user,
                        setLoading,
                        setError,
                        setReminders,
                        setTotalReminders,
                        () => getUserToken(auth),
                        () => handleSessionExpired(logout, navigate),
                        page,
                        limit,
                        sortConfig
                      )
                    }
                  />
                </div>
              </div>
            )}

            {/* Food Logs Section */}
            {activeTab === "foodLogs" && (
              <div className="space-y-8">
                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold">Total Food Logs</h3>
                    <p className="text-2xl font-bold text-indigo-600">{totalFoodLogs}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold">Total Calories</h3>
                    <p className="text-2xl font-bold text-indigo-600">
                      {Number(foodLogs.reduce((sum, log) => sum + (log.calories || 0), 0)).toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold">Unique Meals</h3>
                    <p className="text-2xl font-bold text-indigo-600">
                      {new Set(foodLogs.map((log) => log.food_name)).size}
                    </p>
                  </div>
                </div>

                {/* Charts */}
                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ActivityChart
                    type="line"
                    labels={chartData.averageCaloriesPerUserWeekly.labels}
                    data={chartData.averageCaloriesPerUserWeekly.data}
                    title="Total Calories Weekly"
                    error={chartData.averageCaloriesPerUserWeekly.error}
                    loading={loading}
                    usersData={users}
                  />
                  <ActivityChart
                    type="line"
                    labels={chartData.macroNutrientsPerUserWeekly.labels}
                    data={chartData.macroNutrientsPerUserWeekly.data}
                    title="Total Macronutrients Consumed Weekly"
                    error={chartData.macroNutrientsPerUserWeekly.error}
                    loading={loading}
                    usersData={users}
                  />
                </div> */}

                {/* Food Log List */}
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xl font-semibold">All Food Logs</span>
                    <button
                      onClick={() => setModalOpen("addFoodLog")}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Add Food Log
                    </button>
                    {selectedRows.length > 0 && (
                      <button
                        onClick={() =>
                          handleDeleteSelectedFoodLogs(
                            user,
                            selectedRows,
                            setLoading,
                            setSelectedRows,
                            () =>
                              fetchFoodLogs(
                                user,
                                setLoading,
                                setError,
                                setFoodLogs,
                                setTotalFoodLogs,
                                () => getUserToken(auth),
                                () => handleSessionExpired(logout, navigate)
                              ),
                            () => getUserToken(auth),
                            () => handleSessionExpired(logout, navigate)
                          )
                        }
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
                      >
                        <FaTrash className="mr-2" /> Delete Selected
                      </button>
                    )}
                  </div>
                  <DataTable
                    columns={foodLogColumns}
                    data={foodLogs}
                    totalCount={totalFoodLogs}
                    onEdit={(item) => {
                      setModalData(item);
                      setModalOpen("updateFoodLog");
                    }}
                    onDelete={(id) =>
                      handleDeleteFoodLog(
                        user,
                        id,
                        () =>
                          fetchFoodLogs(
                            user,
                            setLoading,
                            setError,
                            setFoodLogs,
                            setTotalFoodLogs,
                            () => getUserToken(auth),
                            () => handleSessionExpired(logout, navigate)
                          ),
                        () => getUserToken(auth),
                        () => handleSessionExpired(logout, navigate)
                      )
                    }
                    onSelect={handleRowSelect}
                    onSelectAll={() => handleSelectAll(foodLogs, "id")}
                    selectedRows={selectedRows}
                    setSelectedRows={setSelectedRows}
                    onSort={handleSort}
                    sortConfig={sortConfig}
                    fetchPage={(page, limit, sortConfig) =>
                      fetchFoodLogs(
                        user,
                        setLoading,
                        setError,
                        setFoodLogs,
                        setTotalFoodLogs,
                        () => getUserToken(auth),
                        () => handleSessionExpired(logout, navigate),
                        page,
                        limit,
                        sortConfig
                      )
                    }
                  />
                </div>
              </div>
            )}

            {/* Exercises Section */}
            {activeTab === "exercises" && (
              <div className="space-y-8">
                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold">Total Exercises</h3>
                    <p className="text-2xl font-bold text-indigo-600">{totalExercises}</p>
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

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ActivityChart
                    type="bar"
                    labels={chartData.averageExerciseDurationWeekly.labels}
                    data={chartData.averageExerciseDurationWeekly.data}
                    title="Total Calories Burned Weekly"
                    error={chartData.averageExerciseDurationWeekly.error}
                    loading={loading}
                    usersData={users}
                  />
                  <ActivityChart
                    type="pie"
                    labels={chartData.exerciseTypeDistribution.labels}
                    data={chartData.exerciseTypeDistribution.data}
                    title="Exercise Types in Percentage"
                    error={chartData.exerciseTypeDistribution.error}
                    loading={loading}
                  />
                </div>

                {/* Exercise List */}
                <div>
                  <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">All Exercises</h3>
                    <button
                      onClick={() => setModalOpen("addExercise")}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Add Exercise
                    </button>
                    {selectedRows.length > 0 && (
                      <button
                        onClick={() =>
                          handleDeleteSelectedExercises(
                            user,
                            selectedRows,
                            setLoading,
                            setSelectedRows,
                            () =>
                              fetchExercises(
                                user,
                                setLoading,
                                setError,
                                setExercises,
                                setTotalExercises,
                                () => getUserToken(auth),
                                () => handleSessionExpired(logout, navigate)
                              ),
                            () => getUserToken(auth),
                            () => handleSessionExpired(logout, navigate)
                          )
                        }
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
                      >
                        <FaTrash className="mr-2" /> Delete Selected
                      </button>
                    )}
                  </div>
                  <DataTable
                    columns={exerciseColumns}
                    data={exercises}
                    totalCount={totalExercises}
                    onEdit={(item) => {
                      setModalData(item);
                      setModalOpen("updateExercise");
                    }}
                    onDelete={(id) =>
                      handleDeleteExercise(
                        user,
                        id,
                        () =>
                          fetchExercises(
                            user,
                            setLoading,
                            setError,
                            setExercises,
                            setTotalExercises,
                            () => getUserToken(auth),
                            () => handleSessionExpired(logout, navigate)
                          ),
                        () => getUserToken(auth),
                        () => handleSessionExpired(logout, navigate)
                      )
                    }
                    onSelect={handleRowSelect}
                    onSelectAll={() => handleSelectAll(exercises, "id")}
                    selectedRows={selectedRows}
                    setSelectedRows={setSelectedRows}
                    onSort={handleSort}
                    sortConfig={sortConfig}
                    fetchPage={(page, limit, sortConfig) =>
                      fetchExercises(
                        user,
                        setLoading,
                        setError,
                        setExercises,
                        setTotalExercises,
                        () => getUserToken(auth),
                        () => handleSessionExpired(logout, navigate),
                        page,
                        limit,
                        sortConfig
                      )
                    }
                  />
                </div>
              </div>
            )}

            {/* Settings Section */}
            {activeTab === "settings" && (
              <div>
                <h3 className="text-xl font-semibold mb-4">System Settings</h3>
                <div className="flex justify-between items-center mb-6">
                  {selectedRows.length > 0 && (
                    <button
                      onClick={() =>
                        handleDeleteSelectedSettings(
                          user,
                          selectedRows,
                          setLoading,
                          setSelectedRows,
                          () =>
                            fetchSettings(
                              user,
                              setLoading,
                              setError,
                              setSettings,
                              () => getUserToken(auth),
                              () => handleSessionExpired(logout, navigate)
                            ),
                          () => getUserToken(auth),
                          () => handleSessionExpired(logout, navigate)
                        )
                      }
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
                    >
                      <FaTrash className="mr-2" /> Delete Selected
                    </button>
                  )}
                </div>
                <DataTable
                  columns={settingColumns}
                  data={settings}
                  totalCount={settings.length}
                  onEdit={(item) => {
                    setModalData(item);
                    setModalOpen("updateSetting");
                  }}
                  onDelete={() => {}}
                  onSelect={handleRowSelect}
                  onSelectAll={() => handleSelectAll(settings, "setting_key")}
                  selectedRows={selectedRows}
                  setSelectedRows={setSelectedRows}
                  onSort={handleSort}
                  sortConfig={sortConfig}
                  fetchPage={(page, limit, sortConfig) =>
                    fetchSettings(
                      user,
                      setLoading,
                      setError,
                      setSettings,
                      () => getUserToken(auth),
                      () => handleSessionExpired(logout, navigate),
                      page,
                      limit,
                      sortConfig
                    )
                  }
                />
              </div>
            )}

            {/* Audit Logs Section */}
            {/* {activeTab === "audit" && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Audit Logs</h3>
                <DataTable
                  columns={auditLogColumns}
                  data={auditLogs.logs}
                  totalCount={auditLogs.total}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onSelect={() => {}}
                  onSelectAll={() => {}}
                  selectedRows={[]}
                  setSelectedRows={setSelectedRows}
                  onSort={handleSort}
                  sortConfig={sortConfig}
                  fetchPage={(page, limit, sortConfig) =>
                    fetchAuditLogs(
                      user,
                      setLoading,
                      setError,
                      setAuditLogs,
                      () => getUserToken(auth),
                      () => handleSessionExpired(logout, navigate),
                      page,
                      limit,
                      sortConfig
                    )
                  }
                />
              </div>
            )} */}
            
            {/* Data Export Section */}
            {activeTab === "export" && (
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <h3 className="text-lg sm:text-xl font-semibold mb-4">Data Export</h3>
                <ol className="space-y-2 sm:space-y-4 list-decimal list-inside">
                  <li className="flex items-center justify-between">
                    <span className="text-sm sm:text-base leading-relaxed sm:leading-normal text-black mr-2">
                      <strong className="text-blue-900">Export Users</strong>: exports the complete list of user records, including email, name, role, and creation date.
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleExportData(
                          user,
                          "users",
                          "csv",
                          () => getUserToken(auth),
                          () => handleSessionExpired(logout, navigate)
                        );
                      }}
                      className="px-2 py-2 bg-white hover:bg-gray-100 text-black hover:text-gray-800 text-sm sm:text-base leading-relaxed sm:leading-normal font-medium rounded-md shadow-sm transition duration-200 ease-in-out transform hover:-translate-y-0.5 border border-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 text-center"
                    >
                      Download
                    </button>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm sm:text-base leading-relaxed sm:leading-normal text-black mr-2">
                      <strong className="text-blue-900">Export Medications</strong>: exports all medication records, including medication name, user ID, dosage, frequency, times per day, start date, and end date.
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleExportData(
                          user,
                          "medications",
                          "csv",
                          () => getUserToken(auth),
                          () => handleSessionExpired(logout, navigate)
                        );
                      }}
                      className="px-2 py-2 bg-white hover:bg-gray-100 text-black hover:text-gray-800 text-sm sm:text-base leading-relaxed sm:leading-normal font-medium rounded-md shadow-sm transition duration-200 ease-in-out transform hover:-translate-y-0.5 border border-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 text-center"
                    >
                      Download
                    </button>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm sm:text-base leading-relaxed sm:leading-normal text-black mr-2">
                      <strong className="text-blue-900">Export Food Logs</strong>: exports food log entries, including user ID, food name, calories, carbs, protein, fats, date logged, and meal type.
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleExportData(
                          user,
                          "foodLogs",
                          "csv",
                          () => getUserToken(auth),
                          () => handleSessionExpired(logout, navigate)
                        );
                      }}
                      className="px-2 py-2 bg-white hover:bg-gray-100 text-black hover:text-gray-800 text-sm sm:text-base leading-relaxed sm:leading-normal font-medium rounded-md shadow-sm transition duration-200 ease-in-out transform hover:-translate-y-0.5 border border-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 text-center"
                    >
                      Download
                    </button>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm sm:text-base leading-relaxed sm:leading-normal text-black mr-2">
                      <strong className="text-blue-900">Export Exercises</strong>: exports exercise records, including user ID, activity, duration, calories burned, and date logged.
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleExportData(
                          user,
                          "exercises",
                          "csv",
                          () => getUserToken(auth),
                          () => handleSessionExpired(logout, navigate)
                        );
                      }}
                      className="px-2 py-2 bg-white hover:bg-gray-100 text-black hover:text-gray-800 text-sm sm:text-base leading-relaxed sm:leading-normal font-medium rounded-md shadow-sm transition duration-200 ease-in-out transform hover:-translate-y-0.5 border border-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 text-center"
                    >
                      Download
                    </button>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm sm:text-base leading-relaxed sm:leading-normal text-black mr-2">
                      <strong className="text-blue-900">Export Reminders</strong>: exports reminder details, including user ID, medication ID, dose index, reminder time, date, and status.
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleExportData(
                          user,
                          "reminders",
                          "csv",
                          () => getUserToken(auth),
                          () => handleSessionExpired(logout, navigate)
                        );
                      }}
                      className="px-2 py-2 bg-white hover:bg-gray-100 text-black hover:text-gray-800 text-sm sm:text-base leading-relaxed sm:leading-normal font-medium rounded-md shadow-sm transition duration-200 ease-in-out transform hover:-translate-y-0.5 border border-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 text-center"
                    >
                      Download
                    </button>
                  </li>
                </ol>
              </div>
            )}
          </div>
        )}
      </main>
      <AnimatePresence>
        {modalOpen === "addUser" && (
          <AddUserModal
            onClose={() => setModalOpen(null)}
            onSuccess={() => {
              fetchUsers(
                user,
                searchQuery,
                setLoading,
                setError,
                setUsers,
                setTotalUsers,
                setLastDoc,
                () => getUserToken(auth),
                () => handleSessionExpired(logout, navigate),
                1,
                10,
                sortConfig
              );
              setModalOpen(null);
            }}
          />
        )}
        {modalOpen === "updateUser" && (
          <UpdateUserModal
            initialData={modalData}
            onClose={() => setModalOpen(null)}
            onSuccess={() => {
              fetchUsers(
                user,
                searchQuery,
                setLoading,
                setError,
                setUsers,
                setTotalUsers,
                setLastDoc,
                () => getUserToken(auth),
                () => handleSessionExpired(logout, navigate),
                1,
                10,
                sortConfig
              );
              setModalOpen(null);
            }}
          />
        )}
        {modalOpen === "addMedication" && (
          <AddMedicationModal
            onClose={() => setModalOpen(null)}
            onSuccess={() => {
              fetchMedications(
                user,
                setLoading,
                setError,
                setMedications,
                setTotalMedications,
                () => getUserToken(auth),
                () => handleSessionExpired(logout, navigate),
                1,
                10,
                sortConfig
              );
              setModalOpen(null);
            }}
          />
        )}
        {modalOpen === "updateMedication" && (
          <UpdateMedicationModal
            initialData={modalData}
            onClose={() => setModalOpen(null)}
            onSuccess={() => {
              fetchMedications(
                user,
                setLoading,
                setError,
                setMedications,
                setTotalMedications,
                () => getUserToken(auth),
                () => handleSessionExpired(logout, navigate),
                1,
                10,
                sortConfig
              );
              setModalOpen(null);
            }}
          />
        )}
        {modalOpen === "addReminder" && (
          <AddReminderModal
            onClose={() => setModalOpen(null)}
            onSuccess={() => {
              fetchReminders(
                user,
                setLoading,
                setError,
                setReminders,
                setTotalReminders,
                () => getUserToken(auth),
                () => handleSessionExpired(logout, navigate),
                1,
                10,
                sortConfig
              );
              setModalOpen(null);
            }}
          />
        )}
        {modalOpen === "addFoodLog" && (
          <AddFoodLogModal
            onClose={() => setModalOpen(null)}
            onSuccess={() => {
              fetchFoodLogs(
                user,
                setLoading,
                setError,
                setFoodLogs,
                setTotalFoodLogs,
                () => getUserToken(auth),
                () => handleSessionExpired(logout, navigate),
                1,
                10,
                sortConfig
              );
              setModalOpen(null);
            }}
          />
        )}
        {modalOpen === "updateFoodLog" && (
          <UpdateFoodLogModal
            initialData={modalData}
            onClose={() => setModalOpen(null)}
            onSuccess={() => {
              fetchFoodLogs(
                user,
                setLoading,
                setError,
                setFoodLogs,
                setTotalFoodLogs,
                () => getUserToken(auth),
                () => handleSessionExpired(logout, navigate),
                1,
                10,
                sortConfig
              );
              setModalOpen(null);
            }}
          />
        )}
        {modalOpen === "addExercise" && (
          <AddExerciseModal
            onClose={() => setModalOpen(null)}
            onSuccess={() => {
              fetchExercises(
                user,
                setLoading,
                setError,
                setExercises,
                setTotalExercises,
                () => getUserToken(auth),
                () => handleSessionExpired(logout, navigate),
                1,
                10,
                sortConfig
              );
              setModalOpen(null);
            }}
          />
        )}
        {modalOpen === "updateExercise" && (
          <UpdateExerciseModal
            initialData={modalData}
            onClose={() => setModalOpen(null)}
            onSuccess={() => {
              fetchExercises(
                user,
                setLoading,
                setError,
                setExercises,
                setTotalExercises,
                () => getUserToken(auth),
                () => handleSessionExpired(logout, navigate),
                1,
                10,
                sortConfig
              );
              setModalOpen(null);
            }}
          />
        )}
        {modalOpen === "updateSetting" && (
          <UpdateSettingModal
            initialData={modalData}
            onClose={() => setModalOpen(null)}
            onSuccess={() => {
              fetchSettings(
                user,
                setLoading,
                setError,
                setSettings,
                () => getUserToken(auth),
                () => handleSessionExpired(logout, navigate),
                1,
                10,
                sortConfig
              );
              setModalOpen(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;