import { useState, useEffect, useContext, useCallback } from "react";
import { useSocket } from "../../contexts/SocketContext";
import { AuthContext } from "../../contexts/AuthContext";
import { createExercise, getUserExercises, updateExercise, deleteExercise, getExerciseStats } from "../../services/api";
import { toast } from "react-toastify";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from "chart.js";
import { auth } from "../../firebase/config";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "./Header";
import Calendar from "./Calendar";
import Stats from "./Stats";
import LogExercise from "./LogExercise";
import RecentExercises from "./RecentExercises";
import WeeklyActivity from "./WeeklyActivity";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const ExerciseTracker = () => {
  const { user, logout } = useContext(AuthContext);
  const { socket, getSocket } = useSocket();
  const navigate = useNavigate();

  const getUserToken = async () => {
    return await auth.currentUser.getIdToken(true);
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFailedAction, setLastFailedAction] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [stats, setStats] = useState({ totalCalories: 0, totalDuration: 0, totalSessions: 0 });
  const [weeklyData, setWeeklyData] = useState({
    calories: [],
    duration: [],
    sessions: [],
    labels: [],
  });
  const [filter, setFilter] = useState("All-Time");
  const [selectedDate, setSelectedDate] = useState(new Date()); // Default to today
  const [isLogExerciseModalOpen, setIsLogExerciseModalOpen] = useState(false); // Modal state

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          font: {
            size: 10,
            family: "'Inter', sans-serif",
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(31, 41, 55, 0.9)",
        padding: 12,
        titleFont: {
          size: 14,
          weight: "bold",
          family: "'Inter', sans-serif",
        },
        bodyFont: {
          size: 14,
          family: "'Inter', sans-serif",
        },
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
          color: "#6B7280",
        },
        grid: {
          color: "rgba(209, 213, 219, 0.3)",
        },
      },
      x: {
        ticks: {
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
          color: "#6B7280",
        },
        grid: {
          display: false,
        },
      },
    },
  };

  const handleSessionExpired = useCallback(() => {
    toast.error("Your session has expired. Please log in again.");
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const token = await getUserToken();
      const [userExercises, exerciseStats] = await Promise.all([
        getUserExercises(token),
        getExerciseStats(token),
      ]);
      setExercises(userExercises.sort((a, b) => new Date(b.date_logged) - new Date(a.date_logged)));
      setStats({
        totalCalories: exerciseStats.totalCaloriesBurned || 0,
        totalDuration: exerciseStats.totalDuration || 0,
        totalSessions: exerciseStats.totalExercises || 0,
      });
    } catch (err) {
      setError("Failed to load exercises or stats");
      setLastFailedAction({ type: "fetchData", params: null });
      toast.error("Failed to load exercises or stats");
      console.error(err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      }
    } finally {
      setLoading(false);
    }
  }, [user, handleSessionExpired]);

  const computeWeeklyData = useCallback(() => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      return date.toISOString().split("T")[0];
    }).reverse();

    const caloriesData = last7Days.map((date) => {
      const dailyExercises = exercises.filter(
        (ex) => new Date(ex.date_logged).toISOString().split("T")[0] === date
      );
      return dailyExercises.reduce((sum, ex) => sum + (ex.calories_burned || 0), 0);
    });

    const durationData = last7Days.map((date) => {
      const dailyExercises = exercises.filter(
        (ex) => new Date(ex.date_logged).toISOString().split("T")[0] === date
      );
      return dailyExercises.reduce((sum, ex) => sum + (ex.duration || 0), 0);
    });

    const sessionsData = last7Days.map((date) => {
      const dailyExercises = exercises.filter(
        (ex) => new Date(ex.date_logged).toISOString().split("T")[0] === date
      );
      return dailyExercises.length;
    });

    setWeeklyData({
      calories: caloriesData,
      duration: durationData,
      sessions: sessionsData,
      labels: last7Days.map((date) => new Date(date).toLocaleDateString("en-US", { weekday: "short" })),
    });
  }, [exercises]);

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

    fetchData();

    return () => {
      unsubscribe();
    };
  }, [user, navigate, fetchData, handleSessionExpired]);

  useEffect(() => {
    if (!socket) return;

    const handleExerciseAdded = (newExercise) => {
      setExercises((prev) => [newExercise, ...prev].sort((a, b) => new Date(b.date_logged) - new Date(a.date_logged)));
      toast.success(`New exercise added: ${newExercise.activity}`);
    };

    const handleExerciseDeleted = (id) => {
      setExercises((prev) => prev.filter((exercise) => exercise.id !== id));
      toast.success("Exercise deleted");
    };

    const handleExerciseUpdated = (updatedExercise) => {
      setExercises((prev) =>
        prev.map((exercise) => (exercise.id === updatedExercise.id ? updatedExercise : exercise))
          .sort((a, b) => new Date(b.date_logged) - new Date(a.date_logged))
      );
      toast.success(`Exercise updated: ${updatedExercise.activity}`);
    };

    socket.on("exerciseAdded", handleExerciseAdded);
    socket.on("exerciseDeleted", handleExerciseDeleted);
    socket.on("exerciseUpdated", handleExerciseUpdated);
    window.scrollTo(0, 0);
    computeWeeklyData();

    return () => {
      socket.off("exerciseAdded", handleExerciseAdded);
      socket.off("exerciseDeleted", handleExerciseDeleted);
      socket.off("exerciseUpdated", handleExerciseUpdated);
    };
  }, [socket, computeWeeklyData]);

  const handleLogExercise = useCallback(async (e, activity, duration, caloriesBurned, setActivity, setDuration, setCaloriesBurned) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to log an exercise");
      setLastFailedAction({ type: "logExercise", params: null });
      toast.error("You must be logged in to log an exercise");
      handleSessionExpired();
      return;
    }
    if (!activity || !duration || !caloriesBurned) {
      setError("All fields are required");
      setLastFailedAction({ type: "logExercise", params: null });
      toast.error("All fields are required");
      return;
    }
    const durationNum = Number(duration);
    const caloriesNum = Number(caloriesBurned);
    if (isNaN(durationNum) || isNaN(caloriesNum) || durationNum <= 0 || caloriesNum <= 0) {
      setError("Duration and calories burned must be positive numbers");
      setLastFailedAction({ type: "logExercise", params: null });
      toast.error("Duration and calories burned must be positive numbers");
      return;
    }
    try {
      setLoading(true);
      const token = await getUserToken();
      const newExercise = {
        activity,
        duration: durationNum,
        calories_burned: caloriesNum,
        date_logged: new Date().toISOString(),
        status: "completed",
      };
      await createExercise(newExercise, token, getSocket);
      setActivity("");
      setDuration("");
      setCaloriesBurned("");
      const exerciseStats = await getExerciseStats(token);
      setStats({
        totalCalories: exerciseStats.totalCaloriesBurned || 0,
        totalDuration: exerciseStats.totalDuration || 0,
        totalSessions: exerciseStats.totalExercises || 0,
      });
      setError(null);
    } catch (err) {
      setError("Failed to log exercise");
      setLastFailedAction({ type: "logExercise", params: { activity, duration: durationNum, caloriesBurned: caloriesNum } });
      toast.error("Failed to log exercise");
      console.error(err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      }
    } finally {
      setLoading(false);
    }
  }, [user, getSocket, handleSessionExpired]);

  const handleDeleteExercise = useCallback(async (id) => {
    try {
      setLoading(true);
      const token = await getUserToken();
      await deleteExercise(id, token, getSocket);
      const exerciseStats = await getExerciseStats(token);
      setStats({
        totalCalories: exerciseStats.totalCaloriesBurned || 0,
        totalDuration: exerciseStats.totalDuration || 0,
        totalSessions: exerciseStats.totalExercises || 0,
      });
      setError(null);
    } catch (err) {
      setError("Failed to delete exercise");
      setLastFailedAction({ type: "deleteExercise", params: { id } });
      toast.error("Failed to delete exercise");
      console.error(err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      }
    } finally {
      setLoading(false);
    }
  }, [getSocket, handleSessionExpired]);

  const handleUpdateExercise = useCallback(async (editingExercise, setEditingExercise) => {
    if (!editingExercise.activity || editingExercise.duration <= 0 || editingExercise.calories_burned <= 0 || isNaN(editingExercise.duration) || isNaN(editingExercise.calories_burned)) {
      setError("Activity must be selected, and duration and calories burned must be positive numbers");
      setLastFailedAction({ type: "updateExercise", params: { editingExercise } });
      toast.error("Activity must be selected, and duration and calories burned must be positive numbers");
      return;
    }
    try {
      setLoading(true);
      const token = await getUserToken();
      await updateExercise(editingExercise.id, editingExercise, token, getSocket);
      setEditingExercise(null);
      const exerciseStats = await getExerciseStats(token);
      setStats({
        totalCalories: exerciseStats.totalCaloriesBurned || 0,
        totalDuration: exerciseStats.totalDuration || 0,
        totalSessions: exerciseStats.totalExercises || 0,
      });
      setError(null);
    } catch (err) {
      setError("Failed to update exercise");
      setLastFailedAction({ type: "updateExercise", params: { editingExercise } });
      toast.error("Failed to update exercise");
      console.error(err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      }
    } finally {
      setLoading(false);
    }
  }, [getSocket, handleSessionExpired]);

  const handleRetry = useCallback(async () => {
    if (!lastFailedAction) return;
    setError(null);
    const { type, params } = lastFailedAction;
    switch (type) {
      case "fetchData":
        await fetchData();
        break;
      case "logExercise":
        if (params) {
          const { activity, duration, caloriesBurned } = params;
          await handleLogExercise({ preventDefault: () => {} }, activity, duration, caloriesBurned, () => {}, () => {}, () => {});
        }
        break;
      case "deleteExercise":
        if (params) {
          await handleDeleteExercise(params.id);
        }
        break;
      case "updateExercise":
        if (params) {
          await handleUpdateExercise(params.editingExercise, () => {});
        }
        break;
      default:
        break;
    }
    setLastFailedAction(null);
  }, [lastFailedAction, fetchData, handleLogExercise, handleDeleteExercise, handleUpdateExercise]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <motion.div
      className="min-h-screen p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto font-mono"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Header onOpenModal={() => setIsLogExerciseModalOpen(true)} />
      
      {error && (
        <motion.div
          className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-lg mb-6 flex justify-between items-center"
          variants={containerVariants}
        >
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-base font-medium">{error}</p>
          </div>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all duration-300 text-sm font-medium flex items-center"
            disabled={loading}
            aria-label="Retry action"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Retry
          </button>
        </motion.div>
      )}

      <div className="space-y-8">
        <Calendar exercises={exercises} setSelectedDate={setSelectedDate} selectedDate={selectedDate} />
        <LogExercise
          handleLogExercise={handleLogExercise}
          loading={loading}
          isOpen={isLogExerciseModalOpen}
          onClose={() => setIsLogExerciseModalOpen(false)}
        />
        <WeeklyActivity weeklyData={weeklyData} chartOptions={chartOptions} />
        <RecentExercises
          exercises={exercises}
          filter={filter}
          setFilter={setFilter}
          handleDeleteExercise={handleDeleteExercise}
          handleUpdateExercise={handleUpdateExercise}
          loading={loading}
        />
      </div>
    </motion.div>
  );
};

export default ExerciseTracker;