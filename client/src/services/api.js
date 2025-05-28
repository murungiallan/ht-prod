import axios from "axios";
import { auth, database } from "../firebase/config.js";
import { ref, update, get, push } from "firebase/database";
import { debounce } from "lodash";

// Production API base URL
const API_BASE_URL = 'https://healthtrack-app23-8fb2f2d8c68d.herokuapp.com/api';

// Create axios instance with dynamic base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry logic with exponential backoff for rate-limited requests
const retryWithBackoff = async (operation, maxAttempts = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (error.code === "auth/too-many-requests" || 
          error.message.includes("Too Many Requests") ||
          error.response?.status === 429) {
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
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  // Avoid setting Content-Type for FormData to let the browser handle it
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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

// Helper functions for API operations
const apiPost = async (endpoint, data, token, config = {}) => {
  try {
    const response = await retryWithBackoff(() =>
      api.post(endpoint, data, {
        headers: { Authorization: `Bearer ${token}`, ...config.headers },
        ...config,
      })
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      const err = new Error("Unauthorized - Invalid or expired token");
      if (error.response.data?.code === "auth/id-token-expired") {
        err.code = "auth/id-token-expired";
      }
      throw err;
    } else if (error.response?.status === 429) {
      throw new Error("Too Many Requests - Please try again later");
    } else if (error.response) {
      throw new Error(error.response.data?.error || `Request failed with status ${error.response.status}`);
    } else if (error.request) {
      throw new Error("Network error - Unable to reach server");
    }
    throw error;
  }
};

const apiGet = async (endpoint, token, config = {}) => {
  try {
    const response = await api.get(endpoint, {
      headers: { Authorization: `Bearer ${token}`, ...config.headers },
      ...config,
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      const err = new Error("Unauthorized - Invalid or expired token");
      if (error.response.data?.code === "auth/id-token-expired") {
        err.code = "auth/id-token-expired";
      }
      throw err;
    } else if (error.response?.status === 429) {
      throw new Error("Too Many Requests - Please try again later");
    } else if (error.response) {
      throw new Error(error.response.data?.error || `Request failed with status ${error.response.status}`);
    } else if (error.request) {
      throw new Error("Network error - Unable to reach server");
    }
    throw error;
  }
};

const apiPut = async (endpoint, data, token, config = {}) => {
  try {
    const response = await retryWithBackoff(() =>
      api.put(endpoint, data, {
        headers: { Authorization: `Bearer ${token}`, ...config.headers },
        ...config,
      })
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      const err = new Error("Unauthorized - Invalid or expired token");
      if (error.response.data?.code === "auth/id-token-expired") {
        err.code = "auth/id-token-expired";
      }
      throw err;
    } else if (error.response?.status === 429) {
      throw new Error("Too Many Requests - Please try again later");
    } else if (error.response) {
      throw new Error(error.response.data?.error || `Request failed with status ${error.response.status}`);
    } else if (error.request) {
      throw new Error("Network error - Unable to reach server");
    }
    throw error;
  }
};

const apiDelete = async (endpoint, token, config = {}) => {
  try {
    const response = await retryWithBackoff(() =>
      api.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}`, ...config.headers },
        ...config,
      })
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      const err = new Error("Unauthorized - Invalid or expired token");
      if (error.response.data?.code === "auth/id-token-expired") {
        err.code = "auth/id-token-expired";
      }
      throw err;
    } else if (error.response?.status === 429) {
      throw new Error("Too Many Requests - Please try again later");
    } else if (error.response) {
      throw new Error(error.response.data?.error || `Request failed with status ${error.response.status}`);
    } else if (error.request) {
      throw new Error("Network error - Unable to reach server");
    }
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

  return apiPost("/users/register", { uid, username, email, displayName, password, role }, token);
};

export const updateLastLogin = async (email, displayName, lastLogin, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const userPath = `users/${user.uid}/lastLogin`;
  await retryWithBackoff(() => update(ref(database), { [userPath]: lastLogin }));

  return apiPost("/users/last-login", { email, displayName, lastLogin }, token);
};

export const getUser = async (token) => {
  return apiGet("/users", token);
};

export const getAllUsers = async (token) => {
  return apiGet("/users/all", token);
};

export const updateProfile = async (formData, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const userPath = `users/${user.uid}`;
  const updatedUserData = {
    username: formData.get('username'),
    displayName: formData.get('displayName'),
    role: formData.get('role'),
    phone: formData.get('phone') || null,
    address: formData.get('address') || null,
    height: parseFloat(formData.get('height')) || null,
    weight: parseFloat(formData.get('weight')) || null,
    profile_image: formData.get('profile_image') || null,
  };
  await retryWithBackoff(() => update(ref(database), { [userPath]: updatedUserData }));

  const response = await fetch('https://healthtrack-app23-8fb2f2d8c68d.herokuapp.com/api/users/profile', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update profile: ${errorText}`);
  }

  return response.json();
};

export const resetPassword = async (email, token) => {
  return apiPost("/users/reset-password", { email }, token);
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

  return apiPost("/users/weekly-goals", { weeklyFoodCalorieGoal, weeklyExerciseCalorieGoal }, token);
};

export const getWeeklyGoals = async (token) => {
  return apiGet("/users/weekly-goals", token);
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

  const response = await apiPost("/medications/add", medicationEntry, token);

  const medicationId = response.id.toString();
  const medicationPath = `medications/${user.uid}/${medicationId}`;
  const firebaseEntry = {
    ...medicationEntry,
    id: medicationId,
    userId: user.uid,
    createdAt: new Date().toISOString(),
  };
  await retryWithBackoff(() => update(ref(database), { [medicationPath]: firebaseEntry }));

  return response;
};

export const getUserMedications = async (token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const medicationsFromMySQL = await apiGet("/medications/get-medications", token);

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

export const updateMedication = async (id, medicationData, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const response = await apiPut(`/medications/update/${id}`, medicationData, token);

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

  updateMedicationDebounced(user.uid, id, updatedData);

  return response;
};

const updateMedicationDebounced = debounce((userId, id, medicationData) => {
  const medicationPath = `medications/${userId}/${id}`;
  update(ref(database), {
    [medicationPath]: medicationData,
  });
}, 2000);

export const updateMedicationTakenStatus = async (id, doseIndex, taken, token, date) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const response = await apiPut(`/medications/${id}/taken`, { doseIndex, taken, date }, token);

  const medicationPath = `medications/${user.uid}/${id}`;
  await retryWithBackoff(() => update(ref(database), { [medicationPath]: response }));

  if (taken) {
    const historyPath = `medication_history/${user.uid}`;
    const historyEntry = {
      medicationId: id,
      medication_name: response.medication_name,
      doseIndex,
      takenAt: new Date().toISOString(),
      date,
    };
    await push(ref(database, historyPath), historyEntry);
  }

  return response;
};

export const markMedicationAsMissed = async (id, doseIndex, missed, token, date) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const response = await apiPut(`/medications/${id}/missed`, { doseIndex, missed, date }, token);

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

  return response;
};

export const deleteMedication = async (id, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const response = await apiDelete(`/medications/delete/${id}`, token);

  const medicationPath = `medications/${user.uid}/${id}`;
  await retryWithBackoff(() => update(ref(database), { [medicationPath]: null }));

  return response;
};

export const getTakenMedicationHistory = async (limit = 3) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const token = await user.getIdToken(true);
  const response = await apiGet("/medications/get-medications", token);

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
};

