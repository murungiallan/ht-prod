import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { 
  getUser, 
  getUserMedications, 
  getTakenMedicationHistory, 
  getUserExercises, 
  getExerciseStats,
  updateProfile
} from '../services/api';
import placeholder from '../assets/placeholder.jpg';
import { toast } from 'react-toastify';
import { auth } from '../firebase/config';
import moment from 'moment';

const Profile = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const { socket } = useSocket();
  
  // States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    username: '',
    display_name: '',
    email: '',
    phone: '',
    address: '',
    height: '',
    weight: '',
    created_at: '',
    last_login: '',
    role: 'user',
    profile_image: placeholder
  });
  const [medications, setMedications] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [recentMedications, setRecentMedications] = useState([]);
  const [recentExercises, setRecentExercises] = useState([]);
  const [stats, setStats] = useState({ 
    totalExercises: 0, 
    medicationAdherence: 0 
  });

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!user || !isMounted) return;

      try {
        setIsLoading(true);
        setError(null);

        const token = await auth.currentUser.getIdToken(true);
        const userResponse = await getUser(token);
        if (isMounted) {
          setUserData({
            username: userResponse?.username || 'Not provided',
            display_name: userResponse?.display_name || 'Not provided',
            email: userResponse?.email || 'Not provided',
            phone: userResponse?.phone || '',
            address: userResponse?.address || '',
            height: userResponse?.height || '',
            weight: userResponse?.weight || '',
            created_at: userResponse?.created_at || '',
            last_login: userResponse?.last_login || '',
            role: userResponse?.role || 'user',
            profile_image: userResponse?.profile_image || placeholder
          });
        }

        const [userMedications, medicationHistory] = await Promise.all([
          getUserMedications(token),
          getTakenMedicationHistory(5)
        ]);
        
        if (isMounted) {
          setMedications(userMedications || []);
          const recentMeds = medicationHistory.slice(0, 3).map(entry => ({
            id: entry.id || Math.random(),
            medication_name: entry.medication_name || 'Unknown',
            dosage: entry.dosage || 'Unknown',
            time: entry.takenAt,
            taken: true
          }));
          setRecentMedications(recentMeds);
          const fullHistory = await getTakenMedicationHistory();
          const adherence = calculateOverallAdherence(userMedications || [], fullHistory || []);
          setStats(prev => ({ ...prev, medicationAdherence: adherence }));
        }

        const [userExercises, exerciseStats] = await Promise.all([
          getUserExercises(token),
          getExerciseStats(token)
        ]);

        if (isMounted) {
          setExercises(userExercises || []);
          setRecentExercises(userExercises?.slice(0, 3) || []);
          setStats(prev => ({
            ...prev,
            totalExercises: exerciseStats?.totalExercises || 0
          }));
        }

      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError(err.message || 'Failed to load profile data. Please try again.');
        toast.error(err.message || 'Failed to load profile data. Please try again.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (user && !authLoading) {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleMedicationUpdate = async (updatedMedication) => {
      try {
        setMedications(prev => 
          prev.map(med => 
            med.id === updatedMedication.id ? updatedMedication : med
          )
        );

        const history = await getTakenMedicationHistory(5);
        const recentMeds = history.slice(0, 3).map(entry => ({
          id: entry.id || Math.random(),
          medication_name: entry.medication_name || 'Unknown',
          dosage: entry.dosage || 'Unknown',
          time: entry.takenAt,
          taken: true
        }));
        setRecentMedications(recentMeds);

        const fullHistory = await getTakenMedicationHistory();
        const adherence = calculateOverallAdherence(
          medications.map(med => 
            med.id === updatedMedication.id ? updatedMedication : med
          ),
          fullHistory
        );
        setStats(prev => ({ ...prev, medicationAdherence: adherence }));
      } catch (err) {
        console.error('Error in handleMedicationUpdate:', err);
      }
    };

    const handleExerciseAdded = async (newExercise) => {
      try {
        const updatedExercises = [newExercise, ...exercises].sort(
          (a, b) => new Date(b.date_logged) - new Date(a.date_logged)
        );
        setExercises(updatedExercises);
        setRecentExercises(updatedExercises.slice(0, 3));

        const token = await auth.currentUser.getIdToken(true);
        const exerciseStats = await getExerciseStats(token);
        setStats(prev => ({
          ...prev,
          totalExercises: exerciseStats?.totalExercises || 0
        }));
      } catch (err) {
        console.error('Error in handleExerciseAdded:', err);
      }
    };

    const handleExerciseDeleted = async (id) => {
      try {
        const updatedExercises = exercises.filter(ex => ex.id !== id);
        setExercises(updatedExercises);
        setRecentExercises(updatedExercises.slice(0, 3));

        const token = await auth.currentUser.getIdToken(true);
        const exerciseStats = await getExerciseStats(token);
        setStats(prev => ({
          ...prev,
          totalExercises: exerciseStats?.totalExercises || 0
        }));
      } catch (err) {
        console.error('Error in handleExerciseDeleted:', err);
      }
    };

    const handleExerciseUpdated = async (updatedExercise) => {
      try {
        const updatedExercises = exercises
          .map(ex => ex.id === updatedExercise.id ? updatedExercise : ex)
          .sort((a, b) => new Date(b.date_logged) - new Date(a.date_logged));
        setExercises(updatedExercises);
        setRecentExercises(updatedExercises.slice(0, 3));

        const token = await auth.currentUser.getIdToken(true);
        const exerciseStats = await getExerciseStats(token);
        setStats(prev => ({
          ...prev,
          totalExercises: exerciseStats?.totalExercises || 0
        }));
      } catch (err) {
        console.error('Error in handleExerciseUpdated:', err);
      }
    };

    socket.on('medicationUpdated', handleMedicationUpdate);
    socket.on('exerciseAdded', handleExerciseAdded);
    socket.on('exerciseDeleted', handleExerciseDeleted);
    socket.on('exerciseUpdated', handleExerciseUpdated);
    socket.on('error', (error) => {
      console.error('Socket error:', error.message);
    });

    return () => {
      socket.off('medicationUpdated', handleMedicationUpdate);
      socket.off('exerciseAdded', handleExerciseAdded);
      socket.off('exerciseDeleted', handleExerciseDeleted);
      socket.off('exerciseUpdated', handleExerciseUpdated);
      socket.off('error');
    };
  }, [socket, user, exercises, medications]);

  const calculateOverallAdherence = (meds, history) => {
    let totalDoses = 0;
    let takenDoses = 0;

    if (!meds || meds.length === 0) return 0;

    meds.forEach((med) => {
      if (!med.doses || typeof med.doses !== 'object') return;

      Object.values(med.doses).forEach((dosesForDate) => {
        if (!Array.isArray(dosesForDate)) return;
        dosesForDate.forEach((dose) => {
          totalDoses++;
          if (dose.taken) takenDoses++;
        });
      });
    });

    return totalDoses > 0 ? parseFloat(((takenDoses / totalDoses) * 100).toFixed(2)) : 0;
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
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

  const formatDate = (dateString, type = 'dateTime') => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Not available';
    return type === 'dateTime' ? date.toLocaleString() : date.toLocaleDateString();
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-16">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800">Your Profile</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-red-600">Please log in to view your profile.</p>
          <p className="text-gray-600 mt-2">
            <a href="/login" className="text-blue-600 hover:underline">Log in</a>
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800">Your Profile</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-red-600">{error}</p>
          <p className="text-gray-600 mt-2">
            You may need to <a href="/login" className="text-blue-600 hover:underline">Log in</a> or refresh the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800">Your Profile</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
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
              <p className="text-gray-600 mb-1"><span className="font-medium">Username:</span> {userData.username || 'Not provided'}</p>
              <p className="text-gray-600 mb-1"><span className="font-medium">Email:</span> {userData.email || 'Not provided'}</p>
              <p className="text-gray-600 mb-1"><span className="font-medium">Phone:</span> {userData.phone || 'Not provided'}</p>
              <p className="text-gray-600 mb-1"><span className="font-medium">Address:</span> {userData.address || 'Not provided'}</p>
              <p className="text-gray-600 mb-1"><span className="font-medium">Height:</span> {userData.height ? `${userData.height} cm` : 'Not provided'}</p>
              <p className="text-gray-600 mb-1"><span className="font-medium">Weight:</span> {userData.weight ? `${userData.weight} kg` : 'Not provided'}</p>
              <p className="text-gray-600 mb-1"><span className="font-medium">Role:</span> {userData.role || 'Not provided'}</p>
              <p className="text-gray-600 mb-1"><span className="font-medium">Created At:</span> {formatDate(userData.created_at)}</p>
              <p className="text-gray-600 mb-1"><span className="font-medium">Last Login:</span> {formatDate(userData.last_login)}</p>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Profile
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Total Exercises</h3>
          <p className="text-3xl font-bold text-blue-600">{stats?.totalExercises || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Medication Adherence</h3>
          <p className="text-3xl font-bold text-blue-600">
            {(typeof stats?.medicationAdherence === 'number' ? stats.medicationAdherence : 0).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg text-gray-800 mb-4 font-semibold">Recent Medications</h3>
          {recentMedications?.length > 0 ? (
            <ul className="space-y-3">
              {recentMedications.map(med => (
                <li key={med?.id} className="flex justify-between items-center">
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
                    <p className="text-gray-800 font-medium">{exercise?.activity || 'Unknown exercise'}</p>
                    <p className="text-sm text-gray-600">
                      {exercise?.duration || 0} mins - {formatDate(exercise?.date_logged, 'date')}
                    </p>
                  </div>
                  <span className="text-gray-600 text-sm">{exercise?.calories_burned || 0} kcal</span>
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