import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import Navbar from "../components/common/Navbar";
import Home from "../pages/Home";
import About from "../components/About";
import Contact from "../components/Contact";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../components/Dashboard/Dashboard";
import MedicationTracker from "../components/MedicationTracker/MedicationTracker";
import FoodDiary from "../components/FoodDiary/FoodDiary";
import ExerciseTracker from "../components/ExerciseTracker/ExerciseTracker";
import MainLayout from "../layouts/MainLayout";

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
        </Routes>
      </div>
    </div>
  );
};

export default AppRoutes;