export const calculateMedicationStreak = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const token = await user.getIdToken(true);
  const response = await apiGet("/medications/get-medications", token);
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
};

// Fetching drug names from RxNorm API
const drugSearchCache = new Map();
const drugDetailsCache = new Map();

const simplifyDrugName = (name) => {
  let simplified = name;
  let brandName = null;

  const brandMatch = simplified.match(/\[([^\]]+)\]/);
  if (brandMatch) {
    brandName = brandMatch[1];
    simplified = simplified.replace(/\[([^\]]+)\]/, "").trim();
  }

  simplified = simplified
    .replace(/\b(24 HR|12 HR|Extended Release|Immediate Release|Oral|Tablet|Capsule|Solution|Effervescent)\b/gi, "")
    .replace(/\b(Pack|Kit)\b/i, "")
    .trim();

  const dosageMatch = simplified.match(/\d+\s*(MG|G|ML)/gi);
  simplified = simplified.replace(/\d+\s*(MG|G|ML)/gi, "").trim();

  const componentsMatch = simplified.match(/\((.*?)\)/g);
  if (componentsMatch) {
    const components = componentsMatch
      .map((part) => {
        const inner = part.replace(/[\(\)]/g, "");
        const parts = inner.split("/").map((comp) => comp.trim());
        return parts.join(" / ");
      })
      .join(" + ");
    simplified = components;
  } else {
    simplified = simplified.split("/").map((part) => part.trim()).join(" / ");
  }

  simplified = simplified.replace(/\s*\/\s*/g, " / ").replace(/\s+/g, " ").trim();
  if (!simplified) {
    simplified = name.replace(/\[([^\]]+)\]/, "").trim();
  }

  return { simplifiedName: simplified, brandName };
};

const extractDosageFromName = (name) => {
  const dosageMatch = name.match(/\d+\s*(MG|G|ML)/gi);
  return dosageMatch ? dosageMatch.join(" / ") : null;
};

