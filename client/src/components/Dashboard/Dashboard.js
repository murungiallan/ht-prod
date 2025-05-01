import { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { auth } from "../../firebase/config";
import { FaPills, FaUtensils, FaRunning, FaTrophy, FaBell, FaCog } from "react-icons/fa";
import { useSocket } from '../../contexts/SocketContext';
import { 
  getUserMedications, 
  getTakenMedicationHistory, 
  calculateMedicationStreak,
  getExerciseStats,
  getUserExercises,
  saveWeeklyGoals,
  getWeeklyGoals
} from "../../services/api";
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Tooltip, Legend, TimeScale, Filler, CategoryScale } from 'chart.js';
import 'chartjs-adapter-moment';
import moment from 'moment';
import { motion, AnimatePresence } from 'framer-motion';
import annotationPlugin from 'chartjs-plugin-annotation';
import { toast } from "react-toastify";

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, TimeScale, Filler, CategoryScale, annotationPlugin);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
  </div>
);

const AuthRequiredMessage = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center p-8 bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Authentication Required</h2>
      <p className="mb-4 text-gray-600">Please log in to view your health dashboard.</p>
      <button 
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        onClick={() => window.location.href = '/'}
      >
        Go to Login
      </button>
    </div>
  </div>
);

const ErrorMessage = ({ message, onRetry }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center p-8 bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Error Loading Dashboard</h2>
      <p className="text-red-500 mb-4">{message}</p>
      <button 
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        onClick={onRetry}
      >
        Try Again
      </button>
    </div>
  </div>
);

