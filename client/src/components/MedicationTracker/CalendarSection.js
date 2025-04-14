import React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const CalendarSection = ({ selectedDate, setSelectedDate, isFutureDate }) => {
  const today = new Date();

  const tileDisabled = ({ date }) => {
    return isFutureDate(date);
  };

  return (
    <div className="w-1/2">
      <div className="p-4 calendar-container rounded-xl shadow-md bg-white overflow-hidden">
        <Calendar
          onChange={(date) => {
            if (!isFutureDate(date)) {
              setSelectedDate(date);
            }
          }}
          value={selectedDate}
          showNeighboringMonth={true}
          tileDisabled={tileDisabled}
          className="border-0 font-inter text-gray-800 w-full"
          tileClassName={({ date, view }) => {
            const isToday = today.toDateString() === date.toDateString();
            const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
            const isCurrentMonth = date.getMonth() === (selectedDate ? selectedDate.getMonth() : today.getMonth());
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isSunday = date.getDay() === 0;
            const isSpecialDate = date.getDate() === 6 || date.getDate() === 10;
          
            let classes = "transition-colors duration-200 text-sm flex items-center justify-center rounded-md";
            if (!isCurrentMonth) {
              classes += " text-gray-400"; // Neighboring months
            } else if (isSelected) {
              classes += " bg-amber-200 text-white font-semibold hover:bg-amber-600"; // Selected date
            } else if (isToday) {
              classes += " bg-teal-100 text-teal-800 font-semibold hover:bg-teal-200"; // Today
            } else {
              classes += " hover:bg-gray-100";
            }
          
            // Special dates (only if current month and NOT selected/today)
            if (isCurrentMonth && !isSelected && !isToday) {
              if (date.getDate() === 6) {
                classes += " text-red-600 hover:bg-red-50";
              } else if (date.getDate() === 10) {
                classes += " text-indigo-600 hover:bg-indigo-50";
              } else if (isSunday) {
                classes += " text-orange-600 hover:bg-orange-50";
              } else if (isWeekend) {
                classes += " text-orange-500 hover:bg-orange-50";
              }
            }

            if (tileDisabled({ date })) {
              classes = " text-gray-400 opacity-60 cursor-not-allowed flex items-center justify-center rounded-md";
            }
          
            return classes;
          }}
          navigationClassName="flex justify-between items-center p-4 border-b border-gray-100"
          navigationLabel={({ date }) => (
            <span className="text-lg font-semibold text-gray-800">
              {date.toLocaleString("default", { month: "long" })} {date.getFullYear()}
            </span>
          )}
          nextLabel={<ChevronRight />}
          prevLabel={<ChevronLeft />}
          next2Label={<DoubleChevronRight />}
          prev2Label={<DoubleChevronLeft />}
          navigationAriaLabel="Calendar navigation"
          formatShortWeekday={(locale, date) => {
            return date.toLocaleString(locale, { weekday: "narrow" });
          }}
          aria-label="Select date for medication tracking"
        />
      </div>

      {/* Custom styles */}
      <style jsx global>{`
        .react-calendar {
          border: none !important;
          font-family: "Inter", sans-serif !important;
          width: 100% !important;
          max-width: 100% !important;
        }

        /* --- GRID FIX START --- */
        .react-calendar__month-view__weekdays {
          display: grid !important;
          grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
          width: 100%;
          text-align: center;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          color: #6b7280; /* text-gray-500 */
          padding-bottom: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none !important;
          font-weight: 500;
        }

        .react-calendar__month-view__weekdays__weekday {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .react-calendar__month-view__days {
          display: grid !important;
          grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
          width: 100%;
          gap: 2px;
        }
        /* --- GRID FIX END --- */

        .react-calendar button {
          margin: 0;
          aspect-ratio: 1 / 1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease, color 0.2s ease;
          border: none;
          background: transparent;
          padding: 0;
          font-size: 0.875rem;
          border-radius: 0.375rem;
        }

        /* --- Navigation Styles --- */
        .react-calendar__navigation {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          border-bottom: 1px solid #f3f4f6; /* border-gray-100 */
        }

        .react-calendar__navigation button {
          min-width: 36px;
          height: 36px;
          background: none;
          color: #4b5563; /* text-gray-600 */
          transition: background-color 0.2s ease;
          border-radius: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          aspect-ratio: auto;
        }

        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background-color: #f3f4f6; /* bg-gray-100 */
        }

        .react-calendar__navigation button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background-color: transparent !important;
        }

        /* --- Tile Classes --- */
        .react-calendar__tile--neighboringMonth {
          /* tileClassName */
        }

        .react-calendar__tile--neighboringMonth:disabled {
          /* tileClassName */
        }

        .react-calendar__tile--active {
          background: #f59e0b !important; /* bg-amber-500 */
          color: #ffffff !important; /* text-white */
        }

        .react-calendar__tile--active:enabled:hover,
        .react-calendar__tile--active:enabled:focus {
          background: #d97706 !important; /* bg-amber-600 */
        }

        @media (max-width: 480px) {
          .react-calendar button {
            font-size: 0.75rem !important;
          }

          .react-calendar__navigation {
            padding: 0.5rem;
          }

          .react-calendar__navigation button {
            min-width: 28px;
            height: 28px;
          }

          .react-calendar__navigation span {
            font-size: 1rem;
          }

          .react-calendar__month-view__weekdays {
            font-size: 0.65rem;
            padding-bottom: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
};

const ChevronLeft = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

const ChevronRight = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

const DoubleChevronLeft = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z"
      clipRule="evenodd"
    />
  </svg>
);

const DoubleChevronRight = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
      clipRule="evenodd"
    />
    <path
      fillRule="evenodd"
      d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

export default CalendarSection;