import { useState } from "react";
import { motion } from "framer-motion";
import React from "react";

const LogFood = ({ handleLogFood, loading, isOpen, onClose }) => { 
    const [foodName, setFoodName] = useState("");
    const [portion, setPortion] = useState("");
    const [calories, setCalories] = useState("");
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        await handleLogFood(e, foodName, sportion, calories, setFoodName, setPortion, setCalories);
        if (!loading) onClose();
    };

    const handleCancel = () => {
        setFoodName("");
        setPortion("");
        setCalories("");
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
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Log New Food</h2>
      
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Food Name</label>
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="e.g., Grilled Chicken"
                  className="w-full bg-white p-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-yellow-600 focus:ring-3 focus:ring-blue-100 transition duration-200"
                  required
                  aria-label="Enter food name"
                />
              </div>
      
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Portion (g / servings)</label>
                  <input
                    type="text"
                    value={portion}
                    onChange={(e) => setPortion(e.target.value)}
                    placeholder="e.g., 150g or 1 serving"
                    className="w-full bg-white p-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-yellow-600 focus:ring-3 focus:ring-blue-100 transition duration-200"
                    required
                    aria-label="Enter portion size"
                  />
                </div>
      
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Calories</label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="e.g., 250"
                    min="1"
                    className="w-full bg-white p-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition duration-200"
                    required
                    aria-label="Enter calories"
                  />
                </div>
              </div>
      
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Food Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                  className="block w-full text-sm text-gray-600 bg-white border border-gray-200 rounded-lg cursor-pointer file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-yellow-100 file:text-yellow-800 hover:file:bg-yellow-200"
                  aria-label="Upload food image"
                />
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
                  aria-label="Log food"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Logging...
                    </div>
                  ) : (
                    "Log Food"
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    );

};

export default LogFood;