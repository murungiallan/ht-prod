import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import {
  createMedication,
  getUserMedications,
  updateMedicationTakenStatus,
  markMedicationAsMissed,
  getUserReminders,
  createReminder,
  updateReminderStatus,
  deleteReminder,
  updateReminder,
  saveFcmToken,
  deleteMedication,
  searchDrugsByName,
  getDrugDetails,
} from "../../services/api";
import { auth, messaging, getToken, onMessage } from "../../firebase/config";
import { toast } from "react-toastify";
import { WiDaySunnyOvercast, WiDaySunny, WiDayWindy } from "react-icons/wi";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../contexts/SocketContext";
import Modal from "react-modal";
import React from "react";
import { debounce } from "lodash";
import { Input } from "./styles";

// Import Components
import Header from "./Header";
import CalendarSection from "./CalendarSection";
import TimeOfDaySection from "./TimeOfDaySection";
import MedicationList from "./MedicationList";
import RemindersSection from "./RemindersSection";
import HistorySection from "./HistorySection";
import AddMedicationModal from "./Modals/AddMedicationModal";
import MedicationDetailModal from "./Modals/MedicationDetailModal";
import DailyChecklistModal from "./Modals/DailyChecklistModal";
import ConfirmModal from "./Modals/ConfirmModal";
import DeleteConfirmModal from "./Modals/DeleteConfirmModal";
import AllRemindersModal from "./Modals/AllRemindersModal";
import SetReminderModal from "./Modals/SetReminderModal";
import AddReminderPromptModal from "./Modals/AddReminderPromptModal";
import EditReminderModal from "./Modals/EditReminderModal";
import TakeMedicationModal from "./Modals/TakeMedicationModal";
import UndoTakenMedicationModal from "./Modals/UndoTakenMedicationModal";
import { moment } from "./utils/utils";

Modal.setAppElement("#root");

const ITEMS_PER_PAGE = 5;

