import { useState } from "react";
import { motion } from "framer-motion";

const LogExercise = ({ handleLogExercise, loading }) => {
  const [activity, setActivity] = useState("");
  const [duration, setDuration] = useState("");
  const [caloriesBurned, setCaloriesBurned] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    await handleLogExercise(e, activity, duration, caloriesBurned, setActivity, setDuration, setCaloriesBurned);
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-md p-6 mb-8"
      variants={itemVariants}
    >
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <svg className="h-5 w-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
            clipRule="evenodd"
          />
        </svg>
        Log New Exercise
      </h2>
      <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Activity</label>
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-base text-gray-700"
            required
            aria-label="Select exercise activity"
          >
            <option value="">Select an exercise</option>
            <option value="Running">Running</option>
            <option value="Walking">Walking</option>
            <option value="Swimming">Swimming</option>
            <option value="Cycling">Cycling</option>
            <option value="Treadmill">Treadmill</option>
            <option value="Hiking">Hiking</option>
            <option value="HIIT">HIIT</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g., 30"
            min="1"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-base text-gray-700"
            required
            aria-label="Enter duration in minutes"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Calories Burned</label>
          <input
            type="number"
            value={caloriesBurned}
            onChange={(e) => setCaloriesBurned(e.target.value)}
            placeholder="e.g., 200"
            min="1"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-base text-gray-700"
            required
            aria-label="Enter calories burned"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={onSubmit}
            className="w-full p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300 text-base font-medium flex items-center justify-center"
            disabled={loading}
            aria-label="Log exercise"
          >
            {loading ? (
              <svg
                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            )}
            {loading ? "Logging..." : "Log Exercise"}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default LogExercise;