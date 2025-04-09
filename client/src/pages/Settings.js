import React, { useState, useEffect } from 'react';
import { getUser, updateProfile } from '../services/api';
import { toast } from 'react-toastify';

const Settings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: ''
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
        
        setResetEmail(userData.email || '');
        setIsLoading(false);
      } catch (err) {
        toast.error('Failed to load user data. Please try again.');
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
      toast.success('Profile updated successfully');
      setIsLoading(false);
    } catch (err) {
      toast.error('Failed to update profile. Please try again.');
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch('http://127.0.0.1:5000/api/auth/reset-password', {
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
      toast.success('Password reset link sent to your email');
      setIsLoading(false);
    } catch (err) {
      toast.error('Failed to send password reset link. Please try again.');
      setIsLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    setIsLoggingOut(true);
    try {
      // Placeholder: API call to log out from all devices
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Logged out from all other devices');
    } catch (err) {
      toast.error('Failed to log out from other devices. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

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
        </div>
      )}
    </div>
  );
};

export default Settings;