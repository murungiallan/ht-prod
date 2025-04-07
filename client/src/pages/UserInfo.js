import React, { useState, useEffect } from 'react';
import { getUser } from '../services/api';

const UserInfo = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({
    displayName: '',
    email: '',
    phone: '',
    createdAt: '',
    lastLogin: '',
    address: '',
    height: '',
    weight: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('Not authenticated');
        }

        const user = await getUser(token);
        setUserData({
          displayName: user.displayName || '',
          email: user.email || '',
          phone: user.phone || '',
          createdAt: user.createdAt || '',
          lastLogin: user.lastLogin || '',
          address: user.address || 'Not provided',
          height: user.height || 'Not provided',
          weight: user.weight || 'Not provided'
        });

        setIsLoading(false);
      } catch (err) {
        setError('Failed to load user information. Please try again.');
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">User Information</h1>

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-fade-in">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="text-white font-bold">
            x
          </button>
        </div>
      )}

      {/* User Information */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Personal Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-600 mb-2"><span className="font-medium">Name:</span> {userData.displayName}</p>
            <p className="text-gray-600 mb-2"><span className="font-medium">Email:</span> {userData.email}</p>
            <p className="text-gray-600 mb-2"><span className="font-medium">Phone:</span> {userData.phone || 'Not provided'}</p>
            <p className="text-gray-600"><span className="font-medium">Address:</span> {userData.address}</p>
          </div>
          <div>
            <p className="text-gray-600 mb-2"><span className="font-medium">Height:</span> {userData.height}</p>
            <p className="text-gray-600 mb-2"><span className="font-medium">Weight:</span> {userData.weight}</p>
            <p className="text-gray-600 mb-2"><span className="font-medium">Account Created:</span> {userData.createdAt ? new Date(userData.createdAt).toLocaleString() : 'Not available'}</p>
            <p className="text-gray-600"><span className="font-medium">Last Login:</span> {userData.lastLogin ? new Date(userData.lastLogin).toLocaleString() : 'Not available'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;