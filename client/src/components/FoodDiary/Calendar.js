import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

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

export default Calendar;