import React, { useState, useEffect } from 'react';
import { getUser, updateProfile, updatePreferences } from '../services/api';

const Settings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    theme: 'light',
    language: 'en'
  });
  
  const [resetEmail, setResetEmail] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const userData = await getUser(token);
        
        setProfile({
          name: userData.displayName || '',
          email: userData.email || '',
          phone: userData.phone || ''
        });
        
        if (userData.preferences) {
          setPreferences(userData.preferences);
        }
        
        setResetEmail(userData.email || '');
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load user data. Please try again.');
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      await updateProfile(token, {
        displayName: profile.name,
        email: profile.email,
        phone: profile.phone
      });
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      setIsLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      await updatePreferences(token, preferences);
      setSuccessMessage('Preferences updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to update preferences. Please try again.');
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: resetEmail })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }
      setSuccessMessage('Password reset link sent to your email');
      setTimeout(() => setSuccessMessage(''), 3000);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to send password reset link. Please try again.');
      setIsLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    setIsLoggingOut(true);
    try {
      // Placeholder: API call to log out from all devices
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccessMessage('Logged out from all other devices');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to log out from other devices. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setPreferences(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [name]: checked }
    }));
  };

  const handleThemeChange = (e) => {
    setPreferences(prev => ({ ...prev, theme: e.target.value }));
  };

  // const handleLanguageChange = (e) => {
  //   setPreferences(prev => ({ ...prev, language: e.target.value }));
  // };

  if (isLoading && !profile.name) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Account Settings</h1>

      {/* Error and Success Messages */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-fade-in">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="text-white font-bold">
            x
          </button>
        </div>
      )}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-fade-in">
          <p>{successMessage}</p>
          <button onClick={() => setSuccessMessage('')} className="text-white font-bold">
            ×
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-4 border-b border-gray-200">
          <button
            className={`py-3 px-4 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'profile'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`py-3 px-4 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'preferences'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
          <button
            className={`py-3 px-4 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'security'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Edit Profile</h2>
          <form onSubmit={handleProfileSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Preferences</h2>
          <form onSubmit={handlePreferencesSubmit}>
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="email-notifications"
                    name="email"
                    checked={preferences.notifications.email}
                    onChange={handleNotificationChange}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="email-notifications" className="ml-3 text-sm text-gray-700">
                    Email Notifications
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="push-notifications"
                    name="push"
                    checked={preferences.notifications.push}
                    onChange={handleNotificationChange}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="push-notifications" className="ml-3 text-sm text-gray-700">
                    Push Notifications
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sms-notifications"
                    name="sms"
                    checked={preferences.notifications.sms}
                    onChange={handleNotificationChange}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sms-notifications" className="ml-3 text-sm text-gray-700">
                    SMS Notifications
                  </label>
                </div>
              </div>
            </div>
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Appearance</h3>
              <div>
                <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <select
                  id="theme"
                  value={preferences.theme}
                  onChange={handleThemeChange}
                  className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>
            {/* <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Language</h3>
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Language
                </label>
                <select
                  id="language"
                  value={preferences.language}
                  onChange={handleLanguageChange}
                  className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">日本語</option>
                </select>
              </div>
            </div> */}
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Preferences'}
            </button>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Security Settings</h2>
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Password</h3>
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
                  className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Sessions</h3>
            <p className="text-gray-600 mb-4">
              This will log you out of all devices except the current one.
            </p>
            <button
              onClick={handleLogoutAllDevices}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 flex items-center"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Logging out...
                </>
              ) : (
                'Log Out From All Other Devices'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;