import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { getUserFoodLogs, getFoodStats, clusterEatingPatterns, predictCaloricIntake } from '../../services/api';
import { toast } from 'react-hot-toast';
import { auth } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import CalendarCard from './CalendarCard';
import FilterSummary from './FilterSummary';
import NutritionalInsights from './NutritionalInsights';
import NutritionalTrends from './NutritionalTrends';
import DailyFoodLogs from './DailyFoodLogs';
import FoodLogModal from './modals/FoodLogModal';

// ErrorBoundary component to catch rendering errors
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const errorHandler = (error) => {
      setHasError(true);
      setError(error);
    };
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-lg mb-6">
        <p className="text-base font-medium">Something went wrong: {error?.message || 'Unknown error'}</p>
      </div>
    );
  }
  return children;
};


// FoodDiary component orchestrates the food tracking interface
const FoodDiary = () => {
  const { user, logout } = useContext(AuthContext);
  const { socket, getSocket } = useSocket();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFailedAction, setLastFailedAction] = useState(null);
  const [foodLogs, setFoodLogs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterPeriod, setFilterPeriod] = useState('today');
  const [stats, setStats] = useState([]);
  const [caloriePredictions, setCaloriePredictions] = useState([]);
  const [eatingPattern, setEatingPattern] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const isMounted = useRef(true);
  const recentActionRef = useRef(null); // Track recent UI actions to prevent duplicate socket updates

  // Event Handlers
  const handleSessionExpired = useCallback(() => {
    if (!isMounted.current) return;
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  // Initialization
  const getUserToken = async () => {
    try {
      return await auth.currentUser.getIdToken(true);
    } catch (err) {
      throw new Error('Failed to get user token');
    }
  };

 
  // Data Fetching
  const fetchData = useCallback(async () => {
    if (!user || !isMounted.current) return;
    try {
      setLoading(true);
      const token = await getUserToken();
      const [logs, foodStats, predictions] = await Promise.all([
        getUserFoodLogs(token),
        getFoodStats(token),
        predictCaloricIntake(token),
      ]);
      const validatedLogs = logs.map(log => ({
        ...log,
        calories: parseFloat(log.calories) || 0,
        carbs: parseFloat(log.carbs) || 0,
        protein: parseFloat(log.protein) || 0,
        fats: parseFloat(log.fats) || 0,
      }));
      // Replace foodLogs with validatedLogs to avoid duplicates
      setFoodLogs(validatedLogs.sort((a, b) => new Date(b.date_logged) - new Date(a.date_logged)));
      const validatedStats = foodStats.map(stat => ({
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
        const userCluster = clusters.find(c => c.userId === user.uid);
        setEatingPattern(userCluster?.cluster || 'Unknown');
      } catch (clusterErr) {
        console.error('Failed to fetch eating patterns:', clusterErr);
        setEatingPattern('Data unavailable');
        toast.error('Failed to fetch eating patterns');
      }
    } catch (err) {
      setError('Failed to load food logs, stats, or predictions');
      setLastFailedAction({ type: 'fetchData', params: null });
      toast.error('Failed to load data');
      console.error(err);
      if (err.code === 'auth/id-token-expired') handleSessionExpired();
    } finally {
      setLoading(false);
    }
  }, [user, handleSessionExpired]);


  const handleRetry = useCallback(async () => {
    if (!lastFailedAction) return;
    setError(null);
    const { type } = lastFailedAction;
    try {
      if (type === 'fetchData') {
        await fetchData();
      }
    } catch (err) {
      setError(`Failed to retry ${type}`);
      toast.error(`Failed to retry ${type}`);
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

  // Effects
  useEffect(() => {
    isMounted.current = true;
    if (!user) {
      navigate('/login', { replace: true });
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
        console.error('Error checking token expiration:', error);
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
        console.error('Failed to connect socket:', err);
        setError('Failed to connect to real-time updates');
        toast.error('Failed to connect to real-time updates');
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
          // Skip if this action was already handled by the UI or if log exists
          if (recentActionRef.current === `add-${validatedLog.id}` || foodLogs.some(l => l.id === validatedLog.id)) {
            recentActionRef.current = null;
            return;
          }
          setFoodLogs(prev => [validatedLog, ...prev].sort((a, b) => new Date(b.date_logged) - new Date(a.date_logged)));
        } catch (err) {
          console.error('Error handling foodLogAdded:', err);
          toast.error('Failed to update food log (added)');
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
          // Skip if this action was already handled by the UI
          if (recentActionRef.current === `update-${validatedLog.id}`) {
            recentActionRef.current = null;
            return;
          }
          if (foodLogs.some(l => l.id === validatedLog.id)) {
            setFoodLogs(prev => prev.map(item => item.id === validatedLog.id ? validatedLog : item).sort((a, b) => new Date(b.date_logged) - new Date(a.date_logged)));
            // Do not show toast for socket updates
          }
        } catch (err) {
          console.error('Error handling foodLogUpdated:', err);
          toast.error('Failed to update food log (updated)');
        }
      },
      foodLogDeleted: (id) => {
        if (!isMounted.current) return;
        try {
          // Skip if this action was already handled by the UI
          if (recentActionRef.current === `delete-${id}`) {
            recentActionRef.current = null;
            return;
          }
          if (foodLogs.some(l => l.id === parseInt(id))) {
            setFoodLogs(prev => prev.filter(item => item.id !== parseInt(id)));
            // Do not show toast for socket updates
          }
        } catch (err) {
          console.error('Error handling foodLogDeleted:', err);
          toast.error('Failed to update food log (deleted)');
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
  }, [socket, getSocket]); // Removed foodLogs from dependencies

  // Render
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
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
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-base font-medium">{error}</p>
              </div>
              <button
                onClick={handleRetry}
                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 text-sm font-medium flex items-center"
                disabled={loading}
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
              <NutritionalInsights
                foodLogs={foodLogs}
                selectedDate={selectedDate}
                eatingPattern={eatingPattern}
              />
              <FilterSummary
                filterPeriod={filterPeriod}
                setFilterPeriod={setFilterPeriod}
                foodLogs={foodLogs}
                selectedDate={selectedDate}
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
            recentActionRef={recentActionRef} // Pass recentActionRef to track UI actions
          />
          <FoodLogModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            getUserToken={getUserToken}
            setFoodLogs={setFoodLogs}
            handleSessionExpired={handleSessionExpired}
            recentActionRef={recentActionRef} // Pass recentActionRef to track UI actions
          />
          <div
            className="fixed bottom-4 right-4 z-50"
            onMouseEnter={() => setIsHelpOpen(true)}
            onMouseLeave={() => setIsHelpOpen(false)}
          >
            <svg
              className="h-10 w-10 text-blue-600 cursor-pointer hover:text-blue-700 transition"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {isHelpOpen && (
              <div className="absolute bottom-12 right-0 w-64 bg-white p-4 rounded-lg shadow-lg text-sm text-gray-600">
                <p><strong>Food Diary Features:</strong></p>
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