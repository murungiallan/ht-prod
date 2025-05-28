import React, { useMemo } from "react";
import { motion } from "framer-motion";
import moment from "moment-timezone";

const NutritionalInsights = ({ foodLogs, selectedDate, eatingPattern }) => {
  // Utilities
  const dailyLogs = useMemo(() => {
    return foodLogs.filter((log) =>
      moment(log.date_logged).tz("Asia/Singapore").isSame(moment(selectedDate).tz("Asia/Singapore"), "day")
    );
  }, [foodLogs, selectedDate]);

  const calculateDailyTotals = useMemo(() => {
    return dailyLogs.reduce(
      (totals, log) => ({
        calories: totals.calories + (parseFloat(log.calories) || 0),
        carbs: totals.carbs + (parseFloat(log.carbs) || 0),
        protein: totals.protein + (parseFloat(log.protein) || 0),
        fats: totals.fats + (parseFloat(log.fats) || 0),
      }),
      { calories: 0, carbs: 0, protein: 0, fats: 0 }
    );
  }, [dailyLogs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white p-6 rounded-xl shadow-md"
    >
      <h2 className="text-lg font-semibold mb-6 text-gray-700">Nutritional Insights</h2>
      <p className="mb-4 text-sm text-gray-600">
        Pattern: <span className="font-medium text-blue-600">{eatingPattern}</span>
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {["calories", "carbs", "protein", "fats"].map((nutrient) => (
          <div key={nutrient} className="p-6 bg-gray-50 rounded-lg text-center">
            <p className="text-xs text-gray-500 capitalize">{nutrient}</p>
            <p className="text-sm font-semibold text-gray-950">
              {typeof calculateDailyTotals[nutrient] === "number" && !isNaN(calculateDailyTotals[nutrient])
                ? `${calculateDailyTotals[nutrient].toFixed(1)} ${nutrient === "calories" ? "kcal" : "g"}`
                : "N/A"}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default NutritionalInsights;