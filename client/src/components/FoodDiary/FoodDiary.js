import React, { useState, useEffect, useRef } from "react";
import { MdAdd, MdClose, MdExpandMore, MdExpandLess } from "react-icons/md";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Modal from "react-modal";
import { motion, AnimatePresence } from "framer-motion";

// Placeholder data
const mealData = [
  { id: 1, name: "Oatmeal", calories: 200, mealType: "Breakfast", date: "2025-04-24" },
  { id: 2, name: "Grilled Chicken Salad", calories: 350, mealType: "Lunch", date: "2025-04-24" },
  { id: 3, name: "Salmon with Quinoa", calories: 450, mealType: "Dinner", date: "2025-04-23" },
  { id: 4, name: "Apple", calories: 80, mealType: "Snacks", date: "2025-04-23" },
  { id: 5, name: "Pancakes", calories: 300, mealType: "Breakfast", date: "2025-04-22" },
];

// Calendar Component
const Calendar = ({ meals, setSelectedDate, selectedDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const scrollContainerRef = useRef(null);

  // Set default selected date
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(new Date());
    }
  }, [selectedDate, setSelectedDate]);

  // Calendar dates for the current month view
  const generateCalendarDates = () => {
    const dates = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const startDate = new Date(year, month, 1);
    startDate.setDate(startDate.getDate() - 3);

    const endDate = new Date(year, month + 1, 0);
    endDate.setDate(endDate.getDate() + 3);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const hasMealsOnDate = (date) => {
    return meals.some(
      (meal) => new Date(meal.date).toISOString().split("T")[0] === date.toISOString().split("T")[0]
    );
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  // Center today's date in the scroll container
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const todayElement = container.querySelector("[data-today='true']");

      if (todayElement) {
        const scrollPosition = todayElement.offsetLeft - container.clientWidth / 2 + todayElement.offsetWidth / 2;
        container.scrollTo({ left: scrollPosition, behavior: "smooth" });
      }
    }
  }, [currentMonth]);

  return (
    <div className="w-full mx-auto bg-gray-50 rounded-lg shadow-sm p-4">
      {/* Month selector header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <motion.button
          onClick={handlePrevMonth}
          className="p-2 bg-white text-teal-700 border border-gray-200 rounded-full hover:bg-teal-50 transition-all duration-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          aria-label="Previous month"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft size={20} />
        </motion.button>
        <h2 className="text-lg font-semibold text-gray-800">
          {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
        </h2>
        <motion.button
          onClick={handleNextMonth}
          className="p-2 bg-white text-teal-700 border border-gray-200 rounded-full hover:bg-teal-50 transition-all duration-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          aria-label="Next month"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight size={20} />
        </motion.button>
      </div>

      {/* Calendar dates scroll container */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto py-2 px-2 scrollbar-hide snap-x snap-mandatory"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {generateCalendarDates().map((date, index) => {
          const isDateToday = isToday(date);
          const isSelected =
            selectedDate &&
            selectedDate.toISOString().split("T")[0] === date.toISOString().split("T")[0];
          const hasMeals = hasMealsOnDate(date);
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

          return (
            <motion.div
              key={index}
              className="snap-center flex-shrink-0 px-1"
              data-today={isDateToday}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={() => handleDateSelect(date)}
                className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-300 ${
                  isSelected
                    ? "bg-teal-100 text-teal-800 shadow-md border border-transparent focus:border-transparent active:border-transparent"
                    : isDateToday
                    ? "bg-teal-100 text-teal-800"
                    : "bg-white text-gray-800 border border-gray-100 hover:border-teal-300 hover:bg-teal-100"
                } ${!isCurrentMonth ? "opacity-50" : ""}`}
                aria-label={`Select date ${date.toLocaleDateString()}`}
              >
                {/* Meal indicator dot */}
                {hasMeals && (
                  <span
                    className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                      isSelected ? "bg-teal-500" : "bg-teal-500"
                    }`}
                  ></span>
                )}

                {/* Day name */}
                <span
                  className={`text-xs px-2 font-medium mb-1 ${
                    isSelected ? "text-teal-800" : "text-gray-600"
                  }`}
                >
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </span>

                {/* Date number */}
                <span
                  className={`text-md font-bold px-2 ${
                    isSelected
                      ? "text-teal-800"
                      : isDateToday
                      ? "text-teal-800"
                      : "text-gray-800"
                  }`}
                >
                  {date.getDate()}
                </span>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Collapsible Meal Section Component
const MealSection = ({ mealType, meals }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-3 px-4 text-sm font-medium text-gray-800 hover:bg-gray-50"
      >
        <span>{mealType} ({meals.length})</span>
        {isOpen ? <MdExpandLess className="text-lg" /> : <MdExpandMore className="text-lg" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {meals.length === 0 ? (
              <p className="px-4 py-2 text-sm text-gray-600">No {mealType} logged.</p>
            ) : (
              meals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex justify-between items-center px-4 py-2 hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{meal.name}</p>
                    <p className="text-xs text-gray-600">{meal.calories} kcal</p>
                  </div>
                  <button className="text-teal-600 hover:text-teal-800" aria-label="Edit meal">
                    <MdAdd className="text-lg" />
                  </button>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ title, value, unit }) => (
  <motion.div
    className="bg-white rounded-lg shadow-sm p-4"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <h3 className="text-sm font-medium text-gray-800">{title}</h3>
    <p className="text-2xl font-semibold text-teal-600 mt-2">
      {value} <span className="text-sm text-gray-600">{unit}</span>
    </p>
  </motion.div>
);

// Pagination Component
const Pagination = ({ currentPage, totalPages, setPage }) => (
  <div className="flex justify-center gap-2 mt-4">
    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
      <button
        key={page}
        onClick={() => setPage(page)}
        className={`px-3 py-1 rounded-md text-sm ${
          currentPage === page
            ? "bg-teal-600 text-white"
            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
        }`}
      >
        {page}
      </button>
    ))}
  </div>
);

// Add Food Modal Component
const AddFoodModal = ({ isOpen, onRequestClose }) => (
  <Modal
    isOpen={isOpen}
    onRequestClose={onRequestClose}
    contentLabel="Add Food"
    className="bg-gray-100 rounded-xl shadow-lg w-full max-w-md overflow-hidden relative border border-gray-200 p-4"
    overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 mb-0"
  >
    <div className="relative">
      <button
        onClick={onRequestClose}
        className="absolute top-0 right-0 text-teal-600 hover:text-teal-800 text-lg font-bold p-2"
        aria-label="Close modal"
      >
        <MdClose />
      </button>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Food</h2>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Food Name</label>
          <input
            type="text"
            placeholder="e.g., Grilled Chicken"
            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Calories</label>
          <input
            type="number"
            placeholder="e.g., 200"
            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Meal Type</label>
          <select
            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
          >
            <option>Breakfast</option>
            <option>Lunch</option>
            <option>Dinner</option>
            <option>Snacks</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Date</label>
          <input
            type="date"
            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onRequestClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 transition-all duration-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-500 focus:ring-2 focus:ring-teal-500 transition-all duration-300"
          >
            Add Food
          </button>
        </div>
      </form>
    </div>
  </Modal>
);

// Main FoodTracker Component
const FoodTracker = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    </div>
  );
};

export default FoodTracker;