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
  getWeeklyGoals,
  getUserFoodLogs,
  getFoodStats,
} from "../../services/api";
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Tooltip, Legend, TimeScale, Filler, CategoryScale, BarElement, BarController } from 'chart.js';
import 'chartjs-adapter-moment';
import moment from 'moment';
import { motion, AnimatePresence } from 'framer-motion';
import annotationPlugin from 'chartjs-plugin-annotation';
import { toast } from 'react-hot-toast';
import { getMedicationChartData } from './Charts/medicationChartData';
import { getExerciseChartData } from './Charts/exerciseChartData';
import { getFoodChartData } from './Charts/foodChartData';

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, TimeScale, Filler, CategoryScale, BarElement, BarController, annotationPlugin);

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

const GoalsModal = ({ isOpen, onClose, onSave, suggestedFoodGoal }) => {
  const [foodGoal, setFoodGoal] = useState('');
  const [exerciseGoal, setExerciseGoal] = useState('');

  useEffect(() => {
    if (suggestedFoodGoal && !foodGoal) {
      setFoodGoal(suggestedFoodGoal.toString());
    }
  }, [suggestedFoodGoal, foodGoal]);

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
            {suggestedFoodGoal && !foodGoal && (
              <span className="text-sm text-gray-500 ml-2">(Suggested: {suggestedFoodGoal} kcal)</span>
            )}
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

const PeriodFilter = ({ period, setPeriod }) => {
  const periods = [
    "Last 7 Days",
    "Last 14 Days",
    "Last 28 Days"
  ];

  return (
    <div className="relative">
      <select
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
        className="appearance-none w-full bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {periods.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

const getDateRange = (period) => {
  const today = moment().startOf('day');
  let startDate;
  let days;

  switch (period) {
    case "Last 7 Days":
      startDate = moment(today).subtract(6, 'days');
      days = 7;
      break;
    case "This Week":
      startDate = moment(today).startOf('week');
      days = moment(today).diff(startDate, 'days') + 1;
      break;
    case "Last Week":
      startDate = moment(today).subtract(1, 'weeks').startOf('week');
      days = 7;
      break;
    case "Last 14 Days":
      startDate = moment(today).subtract(13, 'days');
      days = 14;
      break;
    case "Last 30 Days":
      startDate = moment(today).subtract(29, 'days');
      days = 30;
      break;
    case "Last 1 Year":
      startDate = moment(today).subtract(1, 'years');
      days = 365;
      break;
    case "All Time":
      startDate = moment(today).subtract(10, 'years');
      days = moment(today).diff(startDate, 'days') + 1;
      break;
    default:
      startDate = moment(today).subtract(6, 'days');
      days = 7;
  }
  return { startDate, days };
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
  const [foodLogs, setFoodLogs] = useState([]);
  const [foodStats, setFoodStats] = useState([]);
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
  const [period, setPeriod] = useState("Last 7 Days");
  const [suggestedFoodGoal, setSuggestedFoodGoal] = useState(null);
  const notificationsRef = useRef(null);
  const settingsRef = useRef(null);

  // Chart refs for accessing chart instances
  const medicationChartRef = useRef(null);
  const foodChartRef = useRef(null);
  const macrosChartRef = useRef(null);
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

        // Fetch medications, exercises, and food logs
        const [userMedications, history, userExercises, userFoodLogs, foodStatsData] = await Promise.all([
          getUserMedications(token),
          getTakenMedicationHistory(),
          getUserExercises(token),
          getUserFoodLogs(token),
          getFoodStats(token),
        ]);
        if (!isMounted) return;
        console.log("Fetched Exercises:", userExercises);
        console.log("Fetched Medications:", userMedications);
        console.log("Fetched Medication History:", history);
        console.log("Fetched Food Logs:", userFoodLogs);
        console.log("Fetched Food Stats:", foodStatsData);
        setMedications(userMedications || []);
        setExercises(userExercises || []);
        setFoodLogs(userFoodLogs || []);
        setFoodStats(foodStatsData || []);

        // Calculate suggested food goal based on foodLogs
        const totalCalories = userFoodLogs.reduce((sum, log) => sum + (Number(log.calories) || 0), 0);
        const daysLogged = new Set(userFoodLogs.map(log => moment(log.date_logged).startOf('day').toISOString())).size;
        const avgDailyCalories = daysLogged > 0 ? totalCalories / daysLogged : 0;
        const suggestedWeeklyGoal = avgDailyCalories * 7;
        setSuggestedFoodGoal(suggestedWeeklyGoal > 0 ? Math.round(suggestedWeeklyGoal) : 14000);

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

        const recentFoodLog = userFoodLogs && userFoodLogs.length > 0 ? userFoodLogs[0] : null;
        const foodActivity = recentFoodLog ? [{
          type: 'food',
          description: `Logged ${recentFoodLog.food_name} (${recentFoodLog.calories} kcal) on ${moment(recentFoodLog.date_logged).format('MMM D, YYYY')}`,
          timestamp: recentFoodLog.date_logged,
        }] : [];

        const combinedActivities = [...medicationActivities, ...exerciseActivity, ...foodActivity]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5);
        if (!isMounted) return;
        setRecentActivities(combinedActivities);

        // Calculate adherence data
        const updatedAdherenceData = calculateAdherenceData(userMedications || [], history);
        setAdherenceData(updatedAdherenceData);

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

        // Compute chart data
        computeChartData(userExercises || [], userFoodLogs || [], foodStatsData || []);
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
  }, [user, authLoading, logout, period]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleMedicationUpdate = async (updatedMedication) => {
      try {
        setMedications((prev) =>
          prev.map((med) =>
            med.id === updatedMedication.id ? updatedMedication : med
          )
        );

        const history = await getTakenMedicationHistory();
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

        const recentFoodLog = foodLogs.length > 0 ? foodLogs[0] : null;
        const foodActivity = recentFoodLog ? [{
          type: 'food',
          description: `Logged ${recentFoodLog.food_name} (${recentFoodLog.calories} kcal) on ${moment(recentFoodLog.date_logged).format('MMM D, YYYY')}`,
          timestamp: recentFoodLog.date_logged,
        }] : [];

        const combinedActivities = [...medicationActivities, ...exerciseActivity, ...foodActivity]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5);
        setRecentActivities(combinedActivities);

        const updatedAdherenceData = calculateAdherenceData(
          medications.map(med => med.id === updatedMedication.id ? updatedMedication : med),
          history
        );
        setAdherenceData(updatedAdherenceData);

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
        computeChartData(updatedExercises, foodLogs, foodStats);

        const history = await getTakenMedicationHistory();
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

        const recentFoodLog = foodLogs.length > 0 ? foodLogs[0] : null;
        const foodActivity = recentFoodLog ? [{
          type: 'food',
          description: `Logged ${recentFoodLog.food_name} (${recentFoodLog.calories} kcal) on ${moment(recentFoodLog.date_logged).format('MMM D, YYYY')}`,
          timestamp: recentFoodLog.date_logged,
        }] : [];

        const combinedActivities = [...medicationActivities, ...exerciseActivity, ...foodActivity]
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
        computeChartData(updatedExercises, foodLogs, foodStats);

        const history = await getTakenMedicationHistory();
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

        const recentFoodLog = foodLogs.length > 0 ? foodLogs[0] : null;
        const foodActivity = recentFoodLog ? [{
          type: 'food',
          description: `Logged ${recentFoodLog.food_name} (${recentFoodLog.calories} kcal) on ${moment(recentFoodLog.date_logged).format('MMM D, YYYY')}`,
          timestamp: recentFoodLog.date_logged,
        }] : [];

        const combinedActivities = [...medicationActivities, ...exerciseActivity, ...foodActivity]
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
        computeChartData(updatedExercises, foodLogs, foodStats);

        const history = await getTakenMedicationHistory();
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

        const recentFoodLog = foodLogs.length > 0 ? foodLogs[0] : null;
        const foodActivity = recentFoodLog ? [{
          type: 'food',
          description: `Logged ${recentFoodLog.food_name} (${recentFoodLog.calories} kcal) on ${moment(recentFoodLog.date_logged).format('MMM D, YYYY')}`,
          timestamp: recentFoodLog.date_logged,
        }] : [];

        const combinedActivities = [...medicationActivities, ...exerciseActivity, ...foodActivity]
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

    const handleFoodLogAdded = async (newFoodLog) => {
      try {
        const updatedFoodLogs = [newFoodLog, ...foodLogs].sort((a, b) => new Date(b.date_logged) - new Date(a.date_logged));
        setFoodLogs(updatedFoodLogs);
        const token = await auth.currentUser.getIdToken(true);
        const updatedFoodStats = await getFoodStats(token);
        setFoodStats(updatedFoodStats);
        computeChartData(exercises, updatedFoodLogs, updatedFoodStats);

        // Recalculate suggested food goal
        const totalCalories = updatedFoodLogs.reduce((sum, log) => sum + (Number(log.calories) || 0), 0);
        const daysLogged = new Set(updatedFoodLogs.map(log => moment(log.date_logged).startOf('day').toISOString())).size;
        const avgDailyCalories = daysLogged > 0 ? totalCalories / daysLogged : 0;
        const suggestedWeeklyGoal = avgDailyCalories * 7;
        setSuggestedFoodGoal(suggestedWeeklyGoal > 0 ? Math.round(suggestedWeeklyGoal) : 14000);

        const history = await getTakenMedicationHistory();
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

        const foodActivity = [{
          type: 'food',
          description: `Logged ${newFoodLog.food_name} (${newFoodLog.calories} kcal) on ${moment(newFoodLog.date_logged).format('MMM D, YYYY')}`,
          timestamp: newFoodLog.date_logged,
        }];

        const combinedActivities = [...medicationActivities, ...exerciseActivity, ...foodActivity]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5);
        setRecentActivities(combinedActivities);

        setHasNewActivity(true);
      } catch (err) {
        console.error("Error in handleFoodLogAdded:", err);
      }
    };

    socket.on("medicationUpdated", handleMedicationUpdate);
    socket.on("exerciseAdded", handleExerciseAdded);
    socket.on("exerciseDeleted", handleExerciseDeleted);
    socket.on("exerciseUpdated", handleExerciseUpdated);
    socket.on("foodLogAdded", handleFoodLogAdded);
    socket.on("error", (error) => {
      console.error("Socket error:", error.message);
    });

    return () => {
      socket.off("medicationUpdated", handleMedicationUpdate);
      socket.off("exerciseAdded", handleExerciseAdded);
      socket.off("exerciseDeleted", handleExerciseDeleted);
      socket.off("exerciseUpdated", handleExerciseUpdated);
      socket.off("foodLogAdded", handleFoodLogAdded);
      socket.off("error");
    };
  }, [socket, user, exercises, foodLogs, foodStats]);

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
      setSuggestedFoodGoal(null);
    } catch (err) {
      console.error("Error saving weekly goals:", err);
      alert("Failed to save goals. Please try again.");
    }
  };

  const calculateAdherenceData = (meds, history) => {
    const today = moment().local().startOf('day');
    let days;
    switch (period) {
      case "Last 7 Days":
        days = 7;
        break;
      case "Last 14 Days":
        days = 14;
        break;
      case "Last 28 Days":
        days = 28;
        break;
      default:
        days = 7;
    }

    const adherenceByDay = [];
    const startDate = moment(today).subtract(days - 1, 'days').startOf('day');

    let currentDate = moment(startDate);
    const endDate = moment(today);

    while (currentDate <= endDate) {
      const date = currentDate.clone().startOf('day');
      let totalDoses = 0;
      let takenDoses = 0;

      if (meds && meds.length > 0) {
        meds.forEach((med) => {
          const dosesForDate = med.doses && med.doses[date.format('YYYY-MM-DD')];
          if (dosesForDate && Array.isArray(dosesForDate)) {
            totalDoses += dosesForDate.length;
            takenDoses += dosesForDate.filter(dose => dose.taken).length;
          }
        });
      }

      const historyTaken = history && history.length > 0 ? history.filter((entry) => {
        const entryDate = moment(entry.date).startOf('day');
        return entryDate.isSame(date, 'day');
      }).length : 0;
      takenDoses = Math.max(takenDoses, historyTaken);

      const missedDoses = totalDoses - takenDoses;

      adherenceByDay.push({
        date: date.toDate(),
        takenDoses,
        missedDoses,
        totalDoses
      });

      currentDate.add(1, 'day');
    }

    return adherenceByDay;
  };

  const calculateOverallAdherence = (adherenceData) => {
    let totalDoses = 0;
    let takenDoses = 0;

    if (!adherenceData || adherenceData.length === 0) return { percentage: 0, fraction: "0/0" };

    adherenceData.forEach((day) => {
      totalDoses += day.totalDoses || 0;
      takenDoses += day.takenDoses || 0;
    });

    const percentage = totalDoses > 0 ? ((takenDoses / totalDoses) * 100).toFixed(2) : 0;
    const fraction = `${takenDoses}/${totalDoses}`;
    return { percentage, fraction };
  };

  const computeChartData = (exercisesToCompute, foodLogsToCompute, foodStatsToCompute) => {
    const { startDate, days } = getDateRange(period);

    const dateRange = Array.from({ length: days }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.toDate().getDate() + i);
      return date;
    });

    const formattedDates = dateRange.map(date => ({
      dateObj: date,
      dateString: date.toISOString().split('T')[0],
      shortDay: moment(date).format('MMM D'),
    }));

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

  const overallAdherence = calculateOverallAdherence(adherenceData);
  const adherencePercentage = overallAdherence.percentage;
  const adherenceFraction = overallAdherence.fraction;

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
        title: {
          display: true,
          text: 'Value',
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
      x: {
        type: 'category',
        ticks: {
          font: {
            size: 12,
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

  const medicationChartData = getMedicationChartData(adherenceData, period);
  const exerciseChartData = getExerciseChartData(weeklyData, period, weeklyGoals);
  const { foodChartData, macrosChartData } = getFoodChartData(foodLogs, foodStats, period, weeklyGoals);

  const medicationChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        ...chartOptions.scales.y,
        stacked: true,
        title: {
          display: true,
          text: 'Number of Doses',
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
          color: "#6B7280",
        },
        suggestedMin: 0,
        suggestedMax: Math.max(...adherenceData.map(d => d.totalDoses)) * 1.1,
      },
      x: {
        ...chartOptions.scales.x,
        stacked: true,
      },
    },
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label;
            const value = context.raw;
            const total = adherenceData.find(entry => moment(entry.date).format('MMM D') === context.label)?.totalDoses || 0;
            return `${label}: ${value} (Total: ${total})`;
          },
        },
      },
    },
  };

  const foodChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        ...chartOptions.scales.y,
        stacked: true,
        title: {
          display: true,
          text: 'Calories (kcal)',
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
          color: "#6B7280",
        },
        suggestedMin: 0,
        suggestedMax: Math.max(
          ...foodChartData.datasets.flatMap(ds => ds.data)
        ) * 1.1,
      },
      x: {
        ...chartOptions.scales.x,
        stacked: true,
      },
    },
    plugins: {
      ...chartOptions.plugins,
      annotation: {
        annotations: {
          goalLine: {
            type: 'line',
            yMin: weeklyGoals.weekly_food_calorie_goal ? weeklyGoals.weekly_food_calorie_goal / (weeklyData.labels.length || 7) : 2000,
            yMax: weeklyGoals.weekly_food_calorie_goal ? weeklyGoals.weekly_food_calorie_goal / (weeklyData.labels.length || 7) : 2000,
            borderColor: 'rgba(34, 197, 94, 0.5)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              content: weeklyGoals.weekly_food_calorie_goal 
                ? `Goal: ~${Math.round(weeklyGoals.weekly_food_calorie_goal / (weeklyData.labels.length || 7))} kcal/day`
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

  const macrosChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        ...chartOptions.scales.y,
        stacked: true,
        title: {
          display: true,
          text: 'Amount (g)',
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
          color: "#6B7280",
        },
      },
      x: {
        ...chartOptions.scales.x,
        stacked: true,
      },
    },
  };

  const caloriesChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        ...chartOptions.scales.y,
        title: {
          display: true,
          text: 'Calories (kcal)',
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
          color: "#6B7280",
        },
        suggestedMin: 0,
      },
      x: {
        ...chartOptions.scales.x,
      },
    },
    plugins: {
      ...chartOptions.plugins,
      annotation: {
        annotations: {
          goalLine: {
            type: 'line',
            yMin: weeklyGoals.weekly_exercise_calorie_goal ? weeklyGoals.weekly_exercise_calorie_goal / (weeklyData.labels.length || 7) : 500,
            yMax: weeklyGoals.weekly_exercise_calorie_goal ? weeklyGoals.weekly_exercise_calorie_goal / (weeklyData.labels.length || 7) : 500,
            borderColor: 'rgba(239, 68, 68, 0.5)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              content: weeklyGoals.weekly_exercise_calorie_goal 
                ? `Goal: ~${Math.round(weeklyGoals.weekly_exercise_calorie_goal / (weeklyData.labels.length || 7))} kcal/day`
                : 'Goal: ~500 kcal/day',
              enabled: true,
              position: 'end',
              backgroundColor: 'rgba(239, 68, 68, 0.8)',
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

  const durationChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        ...chartOptions.scales.y,
        title: {
          display: true,
          text: 'Duration (min)',
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
          color: "#6B7280",
        },
        suggestedMin: 0,
      },
      x: {
        ...chartOptions.scales.x,
      },
    },
  };

  const sessionsChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        ...chartOptions.scales.y,
        title: {
          display: true,
          text: 'Sessions',
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
          color: "#6B7280",
        },
        suggestedMin: 0,
      },
      x: {
        ...chartOptions.scales.x,
      },
    },
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    setShowSettings(false);
    setHasNewActivity(false);
  };

  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
    setShowNotifications(false);
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
      toast.success(`${fileName}.png downloaded!`);
    } else {
      toast.error("Chart is not available for download.");
    }
  };

  const downloadChartDataAsCSV = (data, labels, fileName, labelField = 'label', dataField = 'data') => {
    if (!data || !labels) {
      toast.error("No data available to download.");
      return;
    }

    const headers = ['Date', dataField.charAt(0).toUpperCase() + dataField.slice(1)];
    const rows = labels.map((label, index) => {
      let value;
      if (dataField === 'takenDoses' || dataField === 'missedDoses') {
        value = data[index]?.[dataField] || 0;
      } else if (dataField === 'data') {
        value = data[index] || 0;
      } else {
        value = data[dataField][index] || 0;
      }
      return [moment(label).format('MMM D'), value];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${fileName}.csv downloaded!`);
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

  const totalFoodIntake = foodChartData.datasets[0].data.reduce((a, b) => a + b, 0);
  const foodIntakeAverage = totalFoodIntake / foodChartData.labels.length;
  const totalCaloriesBurned = weeklyData.calories.reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 w-full">
      <GoalsModal
        isOpen={showGoalsModal}
        onClose={() => setShowGoalsModal(false)}
        onSave={handleSaveGoals}
        suggestedFoodGoal={suggestedFoodGoal}
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
              <div className="w-40">
                <PeriodFilter period={period} setPeriod={setPeriod} />
              </div>
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
                      className="absolute right-0 mt-2 w-90 bg-white rounded-xl shadow-lg border border-gray-100 z-10"
                    >
                      <div className="p-4">
                        <ul className="space-y-3 max-h-64 overflow-y-auto mb-4">
                          {recentActivities.length > 0 ? (
                            recentActivities.map((activity, index) => (
                              <li key={index} className="text-sm flex items-center justify-between text-gray-600">
                                <div className="flex items-center">
                                  <span className={`w-2 h-2 rounded-full mr-2 ${activity.type === 'medication' ? 'bg-blue-500' : activity.type === 'exercise' ? 'bg-teal-500' : 'bg-green-500'}`}></span>
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
                                  'takenDoses'
                                )}
                                className="text-sm text-blue-600 hover:text-blue-950"
                              >
                                Data (CSV)
                              </button>
                            </div>
                          </li>
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
                                  foodChartData.datasets[0].data,
                                  foodChartData.labels,
                                  'food-intake-data'
                                )}
                                className="text-sm text-blue-600 hover:text-blue-950"
                              >
                                Data (CSV)
                              </button>
                            </div>
                          </li>
                          <li>
                            <div className="text-sm font-medium text-gray-700">Macronutrients</div>
                            <div className="flex space-x-2 mt-1">
                              <button
                                onClick={() => downloadChartImage(macrosChartRef, 'macros-chart')}
                                className="text-sm text-blue-600 hover:text-blue-950"
                              >
                                Image (PNG)
                              </button>
                              <button
                                onClick={() => downloadChartDataAsCSV(
                                  macrosChartData.datasets[0].data,
                                  macrosChartData.labels,
                                  'macros-data'
                                )}
                                className="text-sm text-blue-600 hover:text-blue-950"
                              >
                                Data (CSV)
                              </button>
                            </div>
                          </li>
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
                                  weeklyData.calories,
                                  weeklyData.labels,
                                  'calories-burned-data'
                                )}
                                className="text-sm text-blue-600 hover:text-blue-950"
                              >
                                Data (CSV)
                              </button>
                            </div>
                          </li>
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
                                  weeklyData.duration,
                                  weeklyData.labels,
                                  'duration-data'
                                )}
                                className="text-sm text-blue-600 hover:text-blue-950"
                              >
                                Data (CSV)
                              </button>
                            </div>
                          </li>
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
                                  weeklyData.sessions,
                                  weeklyData.labels,
                                  'sessions-data'
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full transition-shadow duration-300"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors duration-200">
                <div className="flex items-center mb-4">
                  <FaPills className="text-blue-600 text-xl mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Medication Adherence</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {adherencePercentage}% ({adherenceFraction})
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Goal: 80%</span>
                    <span className={adherencePercentage >= 80 ? "text-green-500 font-medium" : "text-red-500 font-medium"}></span>
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

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-green-200 transition-colors duration-200">
                <div className="flex items-center mb-4">
                  <FaUtensils className="text-green-600 text-xl mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Weekly Food Calorie Goal</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {weeklyGoals.weekly_food_calorie_goal !== null
                        ? `${weeklyGoals.weekly_food_calorie_goal} kcal`
                        : suggestedFoodGoal
                          ? `${suggestedFoodGoal} kcal (Suggested)`
                          : "Not set"}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Current: {totalFoodIntake.toFixed(0)} kcal</span>
                    {weeklyGoals.weekly_food_calorie_goal !== null && (
                      <span className={totalFoodIntake >= weeklyGoals.weekly_food_calorie_goal ? "text-red-500 font-medium" : "text-green-500 font-medium"}>
                        {totalFoodIntake >= weeklyGoals.weekly_food_calorie_goal
                          ? ` (${((totalFoodIntake / weeklyGoals.weekly_food_calorie_goal) * 100).toFixed(1)}%)`
                          : ` (${((totalFoodIntake / weeklyGoals.weekly_food_calorie_goal) * 100).toFixed(1)}% of goal)`}
                      </span>
                    )}
                    {suggestedFoodGoal && weeklyGoals.weekly_food_calorie_goal === null && (
                      <span className="text-gray-500">({((totalFoodIntake / suggestedFoodGoal) * 100).toFixed(1)}% of suggested)</span>
                    )}
                  </div>
                  {(weeklyGoals.weekly_food_calorie_goal !== null || suggestedFoodGoal) && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            (totalFoodIntake / (weeklyGoals.weekly_food_calorie_goal || suggestedFoodGoal || 1)) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>

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
                    <span className="text-gray-600">Current: {totalCaloriesBurned.toFixed(0)} kcal</span>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
            <motion.div 
              className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Medication Adherence ({period})
                </h2>
                <p className="text-sm text-gray-600">
                  Today: {adherenceData.length > 0 ? `${adherenceData[adherenceData.length - 1].takenDoses}/${adherenceData[adherenceData.length - 1].totalDoses}` : "0/0"}
                </p>
              </div>
              <div className="h-64 w-full">
                {adherenceData.length > 0 ? (
                  <Bar ref={medicationChartRef} data={medicationChartData} options={medicationChartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No adherence data available</p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div 
              className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Food Intake ({period})
                </h2>
                <p className="text-sm text-gray-600">
                  Average: {foodIntakeAverage.toFixed(0)} kcal
                </p>
              </div>
              <div className="h-64 w-full">
                {foodChartData.labels.length > 0 ? (
                  <Line ref={foodChartRef} data={foodChartData} options={foodChartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No food intake data available</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <motion.div 
            className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Macronutrient Trends ({period})
              </h2>
            </div>
            <div className="h-64 w-full">
              {macrosChartData.labels.length > 0 ? (
                <Bar ref={macrosChartRef} data={macrosChartData} options={macrosChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No macronutrient data available</p>
                </div>
              )}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
            <motion.div 
              className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Calories Burned ({period})
                </h2>
                <p className="text-sm text-gray-600">
                  Total: {weeklyData.calories?.reduce((a, b) => a + b, 0) || 0} kcal
                </p>
              </div>
              <div className="h-64 w-full">
                {exerciseChartData?.calories?.data?.datasets?.[0]?.data?.some(val => val > 0) ? (
                  <Line 
                    ref={calorieChartRef} 
                    data={exerciseChartData.calories.data} 
                    options={caloriesChartOptions} 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No calorie data available</p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div 
              className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Exercise Duration ({period})
                </h2>
                <p className="text-sm text-gray-600">
                  Total: {weeklyData.duration?.reduce((a, b) => a + b, 0) || 0} min
                </p>
              </div>
              <div className="h-64 w-full">
                {exerciseChartData?.duration?.data?.datasets?.[0]?.data?.some(val => val > 0) ? (
                  <Line 
                    ref={durationChartRef} 
                    data={exerciseChartData.duration.data} 
                    options={durationChartOptions} 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No duration data available</p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div 
              className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.4 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Exercise Sessions ({period})
                </h2>
                <p className="text-sm text-gray-600">
                  Total: {weeklyData.sessions?.reduce((a, b) => a + b, 0) || 0}
                </p>
              </div>
              <div className="h-64 w-full">
                {exerciseChartData?.sessions?.data?.datasets?.[0]?.data?.some(val => val > 0) ? (
                  <Bar 
                    ref={sessionsChartRef} 
                    data={exerciseChartData.sessions.data} 
                    options={sessionsChartOptions} 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No session data available</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;