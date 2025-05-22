import { motion } from "framer-motion";

const modalVariants = { hidden: { opacity: 0, y: -50 }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -50 } };

const AddReminderModal = ({ onSubmit, onClose }) => {
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
        <h3 className="text-lg font-bold text-gray-800 mb-4">Add Reminder</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="number"
            name="user_id"
            placeholder="User ID"
            className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="number"
            name="medication_id"
            placeholder="Medication ID"
            className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="number"
            name="dose_index"
            placeholder="Dose Index"
            className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="time"
            name="reminder_time"
            placeholder="Reminder Time"
            className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="date"
            name="date"
            placeholder="Date"
            className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
            required
          />
          <select
            name="status"
            className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
          </select>
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
              Add Reminder
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddReminderModal;