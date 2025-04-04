import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import logo from '../../assets/favicon.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
    { to: "/login", label: "Login" },
    { to: "/register", label: "Register" },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <img
                  src={logo}
                  alt="HealthTrack Logo"
                  className="h-8 w-auto"
                />
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-4 lg:space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-2 py-2 text-gray-800 hover:text-black transition duration-300 font-medium ${
                    location.pathname === link.to ? "text-black border-b-2 border-black" : ""
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={toggleMenu} 
                className="p-2 rounded-md text-gray-800 hover:text-black hover:bg-gray-100"
                aria-label="Toggle menu"
              >
                {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-100">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={toggleMenu}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      location.pathname === link.to
                        ? "text-black bg-gray-100"
                        : "text-gray-800 hover:bg-gray-50 hover:text-black"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;