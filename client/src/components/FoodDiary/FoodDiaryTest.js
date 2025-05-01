import React, { useState } from "react";
import Calendar from "./Calendar";
import MealSection from "./MealSection";
import SummaryCard from "./SummaryCard";
import Pagination from "./Pagination";
import AddFoodModal from "./AddFoodModal";
import { MdAdd } from "react-icons/md";

const mealData = [
  { id: 1, name: "Oatmeal", calories: 200, mealType: "Breakfast", date: "2025-04-24" },
  { id: 2, name: "Grilled Chicken Salad", calories: 350, mealType: "Lunch", date: "2025-04-24" },
  { id: 3, name: "Salmon with Quinoa", calories: 450, mealType: "Dinner", date: "2025-04-23" },
  { id: 4, name: "Apple", calories: 80, mealType: "Snacks", date: "2025-04-23" },
  { id: 5, name: "Pancakes", calories: 300, mealType: "Breakfast", date: "2025-04-22" },
];

const FoodDiary = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const formattedDate = selectedDate.toISOString().split("T")[0];
  const mealsForDate = mealData.filter(meal => meal.date === formattedDate);

  const groupedMeals = ["Breakfast", "Lunch", "Dinner", "Snacks"].map(type => ({
    mealType: type,
    meals: mealsForDate.filter(meal => meal.mealType === type),
  }));

  const totalCalories = mealsForDate.reduce((sum, meal) => sum + meal.calories, 0);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <Calendar meals={mealData} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

      <div className="grid grid-cols-2 gap-4">
        <SummaryCard title="Total Calories" value={totalCalories} unit="kcal" />
        <SummaryCard title="Meals Logged" value={mealsForDate.length} unit="meals" />
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        {groupedMeals.map(({ mealType, meals }) => (
          <MealSection key={mealType} mealType={mealType} meals={meals} />
        ))}
      </div>

      <Pagination currentPage={currentPage} totalPages={3} setPage={setCurrentPage} />

      <div className="flex justify-end">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 mt-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
        >
          <MdAdd className="text-lg" /> Add Food
        </button>
      </div>

      <AddFoodModal isOpen={modalOpen} onRequestClose={() => setModalOpen(false)} />
    </div>
  );
};

export default FoodDiary;