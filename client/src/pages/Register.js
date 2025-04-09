import { useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(username, email, password, displayName, role);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Failed to register");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="px-8 pt-8 pb-6 text-center">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <img src={logo} alt="HealthTrack Logo" className="w-1/2 h-auto mx-auto mb-2" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create an Account</h2>
          <p className="text-gray-600 mb-6">Create your account and start your wellness journey</p>
        </div>

        <form onSubmit={handleRegister} className="px-8 pb-8 space-y-5">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition duration-200"
              required
              placeholder="Your username"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition duration-200"
              required
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition duration-200"
              required
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="displayName">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition duration-200"
              required
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="role">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition duration-200"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full p-3 bg-gradient-to-r from-gray-400 to-gray-800 text-white font-medium rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition duration-200 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
                Creating Account...
              </div>
            ) : (
              "Create Account"
            )}
          </button>

          <div className="mt-6 text-center">
            <p>
              Already have an account?{" "}
              <Link to="/login" className="text-amber-950 hover:text-amber-800 font-mono transition duration-200 underline underline-offset-8">
                Sign in
              </Link>
            </p>
          </div>

          {/* <div className="pt-2 mt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </div> */}
        </form>
      </motion.div>
    </div>
  );
};

export default Register;