const GoalsModal = ({ isOpen, onClose, onSave }) => {
  const [foodGoal, setFoodGoal] = useState('');
  const [exerciseGoal, setExerciseGoal] = useState('');

  const handleSubmit = () => {
    if (!foodGoal || !exerciseGoal) {
      alert("Please enter both goals.");
      return;
    }
    onSave(Number(foodGoal), Number(exerciseGoal));
    onClose();
    toast.success("Weekly Goals Updated!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 mb-0">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md m-2">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Set Your Weekly Goals</h2>
        <p className="text-gray-600 mb-4">Please set your weekly calorie goals for food intake and exercise.</p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weekly Food Calorie Goal (kcal)
          </label>
          <input
            type="number"
            value={foodGoal}
            onChange={(e) => setFoodGoal(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 14000"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weekly Exercise Calorie Goal (kcal)
          </label>
          <input
            type="number"
            value={exerciseGoal}
            onChange={(e) => setExerciseGoal(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 2000"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Goals
          </button>
        </div>
      </div>
    </div>
  );
};

const WeeklyActivity = ({ weeklyData, chartOptions, calorieChartRef, durationChartRef, sessionsChartRef }) => {
  const chartConfigs = {
    calories: {
      title: "Calories Burned (Last 7 Days)",
      icon: (
        <svg className="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M12.395 2.553a1 1 0 00-1.45-.385c危機.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
            clipRule="evenodd"
          />
        </svg>
      ),
      data: {
        labels: weeklyData.labels || [],
        datasets: [
          {
            label: "Calories Burned",
            data: weeklyData.calories || [],
            borderColor: "rgba(239, 68, 68, 1)",
            backgroundColor: "rgba(239, 68, 68, 0.2)",
            borderWidth: 1,
            pointBackgroundColor: "rgba(239, 68, 68, 1)",
            pointRadius: 2,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        ...chartOptions,
        plugins: {
          ...chartOptions.plugins,
          annotation: {
            annotations: {
              goalLine: {
                type: 'line',
                yMin: 2000 / 7,
                yMax: 2000 / 7,
                borderColor: 'rgba(255, 99, 132, 0.5)',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                  content: 'Goal: ~285 cal/day',
                  enabled: true,
                  position: 'end',
                  backgroundColor: 'rgba(255, 99, 132, 0.8)',
                  color: 'white',
                  font: {
                    size: 10,
                  },
                },
              },
            },
          },
        },
      },
    },
    duration: {
      title: "Duration in minutes (Last 7 Days)",
      icon: (
        <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
      ),
      data: {
        labels: weeklyData.labels || [],
        datasets: [
          {
            label: "Duration",
            data: weeklyData.duration || [],
            borderColor: "rgba(59, 130, 246, 1)",
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            borderWidth: 1,
            pointBackgroundColor: "rgba(59, 130, 246, 1)",
            pointRadius: 2,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        ...chartOptions,
        plugins: {
          ...chartOptions.plugins,
          annotation: {
            annotations: {
              goalLine: {
                type: 'line',
                yMin: 150 / 7,
                yMax: 150 / 7,
                borderColor: 'rgba(59, 130, 246, 0.5)',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                  content: 'Goal: ~21 min/day',
                  enabled: true,
                  position: 'end',
                  backgroundColor: 'rgba(59, 130, 246, 0.8)',
                  color: 'white',
                  font: {
                    size: 10,
                  },
                },
              },
            },
          },
        },
      },
    },
    sessions: {
      title: "Total Sessions (Last 7 Days)",
      icon: (
        <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path
            fillRule="evenodd"
            d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2 2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
            clipRule="evenodd"
          />
        </svg>
      ),
      data: {
        labels: weeklyData.labels || [],
        datasets: [
          {
            label: "Sessions",
            data: weeklyData.sessions || [],
            borderColor: "rgba(16, 185, 129, 1)",
            backgroundColor: "rgba(16, 185, 129, 0.2)",
            borderWidth: 1,
            pointBackgroundColor: "rgba(16, 185, 129, 1)",
            pointRadius: 2,
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        ...chartOptions,
        plugins: {
          ...chartOptions.plugins,
          annotation: {
            annotations: {
              goalLine: {
                type: 'line',
                yMin: 5 / 7,
                yMax: 5 / 7,
                borderColor: 'rgba(16, 185, 129, 0.5)',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                  content: 'Goal: ~0.7 sessions/day',
                  enabled: true,
                  position: 'end',
                  backgroundColor: 'rgba(16, 185, 129, 0.8)',
                  color: 'white',
                  font: {
                    size: 10,
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4 w-full"
    >
      <div className="flex flex-wrap gap-4 sm:gap-6">
        {/* Calories Burned Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 w-full lg:w-[calc(50%-0.75rem)]">
          <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center">
            {chartConfigs.calories.icon}
            {chartConfigs.calories.title}
          </h3>
          <div className="h-64 w-full">
            {weeklyData.calories && weeklyData.calories.some(value => value > 0) ? (
              <Line ref={calorieChartRef} data={chartConfigs.calories.data} options={chartConfigs.calories.options} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No calorie data available for this period</p>
              </div>
            )}
          </div>
        </div>
        {/* Duration Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 w-full lg:w-[calc(50%-0.75rem)]">
          <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center">
            {chartConfigs.duration.icon}
            {chartConfigs.duration.title}
          </h3>
          <div className="h-64 w-full">
            {weeklyData.duration && weeklyData.duration.some(value => value > 0) ? (
              <Line ref={durationChartRef} data={chartConfigs.duration.data} options={chartConfigs.duration.options} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No duration data available for this period</p>
              </div>
            )}
          </div>
        </div>
        {/* Sessions Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 w-full">
          <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center">
            {chartConfigs.sessions.icon}
            {chartConfigs.sessions.title}
          </h3>
          <div className="h-64 w-full">
            {weeklyData.sessions && weeklyData.sessions.some(value => value > 0) ? (
              <Line ref={sessionsChartRef} data={chartConfigs.sessions.data} options={chartConfigs.sessions.options} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No sessions data available for this period</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const { user, loading: authLoading, logout } = useContext(AuthContext);
  const { socket } = useSocket();
  const [medications, setMedications] = useState([]);
  const [adherenceData, setAdherenceData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [streak, setStreak] = useState(0);
  const [fetchError, setFetchError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exerciseStats, setExerciseStats] = useState({ totalDuration: 0 });
  const [exercises, setExercises] = useState([]);
  const [weeklyData, setWeeklyData] = useState({
    calories: [],
    duration: [],
    sessions: [],
    labels: [],
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasNewActivity, setHasNewActivity] = useState(false);
  const [weeklyGoals, setWeeklyGoals] = useState({ weekly_food_calorie_goal: null, weekly_exercise_calorie_goal: null });
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const notificationsRef = useRef(null);
  const settingsRef = useRef(null);

  // Chart refs for accessing chart instances
  const medicationChartRef = useRef(null);
  const foodChartRef = useRef(null);
  const calorieChartRef = useRef(null);
  const durationChartRef = useRef(null);
  const sessionsChartRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!user || !isMounted) return;

      setIsLoading(true);
      setFetchError(null);

      try {
        const token = await auth.currentUser.getIdToken(true);
        
        // Fetch weekly goals
        const goals = await getWeeklyGoals(token);
        if (isMounted) {
          setWeeklyGoals(goals);
          if (goals.weekly_food_calorie_goal === null || goals.weekly_exercise_calorie_goal === null) {
            setShowGoalsModal(true);
          }
        }

        // Fetch medications
        const userMedications = await getUserMedications(token);
        if (!isMounted) return;
        setMedications(userMedications || []);

        // Fetch medication history and exercises
        const [history, userExercises] = await Promise.all([
          getTakenMedicationHistory(5),
          getUserExercises(token),
        ]);
        if (!isMounted) return;
        setExercises(userExercises || []);
        
        // Compute recent activities
        const medicationActivities = history.map((entry) => ({
          type: 'medication',
          description: `Logged ${entry.medication_name} on ${moment(entry.date).format('MMM D, YYYY')} at ${moment(entry.takenAt).format('h:mm A')}`,
          timestamp: entry.takenAt,
        }));

        const recentExercise = userExercises && userExercises.length > 0 ? userExercises[0] : null;
        const exerciseActivity = recentExercise ? [{
          type: 'exercise',
          description: `Logged ${recentExercise.activity} (${recentExercise.duration} min) on ${moment(recentExercise.date_logged).format('MMM D, YYYY')}`,
          timestamp: recentExercise.date_logged,
        }] : [];

        const combinedActivities = [...medicationActivities, ...exerciseActivity]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5);
        if (!isMounted) return;
        setRecentActivities(combinedActivities);

        // Fetch full history for adherence data
        const fullHistory = await getTakenMedicationHistory();
        if (!isMounted) return;
        calculateAdherenceData(userMedications || [], fullHistory);

        // Fetch streak
        const userStreak = await calculateMedicationStreak();
        if (!isMounted) return;
        setStreak(userStreak || 0);

        // Fetch exercise stats
        const exerciseStats = await getExerciseStats(token);
        if (!isMounted) return;
        setExerciseStats({
          totalDuration: exerciseStats?.totalDuration || 0,
        });

        // Compute weekly data for charts
        computeWeeklyData(userExercises || []);
      } catch (err) {
        if (!isMounted) return;
        setFetchError("Failed to load dashboard data");
        if (err.message && err.message.includes("Unauthorized")) {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (user && !authLoading) fetchData();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, logout]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleMedicationUpdate = async (updatedMedication) => {
      try {
        setMedications((prev) =>
          prev.map((med) =>
            med.id === updatedMedication.id ? updatedMedication : med
          )
        );

        const history = await getTakenMedicationHistory(5);
        const medicationActivities = history.map((entry) => ({
          type: 'medication',
          description: `Logged ${entry.medication_name} on ${moment(entry.date).format('MMM D, YYYY')} at ${moment(entry.takenAt).format('h:mm A')}`,
          timestamp: entry.takenAt,
        }));

        const recentExercise = exercises.length > 0 ? exercises[0] : null;
        const exerciseActivity = recentExercise ? [{
          type: 'exercise',
          description: `Logged ${recentExercise.activity} (${recentExercise.duration} min) on ${moment(recentExercise.date_logged).format('MMM D, YYYY')}`,
          timestamp: recentExercise.date_logged,
        }] : [];

        const combinedActivities = [...medicationActivities, ...exerciseActivity]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5);
        setRecentActivities(combinedActivities);

        const fullHistory = await getTakenMedicationHistory();
        calculateAdherenceData(
          medications.map(med => med.id === updatedMedication.id ? updatedMedication : med),
          fullHistory
        );

        const userStreak = await calculateMedicationStreak();
        setStreak(userStreak || 0);

        setHasNewActivity(true);
      } catch (err) {
        console.error("Error in handleMedicationUpdate:", err);
      }
    };

    const handleExerciseAdded = async (newExercise) => {
      try {
        const updatedExercises = [newExercise, ...exercises].sort((a, b) => new Date(b.date_logged) - new Date(a.date_logged));
        setExercises(updatedExercises);
        computeWeeklyData(updatedExercises);

        const history = await getTakenMedicationHistory(5);
        const medicationActivities = history.map((entry) => ({
          type: 'medication',
          description: `Logged ${entry.medication_name} on ${moment(entry.date).format('MMM D, YYYY')} at ${moment(entry.takenAt).format('h:mm A')}`,
          timestamp: entry.takenAt,
        }));

        const exerciseActivity = [{
          type: 'exercise',
          description: `Logged ${newExercise.activity} (${newExercise.duration} min) on ${moment(newExercise.date_logged).format('MMM D, YYYY')}`,
          timestamp: newExercise.date_logged,
        }];

        const combinedActivities = [...medicationActivities, ...exerciseActivity]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5);
        setRecentActivities(combinedActivities);

        const token = await auth.currentUser.getIdToken(true);
        const exerciseStats = await getExerciseStats(token);
        setExerciseStats({
          totalDuration: exerciseStats?.totalDuration || 0,
        });

        setHasNewActivity(true);
      } catch (err) {
        console.error("Error in handleExerciseAdded:", err);
      }
    };

    const handleExerciseDeleted = async (id) => {
      try {
        const updatedExercises = exercises.filter((exercise) => exercise.id !== id);
        setExercises(updatedExercises);
        computeWeeklyData(updatedExercises);

        const history = await getTakenMedicationHistory(5);
        const medicationActivities = history.map((entry) => ({
          type: 'medication',
          description: `Logged ${entry.medication_name} on ${moment(entry.date).format('MMM D, YYYY')} at ${moment(entry.takenAt).format('h:mm A')}`,
          timestamp: entry.takenAt,
        }));

        const recentExercise = updatedExercises.length > 0 ? updatedExercises[0] : null;
        const exerciseActivity = recentExercise ? [{
          type: 'exercise',
          description: `Logged ${recentExercise.activity} (${recentExercise.duration} min) on ${moment(recentExercise.date_logged).format('MMM D, YYYY')}`,
          timestamp: recentExercise.date_logged,
        }] : [];

        const combinedActivities = [...medicationActivities, ...exerciseActivity]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5);
        setRecentActivities(combinedActivities);

        const token = await auth.currentUser.getIdToken(true);
        const exerciseStats = await getExerciseStats(token);
        setExerciseStats({
          totalDuration: exerciseStats?.totalDuration || 0,
        });

        setHasNewActivity(true);
      } catch (err) {
        console.error("Error in handleExerciseDeleted:", err);
      }
    };

    const handleExerciseUpdated = async (updatedExercise) => {
      try {
        const updatedExercises = exercises
          .map((exercise) => (exercise.id === updatedExercise.id ? updatedExercise : exercise))
          .sort((a, b) => new Date(b.date_logged) - new Date(a.date_logged));
        setExercises(updatedExercises);
        computeWeeklyData(updatedExercises);

        const history = await getTakenMedicationHistory(5);
        const medicationActivities = history.map((entry) => ({
          type: 'medication',
          description: `Logged ${entry.medication_name} on ${moment(entry.date).format('MMM D, YYYY')} at ${moment(entry.takenAt).format('h:mm A')}`,
          timestamp: entry.takenAt,
        }));

        const exerciseActivity = [{
          type: 'exercise',
          description: `Logged ${updatedExercise.activity} (${updatedExercise.duration} min) on ${moment(updatedExercise.date_logged).format('MMM D, YYYY')}`,
          timestamp: updatedExercise.date_logged,
        }];

        const combinedActivities = [...medicationActivities, ...exerciseActivity]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5);
        setRecentActivities(combinedActivities);

        const token = await auth.currentUser.getIdToken(true);
        const exerciseStats = await getExerciseStats(token);
        setExerciseStats({
          totalDuration: exerciseStats?.totalDuration || 0,
        });

        setHasNewActivity(true);
      } catch (err) {
        console.error("Error in handleExerciseUpdated:", err);
      }
    };

    socket.on("medicationUpdated", handleMedicationUpdate);
    socket.on("exerciseAdded", handleExerciseAdded);
    socket.on("exerciseDeleted", handleExerciseDeleted);
    socket.on("exerciseUpdated", handleExerciseUpdated);
    socket.on("error", (error) => {
      console.error("Socket error:", error.message);
    });

    return () => {
      socket.off("medicationUpdated", handleMedicationUpdate);
      socket.off("exerciseAdded", handleExerciseAdded);
      socket.off("exerciseDeleted", handleExerciseDeleted);
      socket.off("exerciseUpdated", handleExerciseUpdated);
      socket.off("error");
    };
  }, [socket, user, exercises, medications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showNotifications &&
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
        setHasNewActivity(false);
      }
  
      if (
        showSettings &&
        settingsRef.current &&
        !settingsRef.current.contains(event.target)
      ) {
        setShowSettings(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
  
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showSettings]);

  const handleSaveGoals = async (foodGoal, exerciseGoal) => {
    try {
      const token = await auth.currentUser.getIdToken(true);
      await saveWeeklyGoals(foodGoal, exerciseGoal, token);
      setWeeklyGoals({
        weekly_food_calorie_goal: foodGoal,
        weekly_exercise_calorie_goal: exerciseGoal,
      });
    } catch (err) {
      console.error("Error saving weekly goals:", err);
      alert("Failed to save goals. Please try again.");
    }
  };

  const calculateOverallAdherence = () => {
    let totalDoses = 0;
    let takenDoses = 0;

    if (!medications || medications.length === 0) return 0;

    medications.forEach((med) => {
      if (!med.doses || typeof med.doses !== "object") return;

      Object.values(med.doses).forEach((dosesForDate) => {
        if (!Array.isArray(dosesForDate)) return;
        dosesForDate.forEach((dose) => {
          totalDoses++;
          if (dose.taken) takenDoses++;
        });
      });
    });

    return totalDoses > 0 ? ((takenDoses / totalDoses) * 100).toFixed(2) : 0;
  };

  const adherencePercentage = calculateOverallAdherence();

  const calculateAdherenceData = (meds, history) => {
    const days = 7;
    const adherenceByDay = [];
    const today = moment().local();

    for (let i = days - 1; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').startOf('day');
      let totalDoses = 0;
      let takenDoses = 0;

      if (meds && meds.length > 0) {
        meds.forEach((med) => {
          const startDate = moment(med.start_date);
          const endDate = moment(med.end_date);
          if (date.isBefore(startDate) || date.isAfter(endDate)) {
            return;
          }

          if (med.times && Array.isArray(med.times)) {
            totalDoses += med.times.length;
          }
        });
      }

      takenDoses = history && history.length > 0 ? history.filter((entry) => {
        const entryDate = moment(entry.date).startOf('day');
        return entryDate.isSame(date, 'day');
      }).length : 0;

      const adherence = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;
      adherenceByDay.push({
        date: date.toDate(),
        adherence: adherence.toFixed(2),
      });
    }

    setAdherenceData(adherenceByDay);
  };

  const computeWeeklyData = (exercisesToCompute) => {
    if (!exercisesToCompute || exercisesToCompute.length === 0) {
      setWeeklyData({
        calories: [],
        duration: [],
        sessions: [],
        labels: [],
      });
      return;
    }

    // Normalize today to midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create array of last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();

    // Format dates for comparison and labels
    const formattedDates = last7Days.map(date => ({
      dateObj: date,
      dateString: date.toISOString().split('T')[0], // YYYY-MM-DD for reference
      shortDay: date.toLocaleDateString("en-US", { weekday: "short" })
    }));

    // Calculate data for each day
    const caloriesData = formattedDates.map(({ dateObj }) => {
      const dailyExercises = exercisesToCompute.filter(ex => {
        if (!ex.date_logged) return false;
        const exDate = new Date(ex.date_logged);
        exDate.setHours(0, 0, 0, 0);
        return exDate.getTime() === dateObj.getTime();
      });
      return dailyExercises.reduce((sum, ex) => sum + (Number(ex.calories_burned) || 0), 0);
    });

    const durationData = formattedDates.map(({ dateObj }) => {
      const dailyExercises = exercisesToCompute.filter(ex => {
        if (!ex.date_logged) return false;
        const exDate = new Date(ex.date_logged);
        exDate.setHours(0, 0, 0, 0);
        return exDate.getTime() === dateObj.getTime();
      });
      return dailyExercises.reduce((sum, ex) => sum + (Number(ex.duration) || 0), 0);
    });

    const sessionsData = formattedDates.map(({ dateObj }) => {
      const dailyExercises = exercisesToCompute.filter(ex => {
        if (!ex.date_logged) return false;
        const exDate = new Date(ex.date_logged);
        exDate.setHours(0, 0, 0, 0);
        return exDate.getTime() === dateObj.getTime();
      });
      return dailyExercises.length;
    });

    setWeeklyData({
      calories: caloriesData,
      duration: durationData,
      sessions: sessionsData,
      labels: formattedDates.map(date => date.shortDay),
    });
  };
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

  const chartData = {
    datasets: [
      {
        label: 'Adherence (%)',
        data: adherenceData.map((entry) => ({
          x: entry.date,
          y: entry.adherence,
        })),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const medicationChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: 'MMM D',
          },
        },
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
          color: "#6B7280",
        },
        ticks: {
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          color: "#6B7280",
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Adherence (%)',
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
          color: "#6B7280",
        },
        ticks: {
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          color: "#6B7280",
        },
        grid: {
          color: "rgba(209, 213, 219, 0.3)",
        },
      },
    },
    plugins: {
      legend: {
        display: true,
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
        callbacks: {
          label: (context) => `${context.parsed.y}%`,
        },
      },
      annotation: {
        annotations: {
          goalLine: {
            type: 'line',
            yMin: 80,
            yMax: 80,
            borderColor: 'rgba(75, 192, 192, 0.5)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              content: 'Goal: 80%',
              enabled: true,
              position: 'end',
              backgroundColor: 'rgba(75, 192, 192, 0.8)',
              color: 'white',
              font: {
                size: 10,
              },
            },
          },
        },
      },
    },
  };

  const foodChartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Food Intake (kcal)",
        data: [1800, 1750, 1900, 1650, 2000, 1850, 1700],
        borderColor: "rgba(34, 197, 94, 1)",
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const foodChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      annotation: {
        annotations: {
          goalLine: {
            type: 'line',
            yMin: weeklyGoals.weekly_food_calorie_goal ? weeklyGoals.weekly_food_calorie_goal / 7 : 2000,
            yMax: weeklyGoals.weekly_food_calorie_goal ? weeklyGoals.weekly_food_calorie_goal / 7 : 2000,
            borderColor: 'rgba(34, 197, 94, 0.5)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              content: weeklyGoals.weekly_food_calorie_goal 
                ? `Goal: ~${Math.round(weeklyGoals.weekly_food_calorie_goal / 7)} kcal/day`
                : 'Goal: 2,000 kcal/day',
              enabled: true,
              position: 'end',
              backgroundColor: 'rgba(34, 197, 94, 0.8)',
              color: 'white',
              font: {
                size: 10,
              },
            },
          },
        },
      },
    },
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    setShowSettings(false); // Close settings if open
    setHasNewActivity(false);
  };

  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
    setShowNotifications(false); // Close notifications if open
  };

  const downloadChartImage = (chartRef, fileName) => {
    if (chartRef.current) {
      const chart = chartRef.current;
      const image = chart.toBase64Image('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("Chart is not available for download.");
    }
  };

  const downloadChartDataAsCSV = (data, labels, fileName, labelField = 'label', dataField = 'data') => {
    if (!data || !labels) {
      alert("No data available to download.");
      return;
    }

    // Prepare CSV content
    const headers = ['Date', dataField.charAt(0).toUpperCase() + dataField.slice(1)];
    const rows = labels.map((label, index) => {
      let value;
      if (dataField === 'adherence') {
        value = data[index]?.adherence || 0;
      } else if (dataField === 'data') {
        value = data[index] || 0;
      } else {
        value = data[dataField][index] || 0;
      }
      return [label, value];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create a downloadable file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <AuthRequiredMessage />;
  }

  if (fetchError) {
    return <ErrorMessage message={fetchError} onRetry={() => window.location.reload()} />;
  }

  const foodIntakeAverage = foodChartData.datasets[0].data.reduce((a, b) => a + b, 0) / foodChartData.labels.length;
  const totalFoodIntake = foodChartData.datasets[0].data.reduce((a, b) => a + b, 0);
  const totalCaloriesBurned = weeklyData.calories.reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 w-full">
      <GoalsModal
        isOpen={showGoalsModal}
        onClose={() => setShowGoalsModal(false)}
        onSave={handleSaveGoals}
      />
      <div className="w-full">
        <header className="mb-6 sm:mb-8 relative px-2 sm:px-0">
          <div className="flex justify-between items-center w-full">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 capitalize">
                Hello, {user?.displayName || user?.username || "User"}
              </h1>
              <p className="text-gray-500 mt-1 text-sm">Your health overview at a glance</p>
            </div>
            <div className="flex items-center space-x-2">
              {/* Notifications Icon */}
              <div className="relative">
                <button
                  onClick={handleNotificationClick}
                  className="p-2 text-gray-600 hover:text-gray-800 focus:outline-none relative"
                  aria-label="Notifications"
                >
                  <FaBell className="text-xl" />
                  {hasNewActivity && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-600 rounded-full border-2 border-gray-50"></span>
                  )}
                </button>
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      ref={notificationsRef}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-10"
                    >
                      <div className="p-4">
                        <ul className="space-y-3 max-h-64 overflow-y-auto mb-4">
                          {recentActivities.length > 0 ? (
                            recentActivities.map((activity, index) => (
                              <li key={index} className="text-sm flex items-center justify-between text-gray-600">
                                <div className="flex items-center">
                                  <span className={`w-2 h-2 rounded-full mr-2 ${activity.type === 'medication' ? 'bg-blue-500' : 'bg-teal-500'}`}></span>
                                  <span>{activity.description}</span>
                                </div>
                                <span className="text-gray-400 text-xs">
                                  {moment(activity.timestamp).fromNow()}
                                </span>
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-gray-600">No recent activities</li>
                          )}
                        </ul>
                        <p className="text-sm text-gray-600">
                          <span className={`w-2 h-2 rounded-full mr-2 bg-red-700`}></span>
                          {streak > 0
                            ? `${streak}-day medication adherence streak! 🎉`
                            : "Start a medication adherence streak today!"}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Settings Icon */}
              <div className="relative">
                <button
                  onClick={handleSettingsClick}
                  className="p-2 text-gray-600 hover:text-gray-800 focus:outline-none relative"
                  aria-label="Settings"
                >
                  <FaCog className="text-xl" />
                </button>
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      ref={settingsRef}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-10"
                    >
                      <div className="p-4">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Download Charts</h3>
                        <ul className="space-y-2">
                          {/* Medication Adherence Chart */}
                          <li>
                            <div className="text-sm font-medium text-gray-700">Medication Adherence</div>
                            <div className="flex space-x-2 mt-1">
                              <button
                                onClick={() => downloadChartImage(medicationChartRef, 'medication-adherence-chart')}
                                className="text-sm text-blue-600 hover:text-blue-950"
                              >
                                Image (PNG)
                              </button>
                              <button
                                onClick={() => downloadChartDataAsCSV(
                                  adherenceData,
                                  adherenceData.map(entry => moment(entry.date).format('MMM D')),
                                  'medication-adherence-data',
                                  'label',
                                  'adherence'
                                )}
                                className="text-sm text-blue-600 hover:text-blue-950"
                              >
                                Data (CSV)
                              </button>
                            </div>
                          </li>
                          {/* Food Intake Chart */}
                          <li>
                            <div className="text-sm font-medium text-gray-700">Food Calorie Intake</div>
                            <div className="flex space-x-2 mt-1">
                              <button
                                onClick={() => downloadChartImage(foodChartRef, 'food-intake-chart')}
                                className="text-sm text-blue-600 hover:text-blue-950"
                              >
                                Image (PNG)
                              </button>
                              <button
                                onClick={() => downloadChartDataAsCSV(
                                  foodChartData.datasets[0],
                                  foodChartData.labels,
                                  'food-intake-data'
                                )}
                                className="text-sm text-blue-600 hover:text-blue-950"
                              >
                                Data (CSV)
                              </button>
                            </div>
                          </li>
                          {/* Weekly Activity: Calories */}
                          <li>
                            <div className="text-sm font-medium text-gray-700">Calories Burned - Exercise</div>
                            <div className="flex space-x-2 mt-1">
                              <button
                                onClick={() => downloadChartImage(calorieChartRef, 'calories-burned-chart')}
                                className="text-sm text-blue-600 hover:text-blue-950"
                              >
                                Image (PNG)
                              </button>
                              <button
                                onClick={() => downloadChartDataAsCSV(
                                  weeklyData,
                                  weeklyData.labels,
                                  'calories-burned-data',
                                  'label',
                                  'calories'
                                )}
                                className="text-sm text-blue-600 hover:text-blue-950"
                              >
                                Data (CSV)
                              </button>
                            </div>
                          </li>
                          {/* Weekly Activity: Duration */}
                          <li>
                            <div className="text-sm font-medium text-gray-700">Duration - Exercise</div>
                            <div className="flex space-x-2 mt-1">
                              <button
                                onClick={() => downloadChartImage(durationChartRef, 'duration-chart')}
                                className="text-sm text-blue-600 hover:text-blue-950"
                              >
                                Image (PNG)
                              </button>
                              <button
                                onClick={() => downloadChartDataAsCSV(
                                  weeklyData,
                                  weeklyData.labels,
                                  'duration-data',
                                  'label',
                                  'duration'
                                )}
                                className="text-sm text-blue-600 hover:text-blue-950"
                              >
                                Data (CSV)
                              </button>
                            </div>
                          </li>
                          {/* Weekly Activity: Sessions */}
                          <li>
                            <div className="text-sm font-medium text-gray-700">Sessions - Exercise</div>
                            <div className="flex space-x-2 mt-1">
                              <button
                                onClick={() => downloadChartImage(sessionsChartRef, 'sessions-chart')}
                                className="text-sm text-blue-600 hover:text-blue-950"
                              >
                                Image (PNG)
                              </button>
                              <button
                                onClick={() => downloadChartDataAsCSV(
                                  weeklyData,
                                  weeklyData.labels,
                                  'sessions-data',
                                  'label',
                                  'sessions'
                                )}
                                className="text-sm text-blue-600 hover:text-blue-950"
                              >
                                Data (CSV)
                              </button>
                            </div>
                          </li>
                        </ul>
                        <button
                          onClick={() => setShowGoalsModal(true)}
                          className="text-sm text-blue-800 hover:text-blue-950 p-2 bg-blue-100 w-full mt-2 text-left rounded-lg"
                        >
                          Update Weekly Goals
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-6 w-full">
          {/* Goals Overview Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full transition-shadow duration-300"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Medication Adherence Progress Bar */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors duration-200">
                <div className="flex items-center mb-4">
                  <FaPills className="text-blue-600 text-xl mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Medication Adherence</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {adherencePercentage}%
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Goal: 80%</span>
                    <span className={adherencePercentage >= 80 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(adherencePercentage, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Food Calorie Goal Card */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-green-200 transition-colors duration-200">
                <div className="flex items-center mb-4">
                  <FaUtensils className="text-green-600 text-xl mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Weekly Food Calorie Goal</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {weeklyGoals.weekly_food_calorie_goal !== null
                        ? `${weeklyGoals.weekly_food_calorie_goal} kcal`
                        : "Not set"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Current: {totalFoodIntake} kcal</span>
                    {weeklyGoals.weekly_food_calorie_goal !== null && (
                      <span className={totalFoodIntake >= weeklyGoals.weekly_food_calorie_goal ? "text-red-500 font-medium" : "text-green-500 font-medium"}>
                        {totalFoodIntake >= weeklyGoals.weekly_food_calorie_goal
                          ? ` (${((totalFoodIntake / weeklyGoals.weekly_food_calorie_goal) * 100).toFixed(1)}%)`
                          : ` (${((totalFoodIntake / weeklyGoals.weekly_food_calorie_goal) * 100).toFixed(1)}% of goal)`}
                      </span>
                    )}
                  </div>
                  {weeklyGoals.weekly_food_calorie_goal !== null && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min((totalFoodIntake / weeklyGoals.weekly_food_calorie_goal) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Exercise Calorie Goal Card */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-red-200 transition-colors duration-200">
                <div className="flex items-center mb-4">
                  <FaRunning className="text-red-600 text-xl mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Weekly Exercise Calorie Goal</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {weeklyGoals.weekly_exercise_calorie_goal !== null
                        ? `${weeklyGoals.weekly_exercise_calorie_goal} kcal`
                        : "Not set"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Current: {totalCaloriesBurned} kcal</span>
                    {weeklyGoals.weekly_exercise_calorie_goal !== null && (
                      <span className={totalCaloriesBurned >= weeklyGoals.weekly_exercise_calorie_goal ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                        {totalCaloriesBurned >= weeklyGoals.weekly_exercise_calorie_goal
                          ? ` (Goal achieved!)`
                          : ` (${((totalCaloriesBurned / weeklyGoals.weekly_exercise_calorie_goal) * 100).toFixed(1)}% of goal)`}
                      </span>
                    )}
                  </div>
                  {weeklyGoals.weekly_exercise_calorie_goal !== null && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-red-500 h-2.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min((totalCaloriesBurned / weeklyGoals.weekly_exercise_calorie_goal) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Medication and Food Charts in a Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
            {/* Medication Adherence Chart */}
            <motion.div 
              className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Medication Adherence (Last 7 Days)
                </h2>
                <p className="text-sm text-gray-600">
                  Current: {adherencePercentage}%
                </p>
              </div>
              <div className="h-64 w-full">
                {adherenceData.length > 0 ? (
                  <Line ref={medicationChartRef} data={chartData} options={medicationChartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No adherence data available</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Food Intake Chart */}
            <motion.div 
              className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Food Intake (Last 7 Days)
                </h2>
                <p className="text-sm text-gray-600">
                  Average: {foodIntakeAverage.toFixed(0)} kcal
                </p>
              </div>
              <div className="h-64 w-full">
                <Line ref={foodChartRef} data={foodChartData} options={foodChartOptions} />
              </div>
            </motion.div>
          </div>

          {/* Weekly Exercise Activity (Full Width) */}
          <div className="w-full">
            <WeeklyActivity 
              weeklyData={weeklyData} 
              chartOptions={chartOptions} 
              calorieChartRef={calorieChartRef}
              durationChartRef={durationChartRef}
              sessionsChartRef={sessionsChartRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;