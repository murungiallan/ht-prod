import { motion } from "framer-motion";

const modalVariants = { hidden: { opacity: 0, y: -50 }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -50 } };

const UpdateUserModal = ({ data, onSubmit, onClose }) => {
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
        <h3 className="text-lg font-bold text-gray-800 mb-4">Update User</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            defaultValue={data.email}
            className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="text"
            name="name"
            placeholder="Name"
            defaultValue={data.name}
            className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
            required
          />
          <select
            name="role"
            defaultValue={data.role}
            className="w-full p-3 border border-gray-200 bg-gray-50 rounded-md focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="resetPassword"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Send Password Reset Email</span>
          </label>
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
              Update User
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default UpdateUserModal;