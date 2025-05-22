import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../../contexts/AuthContext";
import { toast } from "react-hot-toast";
import {
  FaUser,
  FaPills,
  FaBell,
  FaUtensils,
  FaRunning,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaCog,
  FaFileExport,
  FaHistory,
} from "react-icons/fa";

const Sidebar = ({ activeTab, setActiveTab, isMinimized, setIsMinimized, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    toast.success("You have been logged out");
    setIsMobileMenuOpen(false);
  };

  const tabs = [
    { id: "users", label: "Users", icon: <FaUser /> },
    { id: "medications", label: "Medications", icon: <FaPills /> },
    { id: "reminders", label: "Reminders", icon: <FaBell /> },
    { id: "foodLogs", label: "Food Logs", icon: <FaUtensils /> },
    { id: "exercises", label: "Exercises", icon: <FaRunning /> },
    // { id: "settings", label: "Settings", icon: <FaCog /> },
    { id: "audit", label: "Audit Logs", icon: <FaHistory /> },
    { id: "export", label: "Data Export", icon: <FaFileExport /> },
  ];

  const sidebarVariants = {
    minimized: { width: "6rem" },
    expanded: { width: "16rem" },
  };

  const textVariants = {
    minimized: { opacity: 0, width: 0 },
    expanded: { opacity: 1, width: "auto" },
  };

  const mobileMenuVariants = {
    hidden: { x: "100%" },
    visible: { x: 0 },
    exit: { x: "100%" },
  };

  return (
    <>
      <button
        className="fixed top-6 right-4 z-50 lg:hidden text-gray-700"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      <motion.div
        className="hidden lg:block fixed top-0 left-0 shadow-md h-screen bg-gray-100 text-black p-4 z-40"
        variants={sidebarVariants}
        animate={isMinimized ? "minimized" : "expanded"}
        onMouseEnter={() => setIsMinimized(false)}
        onMouseLeave={() => setIsMinimized(true)}
      >
        <div className="flex items-center justify-between mb-8 mt-16"></div>
        <nav className="space-y-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center w-full h-12 rounded-md hover:bg-gray-600 hover:text-white ${
                activeTab === tab.id ? "bg-gray-500 text-white" : ""
              } ${isMinimized ? "justify-center p-4" : "justify-start px-4 py-2"}`}
            >
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                {tab.icon}
              </span>
              <motion.span
                variants={textVariants}
                animate={isMinimized ? "minimized" : "expanded"}
                className="text-sm font-medium ml-3 flex-grow text-left"
                style={{ visibility: isMinimized ? "hidden" : "visible" }}
              >
                {tab.label}
              </motion.span>
            </motion.button>
          ))}
          <motion.button
            onClick={handleLogout}
            className={`flex items-center w-full h-12 rounded-md hover:bg-red-600 hover:text-white ${
              isMinimized ? "justify-center p-4" : "justify-start px-4 py-2"
            }`}
          >
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
              <FaSignOutAlt />
            </span>
            <motion.span
              variants={textVariants}
              animate={isMinimized ? "minimized" : "expanded"}
              className="text-sm font-medium ml-3 flex-grow text-left"
              style={{ visibility: isMinimized ? "hidden" : "visible" }}
            >
              Logout
            </motion.span>
          </motion.button>
        </nav>
      </motion.div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black z-40 lg:hidden"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 0.5 },
                exit: { opacity: 0 },
              }}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.nav
              className="fixed top-0 right-0 w-full h-screen bg-gray-100 z-50 lg:hidden"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-200"></div>
                <div className="flex-1 flex flex-col justify-between p-4">
                  <div className="space-y-4">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`block py-3 px-3 text-gray-700 text-lg font-medium hover:bg-gray-100 hover:text-blue-600 rounded-lg w-full text-left ${
                          activeTab === tab.id ? "bg-gray-200" : ""
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left py-3 px-3 text-gray-700 text-lg font-medium hover:bg-red-50 hover:text-red-600 border-t border-gray-200 rounded-lg"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;