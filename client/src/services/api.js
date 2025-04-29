import axios from "axios";
import { auth, database } from "../firebase/config.js";
import { ref, update, get, push, query, orderByChild, limitToLast } from "firebase/database";
import { debounce } from "lodash";

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
        if (errorData.code === "auth/id-token-expired") {
          const error = new Error("Unauthorized - ID token expired");
          error.code = "auth/id-token-expired";
          throw error;
        }
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

export const saveWeeklyGoals = async (weeklyFoodCalorieGoal, weeklyExerciseCalorieGoal, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const userPath = `users/${user.uid}/weeklyGoals`;
  const goalsData = {
    weeklyFoodCalorieGoal,
    weeklyExerciseCalorieGoal,
  };
  await retryWithBackoff(() => update(ref(database), { [userPath]: goalsData }));

  return authFetch(
    "/users/weekly-goals",
    {
      method: "POST",
      body: JSON.stringify({ weeklyFoodCalorieGoal, weeklyExerciseCalorieGoal }),
    },
    token
  );
};

export const getWeeklyGoals = async (token) => {
  return authFetch("/users/weekly-goals", {}, token);
};

//Food Diary API

export const createFoodLog = async (foodData, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");


}

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

  // Remove duplicates based on medication_name, dosage, times_per_day, and frequency
  const uniqueMedications = Array.from(
    new Map(
      medicationsFromMySQL.map((med) => [
        `${med.medication_name}-${med.dosage}-${med.times_per_day}-${med.frequency}`,
        med,
      ])
    ).values()
  );

  try {
    const updates = {};
    uniqueMedications.forEach((medication) => {
      const medicationPath = `medications/${user.uid}/${medication.id}`;
      updates[medicationPath] = {
        id: medication.id.toString(),
        userId: user.uid,
        medication_name: medication.medication_name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        times_per_day: medication.times_per_day,
        times: medication.times || [],
        doses: medication.doses || {},
        start_date: medication.start_date,
        end_date: medication.end_date,
        notes: medication.notes,
        createdAt: medication.createdAt || new Date().toISOString(),
      };
    });
    await retryWithBackoff(() => update(ref(database), updates));
  } catch (error) {
    console.error("Error updating Firebase with medications:", error);
  }

  return uniqueMedications;
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
export const updateMedicationTakenStatus = async (id, doseIndex, taken, token, date) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const response = await api.put(
    `/medications/${id}/taken`,
    { doseIndex, taken, date },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const medicationPath = `medications/${user.uid}/${id}`;
  let existingData = {};
  try {
    const snapshot = await get(ref(database, medicationPath));
    if (snapshot.exists()) existingData = snapshot.val();
  } catch (error) {
    console.error("Error fetching existing medication data from Firebase:", error);
  }

  const doses = { ...(existingData.doses || {}) };
  const dailyDoses = doses[date] || existingData.times.map((time) => ({
    time,
    taken: false,
    missed: false,
    takenAt: null,
  }));
  dailyDoses[doseIndex] = {
    time: dailyDoses[doseIndex]?.time || existingData.times[doseIndex],
    taken,
    missed: taken ? false : dailyDoses[doseIndex]?.missed || false,
    takenAt: taken ? new Date().toISOString() : null,
  };
  doses[date] = dailyDoses;

  const updatedData = { ...existingData, doses };
  updateMedicationDebounced(user.uid, id, updatedData);

  if (taken) {
    const historyPath = `medication_history/${user.uid}`;
    const historyEntry = {
      medicationId: id,
      medication_name: existingData.medication_name || "Unknown",
      doseIndex,
      takenAt: new Date().toISOString(),
      date,
    };
    await retryWithBackoff(() => push(ref(database, historyPath), historyEntry));
  }

  return response.data;
};

