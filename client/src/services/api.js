import axios from "axios";
import { auth, database } from "../firebase/config.js";
import { ref, update, get, push, query, orderByChild, limitToLast } from "firebase/database";
import { debounce } from "lodash";
import moment from "moment"; // For date manipulation in streak calculation

const api = axios.create({ baseURL: "http://127.0.0.1:5000/api" });

// Retry logic with exponential backoff for rate-limited requests
const retryWithBackoff = async (operation, maxAttempts = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (error.code === "auth/too-many-requests" || error.message.includes("Too Many Requests")) {
        if (attempt === maxAttempts) {
          throw error;
        }
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Rate limit hit, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};

// Helper function to make authenticated requests
const authFetch = async (endpoint, options = {}, token) => {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  try {
    const response = await fetch(`http://127.0.0.1:5000/api${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "An unknown error occurred",
      }));
      if (response.status === 401) {
        throw new Error("Unauthorized - Invalid or expired token");
      } else if (response.status === 429) {
        throw new Error("Too Many Requests - Please try again later");
      } else {
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};

// User API
export const registerUser = async (uid, username, email, displayName, password, role = "user", token) => {
  const userPath = `users/${uid}`;
  const userData = {
    username,
    email,
    displayName,
    role,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };
  await retryWithBackoff(() => update(ref(database), { [userPath]: userData }));

  return authFetch(
    "/users/register",
    {
      method: "POST",
      body: JSON.stringify({ uid, username, email, displayName, password, role }),
    },
    token
  );
};

export const updateLastLogin = async (email, displayName, lastLogin, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const userPath = `users/${user.uid}/lastLogin`;
  await retryWithBackoff(() => update(ref(database), { [userPath]: lastLogin }));

  return authFetch(
    "/users/last-login",
    {
      method: "POST",
      body: JSON.stringify({ email, displayName, lastLogin }),
    },
    token
  );
};

export const getUser = async (token) => {
  return authFetch("/users", {}, token);
};

export const updateProfile = async (userData, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const userPath = `users/${user.uid}`;
  const updatedUserData = {
    username: userData.username,
    email: userData.email,
    displayName: userData.displayName,
    role: userData.role,
    lastLogin: new Date().toISOString(),
  };
  await retryWithBackoff(() => update(ref(database), { [userPath]: updatedUserData }));

  return authFetch(
    "/users/profile",
    {
      method: "PUT",
      body: JSON.stringify(userData),
    },
    token
  );
};

export const resetPassword = async (email, token) => {
  return authFetch(
    "/users/reset-password",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
    token
  );
};

// Medication API
export const createMedication = async (medicationData, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const medicationEntry = {
    medication_name: medicationData.medication_name,
    dosage: medicationData.dosage,
    frequency: medicationData.frequency,
    times_per_day: medicationData.times_per_day,
    times: medicationData.times,
    doses: medicationData.doses,
    start_date: medicationData.start_date,
    end_date: medicationData.end_date,
    notes: medicationData.notes,
  };

  const response = await api.post("/medications/add", medicationEntry, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const medicationId = response.data.id.toString();
  const medicationPath = `medications/${user.uid}/${medicationId}`;
  const firebaseEntry = {
    ...medicationEntry,
    id: medicationId,
    userId: user.uid,
    createdAt: new Date().toISOString(),
  };
  await retryWithBackoff(() => update(ref(database), { [medicationPath]: firebaseEntry }));

  return response.data;
};

export const getUserMedications = async (token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  let medicationsFromMySQL;
  try {
    const response = await authFetch("/medications/get-medications", {}, token);
    medicationsFromMySQL = response;
  } catch (error) {
    console.error("Error fetching medications from MySQL:", error);
    throw new Error("Failed to fetch medications from server");
  }

  try {
    const updates = {};
    medicationsFromMySQL.forEach((medication) => {
      const medicationPath = `medications/${user.uid}/${medication.id}`;
      updates[medicationPath] = {
        id: medication.id.toString(),
        userId: user.uid,
        medication_name: medication.medication_name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        times_per_day: medication.times_per_day,
        times: medication.times,
        doses: medication.doses ?? medication.times.map((time) => ({
          time,
          taken: false,
          missed: false,
        })),
        createdAt: medication.createdAt || new Date().toISOString(),
      };
    });
    await retryWithBackoff(() => update(ref(database), updates));
  } catch (error) {
    console.error("Error updating Firebase with medications:", error);
  }

  return medicationsFromMySQL;
};

// Update Medication
export const updateMedication = async (id, medicationData, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  // Sync with MySQL
  const response = await api.put(`/medications/update/${id}`, medicationData, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Fetch the existing medication data from Firebase
  const medicationPath = `medications/${user.uid}/${id}`;
  let existingData = {};
  try {
    const snapshot = await get(ref(database, medicationPath));
    if (snapshot.exists()) {
      existingData = snapshot.val();
    }
  } catch (error) {
    console.error("Error fetching existing medication data from Firebase:", error);
  }

  // Merge the existing data with the updated data
  const updatedData = {
    ...existingData,
    id,
    userId: user.uid,
    medication_name: medicationData.medication_name ?? existingData.medication_name,
    dosage: medicationData.dosage ?? existingData.dosage,
    frequency: medicationData.frequency ?? existingData.frequency,
    time: medicationData.time ?? existingData.time,
    taken: medicationData.taken ?? existingData.taken ?? false,
    missed: medicationData.missed ?? existingData.missed ?? false,
  };

  // Update Firebase with the merged data
  updateMedicationDebounced(user.uid, id, updatedData);

  return response.data;
};

// Debounced update for general medication updates
const updateMedicationDebounced = debounce((userId, id, medicationData) => {
  const medicationPath = `medications/${userId}/${id}`;
  update(ref(database), {
    [medicationPath]: medicationData,
  });
}, 2000);

// Update medication as taken
export const updateMedicationTakenStatus = async (id, doseIndex, taken, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  // Fetch the existing medication from MySQL
  const response = await api.put(`/medications/${id}/taken`, { doseIndex, taken }, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Fetch the existing medication data from Firebase
  const medicationPath = `medications/${user.uid}/${id}`;
  let existingData = {};
  try {
    const snapshot = await get(ref(database, medicationPath));
    if (snapshot.exists()) {
      existingData = snapshot.val();
    }
  } catch (error) {
    console.error("Error fetching existing medication data from Firebase:", error);
  }

  // Ensure doses array exists and is an array
  const doses = Array.isArray(existingData.doses) ? [...existingData.doses] : [];
  
  // Ensure the dose at doseIndex exists and has all required properties
  const currentDose = doses[doseIndex] || { time: "00:00:00", taken: false, missed: false, takenAt: null };
  const updatedDose = {
    time: currentDose.time || "00:00:00",
    taken: taken,
    missed: taken ? false : (currentDose.missed || false),
    takenAt: taken ? new Date().toISOString() : null,
  };

  // Update the doses array
  doses[doseIndex] = updatedDose;

  const updatedData = {
    ...existingData,
    doses,
  };

  // Update Firebase with the merged data
  updateMedicationDebounced(user.uid, id, updatedData);

  // Log the taken action to medication history in Firebase
  if (taken) {
    const historyPath = `medication_history/${user.uid}`;
    const historyEntry = {
      medicationId: id,
      medication_name: existingData.medication_name || "Unknown",
      doseIndex,
      takenAt: new Date().toISOString(),
    };
    await retryWithBackoff(() => push(ref(database, historyPath), historyEntry));
  }

  return response.data;
};

// Mark medication as missed
export const markMedicationAsMissed = async (id, doseIndex, missed, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  // Sync with MySQL
  const response = await api.put(`/medications/${id}/missed`, { doseIndex, missed }, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Fetch the existing medication data from Firebase
  const medicationPath = `medications/${user.uid}/${id}`;
  let existingData = {};
  try {
    const snapshot = await get(ref(database, medicationPath));
    if (snapshot.exists()) {
      existingData = snapshot.val();
    }
  } catch (error) {
    console.error("Error fetching existing medication data from Firebase:", error);
  }

  // Ensure doses array exists and is an array
  const doses = Array.isArray(existingData.doses) ? [...existingData.doses] : [];

  // Ensure the dose at doseIndex exists and has all required properties
  const currentDose = doses[doseIndex] || { time: "00:00:00", taken: false, missed: false, takenAt: null };
  const updatedDose = {
    time: currentDose.time || "00:00:00",
    taken: missed ? false : (currentDose.taken || false),
    missed,
    takenAt: missed ? null : (currentDose.takenAt || null),
  };

  // Update the doses array
  doses[doseIndex] = updatedDose;

  const updatedData = {
    ...existingData,
    doses,
  };

  // Update Firebase with the merged data
  updateMedicationDebounced(user.uid, id, updatedData);

  return response.data;
};

export const deleteMedication = async (id, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  // Sync with MySQL
  const response = await api.delete(`/medications/delete/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Delete in Firebase with a single request
  const medicationPath = `medications/${user.uid}/${id}`;
  await retryWithBackoff(() => update(ref(database), { [medicationPath]: null }));

  return response.data;
};


// Fetch taken medication history from MySQL using the medications table
export const getTakenMedicationHistory = async (limit = 3) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const token = await user.getIdToken(true);
  try {
    const response = await authFetch("/medications/get-medications", {}, token);

    const takenDoses = [];
    response.forEach((medication) => {
      if (!medication.doses || !Array.isArray(medication.doses)) return;

      medication.doses.forEach((dose, doseIndex) => {
        if (dose.taken && dose.takenAt) {
          takenDoses.push({
            id: `${medication.id}-${doseIndex}`,
            medicationId: medication.id.toString(),
            medication_name: medication.medication_name,
            doseIndex: doseIndex,
            takenAt: dose.takenAt,
          });
        }
      });
    });

    // Sort by takenAt in descending order (most recent first)
    takenDoses.sort((a, b) => new Date(b.takenAt) - new Date(a.takenAt));

    // Apply the limit
    return limit > 0 ? takenDoses.slice(0, limit) : takenDoses;
  } catch (error) {
    console.error("Error fetching taken medication history from MySQL:", error);
    throw new Error("Failed to fetch taken medication history");
  }
};

// Calculate medication adherence streak using MySQL medications table
export const calculateMedicationStreak = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const token = await user.getIdToken(true);
  try {
    const response = await authFetch("/medications/get-medications", {}, token);
    if (!response || response.length === 0) {
      return 0;
    }

    const takenTimestamps = [];
    response.forEach((medication) => {
      if (!medication.doses || !Array.isArray(medication.doses)) return; 

      medication.doses.forEach((dose) => {
        if (dose.taken && dose.takenAt) {
          takenTimestamps.push(dose.takenAt);
        }
      });
    });

    if (takenTimestamps.length === 0) {
      return 0;
    }

    // Extract unique dates from takenAt timestamps and sort them
    const takenDates = [...new Set(
      takenTimestamps.map((timestamp) => new Date(timestamp).toISOString().split("T")[0])
    )].sort();

    let streak = 1;
    for (let i = 1; i < takenDates.length; i++) {
      const prevDate = new Date(takenDates[i - 1]);
      const currDate = new Date(takenDates[i]);
      const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error("Error calculating medication streak:", error);
    throw new Error("Failed to calculate medication streak");
  }
};


// Exercise API
export const createExercise = async (exerciseData, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  // Validate exercise data
  const exerciseEntry = {
    userId: user.uid,
    activity: exerciseData.activity,
    duration: exerciseData.duration,
    calories_burned: exerciseData.calories_burned,
    date_logged: exerciseData.date_logged,
    createdAt: new Date().toISOString(),
  };

  // Sync with MySQL
  const response = await api.post("/exercises/add", exerciseEntry, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Write to Firebase with a single update
  const exerciseId = response.data.id.toString();
  const exercisePath = `exercises/${user.uid}/${exerciseId}`;
  const firebaseEntry = {
    ...exerciseEntry,
    id: exerciseId,
  };
  await retryWithBackoff(() => update(ref(database), { [exercisePath]: firebaseEntry }));

  return response.data;
};

export const getUserExercises = async (token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  // Fetch from MySQL
  const response = await authFetch("/exercises/get-exercises", {}, token);
  const exercisesFromMySQL = response;

  // Update Firebase with the latest data from MySQL
  const updates = {};
  exercisesFromMySQL.forEach((exercise) => {
    const exercisePath = `exercises/${user.uid}/${exercise.id}`;
    updates[exercisePath] = {
      id: exercise.id.toString(),
      userId: user.uid,
      activity: exercise.activity,
      duration: exercise.duration,
      calories_burned: exercise.calories_burned,
      date_logged: exercise.date_logged,
      createdAt: exercise.createdAt || new Date().toISOString(),
    };
  });
  await retryWithBackoff(() => update(ref(database), updates));

  return exercisesFromMySQL;
};

const updateExerciseDebounced = debounce((userId, id, exerciseData) => {
  const exercisePath = `exercises/${userId}/${id}`;
  update(ref(database), {
    [exercisePath]: {
      id,
      userId,
      activity: exerciseData.activity,
      duration: exerciseData.duration,
      calories_burned: exerciseData.calories_burned,
      date_logged: exerciseData.date_logged,
    },
  });
}, 2000);

export const updateExercise = async (id, exerciseData, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  // Sync with MySQL
  const response = await api.put(`/medications/update/${id}`, exerciseData, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Update Firebase with a single request (debounced)
  updateExerciseDebounced(user.uid, id, exerciseData);

  return response.data;
};

export const deleteExercise = async (id, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  // Sync with MySQL
  const response = await api.delete(`/exercises/delete/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Delete in Firebase with a single request
  const exercisePath = `exercises/${user.uid}/${id}`;
  await retryWithBackoff(() => update(ref(database), { [exercisePath]: null }));

  return response.data;
};

export const getExerciseStats = async (token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  // Fetch from MySQL
  const response = await authFetch("/exercises/exercise-stats", {}, token);
  const stats = response;

  // Update Firebase
  const statsPath = `exercise_stats/${user.uid}`;
  await retryWithBackoff(() => update(ref(database), { [statsPath]: stats }));

  return stats;
};