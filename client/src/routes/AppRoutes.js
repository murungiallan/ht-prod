import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../layouts/Nav";
import Home from "../pages/Home";
import About from "../components/About";
import Contact from "../components/Contact";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Settings from "../pages/Settings";
import Profile from "../pages/Profile";
import UserInfo from "../pages/UserInfo";
import Dashboard from "../components/Dashboard/Dashboard";
import MedicationTracker from "../components/MedicationTracker/MedicationTracker";
import FoodDiary from "../components/FoodDiary/FoodDiary";
import ExerciseTracker from "../components/ExerciseTracker/ExerciseTracker";
import MainLayout from "../layouts/MainLayout";
import ForgotPassword from "../pages/ForgotPassword";

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const unauthenticatedRoutes = ["/", "/about", "/contact", "/login", "/register"];

  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* Conditionally rendering the Navbar for unauthenticated routes */}
      {unauthenticatedRoutes.includes(location.pathname) && <Navbar />}

      <div>
        <Routes>
          {/* Unauthenticated Routes */}
          <Route
            path="/"
            element={
              user ? (
                <Navigate to="/dashboard" />
              ) : (
                <Home />
              )
            }
          />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Authenticated Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/medications"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <MedicationTracker />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/food-diary"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <FoodDiary />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/exercise"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ExerciseTracker />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Profile />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Settings />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-info"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <UserInfo />
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
};

export default AppRoutes;