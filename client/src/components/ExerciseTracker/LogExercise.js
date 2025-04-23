import { useState } from "react";
import { motion } from "framer-motion";

const LogExercise = ({ handleLogExercise, loading, isOpen, onClose }) => {
  const [activity, setActivity] = useState("");
  const [duration, setDuration] = useState("");
  const [caloriesBurned, setCaloriesBurned] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    await handleLogExercise(e, activity, duration, caloriesBurned, setActivity, setDuration, setCaloriesBurned);
    if (!loading) onClose();
  };

  const handleCancel = () => {
    setActivity("");
    setDuration("");
    setCaloriesBurned("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 mb-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-gray-100 rounded-xl shadow-lg w-full max-w-md overflow-hidden relative border border-gray-200"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 bg-gray-100 rounded-full w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-yellow-600 transition-colors duration-200 focus:outline-none focus:ring-3 focus:ring-blue-200"
          aria-label="Close modal"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Log New Exercise</h2>
          
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Exercise Activity</label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full bg-white p-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-yellow-600 focus:ring-3 focus:ring-blue-100 transition duration-200"
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
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (min)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 30"
                  min="1"
                  className="w-full bg-white p-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-yellow-600 focus:ring-3 focus:ring-blue-100 transition duration-200"
                  required
                  aria-label="Enter duration in minutes"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Calories Burned</label>
                <input
                  type="number"
                  value={caloriesBurned}
                  onChange={(e) => setCaloriesBurned(e.target.value)}
                  placeholder="e.g., 200"
                  min="1"
                  className="w-full bg-white p-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition duration-200"
                  required
                  aria-label="Enter calories burned"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-2 px-4 bg-gray-100 text-gray-800 rounded-lg border border-gray-200 hover:bg-gray-200 focus:outline-none font-medium text-sm transition-all duration-500 transform hover:-translate-y-px"
                aria-label="Cancel"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-400 focus:outline-none font-medium text-sm transition-all duration-500 transform hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                aria-label="Log exercise"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin mr-2 h-4 w-4 text-white"
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
                    Logging...
                  </div>
                ) : (
                  "Log Exercise"
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LogExercise;