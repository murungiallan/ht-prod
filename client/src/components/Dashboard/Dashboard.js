import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { auth } from "../../firebase/config";
import { FaPills, FaUtensils, FaRunning, FaLightbulb, FaTrophy } from "react-icons/fa";
import { useSocket } from '../../contexts/SocketContext';
import { 
  getUserMedications, 
  getTakenMedicationHistory, 
  calculateMedicationStreak,
} from "../../services/api";
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-moment';
import moment from 'moment';
import { motion, AnimatePresence } from 'framer-motion';

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, TimeScale);

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
    <div className="bg-white p-4 rounded-xl shadow-lg flex items-center space-x-4">
      <div className={`p-2 ${bgColorClass} rounded-full`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-sm text-gray-500 uppercase">{title}</h3>
        {/* Animation of percentage text */}
        <motion.p
          className="text-xl font-bold text-gray-800"
          initial={{ textContent: "0%" }}
          animate={{ textContent: value }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          {value}
        </motion.p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          {/* Animation of progress bar width */}
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

  // Listens to detect screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Calculate overall medication adherence
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

  // Calculate adherence data for the chart (last 7 days)
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

  // Fetch medications, taken history, and streak
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setFetchError(null);
      
      try {
        const token = await auth.currentUser.getIdToken(true);
        
        const userMedications = await getUserMedications(token);
        setMedications(userMedications);
        
        const history = await getTakenMedicationHistory(5);
        setRecentActivities(history.map((entry) => ({
          type: 'medication',
          description: `Logged ${entry.medication_name} on ${moment(entry.date).format('MMM D, YYYY')} at ${moment(entry.takenAt).format('h:mm A')}`,
          timestamp: entry.takenAt,
        })));

        const fullHistory = await getTakenMedicationHistory();
        calculateAdherenceData(userMedications, fullHistory);

        const userStreak = await calculateMedicationStreak();
        setStreak(userStreak);
      } catch (err) {
        console.error("Error fetching data:", err);
        setFetchError("Failed to load dashboard data");
        if (err.message && err.message.includes("Unauthorized")) {
          logout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchData();
  }, [user, logout]);

  // Listen for real-time medication updates via Socket.IO
  useEffect(() => {
    if (!socket) return;
  
    const handleMedicationUpdate = async (updatedMedication) => {
      console.log("Medication updated:", updatedMedication);
  
      setMedications((prev) =>
        prev.map((med) =>
          med.id === updatedMedication.id ? updatedMedication : med
        )
      );
  
      try {
        const history = await getTakenMedicationHistory(5);
        setRecentActivities(history.map((entry) => ({
          type: 'medication',
          description: `Logged ${entry.medication_name} on ${moment(entry.date).format('MMM D, YYYY')} at ${moment(entry.takenAt).format('h:mm A')}`,
          timestamp: entry.takenAt,
        })));
  
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
  
    socket.on("medicationUpdated", handleMedicationUpdate);
    socket.on("error", (error) => {
      console.error("Socket error:", error.message);
    });
  
    return () => {
      socket.off("medicationUpdated", handleMedicationUpdate);
      socket.off("error");
    };
  }, [socket, medications]);

  // Chart.js data for adherence over time
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

  const chartOptions = {
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

  // Tabs definition
  const tabs = [
    { id: "medication", label: "Medication Adherence", icon: <FaPills className="mr-2" /> },
    { id: "food", label: "Food Intake", icon: <FaUtensils className="mr-2" /> },
    { id: "exercise", label: "Exercise Activity", icon: <FaRunning className="mr-2" /> },
  ];

  // Animation variants for tabs
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

  // Animation variants for chart content
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold capitalize">
            Hello, {user?.displayName || user?.username || "User"}
          </h1>
          <p className="text-gray-500 mt-1">Your health overview</p>
        </div>
      </header>

      {/* Overview Widgets */}
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
          value="120 min"
          percentage={60}
          color="teal"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Charts with Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Tab Navigation */}
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

            {/* Tab Content */}
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
                        <Line data={chartData} options={chartOptions} />
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
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Exercise Activity</h2>
                    <div className="h-64 md:h-80 flex items-center justify-center">
                      <p className="text-gray-600">Chart placeholder (Weekly exercise minutes)</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity, Insights, Tips, Rewards */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
            <ul className="flex flex-col space-y-2">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <li key={index} className="text-sm flex items-center justify-between text-gray-600">
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      <span>{activity.description}</span>
                    </div>
                    <span className="text-gray-400 text-xs">
                      {moment(activity.timestamp).fromNow()}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-600">No recent medication activities</li>
              )}
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaLightbulb className="mr-2 text-yellow-500" /> Health Insights
            </h2>
            <p className="text-sm text-gray-600">
              {adherencePercentage >= 80
                ? "Great job! Your medication adherence is excellent."
                : "Try to improve your medication adherence this week!"}
            </p>
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