import React, { useState, useEffect } from 'react';
import { getUser, getUserMedications, getUserExercises, getExerciseStats } from '../services/api';
import placeholder from '../assets/placeholder.jpg';
import { toast } from 'react-toastify';
import { auth } from '../firebase/config';

const Profile = () => {
  // states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({
    display_name: '',
    email: '',
    phone: '',
    photoURL: placeholder
  });
  const [recentMedications, setRecentMedications] = useState([]);
  const [recentExercises, setRecentExercises] = useState([]);
  const [stats, setStats] = useState({ totalExercises: 0, medicationAdherence: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if user is authenticated
        if (!auth.currentUser) {
          throw new Error('Not authenticated. Please log in to view your profile.');
        }

        // Fetch the ID token
        const token = await auth.currentUser.getIdToken(true);

        // Fetch user data
        const user = await getUser(token);
        setUserData({
          display_name: user?.display_name || 'Not provided',
          email: user?.email || 'Not provided',
          phone: user?.phone || 'Not provided',
          photoURL: user?.photoURL || placeholder
        });

        // Fetch recent medications (limit to 3)
        const medications = await getUserMedications(token);
        setRecentMedications(medications?.slice(0, 3) || []);

        // Fetch recent exercises (limit to 3)
        const exercises = await getUserExercises(token);
        setRecentExercises(exercises?.slice(0, 3) || []);

        // Fetch stats
        const exerciseStats = await getExerciseStats(token);
        setStats({
          totalExercises: exerciseStats?.totalExercises || 0,
          medicationAdherence: medications?.length
            ? (medications.filter(m => m?.taken).length / medications.length) * 100
            : 0
        });
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError(err.message || 'Failed to load profile data. Please try again.');
        toast.error(err.message || 'Failed to load profile data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData(prev => ({ ...prev, photoURL: reader.result || placeholder }));
        toast.success('Profile picture updated successfully (client-side preview)');
      };
      reader.onerror = () => {
        toast.error('Failed to upload profile picture.');
        setUserData(prev => ({ ...prev, photoURL: placeholder }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Format date with fallback
  const formatDate = (dateString, type = 'dateTime') => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Not available';
    return type === 'dateTime' ? date.toLocaleString() : date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-16">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Display error message if there’s an error
  if (error) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 font-mono">Your Profile</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-red-600">{error}</p>
          <p className="text-gray-600 mt-2">
            You may need to <a href="/login" className="text-blue-600 hover:underline">log in</a> or refresh the page.
          </p>
        </div>
      </div>
    );
  }

  // Fallback for if userData is null or undefined
  if (!userData) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 font-mono">Your Profile</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600">No profile data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 font-mono">Your Profile</h1>

      {/* Profile Overview */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-6">
          <div className="relative">
            <img
              src={userData.photoURL || placeholder}
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
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">{userData.display_name || 'Not provided'}</h2>
            <p className="text-gray-600 mb-1">
              <span className="font-medium">Email:</span> {userData.email || 'Not provided'}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Phone:</span> {userData.phone || 'Not provided'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Total Exercises</h3>
          <p className="text-3xl font-bold text-blue-600">{stats?.totalExercises || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Medication Adherence</h3>
          <p className="text-3xl font-bold text-blue-600">{(stats?.medicationAdherence || 0).toFixed(1)}%</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg text-gray-800 mb-4 font-semibold">Recent Medications</h3>
          {recentMedications?.length > 0 ? (
            <ul className="space-y-3">
              {recentMedications.map(med => (
                <li key={med?.id || Math.random()} className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-800 font-medium">{med?.medication_name || 'Unknown medication'}</p>
                    <p className="text-sm text-gray-600">
                      {med?.dosage || 'Unknown dosage'} - {formatDate(med?.time)}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      med?.taken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {med?.taken ? 'Taken' : 'Missed'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No recent medications.</p>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Exercises</h3>
          {recentExercises?.length > 0 ? (
            <ul className="space-y-3">
              {recentExercises.map(exercise => (
                <li key={exercise?.id || Math.random()} className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-800 font-medium">{exercise?.name || 'Unknown exercise'}</p>
                    <p className="text-sm text-gray-600">
                      {exercise?.duration || 0} mins - {formatDate(exercise?.date, 'date')}
                    </p>
                  </div>
                  <span className="text-gray-600 text-sm">{exercise?.calories || 0} kcal</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No recent exercises.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;