const MedicationTracker = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { socket } = useSocket();

  const getUserToken = async () => {
    return await auth.currentUser.getIdToken(true);
  };

  // State Management
  const [medications, setMedications] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [medicationHistory, setMedicationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filteredDrugs, setFilteredDrugs] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showAllRemindersModal, setShowAllRemindersModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(null);
  const [showAddReminderPrompt, setShowAddReminderPrompt] = useState(null);
  const [editReminderModal, setEditReminderModal] = useState(null);
  const [showTakeModal, setShowTakeModal] = useState(null);
  const [showUndoModal, setShowUndoModal] = useState(null);

  // Form States
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [dosage, setDosage] = useState("");
  const [timesPerDay, setTimesPerDay] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [isRecurringReminder, setIsRecurringReminder] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [drugInfo, setDrugInfo] = useState({ interactions: [], dosages: [], usage: "", description: "" });
  const [drugInfoLoading, setDrugInfoLoading] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [medicationToDelete, setMedicationToDelete] = useState(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState({
    medications: 1,
    reminders: 1,
    history: 1,
    allReminders: 1,
  });

  // Centralized session expiration handler
  const handleSessionExpired = useCallback(() => {
    toast.error("Your session has expired. Please log in again.");
    logout();
    navigate("/login");
  }, [logout, navigate]);

  // Utility Functions
  const isPastDate = (date) => moment(date).isBefore(moment(), "day");
  const isFutureDate = (date) => moment(date).isAfter(moment(), "day");

  const getDoseStatus = useCallback((med, doseIndex) => {
    const dateKey = moment(selectedDate).format("YYYY-MM-DD");
    const doses = med.doses?.[dateKey] || med.times.map((time) => ({
      time,
      taken: false,
      missed: false,
      takenAt: null,
    }));
    const dose = doses[doseIndex];
    if (!dose) {
      return { isTaken: false, isMissed: false, isTimeToTake: false, isWithinWindow: false };
    }
  
    const isTaken = dose.taken;
    const isMissed = dose.missed;
    const [hours, minutes] = dose.time.split(":").map(Number);
    const doseDateTime = moment(med.selectedDate)
      .utcOffset("+08:00")
      .set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
  
    const now = moment();
  
    // Defining the 1-hour window
    const windowStart = moment(doseDateTime).subtract(1, "hour");
    const windowEnd = moment(doseDateTime).add(1, "hour");
    const isWithinWindow = now.isBetween(windowStart, windowEnd, undefined, "[]"); // Inclusive
    const isTimeToTake = now.isSameOrAfter(doseDateTime);
  
    return { isTaken, isMissed, isTimeToTake, isWithinWindow };
  }, [selectedDate]);

  const confirmTakenStatus = (medicationId, doseIndex, taken) => {
    setConfirmMessage(
      taken
        ? `Are you sure you want to mark this dose as taken?`
        : `Not yet taken your medication?`
    );
    setConfirmAction(() => () => handleUpdateTakenStatus(medicationId, doseIndex, taken));
    setShowConfirmModal(true);
  };

  const calculateDoseStatus = (med) => {
    const dateKey = moment(selectedDate).format("YYYY-MM-DD");
    const doses = med.doses?.[dateKey] || med.times.map((time) => ({
      time,
      taken: false,
      missed: false,
      takenAt: null,
    }));
    const totalDoses = doses.length;
    const takenDoses = doses.filter((dose) => dose.taken).length;
    const missedDoses = doses.filter((dose) => dose.missed).length;
    return { totalDoses, takenDoses, missedDoses };
  };

  const calculateProgress = () => {
    if (!selectedMedication) return 0;
    const start = moment(selectedMedication.start_date);
    const end = moment(selectedMedication.end_date);
    const totalDays = end.diff(start, "days") + 1;
    const daysPassed = moment().diff(start, "days");
    return Math.min(100, Math.round((daysPassed / totalDays) * 100));
  };

  const calculateDaysRemaining = () => {
    if (!selectedMedication) return 0;
    const end = moment(selectedMedication.end_date);
    const today = moment();
    return Math.max(0, end.diff(today, "days"));
  };

  const handleDrugSearch = async (query) => {
    setName(query);
    if (query.length < 2) {
      setFilteredDrugs([]);
      setShowDropdown(false);
      return;
    }

    try {
      const drugs = await searchDrugsByName(query);
      const filtered = drugs.filter(
        (drug) =>
          drug.displayName.toLowerCase().includes(query.toLowerCase()) ||
          drug.synonym.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredDrugs(filtered);
      setShowDropdown(true);
    } catch (error) {
      console.error("Error searching drugs:", error);
      setFilteredDrugs([]);
      setShowDropdown(false);
    }
  };

  const handleDrugSelect = (drug) => {
    setName(drug.displayName);
    setShowDropdown(false);
  };

  const fetchMedications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const token = await getUserToken();
      const meds = await getUserMedications(token);

      // Remove duplicates based on medication_name, dosage, times_per_day, and frequency
      const uniqueMeds = Array.from(
        new Map(
          meds.map((med) => [
            `${med.medication_name}-${med.dosage}-${med.times_per_day}-${med.frequency}`,
            med,
          ])
        ).values()
      );

      setMedications(uniqueMeds);
    } catch (err) {
      console.error("Error fetching medications:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to fetch medications");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReminders = async () => {
    if (!user) return;
    try {
      const token = await getUserToken();
      const userReminders = await getUserReminders(token);
      setReminders(userReminders);
    } catch (err) {
      console.error("Error fetching reminders:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to fetch reminders");
      }
    }
  };

  const handleAddMedication = async (e, doseTimes = []) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to add a medication");
      logout();
      navigate("/login");
      return;
    }
    if (!name || !frequency || !dosage || !timesPerDay || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setActionLoading(true);
    try {
      const token = await getUserToken();
      // Convert doseTimes to the required format (HH:mm:ss)
      const formattedTimes = doseTimes.map((dose) => {
        const [hours, minutes] = dose.time.split(":");
        return `${hours}:${minutes}:00`;
      });

      const medicationData = {
        medication_name: name,
        frequency,
        dosage,
        times_per_day: parseInt(timesPerDay),
        start_date: startDate,
        end_date: endDate,
        notes,
        times: formattedTimes.length === parseInt(timesPerDay) ? formattedTimes : Array.from({ length: parseInt(timesPerDay) }, () => "08:00:00"),
        doses: {},
      };
      const createdMedication = await createMedication(medicationData, token);
      setMedications((prev) => [createdMedication, ...prev]);
      toast.success("Medication added successfully");
      setShowAddModal(false);
      setName("");
      setFrequency("daily");
      setDosage("");
      setTimesPerDay("1");
      setStartDate("");
      setEndDate("");
      setNotes("");
      return createdMedication;
    } catch (err) {
      console.error("Error adding medication:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to add medication");
      }
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const onMedicationAdded = (data) => {
    setSelectedMedication(data);
    setDrugInfo(data.drugInfo || { interactions: [], dosages: [], usage: "", description: "" });
    setShowDetailModal(true);
  };

  const openMedicationDetail = async (med) => {
    setSelectedMedication(med);
    setDrugInfoLoading(true);
    try {
      const drugs = await searchDrugsByName(med.medication_name);
      const selectedDrug = drugs.find((drug) => drug.name.toLowerCase() === med.medication_name.toLowerCase());
      if (selectedDrug) {
        const drugInfo = await getDrugDetails(selectedDrug.id, selectedDrug.displayName);
        setDrugInfo(drugInfo);
      } else {
        setDrugInfo({ interactions: [], dosages: [], usage: "", description: "No details available" });
      }
    } catch (error) {
      console.error("Error fetching drug details:", error);
      setDrugInfo({ interactions: [], dosages: [], usage: "", description: "Failed to fetch details" });
    } finally {
      setDrugInfoLoading(false);
      setShowDetailModal(true);
    }
  };

  const handleUpdateTakenStatus = async (medicationId, doseIndex, taken) => {
    setActionLoading(true);
    try {
      const token = await getUserToken();
      const dateKey = moment(selectedDate).format("YYYY-MM-DD");
      const updatedMedication = await updateMedicationTakenStatus(medicationId, doseIndex, taken, token, dateKey);
      if (!taken) {
        await markMedicationAsMissed(medicationId, doseIndex, false, token, dateKey);
      }
      setMedications((prev) =>
        prev.map((med) => (med.id === updatedMedication.id ? updatedMedication : med))
      );
      if (socket) {
        socket.emit("medicationUpdated", updatedMedication);
      }
      toast.success(taken ? "Dose marked as taken" : "Dose status undone");
      setShowConfirmModal(false);

      if (taken) {
        const med = medications.find((m) => m.id === medicationId);
        setShowAddReminderPrompt({
          medication: med,
          doseIndex,
          suggestedDate: dateKey,
        });
      }

      await updateMedicationHistory();
    } catch (err) {
      console.error("Error updating taken status:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to update dose status");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetReminder = async (e, medicationId, doseIndex) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = await getUserToken();
      const reminderData = {
        medicationId,
        doseIndex,
        reminderTime,
        date: moment(selectedDate).format("YYYY-MM-DD"),
        type: isRecurringReminder ? "recurring" : "single",
      };
      const createdReminder = await createReminder(reminderData, token);
      setReminders((prev) => [createdReminder, ...prev]);
      toast.success("Reminder set successfully");
      setShowReminderModal(null);
      setReminderTime("");
      setIsRecurringReminder(false);
    } catch (err) {
      console.error("Error setting reminder:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to set reminder");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkReminderAsSent = async (reminderId) => {
    setActionLoading(true);
    try {
      const token = await getUserToken();
      const updatedReminder = await updateReminderStatus(reminderId, "sent", token);
      setReminders((prev) =>
        prev.map((reminder) =>
          reminder.id === reminderId ? { ...reminder, status: "sent" } : reminder
        )
      );
      toast.success("Reminder marked as sent");
    } catch (err) {
      console.error("Error marking reminder as sent:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to mark reminder as sent");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    setActionLoading(true);
    try {
      const token = await getUserToken();
      await deleteReminder(reminderId, token);
      setReminders((prev) => prev.filter((reminder) => reminder.id !== reminderId));
      toast.success("Reminder deleted successfully");
    } catch (err) {
      console.error("Error deleting reminder:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to delete reminder");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateReminder = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = await getUserToken();
      const reminderData = {
        reminderTime,
        date: moment(selectedDate).format("YYYY-MM-DD"),
        type: isRecurringReminder ? "recurring" : "single",
        medicationId: editReminderModal.medicationId,
        doseIndex: editReminderModal.doseIndex,
        status: editReminderModal.status || "pending",
        createdAt: editReminderModal.createdAt || new Date().toISOString(),
      };
      const updatedReminder = await updateReminder(editReminderModal.id, reminderData, token);
      setReminders((prev) =>
        prev.map((reminder) =>
          reminder.id === editReminderModal.id ? { ...reminder, ...reminderData } : reminder
        )
      );
      toast.success("Reminder updated successfully");
      setEditReminderModal(null);
      setReminderTime("");
      setIsRecurringReminder(false);
    } catch (err) {
      console.error("Error updating reminder:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to update reminder");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDeleteMedication = (medicationId) => {
    setMedicationToDelete(medicationId);
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteMedication = async () => {
    setActionLoading(true);
    try {
      const token = await getUserToken();
      await deleteMedication(medicationToDelete, token);
      setMedications((prev) => prev.filter((med) => med.id !== medicationToDelete));
      if (selectedMedication?.id === medicationToDelete) {
        setShowDetailModal(false);
      }
      toast.success("Medication deleted successfully");
      setShowDeleteConfirmModal(false);
      setMedicationToDelete(null);
      await updateMedicationHistory();
    } catch (err) {
      console.error("Error deleting medication:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        toast.error("Failed to delete medication");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const updateMedicationHistory = async () => {
    const history = [];
    medications.forEach((med) => {
      Object.entries(med.doses || {}).forEach(([date, doses]) => {
        doses.forEach((dose, index) => {
          history.push({
            medication_name: med.medication_name,
            dosage: med.dosage,
            date,
            time: dose.time,
            status: dose.taken ? "Taken" : dose.missed ? "Missed" : "Pending",
          });
        });
      });
    });
    setMedicationHistory(history);
  };

  const checkAndMarkMissedDoses = useCallback(async () => {
    if (!user) return;
  
    const now = moment();
    const dateKey = moment(selectedDate).format("YYYY-MM-DD");
    const token = await getUserToken();
  
    for (const med of medications) {
      const doses = med.doses?.[dateKey] || med.times.map((time) => ({
        time,
        taken: false,
        missed: false,
        takenAt: null,
      }));
  
      for (let doseIndex = 0; doseIndex < doses.length; doseIndex++) {
        const dose = doses[doseIndex];
        const [hours, minutes] = dose.time.split(":").map(Number);
        const doseDateTime = moment(med.selectedDate)
          .utcOffset("+08:00")
          .set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
        const windowEnd = moment(doseDateTime).add(1, "hour");
  
        // If the 1-hour window has passed, the dose isn't taken, and it hasn't been marked as missed
        if (now.isAfter(windowEnd) && !dose.taken && !dose.missed) {
          try {
            await markMedicationAsMissed(med.id, doseIndex, true, token, dateKey);
            // Update local state
            setMedications((prev) =>
              prev.map((m) =>
                m.id === med.id
                  ? {
                      ...m,
                      doses: {
                        ...m.doses,
                        [dateKey]: doses.map((d, idx) =>
                          idx === doseIndex ? { ...d, missed: true } : d
                        ),
                      },
                    }
                  : m
              )
            );
          } catch (err) {
            console.error("Error marking dose as missed:", err);
            if (err.code === "auth/id-token-expired") {
              handleSessionExpired();
            } else {
              toast.error("Failed to mark dose as missed");
            }
          }
        }
      }
    }
  }, [medications, selectedDate, user, handleSessionExpired]);

  // Run checkAndMarkMissedDoses when medications or selectedDate changes
  useEffect(() => {
    checkAndMarkMissedDoses();
  }, [medications, selectedDate, checkAndMarkMissedDoses]);

  // Group medications by time of day
  const morningMeds = useMemo(() => {
    const seen = new Set();
    return medications
      .flatMap((med) => {
        const dateKey = moment(selectedDate).format("YYYY-MM-DD");
        const doses = med.doses?.[dateKey] || med.times.map((time) => ({
          time,
          taken: false,
          missed: false,
          takenAt: null,
        }));
        return doses.map((dose, index) => {
          const [hours] = dose.time.split(":").map(Number);
          if (hours >= 5 && hours < 12) {
            const key = `${med.id}-${index}`;
            if (seen.has(key)) return null;
            seen.add(key);
            return {
              ...med,
              doseTime: dose.time,
              doseIndex: index,
              timeOfDay: "Morning",
              selectedDate,
            };
          }
          return null;
        });
      })
      .filter(Boolean);
  }, [medications, selectedDate]);

  const afternoonMeds = useMemo(() => {
    const seen = new Set();
    return medications
      .flatMap((med) => {
        const dateKey = moment(selectedDate).format("YYYY-MM-DD");
        const doses = med.doses?.[dateKey] || med.times.map((time) => ({
          time,
          taken: false,
          missed: false,
          takenAt: null,
        }));
        return doses.map((dose, index) => {
          const [hours] = dose.time.split(":").map(Number);
          if (hours >= 12 && hours < 17) {
            const key = `${med.id}-${index}`;
            if (seen.has(key)) return null;
            seen.add(key);
            return {
              ...med,
              doseTime: dose.time,
              doseIndex: index,
              timeOfDay: "Afternoon",
              selectedDate,
            };
          }
          return null;
        });
      })
      .filter(Boolean);
  }, [medications, selectedDate]);

  const eveningMeds = useMemo(() => {
    const seen = new Set();
    return medications
      .flatMap((med) => {
        const dateKey = moment(selectedDate).format("YYYY-MM-DD");
        const doses = med.doses?.[dateKey] || med.times.map((time) => ({
          time,
          taken: false,
          missed: false,
          takenAt: null,
        }));
        return doses.map((dose, index) => {
          const [hours] = dose.time.split(":").map(Number);
          if (hours >= 17 || hours < 5) {
            const key = `${med.id}-${index}`;
            if (seen.has(key)) return null;
            seen.add(key);
            return {
              ...med,
              doseTime: dose.time,
              doseIndex: index,
              timeOfDay: "Evening",
              selectedDate,
            };
          }
          return null;
        });
      })
      .filter(Boolean);
  }, [medications, selectedDate]);

  const dailyDoses = useMemo(() => {
    return medications
      .map((med) => {
        const dateKey = moment(selectedDate).format("YYYY-MM-DD");
        const doses = med.doses?.[dateKey] || med.times.map((time) => ({
          time,
          taken: false,
          missed: false,
          takenAt: null,
        }));
        return doses.map((dose, index) => ({
          ...med,
          doseTime: dose.time,
          doseIndex: index,
          timeOfDay: (() => {
            const [hours] = dose.time.split(":").map(Number);
            if (hours >= 5 && hours < 12) return "Morning";
            if (hours >= 12 && hours < 17) return "Afternoon";
            return "Evening";
          })(),
        }));
      })
      .flat()
      .filter(Boolean);
  }, [medications, selectedDate]);

  // Firebase Messaging Setup
  const setupNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const fcmToken = await getToken(messaging, {
          vapidKey: "BHo0F2FHBX8okHJ8ejib_7nHTTlXhJlZ4O0e4VQ1jKa0UJWhXBDJdp8KS4Ox2cWSn9ppw_m_Pz4L0KBkKN15CHI",
        });
        if (fcmToken) {
          const token = await getUserToken();
          await saveFcmToken(token, fcmToken);
        }
      }
    } catch (err) {
      console.error("Error setting up notifications:", err);
      if (err.code === "auth/id-token-expired") {
        handleSessionExpired();
      } else {
        console.error("Error setting up notifications:", err);
      }
    }
  };

  // Fetch initial data and set up token expiration listener
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const unsubscribe = auth.onIdTokenChanged(async (currentUser) => {
      if (!currentUser) {
        handleSessionExpired();
        return;
      }

      try {
        const tokenResult = await currentUser.getIdTokenResult();
        const expirationTime = new Date(tokenResult.expirationTime).getTime();
        const currentTime = Date.now();
        const timeUntilExpiration = expirationTime - currentTime;

        if (timeUntilExpiration <= 0) {
          handleSessionExpired();
          return;
        }

        if (timeUntilExpiration < 5 * 60 * 1000) {
          await currentUser.getIdToken(true);
        }
      } catch (error) {
        console.error("Error checking token expiration:", error);
        handleSessionExpired();
      }
    });

    fetchMedications();
    fetchReminders();
    setupNotifications();

    onMessage(messaging, (payload) => {
      toast.info(payload.notification.body);
    });

    return () => unsubscribe();
  }, [user, navigate, handleSessionExpired]);

  // Set up socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleMedicationUpdated = (updatedMedication) => {
      setMedications((prev) =>
        prev.map((med) =>
          med.id === updatedMedication.id ? updatedMedication : med
        )
      );
    };

    const handleReminderSent = (reminder) => {
      toast.info(`Reminder: ${reminder.message}`);
    };

    socket.on("medicationUpdated", handleMedicationUpdated);
    socket.on("reminderSent", handleReminderSent);

    return () => {
      socket.off("medicationUpdated", handleMedicationUpdated);
      socket.off("reminderSent", handleReminderSent);
    };
  }, [socket]);

  useEffect(() => {
    updateMedicationHistory();
  }, [medications]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <Header
        user={user}
        onViewAllReminders={() => setShowAllRemindersModal(true)}
        onViewChecklist={() => setShowChecklistModal(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <div className="flex flex-col lg:space-x-6 space-y-6 lg:space-y-0">
        <div className="flex flex-col lg:flex-row lg:space-x-6 space-y-6 lg:space-y-0 w-full gap-2">
          <div className="flex flex-col space-y-3 lg:max-w-3/4 w-full justify-center">
            <TimeOfDaySection
              title="Morning"
              meds={morningMeds}
              icon={<WiDaySunnyOvercast style={{ fontSize: "1.5rem", color: "#ffca28" }} />}
              reminders={reminders}
              setShowReminderModal={setShowReminderModal}
              setSelectedMedication={setSelectedMedication}
              getDoseStatus={getDoseStatus}
            />
            <TimeOfDaySection
              title="Afternoon"
              meds={afternoonMeds}
              icon={<WiDaySunny style={{ fontSize: "1.5rem", color: "#ffb300" }} />}
              reminders={reminders}
              setShowReminderModal={setShowReminderModal}
              setSelectedMedication={setSelectedMedication}
              getDoseStatus={getDoseStatus}
            />
            <TimeOfDaySection
              title="Evening"
              meds={eveningMeds}
              icon={<WiDayWindy style={{ fontSize: "1.5rem", color: "#ff8f00" }} />}
              reminders={reminders}
              setShowReminderModal={setShowReminderModal}
              setSelectedMedication={setSelectedMedication}
              getDoseStatus={getDoseStatus}
            />
          </div>
          <CalendarSection
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            isFutureDate={isFutureDate}
          />
        </div>
        <div className="flex flex-col lg:space-x-6 space-y-6 lg:space-y-0 w-full lg:max-w-3/4">
          <MedicationList
            medications={medications}
            loading={loading}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            calculateDoseStatus={calculateDoseStatus}
            onAddMedication={() => setShowAddModal(true)}
            openMedicationDetail={openMedicationDetail}
            setShowTakeModal={setShowTakeModal}
            setShowUndoModal={setShowUndoModal}
            confirmDeleteMedication={confirmDeleteMedication}
            actionLoading={actionLoading}
            searchQuery={searchQuery}
          />
          <RemindersSection
            reminders={reminders}
            medications={medications}
            selectedDate={selectedDate}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            handleMarkReminderAsSent={handleMarkReminderAsSent}
            handleDeleteReminder={handleDeleteReminder}
            setEditReminderModal={setEditReminderModal}
            setReminderTime={setReminderTime}
            actionLoading={actionLoading}
            searchQuery={searchQuery}
          />
          <HistorySection
            medicationHistory={medicationHistory}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            searchQuery={searchQuery}
          />
        </div>
      </div>

      {showAddModal && name !== undefined && dosage !== undefined && (
        <AddMedicationModal
          isOpen={showAddModal}
          onRequestClose={() => setShowAddModal(false)}
          name={name}
          setName={setName}
          frequency={frequency}
          setFrequency={setFrequency}
          dosage={dosage}
          setDosage={setDosage}
          timesPerDay={timesPerDay}
          setTimesPerDay={setTimesPerDay}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          notes={notes}
          setNotes={setNotes}
          handleAddMedication={handleAddMedication}
          actionLoading={actionLoading}
          filteredDrugs={filteredDrugs}
          showDropdown={showDropdown}
          handleDrugSearch={handleDrugSearch}
          setShowDropdown={setShowDropdown}
          handleDrugSelect={handleDrugSelect}
          onMedicationAdded={onMedicationAdded}
        />
      )}
      <MedicationDetailModal
        isOpen={showDetailModal}
        onRequestClose={() => setShowDetailModal(false)}
        selectedMedication={selectedMedication}
        drugInfo={drugInfo}
        drugInfoLoading={drugInfoLoading}
        calculateProgress={calculateProgress}
        calculateDaysRemaining={calculateDaysRemaining}
        getDoseStatus={getDoseStatus}
        confirmTakenStatus={confirmTakenStatus}
        actionLoading={actionLoading}
        isPastDate={isPastDate}
        isFutureDate={isFutureDate}
        selectedDate={selectedDate}
      />
      <DailyChecklistModal
        isOpen={showChecklistModal}
        onRequestClose={() => setShowChecklistModal(false)}
        dailyDoses={dailyDoses}
        selectedDate={selectedDate}
        getDoseStatus={getDoseStatus}
        confirmTakenStatus={confirmTakenStatus}
        actionLoading={actionLoading}
        isPastDate={isPastDate}
        isFutureDate={isFutureDate}
      />
      <ConfirmModal
        isOpen={showConfirmModal}
        onRequestClose={() => setShowConfirmModal(false)}
        message={confirmMessage}
        onConfirm={confirmAction}
        actionLoading={actionLoading}
      />
      <DeleteConfirmModal
        isOpen={showDeleteConfirmModal}
        onRequestClose={() => setShowDeleteConfirmModal(false)}
        onConfirm={handleDeleteMedication}
        actionLoading={actionLoading}
      />
      <AllRemindersModal
        isOpen={showAllRemindersModal}
        onRequestClose={() => setShowAllRemindersModal(false)}
        reminders={reminders}
        medications={medications}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={ITEMS_PER_PAGE}
        handleMarkReminderAsSent={handleMarkReminderAsSent}
        handleDeleteReminder={handleDeleteReminder}
        setEditReminderModal={setEditReminderModal}
        setReminderTime={setReminderTime}
        actionLoading={actionLoading}
      />
      <SetReminderModal
        isOpen={!!showReminderModal}
        onRequestClose={() => setShowReminderModal(null)}
        reminderTime={reminderTime}
        setReminderTime={setReminderTime}
        isRecurringReminder={isRecurringReminder}
        setIsRecurringReminder={setIsRecurringReminder}
        handleSetReminder={(e) => handleSetReminder(e, showReminderModal?.medicationId, showReminderModal?.doseIndex)}
        actionLoading={actionLoading}
      />
      <AddReminderPromptModal
        isOpen={!!showAddReminderPrompt}
        onRequestClose={() => setShowAddReminderPrompt(null)}
        showAddReminderPrompt={showAddReminderPrompt}
        setShowReminderModal={setShowReminderModal}
        selectedDate={selectedDate}
      />
      <EditReminderModal
        isOpen={!!editReminderModal}
        onRequestClose={() => setEditReminderModal(null)}
        reminderTime={reminderTime}
        setReminderTime={setReminderTime}
        isRecurringReminder={isRecurringReminder}
        setIsRecurringReminder={setIsRecurringReminder}
        handleUpdateReminder={handleUpdateReminder}
        actionLoading={actionLoading}
      />
      <TakeMedicationModal
        isOpen={!!showTakeModal}
        onRequestClose={() => setShowTakeModal(null)}
        showTakeModal={showTakeModal}
        medications={medications}
        selectedDate={selectedDate}
        getDoseStatus={getDoseStatus}
        confirmTakenStatus={confirmTakenStatus}
        actionLoading={actionLoading}
        isPastDate={isPastDate}
        isFutureDate={isFutureDate}
      />
      <UndoTakenMedicationModal
        isOpen={!!showUndoModal}
        onRequestClose={() => setShowUndoModal(null)}
        showUndoModal={showUndoModal}
        medications={medications}
        selectedDate={selectedDate}
        getDoseStatus={getDoseStatus}
        confirmTakenStatus={confirmTakenStatus}
        actionLoading={actionLoading}
        isPastDate={isPastDate}
        isFutureDate={isFutureDate}
      />
    </div>
  );
};

export default MedicationTracker;