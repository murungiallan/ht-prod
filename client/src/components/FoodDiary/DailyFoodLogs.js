import React, { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import moment from "moment-timezone";
import { toast } from "react-hot-toast";
import { copyFoodLog, deleteFoodLog } from "../../services/api";
import { WiDaySunnyOvercast, WiDaySunny, WiDayWindy } from "react-icons/wi";

const DailyFoodLogs = ({
  foodLogs,
  selectedDate,
  setFoodLogs,
  getUserToken,
  handleSessionExpired,
  onOpenFoodDetails,
}) => {
  const [loading, setLoading] = useState(false);

  const handleDeleteFoodLog = useCallback(
    async (id) => {
      if (!id) return toast.error("Invalid food log ID");
      try {
        setLoading(true);
        const token = await getUserToken();
        await deleteFoodLog(id, token);
        setFoodLogs((prev) => prev.filter((item) => item.id !== id));
        toast.success("Food log deleted!");
      } catch (err) {
        toast.error("Failed to delete food log");
        if (err.code === "auth/id-token-expired") handleSessionExpired();
      } finally {
        setLoading(false);
      }
    },
    [getUserToken, handleSessionExpired, setFoodLogs]
  );

  const handleCopyFoodLog = useCallback(
    async (log) => {
      if (!log?.id) return toast.error("Invalid food log");
      try {
        setLoading(true);
        const token = await getUserToken();
        await copyFoodLog(log.id, selectedDate.toISOString(), token);
        setFoodLogs((prev) => [
          ...prev,
          {
            ...log,
            date_logged: selectedDate.toISOString(),
          },
        ]);
        toast.success("Food log copied!");
      } catch (err) {
        toast.error("Failed to copy food log");
        if (err.code === "auth/id-token-expired") handleSessionExpired();
      } finally {
        setLoading(false);
      }
    },
    [getUserToken, selectedDate, handleSessionExpired, setFoodLogs]
  );

  const dailyLogs = useMemo(() => {
    if (!foodLogs) return [];
    return foodLogs.filter((log) =>
      moment(log.date_logged).tz("Asia/Singapore").isSame(moment(selectedDate).tz("Asia/Singapore"), "day")
    );
  }, [foodLogs, selectedDate]);

  const groupedLogs = useMemo(() => {
    try {
      return {
        morning: dailyLogs.filter((log) => log.meal_type === "morning"),
        afternoon: dailyLogs.filter((log) => log.meal_type === "afternoon"),
        evening: dailyLogs.filter((log) => log.meal_type === "evening"),
      };
    } catch (err) {
      console.error("Error grouping logs by meal:", err);
      toast.error("Failed to group food logs");
      return { morning: [], afternoon: [], evening: [] };
    }
  }, [dailyLogs]);

  const mealTotals = useMemo(() => {
    const calculateTotals = (logs) =>
      logs.reduce(
        (acc, log) => ({
          calories: acc.calories + (Number(log.calories) || 0),
          carbs: acc.carbs + (Number(log.carbs) || 0),
          protein: acc.protein + (Number(log.protein) || 0),
          fats: acc.fats + (Number(log.fats) || 0),
        }),
        { calories: 0, carbs: 0, protein: 0, fats: 0 }
      );

    return {
      morning: calculateTotals(groupedLogs.morning),
      afternoon: calculateTotals(groupedLogs.afternoon),
      evening: calculateTotals(groupedLogs.evening),
      daily: calculateTotals(dailyLogs),
    };
  }, [groupedLogs, dailyLogs]);

  const mealIcons = {
    morning: <WiDaySunnyOvercast style={{ fontSize: "1.2em", color: "#ffca28", marginRight: "4px" }} />,
    afternoon: <WiDaySunny style={{ fontSize: "1.2em", color: "#ffca28", marginRight: "4px" }} />,
    evening: <WiDayWindy style={{ fontSize: "1.2em", color: "#ffca28", marginRight: "4px" }} />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="bg-white rounded-xl shadow-sm my-4 overflow-hidden relative"
    >
      <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Food Journal</h2>
        <span className="text-sm text-gray-500 font-medium">
          {moment(selectedDate).tz("Asia/Singapore").format("dddd, MMM D, YYYY")}
        </span>
      </div>

      {dailyLogs.length === 0 ? (
        <div className="text-center py-12 px-6">
          <div className="text-gray-400 mb-2">📝</div>
          <p className="text-gray-500 font-medium">No meals logged for today</p>
          <p className="text-gray-400 text-sm mt-1">Your daily food entries will appear here</p>
        </div>
      ) : (
        <>
          {Object.entries(groupedLogs).map(([type, logs]) => (
            <div key={type} className="border-b border-gray-100 last:border-b-0">
              {logs.length > 0 && (
                <>
                  <div className="px-6 py-3 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-1.5">
                      <span className="mr-2">{mealIcons[type]}</span>
                      <h3 className="text-sm font-semibold capitalize text-gray-700">{type}</h3>
                    </div>
                    <div className="flex space-x-4 text-xs text-gray-500">
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-400">Calories</span>
                        <span className="font-medium">{mealTotals[type].calories}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-400">Carbs</span>
                        <span className="font-medium">{mealTotals[type].carbs}g</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-400">Protein</span>
                        <span className="font-medium">{mealTotals[type].protein}g</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-400">Fats</span>
                        <span className="font-medium">{mealTotals[type].fats}g</span>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-50">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="px-6 py-3 flex items-center hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => onOpenFoodDetails(log)}
                      >
                        <div className="mr-4">
                          {log.image_data ? (
                            <img
                              src={log.image_data}
                              alt={log.food_name || "Food"}
                              className="w-10 h-10 object-cover rounded-full border border-gray-200"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/40?text=•";
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                              •
                            </div>
                          )}
                        </div>

                        <div className="flex-grow">
                          <h4
                            className="font-medium text-gray-800 truncate"
                            title={log.food_name || "Unknown"}
                          >
                            {log.food_name || "Unknown"}
                          </h4>
                        </div>

                        <div className="flex space-x-5 mr-5">
                          <div className="text-center">
                            <div className="text-xs text-gray-500">{log.calories || "0"}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500">{log.carbs || "0"}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500">{log.protein || "0"}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500">{log.fats || "0"}</div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyFoodLog(log);
                            }}
                            className="p-1.5 text-green-500 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50"
                            disabled={loading}
                            title="Copy to current date"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFoodLog(log.id);
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                            disabled={loading}
                            title="Delete"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-700">Daily Total</h3>
              <div className="flex space-x-6">
                <div>
                  <span className="text-xs text-gray-500">Calories</span>
                  <div className="text-sm font-medium text-gray-800">{mealTotals.daily.calories}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Carbs</span>
                  <div className="text-sm font-medium text-gray-800">{mealTotals.daily.carbs}g</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Protein</span>
                  <div className="text-sm font-medium text-gray-800">{mealTotals.daily.protein}g</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Fats</span>
                  <div className="text-sm font-medium text-gray-800">{mealTotals.daily.fats}g</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default DailyFoodLogs;