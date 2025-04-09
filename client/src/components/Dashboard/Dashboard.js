import { useContext, useEffect } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { FaPills, FaUtensils, FaRunning, FaLightbulb, FaTrophy, FaCog } from "react-icons/fa";
import {useSocket} from '../../contexts/SocketContext';

const Dashboard = () => {
  const { user, loading } = useContext(AuthContext);
  const {socket} = useSocket();

  useEffect(() => {
    // Listen for medication updates
    socket.on("medicationUpdated", (data) => {
      console.log("Medication updated:", data);
    });

    // Listen for errors
    socket.on("error", (error) => {
      console.error("Socket error:", error.message);
    });

    // Clean up listeners on unmount
    return () => {
      socket.off("welcome");
      socket.off("medicationUpdated");
      socket.off("error");
    };
  }, [socket]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to view this page.</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen max-w-7xl mx-2">
      {/* Header */}
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Hello, {user.displayName || "User"}
          </h1>
          <p className="text-gray-500 mt-1">Your health overview</p>
        </div>
        <button className="text-gray-600 hover:text-blue-600">
          <FaCog className="text-xl" /> {/* Placeholder for widget customization */}
        </button>
      </header>

      {/* Overview Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-lg flex items-center space-x-4">
          <div className="p-2 bg-blue-100 rounded-full">
            <FaPills className="text-blue-500 text-xl" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm text-gray-500 uppercase">Medication Adherence</h3>
            <p className="text-xl font-bold text-gray-800">85%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: "85%" }}></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg flex items-center space-x-4">
          <div className="p-2 bg-green-100 rounded-full">
            <FaUtensils className="text-green-500 text-xl" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm text-gray-500 uppercase">Food Intake</h3>
            <p className="text-xl font-bold text-gray-800">1,800 kcal</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: "70%" }}></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg flex items-center space-x-4">
          <div className="p-2 bg-teal-100 rounded-full">
            <FaRunning className="text-teal-500 text-xl" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm text-gray-500 uppercase">Exercise</h3>
            <p className="text-xl font-bold text-gray-800">120 min</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-teal-500 h-2 rounded-full" style={{ width: "60%" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Adherence Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Adherence Over Time</h2>
            <p className="text-gray-600">Chart placeholder (Adherence trend)</p>
          </div>

          {/* Food Intake Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Food Intake</h2>
            <p className="text-gray-600">Chart placeholder (Daily calorie intake)</p>
          </div>

          {/* Exercise Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Exercise Activity</h2>
            <p className="text-gray-600">Chart placeholder (Weekly exercise minutes)</p>
          </div>
        </div>

        {/* Right Column: Recent Activity, Insights, Tips, Rewards */}
        <div className="lg:col-span-1 space-y-6">
          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
            <ul className="space-y-3">
              <li className="text-sm text-gray-600">Logged Aspirin at 8:00 AM</li>
              <li className="text-sm text-gray-600">Completed 30 min run at 7:00 AM</li>
              <li className="text-sm text-gray-600">Logged breakfast (500 kcal) at 6:30 AM</li>
            </ul>
          </div>

          {/* Health Insights */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaLightbulb className="mr-2 text-yellow-500" /> Health Insights
            </h2>
            <p className="text-sm text-gray-600">You’ve met your exercise goal this week! Keep it up!</p>
          </div>

          {/* Health Tips */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Daily Health Tip</h2>
            <p className="text-sm text-gray-600">Drink at least 8 glasses of water today to stay hydrated.</p>
          </div>

          {/* Rewards */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaTrophy className="mr-2 text-yellow-500" /> Achievements
            </h2>
            <p className="text-sm text-gray-600">5-day medication adherence streak! 🎉</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;