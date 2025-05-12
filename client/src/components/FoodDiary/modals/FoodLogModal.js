import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { createFoodLog, searchFoods } from '../../../services/api';

// FoodLogModal component for adding new food logs
const FoodLogModal = ({ isOpen, onClose, getUserToken, setFoodLogs, handleSessionExpired }) => {
  const [foodInput, setFoodInput] = useState({
    name: '',
    calories: '',
    carbs: '',
    protein: '',
    fats: '',
    mealType: 'morning',
    dateLogged: new Date(),
  });
  const [image, setImage] = useState(null);
  const [foodSuggestions, setFoodSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Initialization
  const resetForm = () => {
    setFoodInput({
      name: '',
      calories: '',
      carbs: '',
      protein: '',
      fats: '',
      mealType: 'morning',
      dateLogged: new Date(),
    });
    setImage(null);
    setFoodSuggestions([]);
  };

  // Data Fetching
  const searchFoodSuggestions = useCallback(
    async (query) => {
      if (!query || query.length < 2) {
        setFoodSuggestions([]);
        return;
      }
      try {
        setSearchLoading(true);
        const token = await getUserToken();
        const results = await searchFoods(query, token);
        setFoodSuggestions(results || []);
      } catch (err) {
        console.error('Error fetching food suggestions:', err);
        toast.error('Failed to fetch food suggestions');
        if (err.code === 'auth/id-token-expired') handleSessionExpired();
      } finally {
        setSearchLoading(false);
      }
    },
    [getUserToken, handleSessionExpired]
  );

  // Event Handlers
  const handleSelectFood = (food) => {
    setFoodInput({
      ...foodInput,
      name: food.food_name,
      calories: food.calories || '',
      carbs: food.carbs || '',
      protein: food.protein || '',
      fats: food.fats || '',
    });
    setFoodSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!foodInput.name.trim()) {
      toast.error('Food name is required');
      return;
    }
  
    try {
      setLoading(true);
      const token = await getUserToken();
      const formData = new FormData();
      formData.append('food_name', foodInput.name.trim());
      formData.append('calories', parseFloat(foodInput.calories) || 0);
      formData.append('carbs', parseFloat(foodInput.carbs) || 0);
      formData.append('protein', parseFloat(foodInput.protein) || 0);
      formData.append('fats', parseFloat(foodInput.fats) || 0);
      formData.append('meal_type', foodInput.mealType);
      formData.append('date_logged', foodInput.dateLogged.toISOString());
      if (image) formData.append('image', image);
  
      console.log('Submitting food log:', { foodInput, image }); // Debug log
      const newLog = await createFoodLog(formData, token);
      console.log('Received new log:', newLog); // Debug log
      if (!newLog || !newLog.id) {
        throw new Error('Invalid response from server');
      }
      setFoodLogs(prev => [newLog, ...prev].sort((a, b) => new Date(b.date_logged) - new Date(a.date_logged)));
      toast.success('Food log added!');
      resetForm();
      onClose();
    } catch (err) {
      console.error('Error creating food log:', err.message, err.stack);
      toast.error(`Failed to add food log: ${err.message || 'Unknown error'}`);
      if (err.code === 'auth/id-token-expired') handleSessionExpired();
    } finally {
      setLoading(false); // Ensure loading is cleared
    }
  };

  // Effects
  useEffect(() => {
    const debounceSearch = setTimeout(() => {
      searchFoodSuggestions(foodInput.name);
    }, 300);
    return () => clearTimeout(debounceSearch);
  }, [foodInput.name, searchFoodSuggestions]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg max-h-150 overflow-y-auto scrollbar-hide no-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Log a Meal</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Food Name</label>
              <input
                type="text"
                value={foodInput.name}
                onChange={(e) => setFoodInput(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Search or enter food..."
                disabled={loading}
              />
              {foodSuggestions.length > 0 && (
                <ul className="mt-2 border rounded-lg max-h-40 overflow-y-auto bg-white shadow-md">
                  {foodSuggestions.map((food, idx) => (
                    <li
                      key={idx}
                      className="p-3 hover:bg-gray-100 cursor-pointer transition"
                      onClick={() => handleSelectFood(food)}
                    >
                      {food.food_name} ({food.calories} kcal)
                    </li>
                  ))}
                </ul>
              )}
              {searchLoading && <p className="text-sm text-gray-500 mt-1">Searching...</p>}
            </div>
            {['Calories (kcal)', 'Carbs (g)', 'Protein (g)', 'Fats (g)'].map((label) => (
              <div key={label}>
                <label className="block text-sm font-medium text-gray-600">{label}</label>
                <input
                  type="number"
                  value={foodInput[label.toLowerCase().split(' ')[0]]}
                  onChange={(e) =>
                    setFoodInput(prev => ({ ...prev, [label.toLowerCase().split(' ')[0]]: e.target.value }))
                  }
                  className="w-full p-3 border rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500 transition"
                  disabled={loading}
                  min="0"
                  step="0.1"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-600">Meal Type</label>
              <select
                value={foodInput.mealType}
                onChange={(e) => setFoodInput(prev => ({ ...prev, mealType: e.target.value }))}
                className="w-full p-3 border rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500 transition"
                disabled={loading}
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Date</label>
              <input
                type="date"
                value={foodInput.dateLogged.toISOString().split('T')[0]}
                onChange={(e) => setFoodInput(prev => ({ ...prev, dateLogged: new Date(e.target.value) }))}
                className="w-full p-3 border rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500 transition"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Image (optional)</label>
              <input
                type="file"
                onChange={(e) => setImage(e.target.files[0])}
                className="w-full p-3 border rounded-lg border-gray-200"
                accept="image/*"
                disabled={loading}
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                disabled={loading}
              >
                Add Log
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FoodLogModal;