export const getDrugDetails = async (rxcui, fallbackName = "Unknown Drug") => {
  if (drugDetailsCache.has(rxcui)) {
    return drugDetailsCache.get(rxcui);
  }

  try {
    const drugInfo = {
      name: fallbackName,
      brandName: null,
      dosages: [],
      interactions: [],
      usage: "",
      description: "",
      sideEffects: [],
      storage: "",
      missedDose: "",
      foodInteractions: [],
    };

    const propertiesResponse = await fetch(
      `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/allproperties.json`
    );

    if (propertiesResponse.ok) {
      const propertiesData = await propertiesResponse.json();
      if (propertiesData?.propConceptGroup?.propConcept) {
        const props = propertiesData.propConceptGroup.propConcept;
        const rxNormName = props.find((p) => p.propName === "RxNorm Name")?.propValue || fallbackName;
        const { simplifiedName, brandName } = simplifyDrugName(rxNormName);
        drugInfo.name = simplifiedName;
        drugInfo.brandName = brandName;
        drugInfo.description = props.find((p) => p.propName === "DESCRIPTION")?.propValue || "";
      }
    } else {
      console.warn(`Properties not found for RxCUI ${rxcui}: ${propertiesResponse.status}`);
      const { simplifiedName, brandName } = simplifyDrugName(fallbackName);
      drugInfo.name = simplifiedName;
      drugInfo.brandName = brandName;
    }

    const relatedResponse = await fetch(
      `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/allrelated.json`
    );

    if (relatedResponse.ok) {
      const relatedData = await relatedResponse.json();
      if (relatedData?.allRelatedGroup?.conceptGroup) {
        const relatedConcepts = relatedData.allRelatedGroup.conceptGroup
          .filter((group) => group.conceptProperties)
          .flatMap((group) => group.conceptProperties);

        if (!drugInfo.brandName) {
          const bnConcept = relatedConcepts.find((concept) => concept.tty === "BN");
          if (bnConcept) {
            drugInfo.brandName = bnConcept.name;
          }
        }

        const dfDosages = relatedConcepts
          .filter((concept) => concept.tty === "DF" || concept.tty === "DFG")
          .map((concept) => concept.name)
          .filter(Boolean);

        const scdConcepts = relatedConcepts.filter((concept) => concept.tty === "SCD");
        const scdDosages = scdConcepts
          .map((concept) => {
            const dosageMatch = concept.name.match(/\d+\s*(MG|G|ML)/gi);
            return dosageMatch ? dosageMatch.join(" / ") : null;
          })
          .filter(Boolean);

        drugInfo.dosages = [...new Set([...dfDosages, ...scdDosages])];
      }
    } else {
      console.warn(`Related info not found for RxCUI ${rxcui}: ${relatedResponse.status}`);
      drugInfo.dosages = [extractDosageFromName(fallbackName) || "Not specified"].filter(Boolean);
    }

    const interactionResponse = await fetch(
      `https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=${rxcui}`
    );

    if (interactionResponse.ok) {
      const interactionData = await interactionResponse.json();
      if (interactionData?.interactionTypeGroup) {
        drugInfo.interactions = interactionData.interactionTypeGroup
          .flatMap((group) => group.interactionType)
          .flatMap((type) => type.interactionPair)
          .map((pair) => pair.description)
          .filter(Boolean);
      }
    } else {
      console.warn(`Interactions not found for RxCUI ${rxcui}: ${interactionResponse.status}`);
    }

    const apiKey = "WkMLQgXOeQev5LZ35i4bOoNgdtaOgtA4p6jHFvHN";
    const genericNameForOpenFDA = drugInfo.name.toUpperCase();
    let openFDABrandName = drugInfo.brandName;
    let openFDAGenericName = genericNameForOpenFDA;

    const openFDAResponse = await fetch(
      `https://api.fda.gov/drug/label.json?search=openfda.rxcui:${rxcui}&limit=1${apiKey ? `&api_key=${apiKey}` : ""}`
    );

    if (openFDAResponse.ok) {
      const openFDAData = await openFDAResponse.json();
      if (openFDAData.results?.[0]) {
        const result = openFDAData.results[0];

        openFDABrandName = result.openfda?.brand_name?.[0] || drugInfo.brandName || "Unknown Brand";
        openFDAGenericName = result.openfda?.generic_name?.[0] || genericNameForOpenFDA;

        drugInfo.sideEffects = result.adverse_reactions?.[0]
          ? result.adverse_reactions[0].split(/,\s*(?![^\(]*\))/).slice(0, 5)
          : [];

        drugInfo.storage = result.storage_and_handling?.[0] || "Store at room temperature.";

        drugInfo.missedDose = result.dosage_and_administration?.[0]
          ? result.dosage_and_administration[0].match(/missed dose[^.]*\./i)?.[0] ||
            "Consult your doctor for missed dose instructions."
          : "Consult your doctor for missed dose instructions.";

        drugInfo.foodInteractions = result.food_effect?.[0]
          ? result.food_effect[0].split(/,\s*(?![^\(]*\))/)
          : result.drug_interactions?.[0]?.match(/food|alcohol|grapefruit/i)
          ? [result.drug_interactions[0].match(/food|alcohol|grapefruit[^.]*\./i)[0]]
          : [];

        drugInfo.usage = result.dosage_and_administration?.[0] || drugInfo.usage;
      }
    } else {
      console.warn(`OpenFDA data not found for RxCUI ${rxcui}: ${openFDAResponse.status}`);
    }

    const medicationDataForStorage = {
      rxcui: rxcui,
      rxnorm_name: drugInfo.name,
      openfda_generic_name: openFDAGenericName,
      openfda_brand_name: openFDABrandName,
      sideEffects: drugInfo.sideEffects,
      storage: drugInfo.storage,
      missedDose: drugInfo.missedDose,
      foodInteractions: drugInfo.foodInteractions,
      usage: drugInfo.usage,
      dosages: drugInfo.dosages,
      interactions: drugInfo.interactions,
      description: drugInfo.description,
    };

    if (drugDetailsCache.size > 500) {
      drugDetailsCache.clear();
    }
    drugDetailsCache.set(rxcui, medicationDataForStorage);

    return medicationDataForStorage;
  } catch (error) {
    console.error("Error fetching drug details:", error);
    throw new Error("Failed to fetch drug details");
  }
};

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
            const { simplifiedName, brandName } = simplifyDrugName(drug.name);
            const dosage = extractDosageFromName(drug.name) || "Not specified";

            return {
              id: drug.rxcui,
              name: drug.name,
              displayName: brandName || simplifiedName,
              type: group.tty || "Unknown",
              dosage,
              brandName
            };
          })
        )
        .filter((drug, index, self) =>
          index === self.findIndex(d => d.id === drug.id)
        );

      medications.sort((a, b) => {
        if (a.type === "SCD" && b.type !== "SCD") return -1;
        if (a.type !== "SCD" && b.type === "SCD") return 1;
        if (a.type === "BN" && b.type !== "BN") return -1;
        if (a.type !== "BN" && b.type === "BN") return 1;
        return a.displayName.localeCompare(b.displayName);
      });

      medications = medications.slice(0, 10);
    }

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

