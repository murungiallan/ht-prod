import { useState, useEffect, useContext } from "react";
import { FaRunning, FaWalking, FaSwimmer, FaHiking, FaDumbbell, FaBicycle, FaEllipsisH, FaClock, FaList, FaEdit, FaTrash } from "react-icons/fa";
import { AuthContext } from "../../contexts/AuthContext";
import { createExercise, getUserExercises, updateExercise, deleteExercise } from "../../services/api";

const ExerciseTracker = () => {
  const { user } = useContext(AuthContext);
  const [exerciseType, setExerciseType] = useState("");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    const fetchExercises = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const userExercises = await getUserExercises();
        setExercises(userExercises);
      } catch (err) {
        setError("Failed to load exercises");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [user]);

  const handleLogExercise = async (e) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in to log an exercise");
      return;
    }

    if (exerciseType && duration && calories) {
      try {
        const newExercise = {
          type: exerciseType,
          duration: Number(duration),
          calories: Number(calories),
          date: new Date().toISOString(),
        };

        const createdExercise = await createExercise(newExercise);
        setExercises([createdExercise, ...exercises]);

        setExerciseType("");
        setDuration("");
        setCalories("");
      } catch (err) {
        setError("Failed to log exercise");
        console.error(err);
      }
    }
  };

  const handleDeleteExercise = async (id) => {
    try {
      await deleteExercise(id);
      setExercises(exercises.filter((exercise) => exercise.id !== id));
    } catch (err) {
      setError("Failed to delete exercise");
      console.error(err);
    }
  };

  const handleUpdateExercise = async (id, updatedData) => {
    try {
      const updatedExercise = await updateExercise(id, updatedData);
      setExercises(
        exercises.map((exercise) =>
          exercise.id === id ? updatedExercise : exercise
        )
      );
    } catch (err) {
      setError("Failed to update exercise");
      console.error(err);
    }
  };

  const totalCalories = exercises.reduce((sum, ex) => sum + ex.calories, 0);
  const totalDuration = exercises.reduce((sum, ex) => sum + ex.duration, 0);
  const totalSessions = exercises.length;

  const exerciseIcons = {
    Running: <FaRunning className="text-blue-500" />,
    Walking: <FaWalking className="text-green-500" />,
    Swimming: <FaSwimmer className="text-teal-500" />,
    Cycling: <FaBicycle className="text-indigo-500" />,
    Treadmill: <FaRunning className="text-gray-500" />,
    Hiking: <FaHiking className="text-brown-500" />,
    HIIT: <FaDumbbell className="text-red-500" />,
    Other: <FaEllipsisH className="text-gray-500" />,
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Hello, {user?.displayName || "User"}
        </h1>
        <p className="text-gray-600 mt-1">Track your exercise progress</p>
      </header>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
            <div className="p-2 bg-blue-100 rounded-full">
              <FaDumbbell className="text-purple-500 text-xl" />
            </div>
            <div>
              <h3 className="text-sm text-gray-600">Calories Burned</h3>
              <p className="text-lg font-semibold text-gray-800">{totalCalories} kcal</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
            <div className="p-2 bg-green-100 rounded-full">
              <FaClock className="text-green-500 text-xl" />
            </div>
            <div>
              <h3 className="text-sm text-gray-600">Total Time</h3>
              <p className="text-lg font-semibold text-gray-800">{totalDuration} min</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
            <div className="p-2 bg-teal-100 rounded-full">
              <FaList className="text-teal-500 text-xl" />
            </div>
            <div>
              <h3 className="text-sm text-gray-600">Sessions</h3>
              <p className="text-lg font-semibold text-gray-800">{totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Log New Exercise</h2>
          <form onSubmit={handleLogExercise} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Exercise Type</label>
              <select
                value={exerciseType}
                onChange={(e) => setExerciseType(e.target.value)}
                className="w-full p-2 border-none rounded-md outline-gray-200 focus:border-gray-400 focus:outline-none focus:ring active:border-gray-100"
                required
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
            <div>
              <label className="block text-sm text-gray-700 mb-1">Duration (min)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 30"
                className="w-full p-2 border-none rounded-md outline-gray-200 focus:border-gray-400 focus:outline-none focus:ring active:border-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Calories Burned</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="e.g., 200"
                className="w-full p-2 border-none rounded-md outline-gray-200 focus:border-gray-400 focus:outline-none focus:ring active:border-gray-100"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200"
                disabled={loading}
              >
                {loading ? "Loading..." : "Log Exercise"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Exercises</h2>
          {loading ? (
            <p className="text-gray-500">Loading exercises...</p>
          ) : exercises.length === 0 ? (
            <p className="text-gray-500">No exercises logged yet. Start by adding one above!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="p-4 bg-gray-50 rounded-md flex items-center space-x-4 hover:bg-gray-100 transition"
                >
                  <div className="text-2xl">{exerciseIcons[exercise.type] || exerciseIcons.Other}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-700">{exercise.type}</h3>
                    <p className="text-sm text-gray-600">Duration: {exercise.duration} min</p>
                    <p className="text-sm text-gray-600">Calories: {exercise.calories} kcal</p>
                    <p className="text-xs text-gray-400">
                      {new Date(exercise.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        handleUpdateExercise(exercise.id, {
                          type: exercise.type,
                          duration: exercise.duration + 5,
                          calories: exercise.calories,
                          date: exercise.date,
                        })
                      }
                      className="text-blue-500 hover:text-blue-600"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteExercise(exercise.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Weekly Activity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium text-gray-700">Calories Burned</h3>
              <p className="text-gray-600 mt-2">Chart placeholder</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium text-gray-700">Time (hours)</h3>
              <p className="text-gray-600 mt-2">Chart placeholder</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium text-gray-700">Total Sessions</h3>
              <p className="text-gray-600 mt-2">Chart placeholder</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseTracker;