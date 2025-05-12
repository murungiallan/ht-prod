import React from 'react';
import Calendar from 'react-calendar';
import { motion } from 'framer-motion';

const CalendarCard = ({ selectedDate, setSelectedDate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white p-4 rounded-xl shadow-md"
    >
      {/* <h2 className="text-lg font-semibold mb-4 text-gray-700">Select Date</h2> */}
      <Calendar
        onChange={setSelectedDate}
        value={selectedDate}
        className="border-none w-full font-sans"
      />
      <style jsx global>{`
        .react-calendar {
          border: none !important;
          font-family: 'Inter', sans-serif !important;
          width: 100% !important;
        }
        .react-calendar__month-view__weekdays {
          display: grid !important;
          grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
          text-align: center;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          color: #6b7280;
          padding-bottom: 0.5rem;
          margin-bottom: 0.25rem;
        }
        .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none !important;
          font-weight: 500;
        }
        .react-calendar__month-view__days {
          display: grid !important;
          grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
          gap: 2px;
        }
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
        .react-calendar__navigation {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          border-bottom: 1px solid #f3f4f6;
        }
        .react-calendar__navigation button {
          min-width: 28px;
          height: 28px;
          background: none;
          color: #4b5563;
          transition: background-color 0.2s ease;
          border-radius: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background-color: #f3f4f6;
        }
        .react-calendar__tile--active {
          background: #3b82f6 !important;
          color: #ffffff !important;
        }
        .react-calendar__tile--active:enabled:hover,
        .react-calendar__tile--active:enabled:focus {
          background: #2563eb !important;
        }
        @media (max-width: 480px) {
          .react-calendar button {
            font-size: 0.75rem !important;
          }
          .react-calendar__navigation {
            padding: 0.5rem;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default CalendarCard;