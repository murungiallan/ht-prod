import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { getUser, updateProfile } from "../services/api";
import { toast } from 'react-hot-toast';
import { auth } from "../firebase/config";
import placeholder from '../assets/placeholder.jpg';

const UserInfo = () => {
  const { user } = useContext(AuthContext);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    username: "",
    display_name: "",
    email: "",
    phone: "",
    created_at: "",
    last_login: "",
    address: "",
    height: "",
    weight: "",
    role: "user",
    profile_image: placeholder
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!auth.currentUser) {
          throw new Error("Not authenticated. Please log in to view your information.");
        }

        const token = await auth.currentUser.getIdToken(true);
        const userResponse = await getUser(token);
        
        setUserData({
          username: userResponse?.username || "Not provided",
          display_name: userResponse?.display_name || "Not provided",
          email: userResponse?.email || "Not provided",
          phone: userResponse?.phone || "",
          created_at: userResponse?.created_at || "",
          last_login: userResponse?.last_login || "",
          address: userResponse?.address || "",
          height: userResponse?.height || "",
          weight: userResponse?.weight || "",
          role: userResponse?.role || "user",
          profile_image: userResponse?.profile_image || placeholder
        });
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err.message || "Failed to load user information. Please try again.");
        toast.error(err.message || "Failed to load user information. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData(prev => ({ ...prev, profile_image: reader.result }));
        toast.success('Profile picture updated (client-side preview)');
      };
      reader.onerror = () => {
        toast.error('Failed to upload profile picture.');
        setUserData(prev => ({ ...prev, profile_image: placeholder }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await auth.currentUser.getIdToken(true);
      const updatedData = {
        username: userData.username,
        displayName: userData.display_name,
        role: userData.role,
        phone: userData.phone,
        address: userData.address,
        height: parseFloat(userData.height) || null,
        weight: parseFloat(userData.weight) || null,
        profile_image: userData.profile_image
      };
      await updateProfile(updatedData, token);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(err.message || 'Failed to update profile');
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-800 pb-3">User Information</h1>
        <div className="bg-white p-8 rounded-lg shadow-md border-l-4 border-red-500">
          <p className="text-red-600 font-medium text-lg mb-2">{error}</p>
          <p className="text-gray-600">
            You may need to{" "}
            <a href="/login" className="text-blue-600 hover:underline font-medium">log in</a>{" "}
            or refresh the page.
          </p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 pb-3">User Information</h1>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-gray-600 text-center">No user data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 pb-3">User Information</h1>

      <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-6">
              <div className="relative">
                <img
                  src={userData.profile_image || placeholder}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                  onError={(e) => (e.target.src = placeholder)}
                />
                <label
                  htmlFor="photo-upload"
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-all duration-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"
                    />
                  </svg>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={userData.username}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Display Name</label>
                  <input
                    type="text"
                    name="display_name"
                    value={userData.display_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={userData.email}
                    disabled
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={userData.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={userData.address}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    value={userData.height}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={userData.weight}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    name="role"
                    value={userData.role}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created At</label>
                  <input
                    type="text"
                    value={formatDate(userData.created_at)}
                    disabled
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Login</label>
                  <input
                    type="text"
                    value={formatDate(userData.last_login)}
                    disabled
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-6">
            <div className="relative">
              <img
                src={userData.profile_image || placeholder}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                onError={(e) => (e.target.src = placeholder)}
              />
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4 p-4 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 mb-1">Username</span>
                  <span className="font-medium text-gray-800">{userData.username}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 mb-1">Full Name</span>
                  <span className="font-medium text-gray-800">{userData.display_name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 mb-1">Email Address</span>
                  <span className="font-medium text-gray-500">{userData.email}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 mb-1">Phone Number</span>
                  <span className="font-medium text-gray-800">{userData.phone || 'Not provided'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 mb-1">Address</span>
                  <span className="font-medium text-gray-800">{userData.address || 'Not provided'}</span>
                </div>
              </div>
              <div className="space-y-4 p-4 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 mb-1">Height</span>
                  <span className="font-medium text-gray-800">{userData.height ? `${userData.height} cm` : 'Not provided'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 mb-1">Weight</span>
                  <span className="font-medium text-gray-800">{userData.weight ? `${userData.weight} kg` : 'Not provided'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 mb-1">Role</span>
                  <span className="font-medium text-gray-800">{userData.role}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 mb-1">Account Created</span>
                  <span className="font-medium text-gray-500">{formatDate(userData.created_at)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 mb-1">Last Login</span>
                  <span className="font-medium text-gray-500">{formatDate(userData.last_login)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="mt-3 pt-6 border-gray-200 flex justify-end">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserInfo;