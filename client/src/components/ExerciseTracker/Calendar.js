import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Stats from "./Stats";

const Calendar = ({ exercises, setSelectedDate, selectedDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const scrollContainerRef = useRef(null);
  
  const normalizeDate = (date) => {
    // Create a new date
    const normalized = new Date(date);
    // Set to midnight in local timezone
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  // Get today's date normalized to midnight
  const today = normalizeDate(new Date());

  // Set default selected date on mount only
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(normalizeDate(new Date()));
    }
  }, []);

  // Generate calendar dates for the current month view
  const generateCalendarDates = () => {
    const dates = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Start 3 days before the first of the month
    const startDate = new Date(year, month, 1);
    startDate.setDate(startDate.getDate() - 3);
    
    // End 3 days after the last of the month
    const endDate = new Date(year, month + 1, 0);
    endDate.setDate(endDate.getDate() + 3);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(normalizeDate(new Date(d)));
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
    return date.getTime() === today.getTime();
  };

  const hasExercisesOnDate = (date) => {
    return exercises.some(ex => {
      const exDate = normalizeDate(new Date(ex.date_logged));
      return exDate.getTime() === date.getTime();
    });
  };

  const handleDateSelect = (date) => {
    setSelectedDate(normalizeDate(date));
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

  // Filter exercises for the selected date using normalized comparison
  const selectedDateExercises = selectedDate
    ? exercises.filter(ex => {
        const exDate = normalizeDate(new Date(ex.date_logged));
        const selDate = normalizeDate(new Date(selectedDate));
        return exDate.getTime() === selDate.getTime();
      })
    : [];

  // Calculate stats for the selected date
  const exerciseStats = selectedDateExercises.reduce(
    (acc, ex) => ({
      totalCalories: acc.totalCalories + (Number(ex.calories_burned) || 0),
      totalDuration: acc.totalDuration + (Number(ex.duration) || 0),
      totalSessions: acc.totalSessions + 1,
    }),
    { totalCalories: 0, totalDuration: 0, totalSessions: 0 }
  );

  return (
    <div className="w-full mx-auto">
      {/* Month selector header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <button
          onClick={handlePrevMonth}
          className="p-2 bg-transparent text-black border border-gray-200 rounded-full hover:bg-gray-200 transition-all duration-300 focus:ring-2 focus:ring-gray-400 focus:outline-none"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-800">
          {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 bg-transparent text-black border border-gray-200 rounded-full hover:bg-gray-200 transition-all duration-300 focus:ring-2 focus:ring-gray-400 focus:outline-none"
          aria-label="Next month"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar dates scroll container */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto py-4 px-2 scrollbar-hide snap-x snap-mandatory"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {generateCalendarDates().map((date, index) => {
          const isDateToday = isToday(date);
          const isSelected = selectedDate && normalizeDate(new Date(selectedDate)).getTime() === date.getTime();
          const hasExercises = hasExercisesOnDate(date);
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

          return (
            <div
              key={index}
              className="snap-center flex-shrink-0 px-1"
              data-today={isDateToday}
            >
              <button
                onClick={() => handleDateSelect(date)}
                className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-300 ${
                  isSelected
                    ? "bg-yellow-400 text-white shadow-lg"
                    : isDateToday
                      ? "bg-yellow-100 text-yellow-500"
                      : "bg-white border border-gray-100 hover:border-yellow-400"
                } ${!isCurrentMonth ? "opacity-50" : ""}`}
                aria-label={`Select date ${date.toLocaleDateString()}`}
              >
                {/* Exercise indicator dot */}
                {hasExercises && (
                  <span
                    className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                      isSelected ? "bg-yellow-600" : "bg-white"
                    }`}
                  ></span>
                )}

                {/* Day name */}
                <span
                  className={`text-xs px-2 font-medium mb-1 ${
                    isSelected ? "text-gray-100" : "text-gray-400"
                  }`}
                >
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </span>

                {/* Date number */}
                <span
                  className={`text-md font-bold px-2 ${
                    isSelected
                      ? "text-white"
                      : isDateToday
                        ? "text-yellow-400"
                        : "text-gray-800"
                  }`}
                >
                  {date.getDate()}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Stats component to display calories, duration, and sessions */}
      <Stats stats={exerciseStats} />
    </div>
  );
};

export default Calendar;