// Reminders API
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

  const response = await apiPost("/reminders/add", reminderEntry, token);
  if (!response.success) {
    throw new Error(response.message || "Failed to create reminder");
  }

  const reminderId = response.reminder.id.toString();
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

export const getUserReminders = async (token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const response = await apiGet("/reminders/get-reminders", token);
  if (!response.success) {
    throw new Error(response.message || "Failed to fetch reminders from server");
  }
  const remindersFromMySQL = response.reminders || [];

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

  const response = await apiDelete(`/reminders/delete/${reminderId}`, token);
  if (!response.success) {
    throw new Error(response.message || "Failed to delete reminder");
  }

  const reminderPath = `reminders/${user.uid}/${reminderId}`;
  await retryWithBackoff(() => update(ref(database), { [reminderPath]: null }));

  return { success: true, message: response.message };
};

export const updateReminderStatus = async (reminderId, status, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  if (!["pending", "sent"].includes(status)) {
    throw new Error("Status must be 'pending' or 'sent'");
  }

  const response = await apiPut(`/reminders/update/${reminderId}/status`, { status }, token);
  if (!response.success) {
    throw new Error(response.message || "Failed to update reminder status");
  }

  const reminderPath = `reminders/${user.uid}/${reminderId}`;
  await retryWithBackoff(() => update(ref(database), { [reminderPath + "/status"]: status }));

  return response.reminder;
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

  const response = await apiPut(`/reminders/update/${reminderId}`, {
    reminderTime: reminderData.reminderTime,
    date: reminderData.date,
    type: reminderData.type,
    status: reminderData.status || "pending",
  }, token);
  if (!response.success) {
    throw new Error(response.message || "Failed to update reminder");
  }

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

  return response.reminder;
};

export const saveFcmToken = async (token, fcmToken) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  await retryWithBackoff(() =>
    update(ref(database), { [`users/${user.uid}/fcm_token`]: fcmToken })
  );
  return { success: true };
};

// Exercise API
export const createExercise = async (exerciseData, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const exerciseEntry = {
    userId: user.uid,
    activity: exerciseData.activity,
    duration: exerciseData.duration,
    calories_burned: exerciseData.calories_burned,
    date_logged: exerciseData.date_logged,
  };

  const response = await apiPost("/exercises/add", exerciseEntry, token);

  const exerciseId = response.id.toString();
  const exercisePath = `exercises/${user.uid}/${exerciseId}`;
  const firebaseEntry = {
    ...exerciseEntry,
    id: exerciseId,
  };
  await retryWithBackoff(() => update(ref(database), { [exercisePath]: firebaseEntry }));

  return response;
};

export const getUserExercises = async (token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const exercisesFromMySQL = await apiGet("/exercises/get-exercises", token);

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

  const response = await apiPut(`/exercises/update/${id}`, exerciseData, token);
  updateExerciseDebounced(user.uid, id, exerciseData);
  return response;
};

