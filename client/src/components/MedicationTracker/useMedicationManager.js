import { useReducer, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import { auth } from '../../firebase/config';
import {
  createMedication,
  getUserMedications,
  updateMedicationTakenStatus,
  markMedicationAsMissed,
  deleteMedication as apiDeleteMedication,
} from '../../services/api';

// Reducer for medication state management
const medicationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ACTION_LOADING':
      return { ...state, actionLoading: action.payload };
    case 'SET_MEDICATIONS':
      return {
        ...state,
        medications: action.payload.map(med => normalizeMedication(med)),
        loading: false,
      };
    case 'SET_REMINDERS':
      return { ...state, reminders: action.payload, loading: false };
    case 'SET_MEDICATION_HISTORY':
      return { ...state, medicationHistory: action.payload };
    case 'ADD_MEDICATION':
      return {
        ...state,
        medications: [normalizeMedication(action.payload), ...state.medications],
      };
    case 'UPDATE_MEDICATION':
      return {
        ...state,
        medications: state.medications.map(med =>
          med.id === action.payload.id ? normalizeMedication(action.payload) : med
        ),
      };
    case 'DELETE_MEDICATION':
      return {
        ...state,
        medications: state.medications.filter(med => med.id !== action.payload),
      };
    case 'UPDATE_DOSE_STATUS':
      return {
        ...state,
        medications: state.medications.map(med =>
          med.id === action.medicationId
            ? updateMedicationDoses(med, action.doseIndex, action.taken, action.dateKey, action.takenAt)
            : med
        ),
      };
    case 'MARK_DOSE_MISSED':
      return {
        ...state,
        medications: state.medications.map(med =>
          med.id === action.medicationId
            ? updateMedicationDoses(med, action.doseIndex, false, action.dateKey, null, true)
            : med
        ),
      };
    case 'SET_SELECTED_MEDICATION':
      return { ...state, selectedMedication: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false, actionLoading: false };
    default:
      return state;
  }
};

// Helper function to normalize medication data structure
const normalizeMedication = (med) => {
  if (!med) return null;
  const normalizedDoses = {};
  if (med.doses) {
    Object.entries(med.doses).forEach(([dateKey, doses]) => {
      normalizedDoses[dateKey] = doses.map((dose, index) => ({
        time: dose.time,
        taken: Boolean(dose.taken),
        missed: Boolean(dose.missed),
        takenAt: dose.takenAt || null,
        doseIndex: dose.doseIndex !== undefined ? dose.doseIndex : index,
      }));
    });
  }
  return {
    ...med,
    doses: normalizedDoses,
    times: med.times || [],
  };
};

// Helper function to update medication doses
const updateMedicationDoses = (med, doseIndex, taken, dateKey, takenAt = null, missed = false) => {
  const updatedDoses = { ...med.doses };
  if (!updatedDoses[dateKey]) {
    updatedDoses[dateKey] = med.times.map((time, index) => ({
      time,
      taken: false,
      missed: false,
      takenAt: null,
      doseIndex: index,
    }));
  }
  updatedDoses[dateKey] = updatedDoses[dateKey].map(dose =>
    dose.doseIndex === doseIndex
      ? {
          ...dose,
          taken,
          missed,
          takenAt: taken ? (takenAt || new Date().toISOString()) : null,
        }
      : dose
  );
  return { ...med, doses: updatedDoses };
};

