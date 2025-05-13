import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import moment from 'moment';
import { toast } from 'react-hot-toast';
import { copyFoodLog, deleteFoodLog } from '../../services/api';

const DailyFoodLogs = ({
  foodLogs,
  selectedDate,
  setFoodLogs,
  getUserToken,
  handleSessionExpired
}) => {
  const [loading, setLoading] = useState(false);

  const handleDeleteFoodLog = useCallback(async (id) => {
    if (!id) return toast.error('Invalid food log ID');
    try {
      setLoading(true);
      const token = await getUserToken();
      await deleteFoodLog(id, token);
      setFoodLogs(prev => prev.filter(item => item.id !== id));
      toast.success('Food log deleted!');
    } catch (err) {
      toast.error('Failed to delete food log');
      if (err.code === 'auth/id-token-expired') handleSessionExpired();
    } finally {
      setLoading(false);
    }
  }, [getUserToken, handleSessionExpired, setFoodLogs]);

  const handleCopyFoodLog = useCallback(async (log) => {
    if (!log?.id) return toast.error('Invalid food log');
    try {
      setLoading(true);
      const token = await getUserToken();
      await copyFoodLog(log.id, selectedDate.toISOString(), token);
      setFoodLogs(prev => [...prev, {
        ...log,
        date_logged: selectedDate.toISOString()
      }]);
      toast.success('Food log copied!');
    } catch (err) {
      toast.error('Failed to copy food log');
      if (err.code === 'auth/id-token-expired') handleSessionExpired();
    } finally {
      setLoading(false);
    }
  }, [getUserToken, selectedDate, handleSessionExpired, setFoodLogs]);

  const dailyLogs = useMemo(() =>
    foodLogs?.filter(log => moment(log.date_logged).isSame(selectedDate, 'day')) || [], [foodLogs, selectedDate]);

  const groupedLogs = useMemo(() => ({
    morning: dailyLogs.filter(log => log.meal_type === 'morning'),
    afternoon: dailyLogs.filter(log => log.meal_type === 'afternoon'),
    evening: dailyLogs.filter(log => log.meal_type === 'evening')
  }), [dailyLogs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="bg-white p-6 rounded-xl shadow-md"
    >
      <h2 className="text-lg font-semibold mb-4 text-gray-700">
        Daily Food Logs ({moment(selectedDate).format('MMM D, YYYY')})
      </h2>

      {Object.entries(groupedLogs).map(([meal, logs]) => (
        <div key={meal} className="mb-6">
          <h3 className="text-base font-medium capitalize mb-3 text-gray-700">{meal}</h3>
          {logs.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {logs.map(log => (
                <div key={log.id} className="border rounded-lg shadow-sm p-4 relative bg-gray-50">
                  <img
                    src={log.image_url || 'https://via.placeholder.com/100?text=No+Image'}
                    alt={log.food_name}
                    className="w-full h-32 object-cover rounded-md mb-2"
                    onError={e => e.target.src = 'https://via.placeholder.com/100?text=No+Image'}
                  />
                  <h4 className="text-sm font-semibold text-gray-800 truncate">{log.food_name}</h4>
                  <p className="text-xs text-gray-600">Calories: {log.calories || '—'}</p>
                  <p className="text-xs text-gray-600">Carbs: {log.carbs || '—'}</p>
                  <p className="text-xs text-gray-600">Protein: {log.protein || '—'}</p>
                  <p className="text-xs text-gray-600">Fats: {log.fats || '—'}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleCopyFoodLog(log)}
                      className="flex-1 text-xs bg-green-500 hover:bg-green-600 text-white py-1 rounded disabled:opacity-50"
                      disabled={loading}
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => handleDeleteFoodLog(log.id)}
                      className="flex-1 text-xs bg-red-500 hover:bg-red-600 text-white py-1 rounded disabled:opacity-50"
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">No {meal} meals logged</p>
          )}
        </div>
      ))}

      {dailyLogs.length === 0 && (
        <div className="text-center text-gray-500 text-sm italic">
          No logs for {moment(selectedDate).format('MMM D, YYYY')}
        </div>
      )}
    </motion.div>
  );
};

export default DailyFoodLogs;