export const deleteExercise = async (id, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const response = await apiDelete(`/exercises/delete/${id}`, token);

  const exercisePath = `exercises/${user.uid}/${id}`;
  await retryWithBackoff(() => update(ref(database), { [exercisePath]: null }));

  return response;
};

export const getExerciseStats = async (token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const stats = await apiGet("/exercises/exercise-stats", token);

  const statsPath = `exercise_stats/${user.uid}`;
  await retryWithBackoff(() => update(ref(database), { [statsPath]: stats }));

  return stats;
};

// Food Diary API
export const createFoodLog = async (foodData, token, onProgress = () => {}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const formData = new FormData();
  formData.append('food_name', foodData.get('food_name'));
  formData.append('calories', parseFloat(foodData.get('calories')) || 0);
  formData.append('carbs', parseFloat(foodData.get('carbs')) || 0);
  formData.append('protein', parseFloat(foodData.get('protein')) || 0);
  formData.append('fats', parseFloat(foodData.get('fats')) || 0);
  formData.append('date_logged', foodData.get('date_logged'));
  formData.append('meal_type', foodData.get('meal_type'));
  if (foodData.get('image')) {
    formData.append('image', foodData.get('image'));
  }

  try {
    const response = await authFetch("/food-logs/add", {
      method: "POST",
      body: formData,
    }, token);

    const foodId = response.id.toString();
    const foodPath = `food_logs/${user.uid}/${foodId}`;
    const firebaseEntry = {
      userId: user.uid,
      food_name: response.food_name,
      calories: response.calories,
      carbs: response.carbs,
      protein: response.protein,
      fats: response.fats,
      image_data: response.image_data || null, // Use image_data from server
      date_logged: response.date_logged,
      meal_type: response.meal_type,
      id: foodId,
    };

    await retryWithBackoff(() => update(ref(database), { [foodPath]: firebaseEntry }));
    return response;
  } catch (error) {
    console.error("Error creating food log:", error);
    throw new Error(error.message || "Failed to create food log");
  }
};


export const getUserFoodLogs = async (token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const response = await authFetch("/food-logs/get-food-logs", {}, token);
  const foodLogsFromMySQL = response;

  const updates = {};
  foodLogsFromMySQL.forEach((foodLog) => {
    const foodPath = `food_logs/${user.uid}/${foodLog.id}`;
    updates[foodPath] = {
      id: foodLog.id.toString(),
      userId: user.uid,
      food_name: foodLog.food_name,
      calories: foodLog.calories,
      carbs: foodLog.carbs,
      protein: foodLog.protein,
      fats: foodLog.fats,
      image_data: foodLog.image_data || null, // Use image_data from server, default to null
      date_logged: foodLog.date_logged,
      meal_type: foodLog.meal_type,
    };
  });
  await retryWithBackoff(() => update(ref(database), updates));

  return foodLogsFromMySQL;
};

const updateFoodLogDebounced = debounce((userId, id, foodData) => {
  const foodPath = `food_logs/${userId}/${id}`;
  update(ref(database), {
    [foodPath]: {
      id,
      userId,
      food_name: foodData.food_name,
      calories: foodData.calories,
      carbs: foodData.carbs,
      protein: foodData.protein,
      fats: foodData.fats,
      image_url: foodData.image_url,
      date_logged: foodData.date_logged,
      meal_type: foodData.meal_type,
    },
  });
}, 500);

export const updateFoodLog = async (id, foodData, imageFile, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const formData = new FormData();
  formData.append('food_name', foodData.food_name);
  formData.append('calories', foodData.calories);
  formData.append('carbs', foodData.carbs);
  formData.append('protein', foodData.protein);
  formData.append('fats', foodData.fats);
  formData.append('date_logged', foodData.date_logged);
  formData.append('meal_type', foodData.meal_type);
  if (imageFile) {
    formData.append('image', imageFile);
  }

  try {
    const response = await authFetch(`/food-logs/update/${id}`, {
      method: "PUT",
      body: formData,
    }, token);

    const foodPath = `food_logs/${user.uid}/${id}`;
    const snapshot = await get(ref(database, foodPath));
    if (snapshot.exists()) {
      const existingData = snapshot.val();
      const hasChanges = JSON.stringify(existingData) !== JSON.stringify({
        ...existingData,
        food_name: response.food_name,
        calories: response.calories,
        carbs: response.carbs,
        protein: response.protein,
        fats: response.fats,
        image_data: response.image_data || null, // Use image_data from server
        date_logged: response.date_logged,
        meal_type: response.meal_type,
      });
      if (hasChanges) {
        updateFoodLogDebounced(user.uid, id, {
          ...response,
          image_data: response.image_data || null,
        });
      }
    }

    return response;
  } catch (error) {
    console.error("Error updating food log:", error);
    throw error;
  }
};

