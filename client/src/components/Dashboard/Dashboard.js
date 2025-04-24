import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { auth } from "../../firebase/config";
import { FaPills, FaUtensils, FaRunning, FaLightbulb, FaTrophy } from "react-icons/fa";
import { useSocket } from '../../contexts/SocketContext';
import { 
  getUserMedications, 
  getTakenMedicationHistory, 
  calculateMedicationStreak,
  getExerciseStats,
  getUserExercises,
} from "../../services/api";
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Tooltip, Legend, TimeScale, Filler, CategoryScale } from 'chart.js';
import 'chartjs-adapter-moment';
import moment from 'moment';
import { motion, AnimatePresence } from 'framer-motion';

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, TimeScale, Filler, CategoryScale);

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const AuthRequiredMessage = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center p-8 bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
      <p className="mb-4">Please log in to view your health dashboard.</p>
      <button 
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
      <h2 className="text-xl font-bold mb-4">Error Loading Dashboard</h2>
      <p className="text-red-500 mb-4">{message}</p>
      <button 
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={onRetry}
      >
        Try Again
      </button>
    </div>
  </div>
);

const StatWidget = ({ icon, title, value, percentage, color }) => {
  const bgColorClass = `bg-${color}-100`;
  const textColorClass = `text-${color}-500`;
  const progressColorClass = `bg-${color}-500`;

  return (
    <div className="bg-white p-4 rounded-xl shadow-lg flex items-center space-x-4 justify-center">
      <div className={`p-2 ${bgColorClass} rounded-full`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-sm text-gray-500 uppercase">{title}</h3>
        <motion.p
          className="text-xl font-bold text-gray-800"
          initial={{ textContent: "0" }}
          animate={{ textContent: value }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          {value}
        </motion.p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <motion.div
            className={`${progressColorClass} h-2 rounded-full`}
            initial={{ width: "0%" }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
};

const WeeklyActivity = ({ weeklyData, chartOptions }) => {
  const [chartType, setChartType] = useState("calories");

  const chartConfigs = {
    calories: {
      title: "Calories Burned",
      icon: (
        <svg className="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
            clipRule="evenodd"
          />
        </svg>
      ),
      data: {
        labels: weeklyData.labels,
        datasets: [
          {
            label: "Calories Burned",
            data: weeklyData.calories,
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
    },
    duration: {
      title: "Duration (minutes)",
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
        labels: weeklyData.labels,
        datasets: [
          {
            label: "Duration",
            data: weeklyData.duration,
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
    },
    sessions: {
      title: "Total Sessions",
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
        labels: weeklyData.labels,
        datasets: [
          {
            label: "Sessions",
            data: weeklyData.sessions,
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
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Weekly Exercise Activity
        </h2>
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-700"
          aria-label="Select chart type"
        >
          <option value="calories">Calories Burned</option>
          <option value="duration">Duration (minutes)</option>
          <option value="sessions">Total Sessions</option>
        </select>
      </div>
      <motion.div
        className="p-4 bg-gray-50 rounded-lg border border-gray-100 h-64"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center">
          {chartConfigs[chartType].icon}
          {chartConfigs[chartType].title}
        </h3>
        <div className="h-48">
          {weeklyData.labels.length > 0 ? (
            <Line data={chartConfigs[chartType].data} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-600">No exercise data available</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const Dashboard = () => {
  const { user, loading, logout } = useContext(AuthContext);
  const { socket } = useSocket();
  const [medications, setMedications] = useState([]);
  const [adherenceData, setAdherenceData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [streak, setStreak] = useState(0);
  const [fetchError, setFetchError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("medication");
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [exerciseStats, setExerciseStats] = useState({ totalDuration: 0 });
  const [exercises, setExercises] = useState([]);
  const [weeklyData, setWeeklyData] = useState({
    calories: [],
    duration: [],
    sessions: [],
    labels: [],
  });

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const calculateOverallAdherence = () => {
    let totalDoses = 0;
    let takenDoses = 0;

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
    const today = moment();

    for (let i = days - 1; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days').startOf('day');
      let totalDoses = 0;
      let takenDoses = 0;

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

      takenDoses = history.filter((entry) => {
        const entryDate = moment(entry.date).startOf('day');
        return entryDate.isSame(date, 'day');
      }).length;

      const adherence = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;
      adherenceByDay.push({
        date: date.toDate(),
        adherence: adherence.toFixed(2),
      });
    }

    setAdherenceData(adherenceByDay);
  };

  const computeWeeklyData = () => {
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
  };

  useEffect(() => {
    let isMounted = true;
  
    const fetchData = async () => {
      if (!user || !isMounted) return;
  
      setIsLoading(true);
      setFetchError(null);
  
      try {
        const token = await auth.currentUser.getIdToken(true);
        const userMedications = await getUserMedications(token);
        if (!isMounted) return;
        setMedications(userMedications);
  
        const history = await getTakenMedicationHistory(5);
        const userExercises = await getUserExercises(token);
        console.log("Fetched Exercises:", userExercises);
        if (!isMounted) return;
        setExercises(userExercises.sort((a, b) => new Date(b.date_logged) - new Date(a.date_logged)));
  
        const medicationActivities = history.map((entry) => ({
          type: 'medication',
          description: `Logged ${entry.medication_name} on ${moment(entry.date).format('MMM D, YYYY')} at ${moment(entry.takenAt).format('h:mm A')}`,
          timestamp: entry.takenAt,
        }));
  
        const recentExercise = userExercises[0];
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
  
        const fullHistory = await getTakenMedicationHistory();
        if (!isMounted) return;
        calculateAdherenceData(userMedications, fullHistory);
  
        const userStreak = await calculateMedicationStreak();
        if (!isMounted) return;
        setStreak(userStreak);
  
        const exerciseStats = await getExerciseStats(token);
        if (!isMounted) return;
        setExerciseStats({
          totalDuration: exerciseStats.totalDuration || 0,
        });
  
        computeWeeklyData();
      } catch (err) {
        console.error("Error fetching data:", err);
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
  
    if (user) fetchData();
  
    return () => {
      isMounted = false;
    };
  }, [user, logout]);

  useEffect(() => {
    if (!socket) return;

    const handleMedicationUpdate = async (updatedMedication) => {
      setMedications((prev) =>
        prev.map((med) =>
          med.id === updatedMedication.id ? updatedMedication : med
        )
      );

      try {
        const history = await getTakenMedicationHistory(5);
        const medicationActivities = history.map((entry) => ({
          type: 'medication',
          description: `Logged ${entry.medication_name} on ${moment(entry.date).format('MMM D, YYYY')} at ${moment(entry.takenAt).format('h:mm A')}`,
          timestamp: entry.takenAt,
        }));

        const recentExercise = exercises[0];
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
        setStreak(userStreak);
      } catch (err) {
        console.error("Error refreshing data after update:", err);
      }
    };

    const handleExerciseAdded = async (newExercise) => {
      setExercises((prev) => [newExercise, ...prev].sort((a, b) => new Date(b.date_logged) - new Date(a.date_logged)));
      computeWeeklyData();

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

      try {
        const token = await auth.currentUser.getIdToken(true);
        const exerciseStats = await getExerciseStats(token);
        setExerciseStats({
          totalDuration: exerciseStats.totalDuration || 0,
        });
      } catch (err) {
        console.error("Error refreshing exercise stats after add:", err);
      }
    };

    const handleExerciseDeleted = async (id) => {
      setExercises((prev) => prev.filter((exercise) => exercise.id !== id));
      computeWeeklyData();

      const history = await getTakenMedicationHistory(5);
      const medicationActivities = history.map((entry) => ({
        type: 'medication',
        description: `Logged ${entry.medication_name} on ${moment(entry.date).format('MMM D, YYYY')} at ${moment(entry.takenAt).format('h:mm A')}`,
        timestamp: entry.takenAt,
      }));

      const recentExercise = exercises.filter((exercise) => exercise.id !== id)[0];
      const exerciseActivity = recentExercise ? [{
        type: 'exercise',
        description: `Logged ${recentExercise.activity} (${recentExercise.duration} min) on ${moment(recentExercise.date_logged).format('MMM D, YYYY')}`,
        timestamp: recentExercise.date_logged,
      }] : [];

      const combinedActivities = [...medicationActivities, ...exerciseActivity]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
      setRecentActivities(combinedActivities);

      try {
        const token = await auth.currentUser.getIdToken(true);
        const exerciseStats = await getExerciseStats(token);
        setExerciseStats({
          totalDuration: exerciseStats.totalDuration || 0,
        });
      } catch (err) {
        console.error("Error refreshing exercise stats after delete:", err);
      }
    };

    const handleExerciseUpdated = async (updatedExercise) => {
      setExercises((prev) =>
        prev.map((exercise) => (exercise.id === updatedExercise.id ? updatedExercise : exercise))
          .sort((a, b) => new Date(b.date_logged) - new Date(a.date_logged))
      );
      computeWeeklyData();

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

      try {
        const token = await auth.currentUser.getIdToken(true);
        const exerciseStats = await getExerciseStats(token);
        setExerciseStats({
          totalDuration: exerciseStats.totalDuration || 0,
        });
      } catch (err) {
        console.error("Error refreshing exercise stats after update:", err);
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
  }, [socket, medications, exercises]);

  // Chart options copied directly from ExerciseTracker
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
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Adherence (%)',
        },
      },
    },
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y}%`,
        },
      },
    },
  };

  const tabs = [
    { id: "medication", label: "Medication Adherence", icon: <FaPills className="mr-2" /> },
    { id: "food", label: "Food Intake", icon: <FaUtensils className="mr-2" /> },
    { id: "exercise", label: "Exercise Activity", icon: <FaRunning className="mr-2" /> },
  ];

  const tabVariants = {
    hidden: { opacity: 0, y: isDesktop ? 0 : -10, x: isDesktop ? -10 : 0 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      x: 0,
      transition: { delay: i * 0.1, duration: 0.3 },
    }),
    exit: { 
      opacity: 0, 
      y: isDesktop ? 0 : -10, 
      x: isDesktop ? -10 : 0, 
      transition: { duration: 0.2 } 
    },
    hover: {
      scale: 1.03,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.97,
      transition: { duration: 0.1 }
    }
  };

  const chartVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  if (loading || isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <AuthRequiredMessage />;
  }

  if (fetchError) {
    return <ErrorMessage message={fetchError} onRetry={() => window.location.reload()} />;
  }

  const exerciseGoal = 150;
  const exercisePercentage = Math.min((exerciseStats.totalDuration / exerciseGoal) * 100, 100);

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen max-w-7xl mx-auto">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold capitalize">
            Hello, {user?.displayName || user?.username || "User"}
          </h1>
          <p className="text-gray-500 mt-1">Your health overview</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatWidget 
          icon={<FaPills className="text-blue-500 text-xl" />}
          title="Medication Adherence"
          value={`${adherencePercentage}%`}
          percentage={adherencePercentage}
          color="blue"
        />
        <StatWidget 
          icon={<FaUtensils className="text-green-500 text-xl" />}
          title="Food Intake"
          value="1,800 kcal"
          percentage={70}
          color="green"
        />
        <StatWidget 
          icon={<FaRunning className="text-teal-500 text-xl" />}
          title="Exercise"
          value={`${exerciseStats.totalDuration} min`}
          percentage={exercisePercentage}
          color="teal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className={`flex ${isDesktop ? 'flex-row' : 'flex-row overflow-x-auto'} border-b border-gray-200`}>
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  whileTap="tap"
                  variants={tabVariants}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-3 text-sm font-medium ${
                    activeTab === tab.id
                      ? "border-b-2 border-transparent text-blue-600 outline-none"
                      : "text-gray-500 hover:text-gray-700 outline-none "
                  } transition-colors duration-200`}
                  style={{ minWidth: isDesktop ? 'auto' : '130px' }}
                  aria-selected={activeTab === tab.id}
                  role="tab"
                >
                  {tab.icon}
                  {tab.label}
                </motion.button>
              ))}
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === "medication" && (
                  <motion.div
                    key="medication"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={chartVariants}
                  >
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      Medication Adherence (last 7 days)
                    </h2>
                    <div className="h-64 md:h-80">
                      {adherenceData.length > 0 ? (
                        <Line data={chartData} options={medicationChartOptions} />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-600">No adherence data available</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === "food" && (
                  <motion.div
                    key="food"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={chartVariants}
                  >
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Food Intake</h2>
                    <div className="h-64 md:h-80 flex items-center justify-center">
                      <p className="text-gray-600">Chart placeholder (Weekly food intake in kcal)</p>
                    </div>
                  </motion.div>
                )}

                {activeTab === "exercise" && (
                  <motion.div
                    key="exercise"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={chartVariants}
                  >
                    <WeeklyActivity weeklyData={weeklyData} chartOptions={chartOptions} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
            <ul className="flex flex-col space-y-2">
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
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Daily Health Tip</h2>
            <p className="text-sm text-gray-600">Drink at least 8 glasses of water today to stay hydrated.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaTrophy className="mr-2 text-yellow-500" /> Achievements
            </h2>
            <p className="text-sm text-gray-600">
              {streak > 0
                ? `${streak}-day medication adherence streak! 🎉`
                : "Start a medication adherence streak today!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;