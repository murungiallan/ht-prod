import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import { getUserFoodLogs, getFoodStats, clusterEatingPatterns, predictCaloricIntake } from "../../services/api";
import { toast } from "react-hot-toast";
import { auth } from "../../firebase/config";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import CalendarCard from "./CalendarCard";
import FilterSummary from "./FilterSummary";
import NutritionalInsights from "./NutritionalInsights";
import NutritionalTrends from "./NutritionalTrends";
import DailyFoodLogs from "./DailyFoodLogs";
import FoodLogModal from "./modals/FoodLogModal";
import moment from "moment-timezone";
import { WiDaySunnyOvercast, WiDaySunny, WiDayWindy } from "react-icons/wi";
import { FiHelpCircle } from "react-icons/fi";

const ErrorBoundary = ({ children, fallbackMessage = "Something went wrong" }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const errorHandler = (error) => {
      setHasError(true);
      setError(error);
    };
    window.addEventListener("error", errorHandler);
    return () => window.removeEventListener("error", errorHandler);
  }, []);

  if (hasError) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-lg">
        <p className="text-base font-medium">{fallbackMessage}: {error?.message || "Unknown error"}</p>
      </div>
    );
  }
  return children;
};

const FoodDiary = () => {
  const { user, logout } = useContext(AuthContext);
  const { socket, getSocket } = useSocket();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFailedAction, setLastFailedAction] = useState(null);
  const [foodLogs, setFoodLogs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(moment().tz("Asia/Singapore").startOf("day").toDate());
  const [filterPeriod, setFilterPeriod] = useState("today");
  const [stats, setStats] = useState([]);
  const [caloriePredictions, setCaloriePredictions] = useState([]);
  const [eatingPattern, setEatingPattern] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [selectedFoodLog, setSelectedFoodLog] = useState(null);
  const isMounted = useRef(true);
  const recentActionRef = useRef(null);

  const handleSessionExpired = useCallback(() => {
    if (!isMounted.current) return;
    toast.error("Session expired. Please log in again.");
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  const getUserToken = useCallback(async () => {
    try {
      if (!auth.currentUser) throw new Error("User not authenticated");
      const token = await auth.currentUser.getIdToken(true); // Force refresh
      const tokenResult = await auth.currentUser.getIdTokenResult();
      const expirationTime = new Date(tokenResult.expirationTime).getTime();
      const currentTime = Date.now();
      if (expirationTime <= currentTime) {
        throw new Error("Token has expired");
      }
      return token;
    } catch (err) {
      console.error("Token refresh failed:", err);
      throw new Error("Failed to get user token: " + err.message);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!user || !isMounted.current) return;
    try {
      setLoading(true);
      setError(null);

      const token = await getUserToken();
      const [logs, foodStats, predictions] = await Promise.all([
        getUserFoodLogs(token),
        getFoodStats(token),
        predictCaloricIntake(token),
      ]);

      const validatedLogs = logs.map((log) => ({
        ...log,
        calories: parseFloat(log.calories) || 0,
        carbs: parseFloat(log.carbs) || 0,
        protein: parseFloat(log.protein) || 0,
        fats: parseFloat(log.fats) || 0,
      }));
      setFoodLogs(validatedLogs.sort((a, b) => new Date(b.date_logged) - new Date(a.date_logged)));
      const validatedStats = foodStats.map((stat) => ({
        ...stat,
        totalCalories: parseFloat(stat.totalCalories) || 0,
        totalCarbs: parseFloat(stat.totalCarbs) || 0,
        totalProtein: parseFloat(stat.totalProtein) || 0,
        totalFats: parseFloat(stat.totalFats) || 0,
      }));
      setStats(validatedStats);
      setCaloriePredictions(predictions || []);

      try {
        const clusters = await clusterEatingPatterns(token);
        const userCluster = clusters.find((c) => c.userId === user.uid);
        setEatingPattern(userCluster?.cluster || "Unknown");
      } catch (clusterErr) {
        console.error("Failed to fetch eating patterns:", clusterErr);
        setEatingPattern("Data unavailable");
        toast.error("Failed to fetch eating patterns");
      }
    } catch (err) {
      setError("Failed to load food logs, stats, or predictions");
      setLastFailedAction({ type: "fetchData", params: null });
      toast.error("Failed to load data: " + err.message);
      console.error(err);
      if (err.message.includes("Token") || err.code === "auth/id-token-expired") {
        handleSessionExpired();
      }
    } finally {
      setLoading(false);
    }
  }, [user, handleSessionExpired, getUserToken]);

  const handleRetry = useCallback(async () => {
    if (!lastFailedAction) return;
    setError(null);
    const { type } = lastFailedAction;
    try {
      if (type === "fetchData") {
        await fetchData();
      }
    } catch (err) {
      setError(`Failed to retry ${type}`);
      toast.error(`Failed to retry ${type}: ${err.message}`);
      console.error(err);
    } finally {
      setLastFailedAction(null);
    }
  }, [lastFailedAction, fetchData]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleOpenFoodDetails = (log) => {
    setSelectedFoodLog(log);
  };

  const handleCloseFoodDetails = () => {
    setSelectedFoodLog(null);
  };

  const mealIcons = {
    morning: <WiDaySunnyOvercast style={{ fontSize: "1.2em", color: "#ffca28", marginRight: "4px" }} />,
    afternoon: <WiDaySunny style={{ fontSize: "1.2em", color: "#ffca28", marginRight: "4px" }} />,
    evening: <WiDayWindy style={{ fontSize: "1.2em", color: "#ffca28", marginRight: "4px" }} />,
  };

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
  
        if (timeUntilExpiration < 5 * 60 * 1000) { // Refresh if less than 5 minutes remaining
          await currentUser.getIdToken(true);
          console.log(`Token refreshed proactively at ${currentTime}`);
        }
      } catch (error) {
        console.error("Error checking token expiration:", error);
        handleSessionExpired();
      }
    });
  
    fetchData();
  
    return () => {
      isMounted.current = false;
      unsubscribe && unsubscribe();
    };
  }, [user, navigate, fetchData, handleSessionExpired]);

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
            image_url: undefined,
            image_data: log.image_data,
          };
          if (recentActionRef.current === `add-${validatedLog.id}` || foodLogs.some((l) => l.id === validatedLog.id)) {
            recentActionRef.current = null;
            return;
          }
          setFoodLogs((prev) =>
            [validatedLog, ...prev].sort((a, b) => new Date(b.date_logged) - new Date(a.date_logged))
          );
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
            image_url: undefined,
            image_data: log.image_data,
          };
          if (recentActionRef.current === `update-${validatedLog.id}`) {
            recentActionRef.current = null;
            return;
          }
          if (foodLogs.some((l) => l.id === validatedLog.id)) {
            setFoodLogs((prev) =>
              prev
                .map((item) => (item.id === validatedLog.id ? validatedLog : item))
                .sort((a, b) => new Date(b.date_logged) - new Date(a.date_logged))
            );
          }
        } catch (err) {
          console.error("Error handling foodLogUpdated:", err);
          toast.error("Failed to update food log (updated)");
        }
      },
      foodLogDeleted: (id) => {
        if (!isMounted.current) return;
        try {
          if (recentActionRef.current === `delete-${id}`) {
            recentActionRef.current = null;
            return;
          }
          if (foodLogs.some((l) => l.id === parseInt(id))) {
            setFoodLogs((prev) => prev.filter((item) => item.id !== parseInt(id)));
          }
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
  }, [socket, getSocket, foodLogs]);

  const getDailySummary = () => {
    const dateStr = moment(selectedDate).tz("Asia/Singapore").format("YYYY-MM-DD");
    const dailyLogs = foodLogs.filter((log) => {
      const logDate = moment(log.date_logged).tz("Asia/Singapore").format("YYYY-MM-DD");
      return logDate === dateStr;
    });
    if (dailyLogs.length === 0)
      return { count: 0, totalCalories: 0, totalCarbs: 0, totalProtein: 0, totalFats: 0 };

    const summary = dailyLogs.reduce(
      (acc, log) => ({
        count: acc.count + 1,
        totalCalories: acc.totalCalories + log.calories,
        totalCarbs: acc.totalCarbs + log.carbs,
        totalProtein: acc.totalProtein + log.protein,
        totalFats: acc.totalFats + log.fats,
      }),
      { count: 0, totalCalories: 0, totalCarbs: 0, totalProtein: 0, totalFats: 0 }
    );

    return summary;
  };

  const dailySummary = getDailySummary();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallbackMessage="An error occurred in the Food Diary">
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-1"
            >
              <h1 className="text-2xl font-bold text-gray-800">Food Diary</h1>
              <p className="text-base text-gray-600">Track your meals and nutrition</p>
            </motion.div>
            <motion.button
              type="button"
              onClick={handleOpenModal}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              + Add New Log
            </motion.button>
          </div>
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-lg mb-6 flex justify-between items-center"
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
                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 text-sm font-medium flex items-center"
                disabled={loading}
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-1">
              <CalendarCard selectedDate={selectedDate} setSelectedDate={setSelectedDate} foodLogs={foodLogs} />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <NutritionalInsights foodLogs={foodLogs} selectedDate={selectedDate} eatingPattern={eatingPattern} />
              <FilterSummary
                filterPeriod={filterPeriod}
                setFilterPeriod={setFilterPeriod}
                foodLogs={foodLogs}
                selectedDate={selectedDate}
                dailySummary={dailySummary}
              />
            </div>
          </div>
          <NutritionalTrends stats={stats} caloriePredictions={caloriePredictions} />
          <DailyFoodLogs
            foodLogs={foodLogs}
            selectedDate={selectedDate}
            setFoodLogs={setFoodLogs}
            getUserToken={getUserToken}
            handleSessionExpired={handleSessionExpired}
            onOpenFoodDetails={handleOpenFoodDetails}
          />
          <FoodLogModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            getUserToken={getUserToken}
            setFoodLogs={setFoodLogs}
            handleSessionExpired={handleSessionExpired}
            recentActionRef={recentActionRef}
          />

          <ErrorBoundary fallbackMessage="Failed to display food details">
            <AnimatePresence>
              {selectedFoodLog && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                  onClick={handleCloseFoodDetails}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={handleCloseFoodDetails}
                      className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                      aria-label="Close modal"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    <div className="flex flex-col items-center">
                      <div className="mb-4">
                        {selectedFoodLog.image_data ? (
                          <img
                            src={selectedFoodLog.image_data}
                            alt={selectedFoodLog.food_name || "Food"}
                            className="w-32 h-32 object-cover rounded-full border border-gray-200 shadow-sm"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/128?text=•";
                            }}
                          />
                        ) : (
                          <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-4xl shadow-sm">
                            •
                          </div>
                        )}
                      </div>

                      <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">
                        {selectedFoodLog.food_name || "Unknown"}
                      </h3>

                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm text-gray-500 capitalize flex items-center">
                          {mealIcons[selectedFoodLog.meal_type]}
                          {selectedFoodLog.meal_type}
                        </span>
                        <span className="text-sm text-gray-500">
                          {moment(selectedFoodLog.date_logged)
                            .tz("Asia/Singapore")
                            .format("MMM D, YYYY h:mm A")}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 w-full bg-gray-50 p-4 rounded-lg shadow-inner">
                        <div className="text-center">
                          <span className="block text-xs text-gray-500">Calories</span>
                          <span className="text-lg font-medium text-gray-800">
                            {selectedFoodLog.calories || "0"} kcal
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="block text-xs text-gray-500">Carbs</span>
                          <span className="text-lg font-medium text-gray-800">{selectedFoodLog.carbs || "0"}g</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-xs text-gray-500">Protein</span>
                          <span className="text-lg font-medium text-gray-800">
                            {selectedFoodLog.protein || "0"}g
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="block text-xs text-gray-500">Fats</span>
                          <span className="text-lg font-medium text-gray-800">{selectedFoodLog.fats || "0"}g</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </ErrorBoundary>

          <div
            style={{
              position: "fixed",
              bottom: "20px",
              left: "20px",
              backgroundColor: "#1a73e8",
              color: "white",
              borderRadius: "50%",
              width: "48px",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              cursor: "pointer",
              zIndex: 1100,
            }}
            onMouseEnter={() => setIsHelpOpen(true)}
            onMouseLeave={() => setIsHelpOpen(false)}
          >
            <FiHelpCircle style={{ fontSize: "24px", opacity: "70%" }} />
            {isHelpOpen && (
              <div className="absolute bottom-12 left-8 w-64 bg-white p-4 rounded-lg shadow-lg text-sm text-gray-600">
                <p>
                  <strong>Food Diary Features:</strong>
                </p>
                <ul className="list-disc pl-4">
                  <li>Select a date to view logs using the calendar.</li>
                  <li>Filter logs by time period (e.g., today, last 7 days).</li>
                  <li>View nutritional insights and daily totals.</li>
                  <li>Track trends and caloric predictions with charts.</li>
                  <li>Manage food logs (add, copy, delete) in the table.</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default FoodDiary;