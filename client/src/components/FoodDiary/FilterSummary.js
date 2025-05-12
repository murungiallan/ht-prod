import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import moment from 'moment';

const FilterSummary = ({ filterPeriod, setFilterPeriod, foodLogs, selectedDate }) => {
  // Utilities
  const filteredLogs = useMemo(() => {
    const now = moment();
    const filters = {
      today: now.clone().startOf("day"),
      yesterday: now.clone().subtract(1, "day").startOf("day"),
      last7: now.clone().subtract(7, "days").startOf("day"),
      last14: now.clone().subtract(14, "days").startOf("day"),
      last28: now.clone().subtract(28, "days").startOf("day"),
      last6months: now.clone().subtract(6, "months").startOf("day"),
      all: null,
    };
    const startDate = filters[filterPeriod] || now.clone().subtract(100, "years").startOf("day");
    return foodLogs.filter(log => {
      const logDate = moment(log.date_logged);
      return !startDate || (logDate.isSameOrAfter(startDate) && logDate.isSameOrBefore(now));
    });
  }, [filterPeriod, foodLogs]);

  const dailyLogs = useMemo(() => {
    return filteredLogs.filter(log => moment(log.date_logged).isSame(selectedDate, "day"));
  }, [filteredLogs, selectedDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* className = "bg-white p-6 rounded-xl shadow-md" */}
      {/* <h2 className="text-lg font-semibold mb-4 text-gray-700">Daily Summary</h2> */}
      {/* <select
        value={filterPeriod}
        onChange={(e) => setFilterPeriod(e.target.value)}
        className="w-full p-3 border rounded-lg border-gray-200 mb-4 focus:ring-2 focus:ring-blue-500 transition"
      >
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="last7">Last 7 Days</option>
        <option value="last14">Last 14 Days</option>
        <option value="last28">Last 28 Days</option>
        <option value="last6months">Last 6 Months</option>
        <option value="all">All Time</option>
      </select> */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-800 mb-1">Daily Summary</h3>
        <p className="text-sm text-blue-700">
          {dailyLogs.length} items on {moment(selectedDate).format("MMM D, YYYY")}
        </p>
      </div>
    </motion.div>
  );
};

export default FilterSummary;