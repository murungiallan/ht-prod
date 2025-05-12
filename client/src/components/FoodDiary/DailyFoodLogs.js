import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import moment from 'moment';
import { toast } from 'react-hot-toast';
import { copyFoodLog, deleteFoodLog } from '../../services/api';

// DailyFoodLogs component displays a table of food logs grouped by meal type for a selected date
const DailyFoodLogs = ({ foodLogs, selectedDate, setFoodLogs, getUserToken, handleSessionExpired }) => {
  const [loading, setLoading] = useState(false);

  // Initialization: Define table column widths
  const columnWidths = {
    food: 'w-40',
    cal: 'w-20',
    carbs: 'w-20',
    protein: 'w-20',
    fats: 'w-20',
    img: 'w-20',
    actions: 'w-32',
  };

  // Data Fetching: Handle deleting a food log
  const handleDeleteFoodLog = useCallback(async (id) => {
    if (!id) {
      toast.error('Invalid food log ID');
      return;
    }
    try {
      setLoading(true);
      const token = await getUserToken();
      await deleteFoodLog(id, token);
      setFoodLogs(prev => prev.filter(item => item.id !== id));
      toast.success('Food log deleted!');
    } catch (err) {
      toast.error('Failed to delete food log');
      console.error('Error deleting food log:', err);
      if (err.code === 'auth/id-token-expired') handleSessionExpired();
    } finally {
      setLoading(false);
    }
  }, [getUserToken, handleSessionExpired, setFoodLogs]);

  // Data Fetching: Handle copying a food log to the current date
  const handleCopyFoodLog = useCallback(async (log) => {
    if (!log || !log.id) {
      toast.error('Invalid food log data');
      return;
    }
    try {
      setLoading(true);
      const token = await getUserToken();
      await copyFoodLog(log.id, selectedDate.toISOString(), token);
      setFoodLogs(prev =>
        [...prev, { ...log, date_logged: selectedDate.toISOString() }].sort(
          (a, b) => new Date(b.date_logged) - new Date(a.date_logged)
        )
      );
      toast.success('Food log copied!');
    } catch (err) {
      toast.error('Failed to copy food log');
      console.error('Error copying food log:', err);
      if (err.code === 'auth/id-token-expired') handleSessionExpired();
    } finally {
      setLoading(false);
    }
  }, [getUserToken, selectedDate, handleSessionExpired, setFoodLogs]);

  // Utilities: Filter logs for the selected date
  const dailyLogs = useMemo(() => {
    if (!foodLogs) return [];
    return foodLogs.filter(log => moment(log.date_logged).isSame(selectedDate, 'day'));
  }, [foodLogs, selectedDate]);

  // Utilities: Group logs by meal type
  const groupedLogs = useMemo(() => {
    try {
      return {
        morning: dailyLogs.filter(log => log.meal_type === 'morning'),
        afternoon: dailyLogs.filter(log => log.meal_type === 'afternoon'),
        evening: dailyLogs.filter(log => log.meal_type === 'evening'),
      };
    } catch (err) {
      console.error('Error grouping logs by meal:', err);
      toast.error('Failed to group food logs');
      return { morning: [], afternoon: [], evening: [] };
    }
  }, [dailyLogs]);

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
      {Object.entries(groupedLogs).map(([type, logs]) => (
        <div key={type} className="mb-6">
          <h3 className="text-base font-medium capitalize mb-2 text-gray-700">{type}</h3>
          {logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className={`p-3 text-left font-medium text-gray-600 ${columnWidths.food}`}>Food</th>
                    <th className={`p-3 text-right font-medium text-gray-600 ${columnWidths.cal}`}>Cal</th>
                    <th className={`p-3 text-right font-medium text-gray-600 ${columnWidths.carbs}`}>Carbs</th>
                    <th className={`p-3 text-right font-medium text-gray-600 ${columnWidths.protein}`}>Prot</th>
                    <th className={`p-3 text-right font-medium text-gray-600 ${columnWidths.fats}`}>Fats</th>
                    <th className={`p-3 text-center font-medium text-gray-600 ${columnWidths.img}`}>Img</th>
                    <th className={`p-3 text-center font-medium text-gray-600 ${columnWidths.actions}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className={`p-3 ${columnWidths.food} truncate`} title={log.food_name || 'Unknown'}>
                        {log.food_name || 'Unknown'}
                      </td>
                      <td className={`p-3 text-right ${columnWidths.cal}`}>{log.calories || '—'}</td>
                      <td className={`p-3 text-right ${columnWidths.carbs}`}>{log.carbs || '—'}</td>
                      <td className={`p-3 text-right ${columnWidths.protein}`}>{log.protein || '—'}</td>
                      <td className={`p-3 text-right ${columnWidths.fats}`}>{log.fats || '—'}</td>
                      <td className={`p-3 text-center ${columnWidths.img}`}>
                        {log.image_url ? (
                          <img
                            src={log.image_url}
                            alt={log.food_name || 'Food'}
                            className="w-10 h-10 object-cover rounded mx-auto"
                            onError={e => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/40?text=No+Image';
                            }}
                          />
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className={`p-3 text-center ${columnWidths.actions}`}>
                        <button
                          type="button"
                          onClick={() => handleCopyFoodLog(log)}
                          className="mr-2 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition disabled:opacity-50"
                          disabled={loading}
                          title="Copy to current date"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFoodLog(log.id)}
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition disabled:opacity-50"
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
          No logs for {moment(selectedDate).format('MMM D, YYYY')}
        </div>
      )}
    </motion.div>
  );
};

export default DailyFoodLogs;