// Mark medication as missed
export const markMedicationAsMissed = async (id, doseIndex, missed, token, date) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const response = await api.put(
    `/medications/${id}/missed`,
    { doseIndex, missed, date },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const medicationPath = `medications/${user.uid}/${id}`;
  let existingData = {};
  try {
    const snapshot = await get(ref(database, medicationPath));
    if (snapshot.exists()) existingData = snapshot.val();
  } catch (error) {
    console.error("Error fetching existing medication data from Firebase:", error);
  }

  const doses = { ...(existingData.doses || {}) };
  const dailyDoses = doses[date] || existingData.times.map((time) => ({
    time,
    taken: false,
    missed: false,
    takenAt: null,
  }));
  dailyDoses[doseIndex] = {
    time: dailyDoses[doseIndex]?.time || existingData.times[doseIndex],
    taken: missed ? false : dailyDoses[doseIndex]?.taken || false,
    missed,
    takenAt: missed ? null : dailyDoses[doseIndex]?.takenAt || null,
  };
  doses[date] = dailyDoses;

  const updatedData = { ...existingData, doses };
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
      if (!medication.doses || typeof medication.doses !== "object") return;

      Object.entries(medication.doses).forEach(([date, dosesForDate]) => {
        if (!Array.isArray(dosesForDate)) return;
        dosesForDate.forEach((dose, doseIndex) => {
          if (dose.taken && dose.takenAt) {
            takenDoses.push({
              id: `${medication.id}-${doseIndex}-${date}`,
              medicationId: medication.id.toString(),
              medication_name: medication.medication_name,
              doseIndex: doseIndex,
              date: date,
              takenAt: dose.takenAt,
            });
          }
        });
      });
    });

    takenDoses.sort((a, b) => new Date(b.takenAt) - new Date(a.takenAt));
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
      if (!medication.doses || typeof medication.doses !== "object") return;

      Object.values(medication.doses).forEach((dosesForDate) => {
        if (!Array.isArray(dosesForDate)) return;
        dosesForDate.forEach((dose) => {
          if (dose.taken && dose.takenAt) {
            takenTimestamps.push(dose.takenAt);
          }
        });
      });
    });

    if (takenTimestamps.length === 0) {
      return 0;
    }

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

// Fetching drug names from RxNorm API

// Cache to store recent drug search results
const drugSearchCache = new Map();
// Cache to store minimal drug details (name and dosage only)
const drugDetailsCache = new Map();

// Function to simplify drug names
const simplifyDrugName = (name) => {
  let simplified = name;
  
  // Remove pack/kit labels
  simplified = simplified.replace(/\b(Pack|Kit)\b/i, "").trim();
  
  // Extract components from parentheses if present
  const match = simplified.match(/\((.*?)\)/g);
  if (match) {
    const components = match
      .map((part) => {
        const inner = part.replace(/[\(\)]/g, "");
        const parts = inner.split("/").map((comp) => {
          const dosageMatch = comp.match(/\d+\s*(MG|G|ML)/i);
          const drugName = comp
            .replace(/\d+\s*(MG|G|ML)\b/i, "")
            .replace(/\b(Oral Tablet|Capsule|Solution|Effervescent)\b/i, "")
            .trim();
          return dosageMatch ? `${drugName} ${dosageMatch[0]}` : drugName;
        });
        return parts.join(" / ");
      })
      .join(" + ");
    simplified = components;
  }

  simplified = simplified.replace(/\s*\/\s*/g, " / ").replace(/\s+/g, " ").trim();
  return simplified || name;
};

// Extract dosage from drug name (as a fallback)
const extractDosageFromName = (name) => {
  const dosageMatch = name.match(/\d+\s*(MG|G|ML)/gi);
  return dosageMatch ? dosageMatch.join(" / ") : null;
};

// Search drugs by name using RxNorm SCDs
export const searchDrugsByName = async (query) => {
  if (!query || query.length < 2) return [];

  const cacheKey = query.toLowerCase();
  if (drugSearchCache.has(cacheKey)) {
    return drugSearchCache.get(cacheKey);
  }

  try {
    const response = await fetch(
      `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(query)}&search=2`
    );

    if (!response.ok) {
      throw new Error(`RxNorm API error: ${response.status}`);
    }

    const data = await response.json();
    let medications = [];

    if (data?.drugGroup?.conceptGroup) {
      medications = data.drugGroup.conceptGroup
        .filter(group => group.conceptProperties)
        .flatMap(group =>
          group.conceptProperties.map(drug => {
            const displayName = simplifyDrugName(drug.name);
            const dosage = extractDosageFromName(drug.name) || "Not specified";

            return {
              id: drug.rxcui,
              name: drug.name,
              displayName,
              type: group.tty || "Unknown",
              dosage
            };
          })
        )
        .filter((drug, index, self) => 
          index === self.findIndex(d => d.id === drug.id)
        );

      // Sort to prioritize SCDs and then by name
      medications.sort((a, b) => {
        if (a.type === "SCD" && b.type !== "SCD") return -1;
        if (a.type !== "SCD" && b.type === "SCD") return 1;
        return a.displayName.localeCompare(b.displayName);
      });

      // Limit to 10 results
      medications = medications.slice(0, 10);
    }

    // Update cache with a larger limit
    if (drugSearchCache.size > 500) { 
      drugSearchCache.clear();
    }
    drugSearchCache.set(cacheKey, medications);
    return medications;
  } catch (error) {
    console.error("Error searching drugs:", error);
    throw new Error("Failed to search medications");
  }
};

