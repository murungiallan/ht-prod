import { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { FaBars, FaTimes, FaSignOutAlt, FaUser, FaCog } from "react-icons/fa";
import logo from "../assets/logo.png";
import placeholder from "../assets/placeholder.jpg";

const Nav = () => {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
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
            >
              {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-between space-x-8">
            {user ? (
              <>
                <div className="flex items-center justify-around space-x-8">
                  <Link to="/dashboard" className="text-gray-700 text-sm font-bold hover:text-gray-800">
                    Dashboard
                  </Link>
                  <Link to="/medications" className="text-gray-700 text-sm font-bold hover:text-gray-800">
                    Medications
                  </Link>
                  <Link to="/food-diary" className="text-gray-700 text-sm font-bold hover:text-gray-800">
                    Food Diary
                  </Link>
                  <Link to="/exercise" className="text-gray-700 text-sm font-bold hover:text-gray-800">
                    Exercise
                  </Link>
                </div>
                
                {/* User Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center text-black hover:text-gray-800 focus:outline-none"
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
                        <p className="font-medium text-gray-800 truncate">Username</p>
                        <p className="text-sm text-gray-500 truncate">user-email@example.com</p>
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
                <Link to="/" className="text-gray-700 text-sm font-bold hover:text-gray-800">
                  Home
                </Link>
                <Link to="/about" className="text-gray-700 text-sm font-bold hover:text-gray-800">
                  About
                </Link>
                <Link to="/contact" className="text-gray-700 text-sm font-bold hover:text-gray-800">
                  Contact
                </Link>
                <Link to="/register" className="inline-block bg-gray-800 text-white text-sm border-transparent hover:border-white font-semibold py-2 px-6 rounded-full hover:bg-gray-950 transition duration-300">
                  Sign Up
                </Link>
                {/* <Link to="/register" className="text-gray-700 hover:text-blue-600 font-medium">
                  Register
                </Link> */}
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <nav className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {user ? (
              <>
                {/* Mobile User Profile Section */}
                <div className="px-3 py-2 border-b border-gray-200 mb-2">
                  <div className="flex items-center mb-2">
                    <img
                      src="https://via.placeholder.com/40"
                      alt="Profile"
                      className="rounded-full w-10 h-10 mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-800 truncate">Username</p>
                      <p className="text-sm text-gray-500 truncate">user-email@example.com</p>
                    </div>
                  </div>
                </div>

                <Link
                  to="/dashboard"
                  onClick={toggleMobileMenu}
                  className="block py-2 px-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/medications"
                  onClick={toggleMobileMenu}
                  className="block py-2 px-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
                >
                  Medications
                </Link>
                <Link
                  to="/food-diary"
                  onClick={toggleMobileMenu}
                  className="block py-2 px-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
                >
                  Food Diary
                </Link>
                <Link
                  to="/exercise"
                  onClick={toggleMobileMenu}
                  className="block py-2 px-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
                >
                  Exercise
                </Link>
                <Link
                  to="/profile"
                  onClick={toggleMobileMenu}
                  className="block py-2 px-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
                >
                  Profile
                </Link>
                <Link
                  to="/user-info"
                  onClick={toggleMobileMenu}
                  className="block py-2 px-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
                >
                  User Information
                </Link>
                <Link
                  to="/settings"
                  onClick={toggleMobileMenu}
                  className="block py-2 px-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 px-3 text-gray-700 hover:bg-gray-50 hover:text-red-600 font-medium border-t border-gray-200 mt-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  onClick={toggleMobileMenu}
                  className="block py-2 px-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
                >
                  Home
                </Link>
                <Link
                  to="/about"
                  onClick={toggleMobileMenu}
                  className="block py-2 px-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  onClick={toggleMobileMenu}
                  className="block py-2 px-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
                >
                  Contact
                </Link>
                <Link
                  to="/login"
                  onClick={toggleMobileMenu}
                  className="block py-2 px-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={toggleMobileMenu}
                  className="block py-2 px-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-medium"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Nav;