export const deleteFoodLog = async (id, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const response = await authFetch(`/food-logs/delete/${id}`, { method: "DELETE" }, token);

  const foodPath = `food_logs/${user.uid}/${id}`;
  await retryWithBackoff(() => update(ref(database), { [foodPath]: null }));

  return response;
};

export const getFoodStats = async (token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const response = await authFetch("/food-logs/food-stats", {}, token);
  const stats = response;

  const statsPath = `food_stats/${user.uid}`;
  await retryWithBackoff(() => update(ref(database), { [statsPath]: stats }));

  return stats;
};

export const copyFoodLog = async (id, newDate, token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const response = await authFetch(
    "/food-logs/copy",
    {
      method: "POST",
      body: JSON.stringify({ id, newDate }),
    },
    token
  );

  const foodPath = `food_logs/${user.uid}/${response.id}`;
  await retryWithBackoff(() => update(ref(database), { [foodPath]: {
    ...response,
    image_data: response.image_data || null, // Use image_data from server
  }}));

  return response;
};

// USDA API Key
const USDA_API_KEY = "DEMO_KEY";
const searchCache = new Map();

export const searchFoods = async (query) => {
  const cacheKey = query.toLowerCase();
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  const proxyUrl = "https://api.nal.usda.gov/fdc/v1/foods/search";
  const url = `${proxyUrl}?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=10`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const errorText = await response.text();
      throw new Error("Response is not JSON");
    }

    const data = await response.json();
    const results = data.foods.map(food => ({
      food_name: food.description,
      calories: food.foodNutrients.find(n => n.nutrientName === "Energy")?.value || 0,
      carbs: food.foodNutrients.find(n => n.nutrientName === "Carbohydrate, by difference")?.value || 0,
      protein: food.foodNutrients.find(n => n.nutrientName === "Protein")?.value || 0,
      fats: food.foodNutrients.find(n => n.nutrientName === "Total lipid (fat)")?.value || 0,
    }));

    if (searchCache.size > 500) {
      searchCache.clear();
    }
    searchCache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error("Error in searchFoods:", error.message);
    throw error;
  }
};

// K-Means Clustering for Nutritional Patterns
export const clusterEatingPatterns = async (token) => {
  const allUsersLogs = await Promise.all(
    (await getAllUsers(token)).map(async (user) => {
      const userLogs = await getUserFoodLogs(token);
      return {
        userId: user.uid,
        logs: userLogs,
      };
    })
  );

  const userData = allUsersLogs.map(user => {
    const logs = user.logs;
    const totalLogs = logs.length;
    if (totalLogs === 0) return null;

    const avgCalories = logs.reduce((sum, log) => sum + log.calories, 0) / totalLogs;
    const avgCarbs = logs.reduce((sum, log) => sum + (log.carbs || 0), 0) / totalLogs;
    const avgProtein = logs.reduce((sum, log) => sum + (log.protein || 0), 0) / totalLogs;
    const avgFats = logs.reduce((sum, log) => sum + (log.fats || 0), 0) / totalLogs;

    return {
      userId: user.userId,
      features: [avgCalories, avgCarbs, avgProtein, avgFats],
    };
  }).filter(data => data !== null);

  const k = 3; // Number of clusters
  const centroids = [];
  const featureVectors = userData.map(d => d.features);

  // Initialize centroids randomly
  for (let i = 0; i < k; i++) {
    centroids.push(featureVectors[Math.floor(Math.random() * featureVectors.length)]);
  }

  // K-Means clustering
  let clusters = new Array(featureVectors.length).fill(0);
  let changed = true;
  const maxIterations = 100;
  let iteration = 0;

  while (changed && iteration < maxIterations) {
    changed = false;
    const newClusters = [];

    // Assign points to nearest centroid
    for (let i = 0; i < featureVectors.length; i++) {
      let minDist = Infinity;
      let cluster = 0;

      for (let j = 0; j < k; j++) {
        const dist = Math.sqrt(
          featureVectors[i].reduce((sum, val, idx) => sum + Math.pow(val - centroids[j][idx], 2), 0)
        );
        if (dist < minDist) {
          minDist = dist;
          cluster = j;
        }
      }

      newClusters[i] = cluster;
      if (newClusters[i] !== clusters[i]) {
        changed = true;
      }
    }

    clusters = newClusters;

    // Update centroids
    for (let j = 0; j < k; j++) {
      const clusterPoints = featureVectors.filter((_, idx) => clusters[idx] === j);
      if (clusterPoints.length > 0) {
        const newCentroid = [];
        for (let d = 0; d < 4; d++) {
          const avg = clusterPoints.reduce((sum, point) => sum + point[d], 0) / clusterPoints.length;
          newCentroid[d] = avg;
        }
        centroids[j] = newCentroid;
      }
    }

    iteration++;
  }

  const clusterLabels = [
    "Balanced Eater",
    "High Carb Eater",
    "High Protein Eater",
  ];

  const userClusters = userData.map((data, idx) => ({
    userId: data.userId,
    cluster: clusterLabels[clusters[idx]] || "Unknown",
  }));

  return userClusters;
};

