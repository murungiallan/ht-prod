import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { auth } from '../firebase/config';
import { AuthContext } from "../contexts/AuthContext";

const Settings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resetEmail, setResetEmail] = useState('');
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if user is authenticated
        if (!auth.currentUser) {
          throw new Error('Not authenticated. Please log in to view your settings.');
        }

        // Set initial email for reset
        setResetEmail(auth.currentUser.email || '');
      } catch (err) {
        console.error('Error fetching user email:', err);
        setError(err.message || 'Failed to load user data. Please try again.');
        toast.error(err.message || 'Failed to load user data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserEmail();
  }, []);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch("http://127.0.0.1:5000/api/users/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password");
      }

      toast.success(result.message);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.message || "Password reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    setIsLoading(true);
    try {
      await logout();
      await new Promise(resolve => setTimeout(resolve, 1000));
      // toast.success('Logged out from all other devices');
    } catch (err) {
      console.error('Error logging out from other devices:', err);
      toast.error('Failed to log out from other devices. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Security Settings</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-red-600">{error}</p>
          <p className="text-gray-600 mt-2">
            You may need to <a href="/login" className="text-blue-600 hover:underline">log in</a> or refresh the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Security Settings</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Password Reset</h2>
        <form onSubmit={handlePasswordReset}>
          <div className="mb-4">
            <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="resetEmail"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Enter your email to reset password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              required
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Password Reset Link'}
          </button>
        </form>
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Session Management</h3>
          <button
            onClick={handleLogoutAllDevices}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? 'Logging out...' : 'Log Out from All Devices'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;