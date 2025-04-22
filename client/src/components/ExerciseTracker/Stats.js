import { FaDumbbell, FaClock, FaList } from "react-icons/fa";
import { motion } from "framer-motion";

const Stats = ({ stats }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8" variants={containerVariants}>
      <motion.div
        className="bg-white rounded-xl shadow-md p-5 flex items-center space-x-3"
        variants={itemVariants}
      >
        <div className="bg-yellow-100 p-3 rounded-full">
          <FaDumbbell className="text-yellow-500 text-xl" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Calories Burned</h3>
          <p className="text-sm font-semibold text-gray-900">
            {stats.totalCalories} <span className="font-normal text-gray-500">kcal</span>
          </p>
        </div>
      </motion.div>
      <motion.div
        className="bg-white rounded-xl shadow-md p-5 flex items-center space-x-3"
        variants={itemVariants}
      >
        <div className="bg-yellow-100 p-3 rounded-full">
          <FaClock className="text-yellow-600 text-xl" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Time</h3>
          <p className="text-sm font-semibold text-gray-900">
            {stats.totalDuration} <span className="font-normal text-gray-500">min</span>
          </p>
        </div>
      </motion.div>
      <motion.div
        className="bg-white rounded-xl shadow-md p-5 flex items-center space-x-3"
        variants={itemVariants}
      >
        <div className="bg-yellow-100 p-3 rounded-full">
          <FaList className="text-yellow-500 text-xl" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Sessions</h3>
          <p className="text-sm font-semibold text-gray-900">{stats.totalSessions}</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Stats;