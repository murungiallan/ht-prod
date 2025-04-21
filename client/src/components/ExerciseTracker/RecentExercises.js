import { useState } from "react";
import { FaRunning, FaWalking, FaSwimmer, FaHiking, FaDumbbell, FaBicycle, FaEllipsisH, FaClock, FaEdit, FaTrash, FaFire, FaCalendarAlt, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const RecentExercises = ({ exercises, filter, setFilter, handleDeleteExercise, handleUpdateExercise, loading }) => {
  const [editingExercise, setEditingExercise] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, exercise: null });
  const [sortConfig, setSortConfig] = useState({ key: 'date_logged', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const exercisesPerPage = 4;

  const openEditModal = (exercise) => {
    setEditingExercise({
      id: exercise.id,
      activity: exercise.activity,
      duration: exercise.duration,
      calories_burned: exercise.calories_burned,
      date_logged: exercise.date_logged,
    });
  };

  const openDeleteModal = (exercise) => {
    setDeleteModal({ isOpen: true, exercise });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, exercise: null });
  };

  const confirmDelete = () => {
    if (deleteModal.exercise) {
      handleDeleteExercise(deleteModal.exercise.id);
      closeDeleteModal();
    }
  };

  const exerciseIcons = {
    Running: <FaRunning className="text-blue-600 text-lg" />,
    Walking: <FaWalking className="text-green-600 text-lg" />,
    Swimming: <FaSwimmer className="text-cyan-600 text-lg" />,
    Cycling: <FaBicycle className="text-yellow-600 text-lg" />,
    Treadmill: <FaRunning className="text-orange-600 text-lg" />,
    Hiking: <FaHiking className="text-emerald-600 text-lg" />,
    HIIT: <FaDumbbell className="text-purple-600 text-lg" />,
    Other: <FaEllipsisH className="text-gray-600 text-lg" />,
  };

  const filterExercises = () => {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfToday.getDate() - 1);
    const startOf7Days = new Date(startOfToday);
    startOf7Days.setDate(startOfToday.getDate() - 6);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    switch (filter) {
      case "Today":
        return exercises.filter((ex) => new Date(ex.date_logged) >= startOfToday);
      case "Yesterday":
        return exercises.filter(
          (ex) => new Date(ex.date_logged) >= startOfYesterday && new Date(ex.date_logged) < startOfToday
        );
      case "Last 7 Days":
        return exercises.filter((ex) => new Date(ex.date_logged) >= startOf7Days);
      case "This Month":
        return exercises.filter((ex) => new Date(ex.date_logged) >= startOfMonth);
      case "This Year":
        return exercises.filter((ex) => new Date(ex.date_logged) >= startOfYear);
      case "All-Time":
      default:
        return exercises;
    }
  };

  const sortData = (data, config) => {
    if (!config.key) return data;
    return [...data].sort((a, b) => {
      if (a[config.key] < b[config.key]) return config.direction === 'asc' ? -1 : 1;
      if (a[config.key] > b[config.key]) return config.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getHeaderArrow = (name) => {
    if (sortConfig.key !== name) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  const filteredExercises = sortData(filterExercises(), sortConfig);

  // Pagination logic
  const totalExercises = filteredExercises.length;
  const totalPages = Math.ceil(totalExercises / exercisesPerPage);
  const indexOfLastExercise = currentPage * exercisesPerPage;
  const indexOfFirstExercise = indexOfLastExercise - exercisesPerPage;
  const currentExercises = filteredExercises.slice(indexOfFirstExercise, indexOfLastExercise);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ behavior: 'smooth' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-8"
      variants={itemVariants}
    >
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
        Recent Exercises
      </h2>
      <div className="mb-6">
        {/* Mobile Dropdown Filter */}
        <div className="sm:hidden">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-1/4 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-blue-500 text-sm text-gray-700"
            aria-label="Select time filter"
          >
            {["Today", "Yesterday", "Last 7 Days", "This Month", "This Year", "All-Time"].map((period) => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>
        </div>
        {/* Desktop Button Filters */}
        <div className="hidden sm:flex flex-wrap gap-2">
          {["Today", "Yesterday", "Last 7 Days", "This Month", "This Year", "All-Time"].map((period) => (
            <motion.button
              key={period}
              onClick={() => {
                setFilter(period);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg max-w-xl font-medium text-sm transition-all duration-300 ${
                filter === period
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-gray-400 focus:outline-none"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Filter by ${period}`}
            >
              {period}
            </motion.button>
          ))}
        </div>
      </div>

      {loading && !filteredExercises.length ? (
        <motion.div className="flex justify-center items-center h-32" variants={itemVariants}>
          <svg
            className="animate-spin h-8 w-8 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </motion.div>
      ) : filteredExercises.length === 0 ? (
        <motion.div
          className="bg-gray-50 rounded-lg p-6 sm:p-8 text-center border border-gray-100"
          variants={itemVariants}
        >
          <svg
            className="mx-auto h-8 w-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="mt-3 text-sm sm:text-base font-medium text-gray-600">
            No exercises logged for this period. Start your journey above!
          </p>
        </motion.div>
      ) : (
        <>
          <motion.div
            variants={containerVariants}
            className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm mb-4"
          >
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12 sm:w-16">
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => requestSort('activity')}
                  >
                    Activity{getHeaderArrow('activity')}
                  </th>
                  <th
                    scope="col"
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => requestSort('duration')}
                  >
                    <div className="flex items-center">
                      <FaClock className="mr-2" />
                      Duration{getHeaderArrow('duration')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => requestSort('calories_burned')}
                  >
                    <div className="flex items-center">
                      <FaFire className="mr-2 text-red-500" />
                      Calories{getHeaderArrow('calories_burned')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => requestSort('date_logged')}
                  >
                    <div className="flex items-center">
                      <FaCalendarAlt className="mr-2" />
                      Date & Time{getHeaderArrow('date_logged')}
                    </div>
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20 sm:w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {currentExercises.map((exercise) => (
                    <motion.tr
                      key={exercise.id}
                      variants={itemVariants}
                      layout
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, height: 0, transition: { duration: 0.3 } }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                        <div className="flex justify-center items-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full shadow-sm">
                          {exerciseIcons[exercise.activity] || exerciseIcons.Other}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">{exercise.activity}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-700">{exercise.duration} min</div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-700">{exercise.calories_burned} kcal</div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                        {new Date(exercise.date_logged).toLocaleDateString()} at{" "}
                        {new Date(exercise.date_logged).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <motion.button
                            onClick={() => openEditModal(exercise)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            disabled={loading}
                            aria-label={`Edit ${exercise.activity}`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <FaEdit className="text-sm" />
                          </motion.button>
                          <motion.button
                            onClick={() => openDeleteModal(exercise)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-all duration-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
                            disabled={loading}
                            aria-label={`Delete ${exercise.activity}`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {loading ? (
                              <span className="animate-spin inline-block w-4 h-4 sm:w-5 sm:h-5 border-2 border-t-transparent border-red-500 rounded-full"></span>
                            ) : (
                              <FaTrash className="text-sm" />
                            )}
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </motion.div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-xs sm:text-sm text-gray-600">
                Showing {indexOfFirstExercise + 1} to {Math.min(indexOfLastExercise, totalExercises)} of {totalExercises} exercises
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-full ${
                    currentPage === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-blue-600 hover:bg-blue-100"
                  } transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  aria-label="Previous page"
                  whileHover={{ scale: currentPage === 1 ? 1 : 1.1 }}
                  whileTap={{ scale: currentPage === 1 ? 1 : 0.9 }}
                >
                  <FaArrowLeft />
                </motion.button>
                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <motion.button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-200"
                      } transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                      aria-label={`Go to page ${page}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {page}
                    </motion.button>
                  ))}
                </div>
                <motion.button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-full ${
                    currentPage === totalPages
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-blue-600 hover:bg-blue-100"
                  } transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  aria-label="Next page"
                  whileHover={{ scale: currentPage === totalPages ? 1 : 1.1 }}
                  whileTap={{ scale: currentPage === totalPages ? 1 : 0.9 }}
                >
                  <FaArrowRight />
                </motion.button>
              </div>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {editingExercise && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-gray-100 rounded-xl shadow-lg w-full max-w-md overflow-hidden relative border border-gray-200"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <button
                onClick={() => setEditingExercise(null)}
                className="absolute top-4 right-4 bg-gray-100 rounded-full w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-purple-800 transition-colors duration-200 focus:outline-none focus:ring-3 focus:ring-purple-200"
                aria-label="Close modal"
                data-accent-color="#6f42c1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Edit Exercise</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Exercise Activity</label>
                    <select
                      value={editingExercise.activity}
                      onChange={(e) => setEditingExercise({ ...editingExercise, activity: e.target.value })}
                      className="w-full bg-white p-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-purple-600 focus:ring-3 focus:ring-purple-100 transition duration-200"
                      aria-label="Select exercise activity"
                    >
                      <option value="">Select an exercise</option>
                      <option value="Running">Running</option>
                      <option value="Walking">Walking</option>
                      <option value="Swimming">Swimming</option>
                      <option value="Cycling">Cycling</option>
                      <option value="Treadmill">Treadmill</option>
                      <option value="Hiking">Hiking</option>
                      <option value="HIIT">HIIT</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration (min)</label>
                      <input
                        type="number"
                        value={editingExercise.duration}
                        onChange={(e) => setEditingExercise({ ...editingExercise, duration: Number(e.target.value) })}
                        min="1"
                        className="w-full bg-white p-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-purple-600 focus:ring-3 focus:ring-purple-100 transition duration-200"
                        aria-label="Enter duration in minutes"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Calories Burned</label>
                      <input
                        type="number"
                        value={editingExercise.calories_burned}
                        onChange={(e) => setEditingExercise({ ...editingExercise, calories_burned: Number(e.target.value) })}
                        min="1"
                        className="w-full bg-white p-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-purple-600 focus:ring-3 focus:ring-purple-100 transition duration-200"
                        aria-label="Enter calories burned"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={() => setEditingExercise(null)}
                      className="flex-1 py-2 px-4 bg-gray-100 text-gray-800 rounded-lg border border-gray-200 hover:bg-gray-200 focus:outline-none font-medium text-sm transition-all duration-500 transform hover:-translate-y-px"
                      disabled={loading}
                      aria-label="Cancel edit"
                    >
                      Cancel
                    </button>
                    
                    <button
                      onClick={() => handleUpdateExercise(editingExercise, setEditingExercise)}
                      className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-800 focus:outline-none font-medium text-sm transition-all duration-500 transform hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading}
                      aria-label="Save changes"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <svg
                            className="animate-spin mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Saving...
                        </div>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        {deleteModal.isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-gray-100 rounded-xl shadow-lg max-w-md overflow-hidden relative border border-gray-200"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <button
                onClick={closeDeleteModal}
                className="absolute top-4 right-4 bg-gray-100 rounded-full w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-red-800 transition-colors duration-200 focus:outline-none focus:ring-3 focus:ring-red-200"
                aria-label="Close delete modal"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Confirm Delete</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to delete the {deleteModal.exercise?.activity} exercise logged on{" "}
                  {new Date(deleteModal.exercise?.date_logged).toLocaleDateString()}? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={closeDeleteModal}
                    className="flex-1 py-2 px-4 bg-gray-100 text-gray-800 rounded-lg border border-gray-200 hover:bg-gray-200 focus:outline-none font-medium text-sm transition-all duration-500 transform hover:-translate-y-px"
                    aria-label="Cancel delete"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-800 focus:outline-none font-medium text-sm transition-all duration-500 transform hover:-translate-y-px"
                    aria-label="Confirm delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RecentExercises;