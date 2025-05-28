import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { getUser, updateProfile } from '../services/api';
import placeholder from '../assets/placeholder.jpg';
import { toast } from 'react-toastify';
import { auth } from '../firebase/config';

const Profile = () => {
  const { user, loading: authLoading, updateProfile: updateAuthProfile } = useContext(AuthContext);

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
    birthdate: '',
    height: '',
    weight: '',
    bio: '',
    created_at: '',
    last_login: '',
    role: 'user',
    profile_image: placeholder,
  });
  const [profileImageFile, setProfileImageFile] = useState(null); // Store file for upload

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
            birthdate: userResponse?.birthdate || '',
            height: userResponse?.height || '',
            weight: userResponse?.weight || '',
            bio: userResponse?.bio || '',
            created_at: userResponse?.created_at || '',
            last_login: userResponse?.last_login || '',
            role: userResponse?.role || 'user',
            profile_image: userResponse?.profile_image || placeholder,
          });
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

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setProfileImageFile(file); // Store file for submission
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData(prev => ({ ...prev, profile_image: reader.result })); // Preview only
        toast.success('Profile picture selected (client-side preview)');
      };
      reader.onerror = () => {
        toast.error('Failed to read profile picture.');
        setProfileImageFile(null);
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
    setIsLoading(true);
    try {
      const token = await auth.currentUser.getIdToken(true);
      const formData = new FormData();
      formData.append('username', userData.username);
      formData.append('displayName', userData.display_name);
      formData.append('role', userData.role);
      formData.append('phone', userData.phone || '');
      formData.append('address', userData.address || '');
      formData.append('birthdate', userData.birthdate || '');
      formData.append('height', parseFloat(userData.height) || null);
      formData.append('weight', parseFloat(userData.weight) || null);
      formData.append('bio', userData.bio || '');
      if (profileImageFile) {
        formData.append('profile_image', profileImageFile); // Send file directly
      }

      const response = await updateProfile(formData, token);
      toast.success('Profile updated successfully');

      // Update AuthContext and local state
      await updateAuthProfile(
        userData.username,
        userData.display_name,
        userData.role,
        userData.phone,
        userData.address,
        parseFloat(userData.height) || null,
        parseFloat(userData.weight) || null,
        response.profile_image || placeholder
      );
      setUserData(prev => ({
        ...prev,
        profile_image: response.profile_image || placeholder,
        email: response.email || prev.email,
      }));
      setIsEditing(false);
      setProfileImageFile(null);
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(err.message || 'Failed to update profile');
      setUserData(prev => ({ ...prev, profile_image: placeholder })); // Revert on error
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Not available';
    return date.toLocaleString();
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
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
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
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
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
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Your Profile</h1>
        <p className="text-gray-600 mt-1">Manage your personal information</p>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Profile Image Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <img
                    src={userData.profile_image || placeholder}
                    alt="Profile"
                    className="w-40 h-40 rounded-full object-cover border-4 border-gray-200"
                    onError={(e) => (e.target.src = placeholder)}
                  />
                  <label
                    htmlFor="photo-upload"
                    className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-all duration-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
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
                <p className="text-sm text-gray-500">Upload a profile picture</p>
              </div>

              {/* Form Fields */}
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={userData.username}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                    <input
                      type="text"
                      name="display_name"
                      value={userData.display_name}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={userData.email}
                      disabled
                      className="w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={userData.phone}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={userData.address}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate</label>
                    <input
                      type="date"
                      name="birthdate"
                      value={userData.birthdate}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      name="bio"
                      value={userData.bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      name="height"
                      value={userData.height}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      name="weight"
                      value={userData.weight}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6 space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setProfileImageFile(null);
                      setUserData(prev => ({ ...prev, profile_image: user.profile_image || placeholder }));
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-800 font-medium rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="md:flex">
            {/* Left Column - Image and Basic Info */}
            <div className="bg-blue-50 p-6 md:w-1/3 flex flex-col items-center">
              <div className="relative mb-4">
                <img
                  src={userData.profile_image || placeholder}
                  alt="Profile"
                  className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-md"
                  onError={(e) => (e.target.src = placeholder)}
                />
                <label
                  htmlFor="photo-upload"
                  className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-all duration-200 shadow-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
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

              <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">{userData.display_name}</h2>
              <p className="text-gray-600 text-center">@{userData.username}</p>

              <div className="bg-white rounded-lg p-4 shadow-sm w-full mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Contact Info</h3>
                <p className="text-gray-700 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  {userData.email}
                </p>
                <p className="text-gray-700 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  {userData.phone || 'Not provided'}
                </p>
                <p className="text-gray-700 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  {userData.address || 'Not provided'}
                </p>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="w-full mt-6 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit Profile
              </button>
            </div>

            {/* Right Column - Detailed Info */}
            <div className="p-6 md:w-2/3">
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-2">About Me</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {userData.bio || 'No bio provided yet. Tell us about yourself!'}
                </p>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm">Birthdate</p>
                    <p className="text-gray-800">{userData.birthdate || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Height</p>
                    <p className="text-gray-800">{userData.height ? `${userData.height} cm` : 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Weight</p>
                    <p className="text-gray-800">{userData.weight ? `${userData.weight} kg` : 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-2">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-sm">Account Type</p>
                    <p className="text-gray-800 capitalize">{userData.role}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Member Since</p>
                    <p className="text-gray-800">{formatDate(userData.created_at, 'date')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Last Login</p>
                    <p className="text-gray-800">{formatDate(userData.last_login)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;