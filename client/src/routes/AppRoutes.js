import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
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

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route
      path="/"
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
);

export default AppRoutes;