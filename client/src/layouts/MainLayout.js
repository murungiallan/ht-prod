import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import EmailVerification from "../components/common/EmailVerification";
import { FaBars, FaTimes, FaCompress, FaExpand, FaHome, FaFlask, FaBook, FaBolt, FaSignOutAlt } from "react-icons/fa";
import logo from "../assets/logo.png";
import favicon from "../assets/favicon.png";

const MainLayout = ({ children }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarShrunk, setIsSidebarShrunk] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSidebarShrink = () => {
    setIsSidebarShrunk(!isSidebarShrunk);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white shadow-md w-full fixed top-0 left-0 z-50">
        <div className="flex items-center">
          <button onClick={toggleMobileMenu} className="text-gray-700 focus:outline-none">
            {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
          <img src={logo} alt="Logo" className="h-8 ml-4" />
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:sticky top-0 left-0 h-full lg:h-screen bg-white shadow-lg text-gray-700 flex flex-col transition-all duration-300 z-40 ${
          isSidebarShrunk ? "lg:w-20" : "w-64"
        } overflow-y-auto`}
      >
        {/* Logo Section */}
        <div className={`p-4 ${isSidebarShrunk ? "flex justify-center" : "flex items-center justify-between"} border-b border-gray-100`}>
          <img
            src={isSidebarShrunk ? favicon : logo}
            alt="Logo"
            className={isSidebarShrunk ? "h-8 mx-auto" : "h-10"}
          />
          {/* Shrink/Expand Button (Visible on Desktop Only) */}
          {!isSidebarShrunk && (
            <button
              onClick={toggleSidebarShrink}
              className="hidden lg:block text-gray-600 hover:text-blue-600 focus:outline-none"
            >
              <FaCompress size={14} />
            </button>
          )}
          {isSidebarShrunk && (
            <button
              onClick={toggleSidebarShrink}
              className="hidden lg:block absolute right-2 top-4 text-gray-600 hover:text-blue-600 focus:outline-none"
            >
              <FaExpand size={14} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-grow py-6">
          <div className="space-y-1">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center px-6 py-3 text-black hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
            >
              <div className={isSidebarShrunk ? "mx-auto" : ""}>
                <FaHome className={`${isSidebarShrunk ? "w-6 h-6" : "w-5 h-5 mr-4"} flex-shrink-0`} />
              </div>
              <span className={`${isSidebarShrunk ? "hidden" : "block"} font-medium`}>Dashboard</span>
            </Link>

            <Link
              to="/medications"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center px-6 py-3 text-black hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
            >
              <div className={isSidebarShrunk ? "mx-auto" : ""}>
                <FaFlask className={`${isSidebarShrunk ? "w-6 h-6" : "w-5 h-5 mr-4"} flex-shrink-0`} />
              </div>
              <span className={`${isSidebarShrunk ? "hidden" : "block"} font-medium`}>Medications</span>
            </Link>

            <Link
              to="/food-diary"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center px-6 py-3 text-black hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
            >
              <div className={isSidebarShrunk ? "mx-auto" : ""}>
                <FaBook className={`${isSidebarShrunk ? "w-6 h-6" : "w-5 h-5 mr-4"} flex-shrink-0`} />
              </div>
              <span className={`${isSidebarShrunk ? "hidden" : "block"} font-medium`}>Food Diary</span>
            </Link>

            <Link
              to="/exercise"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center px-6 py-3 text-black hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
            >
              <div className={isSidebarShrunk ? "mx-auto" : ""}>
                <FaBolt className={`${isSidebarShrunk ? "w-6 h-6" : "w-5 h-5 mr-4"} flex-shrink-0`} />
              </div>
              <span className={`${isSidebarShrunk ? "hidden" : "block"} font-medium`}>Exercise</span>
            </Link>
          </div>
        </nav>

        {/* Footer with Logout Button */}
        <div className="p-4 border-t border-gray-100 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-6 py-3 text-black hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <div className={isSidebarShrunk ? "mx-auto" : ""}>
              <FaSignOutAlt className={`${isSidebarShrunk ? "w-6 h-6" : "w-5 h-5 mr-4"} flex-shrink-0`} />
            </div>
            <span className={`${isSidebarShrunk ? "hidden" : "block"} font-medium`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black opacity-25 z-30"
          onClick={toggleMobileMenu}
        ></div>
      )}

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 pt-16 lg:pt-0 px-1 sm:px-6 lg:px-8 py-6`}
      >
        <div className="max-w-7xl mx-2">
          {children}
          <EmailVerification/>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;