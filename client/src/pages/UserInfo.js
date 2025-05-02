import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { getUser } from "../services/api";
import { toast } from 'react-hot-toast';
import { auth } from "../firebase/config";

const UserInfo = () => {
  const { user } = useContext(AuthContext);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({
    display_name: "",
    email: "",
    phone: "",
    created_at: "",
    last_login: "",
    address: "",
    height: "",
    weight: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!auth.currentUser) {
          throw new Error(
            "Not authenticated. Please log in to view your information."
          );
        }

        const token = await auth.currentUser.getIdToken(true);
        const userResponse = await getUser(token);
        
        setUserData({
          display_name: userResponse?.display_name || "Not provided",
          email: userResponse?.email || "Not provided",
          phone: userResponse?.phone || "Not provided",
          created_at: userResponse?.created_at || "",
          last_login: userResponse?.last_login || "",
          address: userResponse?.address || "Not provided",
          height: userResponse?.height || "Not provided",
          weight: userResponse?.weight || "Not provided",
        });
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(
          err.message || "Failed to load user information. Please try again."
        );
        toast.error(
          err.message || "Failed to load user information. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Not available" : date.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <div className="w-16 h-16 border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 pb-3">
          User Information
        </h1>
        <div className="bg-white p-8 rounded-lg shadow-md border-l-4 border-red-500">
          <p className="text-red-600 font-medium text-lg mb-2">{error}</p>
          <p className="text-gray-600">
            You may need to{" "}
            <a href="/login" className="text-blue-600 hover:underline font-medium">
              log in
            </a>{" "}
            or refresh the page.
          </p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 pb-3">
          User Information
        </h1>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-gray-600 text-center">No user data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 pb-3">
        User Information
      </h1>

      <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4  p-4 rounded-lg">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Full Name</span>
              <span className="font-medium text-gray-800">{userData.display_name}</span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Email Address</span>
              <span className="font-medium text-gray-800">{userData.email}</span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Phone Number</span>
              <span className="font-medium text-gray-800">{userData.phone}</span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Address</span>
              <span className="font-medium text-gray-800">{userData.address}</span>
            </div>
          </div>
          
          <div className="space-y-4 p-4 rounded-lg">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Height</span>
              <span className="font-medium text-gray-800">{userData.height}</span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Weight</span>
              <span className="font-medium text-gray-800">{userData.weight}</span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Account Created</span>
              <span className="font-medium text-gray-800">{formatDate(userData.created_at)}</span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">Last Login</span>
              <span className="font-medium text-gray-800">{formatDate(userData.last_login)}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-3 pt-6 border-gray-200 flex justify-end">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;