// Get minimal drug information for AddMedicationModal (name and dosage only)
export const getDrugDetails = async (rxcui, fallbackName = "Unknown Drug") => {
  if (drugDetailsCache.has(rxcui)) {
    return drugDetailsCache.get(rxcui);
  }

  try {
    // Fetch only the properties endpoint (name and dosage)
    const propertiesResponse = await fetch(
      `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/allproperties.json`
    );

    const drugInfo = {
      name: fallbackName,
      dosages: []
    };

    // Handle properties response
    if (propertiesResponse.ok) {
      const propertiesData = await propertiesResponse.json();
      if (propertiesData?.propConceptGroup?.propConcept) {
        const props = propertiesData.propConceptGroup.propConcept;
        drugInfo.name = props.find(p => p.propName === "RxNorm Name")?.propValue || fallbackName;
      }
    } else {
      console.warn(`Properties not found for RxCUI ${rxcui}: ${propertiesResponse.status}`);
    }

    // Fetch dosage information using the related endpoint
    const relatedResponse = await fetch(
      `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/allrelated.json`
    );

    if (relatedResponse.ok) {
      const relatedData = await relatedResponse.json();
      if (relatedData?.allRelatedGroup?.conceptGroup) {
        const relatedConcepts = relatedData.allRelatedGroup.conceptGroup
          .filter(group => group.conceptProperties)
          .flatMap(group => group.conceptProperties);

        // Get standard dosage forms (DF/DFG)
        const dfDosages = relatedConcepts
          .filter(concept => concept.tty === "DF" || concept.tty === "DFG")
          .map(concept => concept.name)
          .filter(Boolean);

        // Get specific dosages from SCDs
        const scdConcepts = relatedConcepts.filter(concept => concept.tty === "SCD");
        const scdDosages = scdConcepts
          .map(concept => {
            const dosageMatch = concept.name.match(/\d+\s*(MG|G|ML)/gi);
            return dosageMatch ? dosageMatch.join(" / ") : null;
          })
          .filter(Boolean);

        // Combine and deduplicate dosages
        drugInfo.dosages = [...new Set([...dfDosages, ...scdDosages])];
      }
    } else {
      console.warn(`Related info not found for RxCUI ${rxcui}: ${relatedResponse.status}`);
      drugInfo.dosages = [extractDosageFromName(fallbackName) || "Not specified"].filter(Boolean);
    }

    // Add fallback dosage if none were found
    if (drugInfo.dosages.length === 0) {
      const fallbackDosage = extractDosageFromName(fallbackName);
      if (fallbackDosage) {
        drugInfo.dosages = [fallbackDosage];
      }
    }

    // Update cache with a larger limit
    if (drugDetailsCache.size > 500) {
      drugDetailsCache.clear();
    }
    drugDetailsCache.set(rxcui, drugInfo);

    return drugInfo;
  } catch (error) {
    console.error("Error fetching drug details:", error);
    throw new Error("Failed to fetch drug details");
  }
};

