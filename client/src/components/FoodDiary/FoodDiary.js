import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import {
  createMedication,
  getUserMedications,
  updateMedication,
  deleteMedication,
  updateMedicationTakenStatus,
  markMedicationAsMissed,
} from "../../services/api";
import { auth } from "../../firebase/config";
import Calendar from "react-calendar";
import Modal from "react-modal";
import moment from "moment";
import { toast } from "react-toastify";
import styled from "styled-components";
import { WiDaySunnyOvercast, WiDaySunny, WiDayWindy } from "react-icons/wi";
import { BsCheck2Circle, BsXCircle, BsClock } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { useSocket } from '../../contexts/SocketContext';

Modal.setAppElement("#root");

// Styled components
const CalendarContainer = styled.div`
  width: 100%;
  background-color: #ffffff;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid #eaeaea;
  
  .react-calendar {
    max-width: 100%;
    background: white;
    border: none;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    line-height: 1.25em;
  }
  
  .react-calendar--doubleView {
    width: 700px;
  }
  
  .react-calendar--doubleView .react-calendar__viewContainer {
    display: flex;
    margin: -0.5em;
  }
  
  .react-calendar--doubleView .react-calendar__viewContainer > * {
    width: 50%;
    margin: 0.5em;
  }
  
  .react-calendar,
  .react-calendar *,
  .react-calendar *:before,
  .react-calendar *:after {
    box-sizing: border-box;
  }
  
  .react-calendar button {
    margin: 0;
    border: 0;
    outline: none;
    border-radius: 8px;
    transition: all 0.2s ease;
  }
  
  .react-calendar button:enabled:hover {
    cursor: pointer;
  }
  
  .react-calendar__navigation {
    display: flex;
    height: 48px;
    margin-bottom: 1.25em;
  }
  
  .react-calendar__navigation button {
    min-width: 44px;
    background: none;
    font-size: 1rem;
    font-weight: 600;
    color: #333;
  }
  
  .react-calendar__navigation button:enabled:hover,
  .react-calendar__navigation button:enabled:focus {
    background-color: #f5f7fa;
    border-radius: 8px;
  }
  
  .react-calendar__navigation button[disabled] {
    background-color: #f8f8f8;
    color: #bbb;
  }
  
  .react-calendar__month-view__weekdays {
    text-align: center;
    text-transform: uppercase;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.75em;
    color: #666;
    padding: 0.5em 0;
  }
  
  .react-calendar__month-view__weekdays__weekday {
    padding: 0.75em;
    text-decoration: none;
  }
  
  .react-calendar__month-view__weekNumbers {
    font-weight: bold;
  }
  
  .react-calendar__month-view__weekNumbers .react-calendar__tile {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75em;
    padding: calc(0.75em / 0.75) calc(0.5em / 0.75);
  }
  
  .react-calendar__month-view__days__day--weekend {
    color: #e85c61;
    text-decoration: none;
  }
  
  .react-calendar__month-view__days__day--neighboringMonth {
    color: #b3b3b3;
  }
  
  .react-calendar__year-view .react-calendar__tile,
  .react-calendar__decade-view .react-calendar__tile,
  .react-calendar__century-view .react-calendar__tile {
    padding: 2em 0.5em;
  }
  
  .react-calendar__tile {
    max-width: 100%;
    text-align: center;
    padding: 0.85em 0.5em;
    background: none;
    font-weight: 500;
    font-size: 0.9em;
  }
  
  .react-calendar__tile:disabled {
    background-color: #f8f8f8;
    color: #d0d0d0;
  }
  
  .react-calendar__tile:enabled:hover,
  .react-calendar__tile:enabled:focus {
    background-color: #f0f5ff;
  }
  
  .react-calendar__tile--now {
    background: #fff5e0;
    border: 2px solid #ffb74d;
    font-weight: 600;
  }
  
  .react-calendar__tile--now:enabled:hover,
  .react-calendar__tile--now:enabled:focus {
    background: #ffefc7;
  }
  
  .react-calendar__tile--hasActive {
    background: #d6e9ff;
  }
  
  .react-calendar__tile--hasActive:enabled:hover,
  .react-calendar__tile--hasActive:enabled:focus {
    background: #c2deff;
  }
  
  .react-calendar__tile--active {
    background: #3182ce;
    color: white;
    font-weight: 600;
    box-shadow: 0 2px 6px rgba(49, 130, 206, 0.4);
  }
  
  .react-calendar__tile--active:enabled:hover,
  .react-calendar__tile--active:enabled:focus {
    background: #2b6cb0;
  }
  
  .react-calendar--selectRange .react-calendar__tile--hover {
    background-color: #e6f2ff;
  }
`;

