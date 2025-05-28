import React, { useMemo } from "react";
import { motion } from "framer-motion";
import moment from "moment-timezone";

const FilterSummary = ({ filterPeriod, setFilterPeriod, foodLogs, selectedDate }) => {
  const filteredLogs = useMemo(() => {
    const now = moment().tz("Asia/Singapore");
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
    return foodLogs.filter((log) => {
      const logDate = moment(log.date_logged).tz("Asia/Singapore");
      return !startDate || (logDate.isSameOrAfter(startDate) && logDate.isSameOrBefore(now));
    });
  }, [filterPeriod, foodLogs]);

  const dailyLogs = useMemo(() => {
    return filteredLogs.filter((log) =>
      moment(log.date_logged).tz("Asia/Singapore").isSame(moment(selectedDate).tz("Asia/Singapore"), "day")
    );
  }, [filteredLogs, selectedDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-800 mb-1">Daily Summary</h3>
        <p className="text-sm text-blue-700">
          {dailyLogs.length} items on {moment(selectedDate).tz("Asia/Singapore").format("MMM D, YYYY")}
        </p>
      </div>
    </motion.div>
  );
};

export default FilterSummary;