// Reminder API
export const createReminder = async (reminderData, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const reminderEntry = {
    medicationId: reminderData.medicationId,
    doseIndex: reminderData.doseIndex,
    reminderTime: reminderData.reminderTime,
    date: reminderData.date,
    type: reminderData.type || "single",
  };

  const response = await api.post("/reminders/add", reminderEntry, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const reminderId = response.data.id.toString();
  const reminderPath = `reminders/${user.uid}/${reminderId}`;
  const firebaseEntry = {
    ...reminderEntry,
    id: reminderId,
    userId: user.uid,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await retryWithBackoff(() => update(ref(database), { [reminderPath]: firebaseEntry }));

  return { id: reminderId, ...firebaseEntry };
};

// Reminders API
export const getUserReminders = async (token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  let remindersFromMySQL;
  try {
    const response = await api.get("/reminders/get-reminders", {
      headers: { Authorization: `Bearer ${token}` },
    });
    remindersFromMySQL = response.data;
  } catch (error) {
    console.error("Error fetching reminders from MySQL:", error);
    throw new Error("Failed to fetch reminders from server");
  }

  try {
    const updates = {};
    remindersFromMySQL.forEach((reminder) => {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!timeRegex.test(reminder.reminder_time) || !dateRegex.test(reminder.date)) {
        console.warn(`Invalid reminder format for ID ${reminder.id}`);
        return;
      }
      const reminderPath = `reminders/${user.uid}/${reminder.id}`;
      updates[reminderPath] = {
        id: reminder.id.toString(),
        userId: user.uid,
        medicationId: reminder.medication_id,
        doseIndex: reminder.dose_index,
        reminderTime: reminder.reminder_time,
        date: reminder.date,
        type: reminder.type,
        status: reminder.status || "pending",
        createdAt: reminder.createdAt || new Date().toISOString(),
      };
    });
    await retryWithBackoff(() => update(ref(database), updates));
  } catch (error) {
    console.error("Error updating Firebase with reminders:", error);
  }

  return remindersFromMySQL.map((reminder) => ({
    id: reminder.id.toString(),
    userId: reminder.user_id,
    medicationId: reminder.medication_id,
    doseIndex: reminder.dose_index,
    reminderTime: reminder.reminder_time,
    date: reminder.date,
    type: reminder.type,
    status: reminder.status || "pending",
    createdAt: reminder.createdAt,
  }));
};

export const deleteReminder = async (reminderId, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  try {
    await api.delete(`/reminders/delete/${reminderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const reminderPath = `reminders/${user.uid}/${reminderId}`;
    await retryWithBackoff(() => update(ref(database), { [reminderPath]: null }));

    return { success: true };
  } catch (error) {
    console.error("Error deleting reminder:", error);
    throw new Error("Failed to delete reminder");
  }
};

export const updateReminderStatus = async (reminderId, status, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  if (!["pending", "sent"].includes(status)) {
    throw new Error("Status must be 'pending' or 'sent'");
  }

  try {
    const response = await api.put(`/reminders/update/${reminderId}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const reminderPath = `reminders/${user.uid}/${reminderId}`;
    await retryWithBackoff(() => update(ref(database), { [reminderPath + "/status"]: status }));

    return response.data;
  } catch (error) {
    console.error("Error updating reminder status:", error);
    throw new Error("Failed to update reminder status");
  }
};

export const updateReminder = async (reminderId, reminderData, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (
    !timeRegex.test(reminderData.reminderTime) ||
    !dateRegex.test(reminderData.date) ||
    !["single", "daily"].includes(reminderData.type)
  ) {
    throw new Error("Invalid reminder data format");
  }

  try {
    const response = await api.put(
      `/reminders/update/${reminderId}`,
      {
        reminderTime: reminderData.reminderTime,
        date: reminderData.date,
        type: reminderData.type,
        status: reminderData.status || "pending",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const reminderPath = `reminders/${user.uid}/${reminderId}`;
    await retryWithBackoff(() =>
      update(ref(database), {
        [reminderPath]: {
          id: reminderId,
          userId: user.uid,
          medicationId: reminderData.medicationId,
          doseIndex: reminderData.doseIndex,
          reminderTime: reminderData.reminderTime,
          date: reminderData.date,
          type: reminderData.type,
          status: reminderData.status || "pending",
          createdAt: reminderData.createdAt || new Date().toISOString(),
        },
      })
    );

    return response.data;
  } catch (error) {
    console.error("Error updating reminder:", error);
    throw new Error("Failed to update reminder");
  }
};

export const saveFcmToken = async (token, fcmToken) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  try {
    // Update Firebase
    await update(ref(database), {
      [`users/${user.uid}/fcm_token`]: fcmToken,
    });
    return { success: true };
  } catch (error) {
    console.error("Error saving FCM token:", error);
    throw new Error("Failed to save FCM token");
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
    date_logged: exerciseData.date_logged
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
      date_logged: exercise.date_logged
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
}, 500);

export const updateExercise = async (id, exerciseData, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  const response = await api.put(`/exercises/update/${id}`, exerciseData, {
    headers: { Authorization: `Bearer ${token}` },
  });
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