import { motion } from "framer-motion";

const modalVariants = { hidden: { opacity: 0, y: -50 }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -50 } };

const UpdateExerciseModal = ({ data, onSubmit, onClose }) => {
  return (
    <motion.div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4">Update Exercise</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="number"
            name="user_id"
            placeholder="User ID"
            defaultValue={data.user_id}
            className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="text"
            name="activity"
            placeholder="Activity (e.g., Running)"
            defaultValue={data.activity}
            className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="number"
            name="duration"
            placeholder="Duration (min)"
            defaultValue={data.duration}
            className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="number"
            name="calories_burned"
            placeholder="Calories Burned"
            defaultValue={data.calories_burned}
            className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="date"
            name="date_logged"
            placeholder="Date Logged"
            defaultValue={data.date_logged?.split("T")[0]}
            className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
            required
          />
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
            >
              Update Exercise
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default UpdateExerciseModal;