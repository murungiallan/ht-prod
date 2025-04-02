import axios from "axios";
import { auth } from "../firebase/config.js";

const api = axios.create({ baseURL: "http://localhost:5000/api" });

// Helper function to make authenticated requests
const authFetch = async (endpoint, options = {}, token) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
   
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
   
  const response = await fetch(`http://localhost:5000/api${endpoint}`, {
    ...options,
    headers
  });
   
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: 'An unknown error occurred'
    }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }
   
  return response.json();
};

export const registerUser = async (token, email, displayName) => {
  return authFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, displayName })
  }, token);
};

export const updateLastLogin = async (token) => {
  return authFetch('/auth/last-login', {
    method: 'POST'
  }, token);
};

export const getUser = async (token) => {
  return authFetch('/auth', {}, token);
};

export const updateProfile = async (token, userData) => {
  return authFetch('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(userData)
  }, token);
};

export const updatePreferences = async (token, preferences) => {
  return authFetch('/auth/preferences', {
    method: 'PUT',
    body: JSON.stringify(preferences)
  }, token);
};

// Exercise API
export const createExercise = async (exerciseData) => {
  const response = await api.post("/exercises/add", exerciseData);
  return response.data;
};

export const getUserExercises = async () => {
  const response = await api.get("/exercises/get-exercises");
  return response.data;
};

export const updateExercise = async (id, exerciseData) => {
  const response = await api.put(`/exercises/update/${id}`, exerciseData);
  return response.data;
};

export const deleteExercise = async (id) => {
  const response = await api.delete(`/exercises/delete/${id}`);
  return response.data;
};

export const getExerciseStats = async () => {
  const response = await api.get("/exercises/exercise-stats");
  return response.data;
};

// Medication API
export const createMedication = async (medicationData, token) => {
  const response = await api.post("/medications/add", medicationData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const getUserMedications = async (token) => {
  const response = await api.get("/medications/get-medications", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const updateMedication = async (id, medicationData) => {
  const response = await api.put(`/medications/update/${id}`, medicationData);
  return response.data;
};

export const deleteMedication = async (id) => {
  const response = await api.delete(`/medications/delete/${id}`);
  return response.data;
};

export const updateMedicationTakenStatus = async (id, taken) => {
  const response = await api.put(`/medications/${id}/taken`, { taken });
  return response.data;
};

export const markMedicationAsMissed = async (id) => {
  const response = await api.put(`/medications/${id}/missed`);
  return response.data;
};