// Custom hook for medication management
export const useMedicationManager = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { socket } = useSocket();

  const initialState = {
    medications: [],
    reminders: [],
    medicationHistory: [],
    selectedMedication: null,
    loading: true,
    actionLoading: false,
    error: null,
  };

  const [state, dispatch] = useReducer(medicationReducer, initialState);

  // Session management
  const handleSessionExpired = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const getUserToken = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');
    return await auth.currentUser.getIdToken(true);
  }, [user]);

  // Error handler
  const handleError = useCallback((error, context = '') => {
    console.error(`Error in ${context}:`, error);
    if (error.code === 'auth/id-token-expired') {
      handleSessionExpired();
    } else {
      const errorMessage = error.response?.data?.error || error.message || `Failed to ${context}`;
      toast.error(errorMessage);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [handleSessionExpired]);

  // Fetch medications
  const fetchMedications = useCallback(async () => {
    if (!user) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const token = await getUserToken();
      const meds = await getUserMedications(token);
      const uniqueMeds = Array.from(
        new Map(
          meds.map(med => [
            `${med.medication_name}-${med.dosage}-${med.times_per_day}-${med.frequency}`,
            med,
          ])
        ).values()
      );
      dispatch({ type: 'SET_MEDICATIONS', payload: uniqueMeds });
    } catch (error) {
      handleError(error, 'fetch medications');
    }
  }, [user, getUserToken, handleError]);

  const fetchReminders = useCallback(async () => {
    // Handled by useReminderManager, but included here for reducer state
  }, []);

  // Add medication
  const addMedication = useCallback(async (medicationData, doseTimes) => {
    if (!user) {
      handleSessionExpired();
      return null;
    }
    dispatch({ type: 'SET_ACTION_LOADING', payload: true });
    try {
      const token = await getUserToken();
      const formattedTimes = doseTimes.map(dose => {
        let time = dose.time;
        if (time.split(':').length === 2) {
          time += ':00';
        }
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(time)) {
          throw new Error(`Invalid time format: ${time}`);
        }
        return time;
      });

      const payload = {
        ...medicationData,
        times: formattedTimes,
        doses: {},
      };

      const createdMedication = await createMedication(payload, token);
      if (!createdMedication) {
        throw new Error('Failed to create medication');
      }

      dispatch({ type: 'ADD_MEDICATION', payload: createdMedication });
      toast.success('Medication added successfully');
      return createdMedication;
    } catch (error) {
      handleError(error, 'add medication');
      throw error;
    } finally {
      dispatch({ type: 'SET_ACTION_LOADING', payload: false });
    }
  }, [user, getUserToken, handleError, handleSessionExpired]);

  // Update dose status
  const updateDoseStatus = useCallback(async (medicationId, doseIndex, taken, selectedDate) => {
    dispatch({ type: 'SET_ACTION_LOADING', payload: true });
    try {
      const token = await getUserToken();
      const dateKey = moment(selectedDate).format('YYYY-MM-DD');
      const med = state.medications.find(m => m.id === medicationId);
      if (!med) throw new Error('Medication not found');
      const dose = med.doses?.[dateKey]?.find(d => d.doseIndex === doseIndex);
      if (!dose) throw new Error('Dose not found');

      if (taken) {
        const doseDateTime = moment(`${dateKey} ${dose.time}`, 'YYYY-MM-DD HH:mm:ss');
        const now = moment().local();
        const hoursDiff = Math.abs(doseDateTime.diff(now, 'hours', true));
        if (hoursDiff > 2) {
          throw new Error('Can only mark medication as taken within 2 hours of the scheduled time');
        }
      }

      const response = await updateMedicationTakenStatus(medicationId, doseIndex, taken, token, dateKey);
      if (!response) throw new Error('Failed to update medication status');

      dispatch({
        type: 'UPDATE_DOSE_STATUS',
        medicationId,
        doseIndex,
        taken,
        dateKey,
        takenAt: taken ? new Date().toISOString() : null,
      });

      if (socket) {
        socket.emit('medicationUpdated', response);
      }

      toast.success(taken ? 'Dose marked as taken' : 'Dose status undone');
      updateMedicationHistory();
      return response;
    } catch (error) {
      handleError(error, 'update dose status');
      throw error;
    } finally {
      dispatch({ type: 'SET_ACTION_LOADING', payload: false });
    }
  }, [getUserToken, handleError, state.medications, socket, updateMedicationHistory]);

  // Delete medication
  const removeMedication = useCallback(async (medicationId) => {
    dispatch({ type: 'SET_ACTION_LOADING', payload: true });
    try {
      const token = await getUserToken();
      await apiDeleteMedication(medicationId, token);
      dispatch({ type: 'DELETE_MEDICATION', payload: medicationId });
      toast.success('Medication deleted successfully');
    } catch (error) {
      handleError(error, 'delete medication');
      throw error;
    } finally {
      dispatch({ type: 'SET_ACTION_LOADING', payload: false });
    }
  }, [getUserToken, handleError]);

  // Mark doses as missed
  const markDosesAsMissed = useCallback(async () => {
    if (!user) return;
    const now = moment().local();
    const dateKey = moment().format('YYYY-MM-DD');
    try {
      const token = await getUserToken();
      for (const med of state.medications) {
        const doses = med.doses?.[dateKey] || [];
        if (!doses.length) continue;

        for (const dose of doses) {
          const [hours, minutes] = dose.time.split(':').map(Number);
          const doseDateTime = moment()
            .set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
          const windowEnd = moment(doseDateTime).add(2, 'hours');

          if (now.isAfter(windowEnd) && !dose.taken && !dose.missed) {
            try {
              await markMedicationAsMissed(med.id, dose.doseIndex, true, token, dateKey);
              dispatch({
                type: 'MARK_DOSE_MISSED',
                medicationId: med.id,
                doseIndex: dose.doseIndex,
                dateKey,
              });
            } catch (error) {
              console.error(`Failed to mark dose as missed for medication ${med.id}:`, error);
            }
          }
        }
      }
    } catch (error) {
      handleError(error, 'mark doses as missed');
    }
  }, [user, getUserToken, handleError, state.medications]);

  // Update medication history
  const updateMedicationHistory = useCallback(() => {
    const history = [];
    state.medications.forEach((med) => {
      Object.entries(med.doses || {}).forEach(([date, doses]) => {
        doses.forEach((dose) => {
          history.push({
            medication_name: med.medication_name,
            dosage: med.dosage,
            date,
            time: dose.time,
            doseIndex: dose.doseIndex,
            status: dose.taken ? 'Taken' : dose.missed ? 'Missed' : 'Pending',
          });
        });
      });
    });
    dispatch({ type: 'SET_MEDICATION_HISTORY', payload: history });
  }, [state.medications]);

  return {
    ...state,
    fetchMedications,
    fetchReminders,
    addMedication,
    updateDoseStatus,
    deleteMedication: removeMedication,
    markDosesAsMissed,
    updateMedicationHistory,
    setSelectedMedication: (medication) => dispatch({ type: 'SET_SELECTED_MEDICATION', payload: medication }),
  };
};