const StatusBadge = styled.span`
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  
  svg {
    width: 1rem;
    height: 1rem;
  }

  &.pending {
    background-color: #f3f4f6;
    color: #6b7280;
  }
  
  &.taken {
    background-color: #d1fae5;
    color: #065f46;
  }
  
  &.missed {
    background-color: #fee2e2;
    color: #b91c1c;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #333;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// Modal styles
const ModalOverlay = {
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 1000,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const ModalContentWrapper = {
  background: "white",
  color: "black",
  width: "90%",
  maxWidth: "500px",
  maxHeight: "80vh",
  margin: "auto",
  borderRadius: "8px",
  padding: "1.5rem",
  position: "relative",
  overflowY: "auto",
  boxSizing: "border-box",
  inset: 0,
};

// Component to display time of day sections
const TimeOfDaySection = ({ title, meds, icon }) => {
  if (!meds || meds.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
        </h2>
        <p className="text-gray-500 text-sm sm:text-base">
          No medications for this time
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 flex items-center">
        {icon}
        <span className="ml-2">{title}</span>
      </h2>
      {meds.map((med) => (
        <div
          key={`${med.id}-${med.doseIndex}`}
          className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 last:border-0"
        >
          <div className="mb-2 sm:mb-0">
            <span className="text-gray-900 text-sm sm:text-base font-medium">
              {med.medication_name} ({med.dosage})
            </span>
            <div className="text-xs text-gray-500">
              Time: {med.doseTime}
            </div>
          </div>
          <MedicationStatusBadge med={med} />
        </div>
      ))}
    </div>
  );
};

// Component for medication status badge
const MedicationStatusBadge = ({ med }) => {
  if (med.doseTaken) {
    return (
      <StatusBadge className="taken">
        <BsCheck2Circle /> Taken
      </StatusBadge>
    );
  } else if (med.doseMissed) {
    return (
      <StatusBadge className="missed">
        <BsXCircle /> Missed
      </StatusBadge>
    );
  } else {
    return (
      <StatusBadge className="pending">
        <BsClock /> Pending
      </StatusBadge>
    );
  }
};


const FoodTracker = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [dosage, setDosage] = useState("");
  const [timesPerDay, setTimesPerDay] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [drugList, setDrugList] = useState([]);
  const [filteredDrugs, setFilteredDrugs] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [drugInfo, setDrugInfo] = useState({ interactions: [], usage: "" });
  const [drugInfoLoading, setDrugInfoLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Mock drug data
  const mockDrugData = [
    { id: 1, name: "Acetaminophen" },
    { id: 2, name: "Amoxicillin" },
    { id: 3, name: "Atorvastatin" },
    { id: 4, name: "Lisinopril" },
    { id: 5, name: "Metformin" },
    { id: 6, name: "Simvastatin" },
    { id: 7, name: "Levothyroxine" },
    { id: 8, name: "Metoprolol" },
    { id: 9, name: "Amlodipine" },
    { id: 10, name: "Albuterol" },
  ];

  // Fetch medications for the user
  useEffect(() => {
    const fetchMedications = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const token = await auth.currentUser.getIdToken(true);
        const userMedications = await getUserMedications(token);
        setMedications(userMedications);
      } catch (err) {
        console.error("Error fetching medications:", err);
        if (err.response?.status === 401) {
          try {
            const newToken = await auth.currentUser.getIdToken(true);
            const userMedications = await getUserMedications(newToken);
            setMedications(userMedications);
          } catch (refreshErr) {
            toast.error("Session expired. Please log in again.");
            logout();
            navigate("/login");
            console.error("Error refreshing token:", refreshErr);
          }
        } else {
          toast.error("Failed to load medications");
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (user) fetchMedications();
  }, [user]);

  // Load mock drug data
  useEffect(() => {
    setDrugList(mockDrugData);
    setFilteredDrugs(mockDrugData);
  }, []);

  // Mock drug info when a medication is selected
  useEffect(() => {
    const fetchMockDrugInfo = async () => {
      if (!selectedMedication) return;
      
      setDrugInfoLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock drug interactions and usage info
        const mockInteractions = [
          "May interact with blood thinners, increasing risk of bleeding.",
          "Can interact with certain antidepressants. Monitor for side effects.",
          "Avoid grapefruit juice while taking this medication."
        ];
        
        const mockUsage = "Take as directed by your healthcare provider. May be taken with or without food. Store at room temperature away from moisture and heat.";
        
        setDrugInfo({ 
          interactions: mockInteractions, 
          usage: mockUsage 
        });
      } catch (err) {
        console.error("Error fetching drug info:", err);
        setDrugInfo({ 
          interactions: [], 
          usage: "Information not available." 
        });
      } finally {
        setDrugInfoLoading(false);
      }
    };
    
    if (showDetailModal && selectedMedication) {
      fetchMockDrugInfo();
    }
  }, [showDetailModal, selectedMedication]);

  // Helper function to determine if a dose is due, taken or missed based on time
  const getDoseStatus = (med, doseIndex) => {
    if (!med || !med.doses || !med.doses[doseIndex]) {
      return { isTaken: false, isMissed: false, isTimeToTake: false, hasPassed: false };
    }
  
    const dose = med.doses[doseIndex];
    const isTaken = dose.taken || false;
    const isMissed = dose.missed || false;
  
    // Check if the dose time has passed
    const doseTime = dose.time;
    const [hours, minutes] = doseTime.split(':').map(Number);
  
    const doseDateTime = new Date(selectedDate);
    doseDateTime.setHours(hours, minutes, 0);
  
    const now = new Date();
    const hasPassed = doseDateTime < now;
  
    // Determine if it's time to take the medication (within 1 hour before or after scheduled time)
    const oneHourInMs = 60 * 60 * 1000;
    const isTimeToTake = Math.abs(doseDateTime - now) <= oneHourInMs;
  
    return { isTaken, isMissed, isTimeToTake, hasPassed };
  };

  // Filter drugs based on user input
  const handleDrugSearch = (value) => {
    setName(value);
    if (value.trim() === "") {
      setFilteredDrugs(drugList);
      setShowDropdown(false);
    } else {
      const filtered = drugList.filter((drug) =>
        drug.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredDrugs(filtered);
      setShowDropdown(true);
    }
  };

  const calculateTimes = (timesPerDay) => {
    const times = [];
    
    if (timesPerDay === "1") {
      times.push("08:00:00");
    } else if (timesPerDay === "2") {
      times.push("08:00:00");
      times.push("20:00:00");
    } else if (timesPerDay === "3") {
      times.push("08:00:00");
      times.push("14:00:00");
      times.push("20:00:00");
    }
    
    return times;
  };

  const handleAddMedication = async (e) => {
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
      const token = await auth.currentUser.getIdToken(true);
      const formattedStartDate = moment(startDate, ["YYYY-MM-DD", "DD/MM/YYYY"]).format("YYYY-MM-DD");
      const formattedEndDate = moment(endDate, ["YYYY-MM-DD", "DD/MM/YYYY"]).format("YYYY-MM-DD");
      const calculatedTimes = calculateTimes(timesPerDay);
      
      const newMedication = {
        medication_name: name,
        frequency: frequency.toLowerCase(),
        dosage,
        times_per_day: parseInt(timesPerDay),
        times: calculatedTimes,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        notes: notes || null,
        doses: calculatedTimes.map((time) => ({
          time,
          taken: false,
          missed: false,
        })),
      };
      
      const createdMedication = await createMedication(newMedication, token);
      setMedications((prev) => [createdMedication, ...prev]);
      
      // Reset form
      setName("");
      setFrequency("daily");
      setDosage("");
      setTimesPerDay("1");
      setStartDate("");
      setEndDate("");
      setNotes("");
      setShowAddModal(false);
      setShowDropdown(false);
      toast.success("Medication added successfully");
    } catch (err) {
      console.error("Error adding medication:", err);
      if (err.response?.status === 401) {
        try {
          const newToken = await auth.currentUser.getIdToken(true);
          const formattedStartDate = moment(startDate, ["YYYY-MM-DD", "DD/MM/YYYY"]).format("YYYY-MM-DD");
          const formattedEndDate = moment(endDate, ["YYYY-MM-DD", "DD/MM/YYYY"]).format("YYYY-MM-DD");
          const calculatedTimes = calculateTimes(timesPerDay);
          
          const newMedication = {
            medication_name: name,
            frequency: frequency.toLowerCase(),
            dosage,
            times_per_day: parseInt(timesPerDay),
            times: calculatedTimes,
            start_date: formattedStartDate,
            end_date: formattedEndDate,
            notes: notes || null,
            doses: calculatedTimes.map((time) => ({
              time,
              taken: false,
              missed: false,
              takenAt: null,
            })),
          };
          const createdMedication = await createMedication(newMedication, newToken);
          setMedications((prev) => [createdMedication, ...prev]);

          setName("");
          setFrequency("daily");
          setDosage("");
          setTimesPerDay("1");
          setStartDate("");
          setEndDate("");
          setNotes("");
          setShowAddModal(false);
          setShowDropdown(false);
          toast.success("Medication added successfully");
        } catch (refreshErr) {
          toast.error("Session expired. Please log in again.");
          console.error("Error refreshing token:", refreshErr);
          logout();
          navigate("/login");
        }
      } else {
        toast.error("Failed to add medication");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMedication = async (id) => {
    setActionLoading(true);
    try {
      const token = await auth.currentUser.getIdToken(true);
      await deleteMedication(id, token);
      setMedications((prev) => prev.filter((med) => med.id !== id));
      if (selectedMedication?.id === id) {
        setShowDetailModal(false);
      }
      toast.success("Medication deleted successfully");
    } catch (err) {
      console.error("Error deleting medication:", err);
      if (err.response?.status === 401) {
        try {
          const newToken = await auth.currentUser.getIdToken(true);
          await deleteMedication(id, newToken);
          setMedications((prev) => prev.filter((med) => med.id !== id));
          if (selectedMedication?.id === id) {
            setShowDetailModal(false);
          }
          toast.success("Medication deleted successfully");
        } catch (refreshErr) {
          toast.error("Session expired. Please log in again.");
          logout();
          navigate("/login");
        }
      } else {
        toast.error("Failed to delete medication");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTakenStatus = async (id, doseIndex, taken) => {
    const med = medications.find(m => m.id === id);
    if (!med) return;
  
    const { isTimeToTake, hasPassed } = getDoseStatus(med, doseIndex);
  
    if (taken && hasPassed && !isTimeToTake) {
      toast.error("Cannot mark as taken more than 1 hour after the scheduled time");
      return;
    }
  
    if (!taken && hasPassed && !isTimeToTake) {
      toast.error("Cannot undo taken status more than 1 hour after the scheduled time");
      return;
    }
  
    setActionLoading(true);
    try {
      const token = await auth.currentUser.getIdToken(true);
      const updatedMedication = await updateMedicationTakenStatus(id, doseIndex, taken, token);
  
      // Update medications in state
      setMedications(prev =>
        prev.map(med => (med.id === updatedMedication.id ? updatedMedication : med))
      );
  
      // Update selected medication if it's the one being modified
      if (selectedMedication?.id === updatedMedication.id) {
        setSelectedMedication(updatedMedication);
      }
  
      // Emit Socket.IO event to notify other clients (e.g., Dashboard)
      if (socket) {
        socket.emit("medicationUpdated", updatedMedication);
      }
  
      toast.success(taken ? "Medication marked as taken" : "Taken status undone");
    } catch (err) {
      console.error("Error updating taken status:", err);
      if (err.response?.status === 401) {
        try {
          const newToken = await auth.currentUser.getIdToken(true);
          const updatedMedication = await updateMedicationTakenStatus(id, doseIndex, taken, newToken);
          setMedications(prev =>
            prev.map(med => (med.id === updatedMedication.id ? updatedMedication : med))
          );
          if (selectedMedication?.id === updatedMedication.id) {
            setSelectedMedication(updatedMedication);
          }
  
          // Emit Socket.IO event after refreshing token
          if (socket) {
            socket.emit("medicationUpdated", updatedMedication);
          }
  
          toast.success(taken ? "Medication marked as taken" : "Taken status undone");
        } catch (refreshErr) {
          toast.error("Session expired. Please log in again.");
          logout();
          navigate("/login");
        }
      } else {
        toast.error("Failed to update medication status");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const checkForMissedMedications = () => {
    const now = new Date();
    
    const medicationsWithUpdatedStatus = medications.map(med => {
      if (!med.doses) return med;
      
      const updatedDoses = med.doses.map((dose, index) => {
        if (dose.taken || dose.missed) return dose;
        
        const [hours, minutes] = dose.time.split(':').map(Number);
        const doseDateTime = new Date(selectedDate);
        doseDateTime.setHours(hours, minutes, 0);
        
        // If dose time has passed by more than 2 hours and not taken
        const twoHoursInMs = 2 * 60 * 60 * 1000;
        if (now - doseDateTime > twoHoursInMs) {
          return { ...dose, missed: true };
        }
        
        return dose;
      });
      
      return { ...med, doses: updatedDoses };
    });
    
    // Update medications state if any changes were made
    if (JSON.stringify(medications) !== JSON.stringify(medicationsWithUpdatedStatus)) {
      setMedications(medicationsWithUpdatedStatus);
  
      medicationsWithUpdatedStatus.forEach(async (med, medIndex) => {
        if (!med.doses) return;
  
        med.doses.forEach(async (dose, index) => {
          const originalDose = medications[medIndex]?.doses?.[index];
          if (dose.missed && !originalDose?.missed) {
            try {
              const token = await auth.currentUser.getIdToken(true);
              const updatedMedication = await markMedicationAsMissed(med.id, index, true, token);
              if (socket) {
                socket.emit("medicationUpdated", updatedMedication);
              }
            } catch (err) {
              console.error("Error auto-marking medication as missed:", err);
            }
          }
        });
      });
    }
  };

  // Check for missed medications every minute
  useEffect(() => {
    checkForMissedMedications();
    const interval = setInterval(checkForMissedMedications, 60 * 1000);
    return () => clearInterval(interval);
  }, [medications, selectedDate]);

  const confirmTakenStatus = (id, doseIndex, taken) => {
    const med = medications.find(m => m.id === id);
    if (!med) return;
  
    const { isTaken, isTimeToTake, hasPassed } = getDoseStatus(med, doseIndex);
  
    if (taken && hasPassed && !isTimeToTake) {
      toast.error("Cannot mark as taken more than 1 hour after the scheduled time");
      return;
    }
  
    if (!taken && hasPassed && !isTimeToTake) {
      toast.error("Cannot undo taken status more than 1 hour after the scheduled time");
      return;
    }
  
    setConfirmMessage(`${taken ? "Did you take your medicine?" : "Not taken your medicine yet?"}`);
    setConfirmAction(() => () => handleUpdateTakenStatus(id, doseIndex, taken));
    setShowConfirmModal(true);
  };

  const handleConfirmAction = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage("");
  };

  const openMedicationDetail = (med) => {
    setSelectedMedication(med);
    setShowDetailModal(true);
  };

  const calculateProgress = () => {
    if (!selectedMedication) return 0;
    const { totalDoses, takenDoses } = calculateDoseStatus(selectedMedication);
    return totalDoses > 0 ? Math.floor((takenDoses / totalDoses) * 100) : 0;
  };

  const calculateDaysRemaining = () => {
    if (!selectedMedication) return 0;
    const end = moment(selectedMedication.end_date);
    const today = moment();
    return Math.max(0, end.diff(today, "days"));
  };

  const categorizeMedicationsByTime = () => {
    const morningMeds = [];
    const afternoonMeds = [];
    const eveningMeds = [];
    
    medications.forEach(med => {
      if (!med.doses) return;
      
      med.doses.forEach((dose, index) => {
        if (!dose || !dose.time) return;
        
        const [hours] = dose.time.split(':').map(Number);
        let timeOfDay = "morning";
        if (hours >= 12 && hours < 17) timeOfDay = "afternoon";
        else if (hours >= 17) timeOfDay = "evening";
        
        const medDate = moment(med.start_date || med.createdAt).format('YYYY-MM-DD');
        const selectedDateStr = moment(selectedDate).format('YYYY-MM-DD');
        
        if (medDate === selectedDateStr) {
          const medicationWithDoseInfo = {
            ...med,
            doseIndex: index,
            doseTime: dose.time,
            doseTaken: dose.taken || false,
            doseMissed: dose.missed || false,
          };
          
          if (timeOfDay === "morning") morningMeds.push(medicationWithDoseInfo);
          else if (timeOfDay === "afternoon") afternoonMeds.push(medicationWithDoseInfo);
          else eveningMeds.push(medicationWithDoseInfo);
        }
      });
    });
    
    return { morningMeds, afternoonMeds, eveningMeds };
  };

  const getDailyDoses = () => {
    return medications.flatMap(med => {
      const doses = Array.isArray(med.doses) ? med.doses : [];
      const medDate = moment(med.start_date || med.createdAt).format('YYYY-MM-DD');
      const selectedDateStr = moment(selectedDate).format('YYYY-MM-DD');
      
      if (medDate === selectedDateStr) {
        return doses.map((dose, index) => ({
          ...med,
          doseIndex: index,
          doseTime: dose?.time || "Unknown time",
          doseTaken: dose?.taken || false,
          doseMissed: dose?.missed || false,
          timeOfDay: (() => {
            if (!dose?.time) return "unknown";
            const [hours] = dose.time.split(':').map(Number);
            if (hours < 12) return "Morning";
            if (hours < 17) return "Afternoon";
            return "Evening";
          })()
        }));
      }
      return [];
    });
  };

  const { morningMeds, afternoonMeds, eveningMeds } = categorizeMedicationsByTime();
  const dailyDoses = getDailyDoses();
  
  const calculateDoseStatus = (med) => {
    const doses = Array.isArray(med.doses) ? med.doses : [];
    const totalDoses = doses.length;
    const takenDoses = doses.filter(dose => dose?.taken).length;
    const missedDoses = doses.filter(dose => dose?.missed).length;
    return { totalDoses, takenDoses, missedDoses };
  };

  const isPastDate = (date) => moment(date).isBefore(moment(), "day");
  const isFutureDate = (date) => moment(date).isAfter(moment(), "day");

  const dummyData = {
    '2025-04-19': {
      breakfast: [
        {
          name: 'Oatmeal with Honey',
          calories: 180,
          portion: '1 bowl',
          image: 'https://www.veggieinspired.com/wp-content/uploads/2015/05/healthy-oatmeal-berries-featured.jpg',
        },
        {
          name: 'Boiled Egg',
          calories: 78,
          portion: '1 egg',
          image: 'https://aducksoven.com/wp-content/uploads/2023/04/soft-boiled-sous-vide-egg-1-4-500x500.jpg',
        },
      ],
      lunch: [
        {
          name: 'Grilled Chicken Sandwich',
          calories: 450,
          portion: '1 sandwich',
          image: 'https://easychickenrecipes.com/wp-content/uploads/2023/06/grilled-chicken-sandwich-1-of-6-edited.jpg',
        },
      ],
      dinner: [
        {
          name: 'Baked Salmon',
          calories: 350,
          portion: '1 fillet',
          image: 'https://assets.epicurious.com/photos/62d6c5146b6e74298a39d06a/4:3/w_4031,h_3023,c_limit/BakedSalmon_RECIPE_04142022_9780_final.jpg',
        },
      ],
    },
  };
  
  const mealTypes = ['breakfast', 'lunch', 'dinner'];
  const [activeTab, setActiveTab] = useState('breakfast');

  const formattedDate = selectedDate.toISOString().split('T')[0];
  const foods = dummyData[formattedDate]?.[activeTab] || [];

  
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col lg:flex-row items-start justify-between lg:space-x-6 mb-6 space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Food Diary
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Track your daily food intake
          </p>
        </div>
        <button
          onClick={() => setShowChecklistModal(true)}
          className="bg-white text-black px-4 py-2 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-100 transition-colors duration-200 border border-gray-300 w-1/4 sm:w-auto"
        >
          View Daily Checklist
        </button>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row lg:space-x-6 space-y-6 lg:space-y-0">
        {/* Calendar Section */}
        <div className="w-full lg:w-1/3">
          <CalendarContainer>
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              showNeighboringMonth={true}
              showFixedNumberOfWeeks={false}
              tileDisabled={({ date }) => isFutureDate(date)}
            />
          </CalendarContainer>
        </div>

        {/* Time of Day Sections */}
        {/*<div className="w-full lg:w-2/3 flex flex-col space-y-4">
          <TimeOfDaySection
            title="Breakfast"
            meds={morningMeds}
            icon={<WiDaySunnyOvercast className="text-xl sm:text-2xl" />}
          />
          <TimeOfDaySection
            title="Lunch"
            meds={afternoonMeds}
            icon={<WiDaySunny className="text-xl sm:text-2xl" />}
          />
          <TimeOfDaySection
            title="Dinner"
            meds={eveningMeds}
            icon={<WiDayWindy className="text-xl sm:text-2xl" />}
          />
        </div>*/}
      </div>

      {/* Food Content Section */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md border border-gray-200 mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-0">
            Food Intake
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-800 transition-colors duration-200 w-1/4 sm:w-auto"
          >
            + Add your meal
          </button>
        </div>
        {/* Meal Tabs */}
        <div className="flex space-x-4 border-b border-green-300 pt-4">
          {mealTypes.map((type) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`px-4 py-2 font-semibold capitalize ${
                activeTab === type ? 'border-b-4 border-green-600 text-green-800' : 'text-gray-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Food Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {foods.length > 0 ? (
            foods.map((food, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow border border-green-200 overflow-hidden"
              >
                <img
                  src={food.image}
                  alt={food.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4 space-y-1">
                  <h3 className="text-lg font-semibold text-green-900">{food.name}</h3>
                  <p className="text-sm text-gray-600">🔥 {food.calories} kcal</p>
                  <p className="text-sm text-gray-600">🍽️ Portion: {food.portion}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic col-span-full">
              No food logged for {activeTab} on {formattedDate}.
            </p>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6 text-gray-800">
      
    </div>

      

      {/* Add Medication Modal */}
      <Modal
        isOpen={showAddModal}
        onRequestClose={() => setShowAddModal(false)}
        contentLabel="Add Medication Modal"
        style={{
          overlay: ModalOverlay,
          content: ModalContentWrapper,
        }}
      >
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Add your meal</h2>
        <form onSubmit={handleAddMedication} className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medication Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleDrugSearch(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
              placeholder="Search for a medication..."
            />
            {showDropdown && filteredDrugs.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-40 overflow-y-auto">
                {filteredDrugs.map((drug) => (
                  <li
                    key={drug.id}
                    onClick={() => {
                      setName(drug.name);
                      setShowDropdown(false);
                    }}
                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    {drug.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dosage
            </label>
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Times Per Day
            </label>
            <select
              value={timesPerDay}
              onChange={(e) => setTimesPerDay(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            >
              <option value="1">Once daily</option>
              <option value="2">Twice daily</option>
              <option value="3">Thrice daily</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              rows="3"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="submit"
              disabled={actionLoading}
              className={`px-4 py-2 rounded bg-green-600 text-white hover:bg-green-800 text-sm sm:text-base transition-colors duration-200 ${
                actionLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {actionLoading ? <LoadingSpinner /> : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded bg-gray-200 text-black hover:bg-gray-200 text-sm sm:text-base transition-colors duration-200 border-2 border-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Medication Detail Modal */}
      {showDetailModal && selectedMedication && (
        <Modal
          isOpen={showDetailModal}
          onRequestClose={() => setShowDetailModal(false)}
          contentLabel="Medication Detail Modal"
          style={{
            overlay: ModalOverlay,
            content: ModalContentWrapper,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              {selectedMedication.medication_name} {selectedMedication.dosage}
            </h3>
            <button
              onClick={() => setShowDetailModal(false)}
              className="text-gray-600 hover:text-gray-900 text-lg"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {selectedMedication.notes || "No additional notes provided."}
          </p>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{calculateProgress()}% complete</span>
              <span>{calculateDaysRemaining()} days remaining</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded mt-1">
              <div
                className="bg-gray-900 h-2 rounded"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Schedule</h4>
            <p className="text-xs text-gray-500">
              {(Array.isArray(selectedMedication.times)
                ? selectedMedication.times
                : []
              ).join(", ")}{" "}
              ({selectedMedication.frequency}, {selectedMedication.times_per_day}{" "}
              times/day, from {selectedMedication.start_date} to{" "}
              {selectedMedication.end_date})
            </p>
          </div>
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Doses</h4>
            {(Array.isArray(selectedMedication.doses)
              ? selectedMedication.doses
              : []
            ).map((dose, index) => {
              const { isTaken, isMissed, isTimeToTake } = getDoseStatus(selectedMedication, index);
              return (
                <div
                  key={index}
                  className="flex justify-between items-center py-1"
                >
                  <span className="text-xs text-gray-500">
                    {dose?.time || "Unknown time"}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        confirmTakenStatus(
                          selectedMedication.id,
                          index,
                          !isTaken
                        )
                      }
                      disabled={isTaken || isMissed || !isTimeToTake || actionLoading || isPastDate(selectedDate) || isFutureDate(selectedDate)}
                      className={`px-2 py-1 rounded text-xs font-semibold transition-colors duration-200 ${
                        isTaken
                          ? "bg-gray-300 text-gray-800 hover:bg-gray-400"
                          : "bg-gray-600 text-white hover:bg-gray-700"
                      } ${
                        isTaken || isMissed || !isTimeToTake || actionLoading || isPastDate(selectedDate) || isFutureDate(selectedDate)
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {isTaken ? "Undo" : "Take"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Drug Interactions Section */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Interactions</h4>
            {drugInfoLoading ? (
              <p className="text-xs text-gray-500">Loading interactions...</p>
            ) : drugInfo.interactions.length > 0 ? (
              <ul className="list-disc pl-4 text-xs text-gray-500">
                {drugInfo.interactions.map((interaction, index) => (
                  <li key={index}>{interaction}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500">No interactions found.</p>
            )}
          </div>
          {/* Usage Section */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Usage Instructions</h4>
            {drugInfoLoading ? (
              <p className="text-xs text-gray-500">Loading usage instructions...</p>
            ) : drugInfo.usage ? (
              <p className="text-xs text-gray-500">{drugInfo.usage}</p>
            ) : (
              <p className="text-xs text-gray-500">No usage instructions available.</p>
            )}
          </div>
        </Modal>
      )}

      {/* Daily Checklist Modal */}
      {showChecklistModal && (
        <Modal
          isOpen={showChecklistModal}
          onRequestClose={() => setShowChecklistModal(false)}
          contentLabel="Daily Checklist Modal"
          style={{
            overlay: ModalOverlay,
            content: ModalContentWrapper,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              Daily Medication Checklist -{" "}
              {moment(selectedDate).format("MMMM D, YYYY")}
            </h3>
            <button
              onClick={() => setShowChecklistModal(false)}
              className="text-gray-600 hover:text-gray-900 text-lg"
            >
              ✕
            </button>
          </div>
          {dailyDoses.length === 0 ? (
            <p className="text-gray-500 text-sm sm:text-base">
              No medications scheduled for this day.
            </p>
          ) : (
            <div className="space-y-3">
              {dailyDoses.map((dose, index) => (
                <div
                  key={`${dose.id}-${dose.doseIndex}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 last:border-0"
                >
                  <div className="mb-2 sm:mb-0">
                    <span className="text-gray-900 text-sm sm:text-base font-medium">
                      {dose.medication_name} (
                      {dose.dosage}/{dose.times_per_day} time
                      {dose.times_per_day > 1 ? "s" : ""} a day)
                    </span>
                    <div className="text-xs text-gray-500">
                      {dose.timeOfDay} - {dose.doseTime}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <MedicationStatusBadge med={dose} />
                    {!isPastDate(selectedDate) && !isFutureDate(selectedDate) && (
                      <button
                        onClick={() =>
                          confirmTakenStatus(
                            dose.id,
                            dose.doseIndex,
                            !dose.doseTaken
                          )
                        }
                        disabled={dose.doseMissed || actionLoading}
                        className={`px-2 py-1 rounded text-xs sm:text-sm font-semibold transition-colors duration-200 ${
                          dose.doseTaken
                            ? "bg-gray-300 text-gray-800 hover:bg-gray-400"
                            : "bg-gray-600 text-white hover:bg-gray-700"
                        } ${
                          dose.doseMissed || actionLoading
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {dose.doseTaken ? "Undo" : "Take"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <Modal
          isOpen={showConfirmModal}
          onRequestClose={() => setShowConfirmModal(false)}
          contentLabel="Confirm Action Modal"
          style={{
            overlay: ModalOverlay,
            content: ModalContentWrapper,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              Confirm Action
            </h3>
            <button
              onClick={() => setShowConfirmModal(false)}
              className="text-gray-600 hover:text-gray-900 text-lg"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-700 mb-4 text-sm sm:text-base">
            {confirmMessage}
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="px-4 py-2 rounded bg-gray-200 text-black hover:bg-gray-200 text-sm sm:text-base transition-colors duration-200 border-2 border-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAction}
              disabled={actionLoading}
              className={`px-4 py-2 rounded bg-green-600 text-white hover:bg-green-800 text-sm sm:text-base transition-colors duration-200 ${
                actionLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {actionLoading ? <LoadingSpinner /> : "Confirm"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FoodTracker;