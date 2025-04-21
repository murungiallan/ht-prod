import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Calendar = ({ exercises, setSelectedDate, selectedDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const scrollContainerRef = useRef(null);
  
  // Generate calendar dates for the current month view
  const generateCalendarDates = () => {
    const dates = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Start from a few days from previous month for better UX
    const startDate = new Date(year, month, 1);
    startDate.setDate(startDate.getDate() - 3);
    
    // End a few days into next month
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

  const hasExercisesOnDate = (date) => {
    return exercises.some(
      (ex) => new Date(ex.date_logged).toISOString().split("T")[0] === date.toISOString().split("T")[0]
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

  // Filter exercises for the selected date
  const selectedDateExercises = selectedDate
    ? exercises.filter(
        (ex) =>
          new Date(ex.date_logged).toISOString().split("T")[0] ===
          new Date(selectedDate).toISOString().split("T")[0]
      )
    : [];

  // Calculate workout stats for the selected date
  const workoutStats = selectedDate
    ? {
        completed: selectedDateExercises.filter((ex) => ex.status === "completed").length,
        canceled: selectedDateExercises.filter((ex) => ex.status === "canceled").length,
        notDone: selectedDateExercises.filter((ex) => ex.status === "not_done").length,
      }
    : { completed: 0, canceled: 0, notDone: 0 };

  return (
    <div className="w-full mx-auto">
      {/* Month selector header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <button
          onClick={handlePrevMonth}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all duration-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-800">
          {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all duration-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
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
          const isSelected = selectedDate &&
            selectedDate.toISOString().split("T")[0] === date.toISOString().split("T")[0];
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
                className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${
                  isSelected 
                    ? "bg-blue-500 text-white shadow-lg" 
                    : isDateToday 
                      ? "bg-blue-100" 
                      : "bg-white border border-gray-200 hover:border-blue-300"
                } ${!isCurrentMonth ? "opacity-50" : ""}`}
                aria-label={`Select date ${date.toLocaleDateString()}`}
              >
                {/* Exercise indicator dot */}
                {hasExercises && (
                  <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                    isSelected ? "bg-white" : "bg-yellow-400"
                  }`}></span>
                )}
                
                {/* Day name */}
                <span className={`text-xs px-2 font-medium mb-1 ${
                  isSelected ? "text-blue-100" : "text-gray-500"
                }`}>
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                
                {/* Date number */}
                <span className={`text-md font-bold px-2 ${
                  isSelected 
                    ? "text-white" 
                    : isDateToday 
                      ? "text-blue-600" 
                      : "text-gray-800"
                }`}>
                  {date.getDate()}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;