export const predictCaloricIntake = async (token) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  try {
    const response = await authFetch("/food-logs/predict-calories", {}, token);
    const predictions = response;

    const predictionsPath = `calorie_predictions/${user.uid}`;
    await retryWithBackoff(() => update(ref(database), { [predictionsPath]: predictions }));

    return predictions;
  } catch (error) {
    console.error("Error predicting caloric intake:", error);
    throw new Error(error.message || "Failed to predict caloric intake");
  }
};

// Helper to validate and normalize response
const normalizeResponse = (response, resourceKey) => {
  if (!response || typeof response !== "object") {
    console.error(`Invalid ${resourceKey} response:`, response);
    return { [resourceKey]: [], total: 0, page: 1, pageSize: 10 };
  }
  return {
    [resourceKey]: Array.isArray(response.data) ? response.data : [],
    total: response.total || 0,
    page: response.page || 1,
    pageSize: response.pageSize || 10,
  };
};

// Admin APIs
export const getAllAdminUsers = async (token, limit, page, sortConfig = { key: "", direction: "asc" }) => {
  const response = await apiGet(
    `/admin/users?page=${page}&pageSize=${limit}&sortKey=${sortConfig.key}&sortDirection=${sortConfig.direction}`,
    token
  );
  return normalizeResponse(response, "users");
};

export const searchAdminUsers = async (query, token, limit, page, sortConfig = { key: "", direction: "asc" }) => {
  if (!query || query.length < 2) throw new Error("Query must be at least 2 characters long");
  const response = await apiGet(
    `/admin/users/search?query=${encodeURIComponent(query)}&page=${page}&pageSize=${limit}&sortKey=${sortConfig.key}&sortDirection=${sortConfig.direction}`,
    token
  );
  return normalizeResponse(response, "users");
};

export const deleteSelectedAdminUsers = async (uids, token) => {
  if (!Array.isArray(uids) || uids.length === 0) throw new Error("Invalid or empty UIDs array");
  return apiPost("/admin/users/delete", { uids }, token);
};

export const getAllAdminMedications = async (token, limit, page, sortConfig = { key: "", direction: "asc" }) => {
  const response = await apiGet(
    `/admin/medications?page=${page}&pageSize=${limit}&sortKey=${sortConfig.key}&sortDirection=${sortConfig.direction}`,
    token
  );
  return normalizeResponse(response, "medications");
};

export const searchAdminMedications = async (query, token, limit, page, sortConfig = { key: "", direction: "asc" }) => {
  if (!query || query.length < 2) throw new Error("Query must be at least 2 characters long");
  const response = await apiGet(
    `/admin/medications/search?query=${encodeURIComponent(query)}&page=${page}&pageSize=${limit}&sortKey=${sortConfig.key}&sortDirection=${sortConfig.direction}`,
    token
  );
  return normalizeResponse(response, "medications");
};

export const getAdminMedicationAdherence = async (token) => {
  return apiGet("/admin/medications/adherence", token);
};

export const deleteSelectedAdminMedications = async (ids, token) => {
  if (!Array.isArray(ids) || ids.length === 0) throw new Error("Invalid or empty IDs array");
  return apiPost("/admin/medications/delete", { ids }, token);
};

export const getAllAdminReminders = async (token, limit, page, sortConfig = { key: "", direction: "asc" }) => {
  const response = await apiGet(
    `/admin/reminders?page=${page}&pageSize=${limit}&sortKey=${sortConfig.key}&sortDirection=${sortConfig.direction}`,
    token
  );
  return normalizeResponse(response, "reminders");
};

export const searchAdminReminders = async (query, token, limit, page, sortConfig = { key: "", direction: "asc" }) => {
  if (!query || query.length < 2) throw new Error("Query must be at least 2 characters long");
  const response = await apiGet(
    `/admin/reminders/search?query=${encodeURIComponent(query)}&page=${page}&pageSize=${limit}&sortKey=${sortConfig.key}&sortDirection=${sortConfig.direction}`,
    token
  );
  return normalizeResponse(response, "reminders");
};

export const updateAdminReminderStatus = async (reminderId, status, token) => {
  if (!["pending", "sent"].includes(status)) throw new Error("Status must be 'pending' or 'sent'");
  return apiPut(`/admin/reminders/${reminderId}/status`, { status }, token);
};

export const deleteSelectedAdminReminders = async (ids, token) => {
  if (!Array.isArray(ids) || ids.length === 0) throw new Error("Invalid or empty IDs array");
  return apiPost("/admin/reminders/delete", { ids }, token);
};

