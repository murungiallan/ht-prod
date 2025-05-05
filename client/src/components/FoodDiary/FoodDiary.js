import React, { useState, useEffect, useRef } from "react";
import { MdAdd, MdClose, MdExpandMore, MdExpandLess } from "react-icons/md";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Modal from "react-modal";
import { motion, AnimatePresence } from "framer-motion";
import LogFood from "./LogFood";
import Calendar from "./Calendar";
import MealSection from "./MealSection";
import SummaryCard from "./SummaryCard";
import AddFoodModal from "./Modals/AddFoodModal";
import Pagination from "./Pagination";


// Placeholder data
const mealData = [
  { id: 1, name: "Oatmeal", calories: 200, mealType: "Breakfast", date: "2025-04-24" },
  { id: 2, name: "Grilled Chicken Salad", calories: 350, mealType: "Lunch", date: "2025-04-24" },
  { id: 3, name: "Salmon with Quinoa", calories: 450, mealType: "Dinner", date: "2025-04-23" },
  { id: 4, name: "Apple", calories: 80, mealType: "Snacks", date: "2025-04-23" },
  { id: 5, name: "Pancakes", calories: 300, mealType: "Breakfast", date: "2025-04-22" },
];



// Main FoodTracker Component
const FoodTracker = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogFoodModalOpen, setIsLogFoodModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snacks"];

  const filteredMeals = mealData.filter(
    (meal) => new Date(meal.date).toDateString() === selectedDate.toDateString()
  );
  const paginatedMeals = filteredMeals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredMeals.length / itemsPerPage);

  const handleLogFood = useCallback(async (e, foodName, portion, calories, setFoodName, setPortion, setCalories) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to log food");
      setLastFailedAction({ type: "logFood", params: null });
      toast.error("You must be logged in to log food");
      handleSessionExpired();
      return;
    }
    if (!foodName || !portion || !calories) {
      setError("All fields are required");
      setLastFailedAction({ type: "logFood", params: null });
      toast.error("All fields are required");
      return;
    }
    const portionNum = Number(portion);
    const caloriesNum = Number(calories);
    if (isNaN(portionNum) || isNaN(caloriesNum) || portionNum <= 0 || caloriesNum <= 0) {
      setError("Portion and calories must be positive numbers");
      setLastFailedAction({ type: "logFood", params: null });
      toast.error("Portion and calories must be positive numbers");
      return;
    }
  
    try {
      setLoading(true);
      const token = await getUserToken();
      const newFood = {
        food_name: foodName,
        portion: portionNum,
        calories: caloriesNum,
        date_logged: new Date().toISOString(),
        status: "consumed",
      };
      await createFood(newFood, token, getSocket);
      setFoodName("");
      setPortion("");
      setCalories("");
  
      const foodStats = await getFoodStats(token);
      setStats({
        totalCalories: foodStats.totalCalories || 0,
        totalPortion: foodStats.totalPortion || 0,
        totalEntries: foodStats.totalFoods || 0,
      });
      setError(null);
    } catch (err) {
      setError("Failed to log food");
      setLastFailedAction({ type: "logFood", params: { foodName, portion: portionNum, calories: caloriesNum } });
      toast.error("Failed to log food");
      console.error(err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      }
    } finally {
      setLoading(false);
    }
  }, [user, getSocket, handleSessionExpired]);

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex justify-between items-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Food Diary
            </h1>
            <p className="text-base text-gray-600">Track your calorie intake</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mb-0 mx-2 px-4 py-2 text-sm font-medium text-black bg-transparent hover:bg-teal-200  rounded-md border border-gray-200 hover:border-0 hover:border-transparent transition-all duration-300"
          >
            Log Food
          </button>
        </motion.div>

        {/* Calendar */}
        <Calendar meals={mealData} setSelectedDate={setSelectedDate} selectedDate={selectedDate} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Meals List */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 p-4 border-b border-gray-200">
              Meals for {selectedDate.toLocaleDateString("en-US", { dateStyle: "medium" })}
            </h2>
            <div className="divide-y divide-gray-200">
              {mealTypes.map((mealType) => (
                <MealSection
                  key={mealType}
                  mealType={mealType}
                  meals={paginatedMeals.filter((meal) => meal.mealType === mealType)}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                setPage={setCurrentPage}
              />
            )}
          </div>

          {/* Summary Cards */}
          <div className="space-y-4">
            <SummaryCard title="Total Calories" value={1080} unit="kcal" />
            <SummaryCard title="Servings" value={4} unit="meals" />
            <SummaryCard title="Water Intake" value={1.5} unit="L" />
          </div>
        </div>
      </div>

      {/* Add Food Modal */}
      <AddFoodModal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} />
      <LogFood
          handleLogFood={handleLogFood}
          loading={loading}
          isOpen={isLogFoodModalOpen}
          onClose={() => setIsLogFoodModalOpen(false)}
        />
    </div>
  );
};

export default FoodTracker;