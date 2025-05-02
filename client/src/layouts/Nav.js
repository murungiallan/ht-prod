import { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { FaBars, FaTimes, FaSignOutAlt, FaUser, FaCog, FaShieldAlt } from "react-icons/fa";
import logo from "../assets/logo.png";
import placeholder from "../assets/placeholder.jpg";
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from "framer-motion";

const Nav = () => {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    toast("You have been logged out");
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Animation variants for the mobile menu
  const mobileMenuVariants = {
    hidden: { x: "100%" },
    visible: { x: 0, transition: { duration: 0.3, ease: "easeInOut" } },
    exit: { x: "100%", transition: { duration: 0.3, ease: "easeInOut" } },
  };

  // Animation variants for the overlay
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 0.5, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  // Animation variants for nav items
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.3 },
    }),
  };

  return (
    <header className="fixed top-0 left-0 w-full text-gray-700 shadow-md z-50 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="HealthTrack" className="h-10" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-700 focus:outline-none"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-between space-x-8">
            {user ? (
              <>
                <div className="flex items-center justify-around space-x-8">
                  <Link
                    to="/dashboard"
                    className="text-gray-700 text-sm font-bold hover:text-gray-800"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/medications"
                    className="text-gray-700 text-sm font-bold hover:text-gray-800"
                  >
                    Medications
                  </Link>
                  <Link
                    to="/food-diary"
                    className="text-gray-700 text-sm font-bold hover:text-gray-800"
                  >
                    Food Diary
                  </Link>
                  <Link
                    to="/exercise"
                    className="text-gray-700 text-sm font-bold hover:text-gray-800"
                  >
                    Exercises
                  </Link>
                </div>

                {/* User Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center text-black hover:text-gray-800 focus:outline-none"
                    aria-label="Open user menu"
                  >
                    <img
                      src={placeholder}
                      alt="Profile"
                      className="rounded-full w-8 h-8"
                    />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-2 mt-2 w-64 ml-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="py-2 px-4 border-b border-gray-200">
                        <p className="font-medium text-gray-800 truncate">
                          {user?.display_name || "User"}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user?.email}
                        </p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        <FaUser className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                      <Link
                        to="/user-info"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        <FaUser className="w-4 h-4 mr-2" />
                        User Information
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        <FaCog className="w-4 h-4 mr-2" />
                        Settings
                      </Link>
                      {user?.role === "admin" && (
                        <Link
                          to="/admin"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          <FaShieldAlt className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 border-t border-gray-200"
                      >
                        <FaSignOutAlt className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className="text-gray-700 text-sm font-bold hover:text-gray-800"
                >
                  Home
                </Link>
                <Link
                  to="/about"
                  className="text-gray-700 text-sm font-bold hover:text-gray-800"
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  className="text-gray-700 text-sm font-bold hover:text-gray-800"
                >
                  Contact
                </Link>
                <Link
                  to="/register"
                  className="inline-block bg-gray-800 text-white text-sm border-transparent hover:border-white font-semibold py-2 px-6 rounded-full hover:bg-gray-950 transition duration-300"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black z-40 md:hidden"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={toggleMobileMenu}
            />

            {/* Full-Page Mobile Menu */}
            <motion.nav
              className="fixed top-0 right-0 w-full h-screen bg-gray-100 z-50 md:hidden"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="flex flex-col h-full">
                {/* Header Section with Logo and Close Button */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <Link to="/" onClick={toggleMobileMenu}>
                    <img src={logo} alt="HealthTrack" className="h-10" />
                  </Link>
                  <button
                    onClick={toggleMobileMenu}
                    className="text-gray-700 focus:outline-none"
                    aria-label="Close menu"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 flex flex-col justify-between p-4">
                  <div className="space-y-4">
                    {user ? (
                      <>
                        {/* User Profile Section */}
                        <div className="px-3 py-2 border-b border-gray-200 mb-2">
                          <div className="flex items-center mb-2">
                            <img
                              src={placeholder}
                              alt="Profile"
                              className="rounded-full w-8 h-8 mr-2"
                            />
                            <div>
                              <p className="font-medium text-gray-800 truncate">
                                {user?.display_name || "User"}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {user?.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        {[
                          { to: "/dashboard", label: "Dashboard" },
                          { to: "/medications", label: "Medications" },
                          { to: "/food-diary", label: "Food Diary" },
                          { to: "/exercise", label: "Exercises" },
                          ...(user?.role === "admin"
                            ? [{ to: "/admin", label: "Admin Dashboard" }]
                            : []),
                          { to: "/profile", label: "Profile" },
                          { to: "/user-info", label: "User Information" },
                          { to: "/settings", label: "Settings" },
                        ].map((item, index) => (
                          <motion.div
                            key={item.to}
                            custom={index}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                          >
                            <Link
                              to={item.to}
                              onClick={toggleMobileMenu}
                              className="block py-3 px-3 text-gray-700 text-lg font-medium hover:bg-gray-100 hover:text-blue-600 rounded-lg"
                            >
                              {item.label}
                            </Link>
                          </motion.div>
                        ))}
                      </>
                    ) : (
                      <>
                        {[
                          { to: "/", label: "Home" },
                          { to: "/about", label: "About" },
                          { to: "/contact", label: "Contact" },
                          { to: "/login", label: "Login" },
                          { to: "/register", label: "Register" },
                        ].map((item, index) => (
                          <motion.div
                            key={item.to}
                            custom={index}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                          >
                            <Link
                              to={item.to}
                              onClick={toggleMobileMenu}
                              className="block py-3 px-3 text-gray-700 text-lg font-medium hover:bg-gray-100 hover:text-blue-600 rounded-lg"
                            >
                              {item.label}
                            </Link>
                          </motion.div>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Logout Button */}
                  {user && (
                    <motion.div
                      custom={7}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <button
                        onClick={handleLogout}
                        className="w-full text-left py-3 px-3 text-gray-700 text-lg font-medium hover:bg-red-50 hover:text-red-600 border-t border-gray-200 rounded-lg"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Nav;