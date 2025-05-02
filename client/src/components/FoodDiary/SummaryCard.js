import React from "react";
import { motion } from "framer-motion";

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

  export default SummaryCard;