export const getAllAdminFoodLogs = async (token, limit, page, sortConfig = { key: "", direction: "asc" }) => {
  const response = await apiGet(
    `/admin/food-logs?page=${page}&pageSize=${limit}&sortKey=${sortConfig.key}&sortDirection=${sortConfig.direction}`,
    token
  );
  return normalizeResponse(response, "foodLogs");
};

export const searchAdminFoodLogs = async (query, token, limit, page, sortConfig = { key: "", direction: "asc" }) => {
  if (!query || query.length < 2) throw new Error("Query must be at least 2 characters long");
  const response = await apiGet(
    `/admin/food-logs/search?query=${encodeURIComponent(query)}&page=${page}&pageSize=${limit}&sortKey=${sortConfig.key}&sortDirection=${sortConfig.direction}`,
    token
  );
  return normalizeResponse(response, "foodLogs");
};

export const getAdminFoodStats = async (token) => {
  return apiGet("/admin/food-logs/stats", token);
};

export const deleteSelectedAdminFoodLogs = async (ids, token) => {
  if (!Array.isArray(ids) || ids.length === 0) throw new Error("Invalid or empty IDs array");
  return apiPost("/admin/food-logs/delete", { ids }, token);
};

export const getAllAdminExercises = async (token, limit, page, sortConfig = { key: "", direction: "asc" }) => {
  const response = await apiGet(
    `/admin/exercises?page=${page}&pageSize=${limit}&sortKey=${sortConfig.key}&sortDirection=${sortConfig.direction}`,
    token
  );
  return normalizeResponse(response, "exercises");
};

export const getAdminExerciseStats = async (token) => {
  return apiGet("/admin/exercises/stats", token);
};

export const searchAdminExercises = async (query, token, limit, page, sortConfig = { key: "", direction: "asc" }) => {
  if (!query || query.length < 2) throw new Error("Query must be at least 2 characters long");
  const response = await apiGet(
    `/admin/exercises/search?query=${encodeURIComponent(query)}&page=${page}&pageSize=${limit}&sortKey=${sortConfig.key}&sortDirection=${sortConfig.direction}`,
    token
  );
  return normalizeResponse(response, "exercises");
};

export const deleteSelectedAdminExercises = async (ids, token) => {
  if (!Array.isArray(ids) || ids.length === 0) throw new Error("Invalid or empty IDs array");
  return apiPost("/admin/exercises/delete", { ids }, token);
};

export const getAdminSystemSettings = async (token, limit, page, sortConfig = { key: "", direction: "asc" }) => {
  const response = await apiGet(
    `/admin/settings?page=${page}&pageSize=${limit}&sortKey=${sortConfig.key}&sortDirection=${sortConfig.direction}`,
    token
  );
  return normalizeResponse(response, "settings");
};

export const searchAdminSystemSettings = async (query, token, limit, page, sortConfig = { key: "", direction: "asc" }) => {
  if (!query || query.length < 2) throw new Error("Query must be at least 2 characters long");
  const response = await apiGet(
    `/admin/settings/search?query=${encodeURIComponent(query)}&page=${page}&pageSize=${limit}&sortKey=${sortConfig.key}&sortDirection=${sortConfig.direction}`,
    token
  );
  return normalizeResponse(response, "settings");
};

export const updateAdminSystemSettings = async (settingKey, settingValue, token) => {
  return apiPut("/admin/settings", { settingKey, settingValue }, token);
};

export const deleteAdminSetting = async (settingKey, token) => {
  return apiDelete(`/admin/settings/${encodeURIComponent(settingKey)}`, token);
};

export const deleteSelectedAdminSettings = async (settingKeys, token) => {
  if (!Array.isArray(settingKeys) || settingKeys.length === 0) throw new Error("Invalid or empty setting keys array");
  return apiPost("/admin/settings/delete", { settingKeys }, token);
};

export const getAdminUserActivityTrends = async (token) => {
  return apiGet("/admin/analytics/user-activity", token);
};

export const exportAdminData = async (table, token) => {
  const validTables = ["users", "medications", "reminders", "food_logs", "exercises"];
  if (!validTables.includes(table)) throw new Error("Invalid table name");
  const response = await api.get(`/admin/export/${table}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/csv",
    },
    responseType: 'text',
  });
  return response.data;
};

export const getAdminAuditLogs = async (token, limit, page, sortConfig = { key: "", direction: "asc" }, query = "") => {
  const url = query
    ? `/admin/audit-logs?page=${page}&pageSize=${limit}&sortKey=${sortConfig.key}&sortDirection=${sortConfig.direction}&query=${encodeURIComponent(query)}`
    : `/admin/audit-logs?page=${page}&pageSize=${limit}&sortKey=${sortConfig.key}&sortDirection=${sortConfig.direction}`;
  const response = await apiGet(url, token);
  return normalizeResponse(response, "logs");
};