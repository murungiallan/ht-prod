import React, { useState, useEffect, useContext, useCallback, useRef, useMemo } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import { createFoodLog, getUserFoodLogs, updateFoodLog, deleteFoodLog, getFoodStats, copyFoodLog, searchFoods, clusterEatingPatterns } from "../../services/api";
import { toast } from "react-hot-toast";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale } from "chart.js";
import moment from "moment";
import { auth } from "../../firebase/config";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-lg mb-6">
          <p className="text-base font-medium">Something went wrong: {this.state.error?.message || "Unknown error"}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale);

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Modal Component
const FoodLogModal = ({ isOpen, onClose, onSubmit, foodInput, setFoodInput, image, setImage, foodSuggestions, handleSelectFood, loading }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 mb-0"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Log a Meal</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Food Name</label>
              <input
                type="text"
                value={foodInput.name}
                onChange={(e) => setFoodInput(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500"
                placeholder="Search or enter food..."
              />
              {foodSuggestions.length > 0 && (
                <ul className="mt-2 border rounded-lg max-h-40 overflow-y-auto bg-white shadow-md">
                  {foodSuggestions.map((food, idx) => (
                    <li
                      key={idx}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSelectFood(food)}
                    >
                      {food.food_name} ({food.calories} kcal)
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Calories (kcal)</label>
              <input
                type="number"
                value={foodInput.calories}
                onChange={(e) => setFoodInput(prev => ({ ...prev, calories: e.target.value }))}
                className="w-full p-2 border rounded-lg border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Carbs (g)</label>
              <input
                type="number"
                value={foodInput.carbs}
                onChange={(e) => setFoodInput(prev => ({ ...prev, carbs: e.target.value }))}
                className="w-full p-2 border rounded-lg border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Protein (g)</label>
              <input
                type="number"
                value={foodInput.protein}
                onChange={(e) => setFoodInput(prev => ({ ...prev, protein: e.target.value }))}
                className="w-full p-2 border rounded-lg border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Fats (g)</label>
              <input
                type="number"
                value={foodInput.fats}
                onChange={(e) => setFoodInput(prev => ({ ...prev, fats: e.target.value }))}
                className="w-full p-2 border rounded-lg border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Meal Type</label>
              <select
                value={foodInput.mealType}
                onChange={(e) => setFoodInput(prev => ({ ...prev, mealType: e.target.value }))}
                className="w-full p-2 border rounded-lg border-gray-200"
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Date</label>
              <input
                type="date"
                value={foodInput.dateLogged.toISOString().split('T')[0]}
                onChange={(e) => setFoodInput(prev => ({ ...prev, dateLogged: new Date(e.target.value) }))}
                className="w-full p-2 border rounded-lg border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Image (optional)</label>
              <input
                type="file"
                onChange={(e) => setImage(e.target.files[0])}
                className="w-full p-2 border rounded-lg border-gray-200"
                accept="image/*"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                Add Log
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const FoodDiary = () => {
  const { user, logout } = useContext(AuthContext);
  const { socket, getSocket } = useSocket();
  const navigate = useNavigate();

  const getUserToken = async () => {
    try {
      return await auth.currentUser.getIdToken(true);
    } catch (err) {
      throw new Error("Failed to get user token");
    }
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFailedAction, setLastFailedAction] = useState(null);
  const [foodLogs, setFoodLogs] = useState([]);
  const [foodInput, setFoodInput] = useState({ name: "", calories: "", carbs: "", protein: "", fats: "", mealType: "morning", dateLogged: new Date() });
  const [image, setImage] = useState(null);
  const [dateLogged, setDateLogged] = useState(new Date());
  const [foodSuggestions, setFoodSuggestions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterPeriod, setFilterPeriod] = useState("today");
  const [stats, setStats] = useState([]);
  const [eatingPattern, setEatingPattern] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const chartRef = useRef(null);
  const isMounted = useRef(true);

  const handleSessionExpired = useCallback(() => {
    if (!isMounted.current) return;
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  const fetchData = useCallback(async () => {
    if (!user || !isMounted.current) return;
    try {
      setLoading(true);
      const token = await getUserToken();
      const [logs, foodStats] = await Promise.all([getUserFoodLogs(token), getFoodStats(token)]);
      const validatedLogs = logs.map(log => ({
        ...log,
        calories: parseFloat(log.calories) || 0,
        carbs: parseFloat(log.carbs) || 0,
        protein: parseFloat(log.protein) || 0,
        fats: parseFloat(log.fats) || 0,
      }));
      setFoodLogs(validatedLogs.sort((a, b) => new Date(b.date_logged) - new Date(a.date_logged)));
      const validatedStats = foodStats.map(stat => ({
        ...stat,
        totalCalories: parseFloat(stat.totalCalories) || 0,
        totalCarbs: parseFloat(stat.totalCarbs) || 0,
        totalProtein: parseFloat(stat.totalProtein) || 0,
        totalFats: parseFloat(stat.totalFats) || 0,
      }));
      setStats(validatedStats);

      try {
        const clusters = await clusterEatingPatterns(token);
        const userCluster = clusters.find(c => c.userId === user.uid);
        setEatingPattern(userCluster?.cluster || "Unknown");
      } catch (clusterErr) {
        console.error("Failed to fetch eating patterns:", clusterErr);
        setEatingPattern("Data unavailable");
        toast.error("Failed to fetch eating patterns");
      }
    } catch (err) {
      setError("Failed to load food logs or stats");
      setLastFailedAction({ type: "fetchData", params: null });
      toast.error("Failed to load food logs or stats");
      console.error(err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
    } finally {
      setLoading(false);
    }
  }, [user, handleSessionExpired]);

  const debouncedFetchData = useMemo(() => debounce(fetchData, 300), [fetchData]);

  const handleAddFoodLog = useCallback(async (e) => {
    e.preventDefault();
    const { name, calories, carbs, protein, fats, mealType, dateLogged } = foodInput;
    if (!name || !calories || !mealType) {
      setError("Food name, calories, and meal type are required");
      setLastFailedAction({ type: "logFood", params: null });
      toast.error("Food name, calories, and meal type are required");
      return;
    }

    const foodData = {
      food_name: name,
      calories: parseFloat(calories) || 0,
      carbs: carbs ? parseFloat(carbs) : null,
      protein: protein ? parseFloat(protein) : null,
      fats: fats ? parseFloat(fats) : null,
      date_logged: dateLogged.toISOString(),
      meal_type: mealType,
    };

    try {
      setLoading(true);
      const token = await getUserToken();
      await createFoodLog(foodData, image, token);
      setFoodInput({ name: "", calories: "", carbs: "", protein: "", fats: "", mealType: "morning", dateLogged: new Date() });
      setImage(null);
      setError(null);
      setIsModalOpen(false);
      debouncedFetchData();
    } catch (err) {
      setError("Failed to add food log");
      setLastFailedAction({ type: "logFood", params: { ...foodData, image } });
      toast.error("Failed to add food log");
      console.error(err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
    } finally {
      setLoading(false);
    }
  }, [foodInput, dateLogged, image, handleSessionExpired, debouncedFetchData]);

  const handleDeleteFoodLog = useCallback(async (id) => {
    try {
      setLoading(true);
      const token = await getUserToken();
      await deleteFoodLog(id, token);
      setError(null);
      debouncedFetchData();
    } catch (err) {
      setError("Failed to delete food log");
      setLastFailedAction({ type: "deleteFood", params: { id } });
      toast.error("Failed to delete food log");
      console.error(err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
    } finally {
      setLoading(false);
    }
  }, [handleSessionExpired, debouncedFetchData]);

  const handleCopyFoodLog = useCallback(async (log) => {
    if (!log || !log.id) {
      setError("Invalid food log data");
      toast.error("Invalid food log data");
      return;
    }
    try {
      setLoading(true);
      const token = await getUserToken();
      await copyFoodLog(log.id, selectedDate.toISOString(), token);
      toast.success("Food log copied!");
      setError(null);
      debouncedFetchData();
    } catch (err) {
      setError("Failed to copy food log");
      setLastFailedAction({ type: "copyFood", params: { log, selectedDate } });
      toast.error("Failed to copy food log");
      console.error(err);
      if (err.code === "auth/id-token-expired") handleSessionExpired();
    } finally {
      setLoading(false);
    }
  }, [selectedDate, handleSessionExpired, debouncedFetchData]);

  const handleSearchFoods = useCallback(async (query) => {
    if (query.length < 2) {
      setFoodSuggestions([]);
      return;
    }
    try {
      setLoading(true);
      const suggestions = await searchFoods(query);
      const validatedSuggestions = suggestions.map(food => ({
        food_name: food.food_name || "Unknown",
        calories: parseFloat(food.calories) || 0,
        carbs: parseFloat(food.carbs) || 0,
        protein: parseFloat(food.protein) || 0,
        fats: parseFloat(food.fats) || 0,
      }));
      setFoodSuggestions(validatedSuggestions);
    } catch (error) {
      setError("Failed to search foods");
      setLastFailedAction({ type: "searchFoods", params: { query } });
      toast.error("Failed to search foods");
      console.error("Error searching foods:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectFood = useCallback((food) => {
    if (!food) return;
    try {
      setFoodInput(prev => ({
        ...prev,
        name: food.food_name || "",
        calories: (parseFloat(food.calories) || 0).toString(),
        carbs: (parseFloat(food.carbs) || 0).toString(),
        protein: (parseFloat(food.protein) || 0).toString(),
        fats: (parseFloat(food.fats) || 0).toString(),
      }));
      setFoodSuggestions([]);
      recommendAlternative(food);
    } catch (err) {
      console.error("Error selecting food:", err);
      toast.error("Failed to select food");
    }
  }, []);

  const recommendAlternative = useCallback((food) => {
    if (!food || !food.food_name) return;
    try {
      const recommendations = {
        "ice cream": { alt: "yogurt", reason: "lower in sugar and fats" },
        "pizza": { alt: "whole grain wrap with veggies", reason: "higher in fiber, lower in saturated fats" },
        "soda": { alt: "sparkling water", reason: "zero sugar and calories" },
      };
      const foodLower = food.food_name.toLowerCase();
      const rec = Object.entries(recommendations).find(([key]) => foodLower.includes(key));
      if (rec) toast(`Try ${rec[1].alt} instead of ${food.food_name} - ${rec[1].reason}`, { icon: "💡" });
    } catch (err) {
      console.error("Error recommending alternative:", err);
      toast.error("Failed to recommend alternative");
    }
  }, []);

  const applyFilter = useCallback(() => {
    try {
      const now = moment();
      const filters = {
        today: now.clone().startOf("day"),
        yesterday: now.clone().subtract(1, "day").startOf("day"),
        last7: now.clone().subtract(7, "days").startOf("day"),
        last14: now.clone().subtract(14, "days").startOf("day"),
        last28: now.clone().subtract(28, "days").startOf("day"),
        last6months: now.clone().subtract(6, "months").startOf("day"),
        all: null,
      };
      const startDate = filters[filterPeriod] || now.clone().subtract(100, "years").startOf("day");
      return foodLogs.filter(log => {
        const logDate = moment(log.date_logged);
        return !startDate || (logDate.isSameOrAfter(startDate) && logDate.isSameOrBefore(now));
      });
    } catch (err) {
      console.error("Error applying filter:", err);
      setError("Failed to apply date filter");
      return [];
    }
  }, [filterPeriod, foodLogs]);

  const calculateDailyTotals = useCallback((logs) => {
    try {
      return logs.reduce(
        (totals, log) => ({
          calories: totals.calories + (parseFloat(log.calories) || 0),
          carbs: totals.carbs + (parseFloat(log.carbs) || 0),
          protein: totals.protein + (parseFloat(log.protein) || 0),
          fats: totals.fats + (parseFloat(log.fats) || 0),
        }),
        { calories: 0, carbs: 0, protein: 0, fats: 0 }
      );
    } catch (err) {
      console.error("Error calculating daily totals:", err);
      setError("Failed to calculate daily totals");
      return { calories: 0, carbs: 0, protein: 0, fats: 0 };
    }
  }, []);

  const chartData = useMemo(() => {
    try {
      return {
        labels: stats.map(stat => moment(stat.logDate).format("MMM D")),
        datasets: [
          { label: "Calories", data: stats.map(stat => parseFloat(stat.totalCalories) || 0), borderColor: "rgba(239, 68, 68, 1)", backgroundColor: "rgba(239, 68, 68, 0.2)", fill: true },
          { label: "Carbs", data: stats.map(stat => parseFloat(stat.totalCarbs) || 0), borderColor: "rgba(59, 130, 246, 1)", backgroundColor: "rgba(59, 130, 246, 0.2)", fill: true },
          { label: "Protein", data: stats.map(stat => parseFloat(stat.totalProtein) || 0), borderColor: "rgba(16, 185, 129, 1)", backgroundColor: "rgba(16, 185, 129, 0.2)", fill: true },
          { label: "Fats", data: stats.map(stat => parseFloat(stat.totalFats) || 0), borderColor: "rgba(255, 206, 86, 1)", backgroundColor: "rgba(255, 206, 86, 0.2)", fill: true },
        ],
      };
    } catch (err) {
      console.error("Error generating chart data:", err);
      setError("Failed to generate chart data");
      return { labels: [], datasets: [] };
    }
  }, [stats]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true, title: { display: true, text: "Amount" } }, x: { title: { display: true, text: "Date" } } },
  };

  const groupByMeal = useCallback((logs) => {
    try {
      return {
        morning: logs.filter(log => log.meal_type === "morning"),
        afternoon: logs.filter(log => log.meal_type === "afternoon"),
        evening: logs.filter(log => log.meal_type === "evening"),
      };
    } catch (err) {
      console.error("Error grouping logs by meal:", err);
      setError("Failed to group food logs by meal");
      return { morning: [], afternoon: [], evening: [] };
    }
  }, []);

  const handleRetry = useCallback(async () => {
    if (!lastFailedAction) return;
    setError(null);
    const { type, params } = lastFailedAction;
    try {
      switch (type) {
        case "fetchData":
          await debouncedFetchData();
          break;
        case "logFood":
          if (params) await handleAddFoodLog({ preventDefault: () => {} });
          break;
        case "deleteFood":
          if (params) await handleDeleteFoodLog(params.id);
          break;
        case "copyFood":
          if (params) await handleCopyFoodLog(params.log);
          break;
        case "searchFoods":
          if (params) await handleSearchFoods(params.query);
          break;
        default:
          break;
      }
    } catch (err) {
      setError(`Failed to retry ${type}`);
      toast.error(`Failed to retry ${type}`);
      console.error(err);
    } finally {
      setLastFailedAction(null);
    }
  }, [lastFailedAction, debouncedFetchData, handleAddFoodLog, handleDeleteFoodLog, handleCopyFoodLog, handleSearchFoods]);

  useEffect(() => {
    isMounted.current = true;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    const unsubscribe = auth.onIdTokenChanged(async (currentUser) => {
      if (!isMounted.current) return;
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

    debouncedFetchData();

    return () => {
      isMounted.current = false;
      unsubscribe && unsubscribe();
    };
  }, [user, navigate, debouncedFetchData, handleSessionExpired]);

  useEffect(() => {
    if (!socket) {
      try {
        getSocket();
      } catch (err) {
        console.error("Failed to connect socket:", err);
        setError("Failed to connect to real-time updates");
        toast.error("Failed to connect to real-time updates");
      }
      return;
    }

    const handlers = {
      foodLogAdded: (log) => {
        if (!isMounted.current) return;
        try {
          const validatedLog = {
            ...log,
            calories: parseFloat(log.calories) || 0,
            carbs: parseFloat(log.carbs) || 0,
            protein: parseFloat(log.protein) || 0,
            fats: parseFloat(log.fats) || 0,
          };
          setFoodLogs(prev => [validatedLog, ...prev].sort((a, b) => new Date(b.date_logged) - new Date(a.date_logged)));
          toast.success("Food log added!");
        } catch (err) {
          console.error("Error handling foodLogAdded:", err);
          toast.error("Failed to update food log (added)");
        }
      },
      foodLogUpdated: (log) => {
        if (!isMounted.current) return;
        try {
          const validatedLog = {
            ...log,
            calories: parseFloat(log.calories) || 0,
            carbs: parseFloat(log.carbs) || 0,
            protein: parseFloat(log.protein) || 0,
            fats: parseFloat(log.fats) || 0,
          };
          setFoodLogs(prev => prev.map(item => item.id === log.id ? validatedLog : item).sort((a, b) => new Date(b.date_logged) - new Date(a.date_logged)));
          toast.success("Food log updated!");
        } catch (err) {
          console.error("Error handling foodLogUpdated:", err);
          toast.error("Failed to update food log (updated)");
        }
      },
      foodLogDeleted: (id) => {
        if (!isMounted.current) return;
        try {
          setFoodLogs(prev => prev.filter(item => item.id !== parseInt(id)));
          toast.success("Food log deleted!");
        } catch (err) {
          console.error("Error handling foodLogDeleted:", err);
          toast.error("Failed to update food log (deleted)");
        }
      },
    };

    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));
    window.scrollTo(0, 0);

    return () => {
      if (socket) {
        Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
      }
    };
  }, [socket, getSocket]);

  const filteredLogs = applyFilter();
  const dailyLogs = filteredLogs.filter(log => moment(log.date_logged).isSame(selectedDate, "day"));
  const dailyTotals = calculateDailyTotals(dailyLogs);
  const groupedLogs = groupByMeal(dailyLogs);

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div></div>;

  return (
    <ErrorBoundary>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between gap-2">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-gray-800"
            >
              Food Diary
            </motion.h1>
            <p className="text-base text-gray-600">Log your meals and track calories</p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 bg-green-950 text-white rounded-lg hover:bg-green-800 transition-colors mb-4"
          >
            + Add New Log
          </button>
        </div>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-lg mb-6 flex justify-between items-center"
          >
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-base font-medium">{error}</p>
            </div>
            <button
              onClick={handleRetry}
              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none text-sm font-medium flex items-center"
              disabled={loading}
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>
          </motion.div>
        )}
        <div className="space-y-6 mt-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-4 sm:p-6 rounded-xl shadow-md"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="sm:w-1/2">
                <h2 className="text-lg font-semibold mb-2 text-gray-700">Select Date</h2>
                <Calendar
                  onChange={setSelectedDate}
                  value={selectedDate}
                  className="border rounded-lg p-2 w-full"
                />

              <style jsx global>{`
                .react-calendar {
                  border: none !important;
                  font-family: "Inter", sans-serif !important;
                  width: 80% !important;
                  max-width: 80% !important;
                }

                /* --- GRID FIX START --- */
                .react-calendar__month-view__weekdays {
                  display: grid !important;
                  grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
                  width: 100%;
                  text-align: center;
                  font-size: 0.75rem;
                  font-weight: 500;
                  text-transform: uppercase;
                  color: #6b7280; /* text-gray-500 */
                  padding-bottom: 0.5rem;
                  margin-bottom: 0.25rem;
                }

                .react-calendar__month-view__weekdays__weekday abbr {
                  text-decoration: none !important;
                  font-weight: 500;
                }

                .react-calendar__month-view__weekdays__weekday {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }

                .react-calendar__month-view__days {
                  display: grid !important;
                  grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
                  width: 100%;
                  gap: 2px;
                }
                /* --- GRID FIX END --- */

                .react-calendar button {
                  margin: 0;
                  aspect-ratio: 1 / 1;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  transition: background-color 0.2s ease, color 0.2s ease;
                  border: none;
                  background: transparent;
                  padding: 0;
                  font-size: 0.75rem;
                  border-radius: 0.375rem;
                }

                /* --- Navigation Styles --- */
                .react-calendar__navigation {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 0.75rem;
                  border-bottom: 1px solid #f3f4f6; /* border-gray-100 */
                }

                .react-calendar__navigation__label {
                  font-size: 0.75rem;
                }

                .react-calendar__navigation button {
                  min-width: 36px;
                  height: 36px;
                  background: none;
                  color: #4b5563; /* text-gray-600 */
                  transition: background-color 0.2s ease;
                  border-radius: 0.25rem;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  aspect-ratio: auto;
                }

                .react-calendar__navigation button:enabled:hover,
                .react-calendar__navigation button:enabled:focus {
                  background-color: #f3f4f6; /* bg-gray-100 */
                }

                .react-calendar__navigation button:disabled {
                  opacity: 0.5;
                  cursor: not-allowed;
                  background-color: transparent !important;
                }

                /* --- Tile Classes --- */
                .react-calendar__tile--neighboringMonth {
                  /* tileClassName */
                }

                .react-calendar__tile--neighboringMonth:disabled {
                  /* tileClassName */
                }

                .react-calendar__tile--active {
                  background: #f59e0b !important; /* bg-amber-500 */
                  color: #ffffff !important; /* text-white */
                }

                .react-calendar__tile--active:enabled:hover,
                .react-calendar__tile--active:enabled:focus {
                  background: #d97706 !important; /* bg-amber-600 */
                }

                @media (max-width: 480px) {
                  .react-calendar button {
                    font-size: 0.75rem !important;
                  }

                  .react-calendar__navigation {
                    padding: 0.5rem;
                  }

                  .react-calendar__navigation button {
                    min-width: 28px;
                    height: 28px;
                  }

                  .react-calendar__navigation span {
                    font-size: 1rem;
                  }

                  .react-calendar__month-view__weekdays {
                    font-size: 0.65rem;
                    padding-bottom: 0.25rem;
                  }
                }
              `}</style>
              </div>
              <div className="sm:w-1/2">
                <h2 className="text-lg font-semibold mb-2 text-gray-700">Filter Period</h2>
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="w-full p-2 border rounded-lg border-gray-200 mb-4"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last7">Last 7 Days</option>
                  <option value="last14">Last 14 Days</option>
                  <option value="last28">Last 28 Days</option>
                  <option value="last6months">Last 6 Months</option>
                  <option value="all">All Time</option>
                </select>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-800 mb-1">Daily Summary</h3>
                  <p className="text-sm text-blue-700">
                    {dailyLogs.length} items on {moment(selectedDate).format("MMM D, YYYY")}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-4 sm:p-6 rounded-xl shadow-md"
          >
            <h2 className="text-lg font-semibold mb-2 text-gray-700">Nutritional Insights</h2>
            <p className="mb-2 text-sm text-gray-600">Pattern: <span className="font-medium text-blue-600">{eatingPattern}</span></p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {["calories", "carbs", "protein", "fats"].map(nutrient => (
                <div key={nutrient} className="p-2 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 capitalize">{nutrient}</p>
                  <p className="text-sm font-medium">
                    {typeof dailyTotals[nutrient] === "number" && !isNaN(dailyTotals[nutrient])
                      ? `${dailyTotals[nutrient].toFixed(1)} ${nutrient === "calories" ? "kcal" : "g"}`
                      : "N/A"}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-4 sm:p-6 rounded-xl shadow-md"
          >
            <h2 className="text-lg font-semibold mb-2 text-gray-700">Nutritional Trends</h2>
            <div className="h-48 sm:h-64">
              {stats.length > 0 && chartData.labels.length > 0 ? (
                <Line ref={chartRef} data={chartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  No data for this period
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-4 sm:p-6 rounded-xl shadow-md"
          >
            <h2 className="text-lg font-semibold mb-2 text-gray-700">Daily Food Logs ({moment(selectedDate).format("MMM D, YYYY")})</h2>
            {Object.entries(groupedLogs).map(([type, logs]) => (
              <div key={type} className="mb-4">
                <h3 className="text-base font-medium capitalize mb-1 text-gray-700">{type}</h3>
                {logs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[300px] border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2 text-left text-xs">Food</th>
                          <th className="p-2 text-right text-xs">Cal</th>
                          <th className="p-2 text-right text-xs">Carbs</th>
                          <th className="p-2 text-right text-xs">Prot</th>
                          <th className="p-2 text-right text-xs">Fats</th>
                          <th className="p-2 text-right text-xs">Img</th>
                          <th className="p-2 text-right text-xs">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map(log => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="p-2 text-sm">{log.food_name || "Unknown"}</td>
                            <td className="p-2 text-right text-sm">{log.calories || "—"}</td>
                            <td className="p-2 text-right text-sm">{log.carbs || "—"}</td>
                            <td className="p-2 text-right text-sm">{log.protein || "—"}</td>
                            <td className="p-2 text-right text-sm">{log.fats || "—"}</td>
                            <td className="p-2 text-center">
                              {log.image_url ? (
                                <img src={log.image_url} alt={log.food_name || "Food"} className="w-10 h-10 object-cover rounded" onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/40?text=No+Image"; }} />
                              ) : "N/A"}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleCopyFoodLog(log)}
                                className="mr-1 px-1 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                disabled={loading}
                                title="Copy to current date"
                              >
                                Copy
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFoodLog(log.id)}
                                className="px-1 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                disabled={loading}
                              >
                                Del
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">No {type} meals logged</p>
                )}
              </div>
            ))}
            {dailyLogs.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No logs for {moment(selectedDate).format("MMM D, YYYY")}
              </div>
            )}
          </motion.div>
        </div>
        <FoodLogModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddFoodLog}
          foodInput={foodInput}
          setFoodInput={setFoodInput}
          image={image}
          setImage={setImage}
          foodSuggestions={foodSuggestions}
          handleSelectFood={handleSelectFood}
          loading={loading}
        />
      </div>
    </ErrorBoundary>
  );
};

export default FoodDiary;