import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import { WiDaySunnyOvercast } from 'react-icons/wi';
import { FiHelpCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from 'react-modal';

// Custom Hooks
import { useMedicationManager } from './useMedicationManager';
import { useModalState } from './useModalState';
import { useReminderManager } from './useReminderManager';
import { useDoseCalculations } from './useDoseCalculations';

// Import Components
import Header from './Header';
import MedicationList from './MedicationList';
import RemindersSection from './RemindersSection';
import HistorySection from './HistorySection';
import AddMedicationModal from './Modals/AddMedicationModal';
import MedicationDetailModal from './Modals/MedicationDetailModal';
import DailyChecklistModal from './Modals/DailyChecklistModal';
import ConfirmModal from './Modals/ConfirmModal';
import DeleteConfirmModal from './Modals/DeleteConfirmModal';
import AllRemindersModal from './Modals/AllRemindersModal';
import SetReminderModal from './Modals/SetReminderModal';
import AddReminderPromptModal from './Modals/AddReminderPromptModal';
import EditReminderModal from './Modals/EditReminderModal';
import TakeMedicationModal from './Modals/TakeMedicationModal';
import UndoTakenMedicationModal from './Modals/UndoTakenMedicationModal';
import DeleteMedicationModal from './Modals/DeleteMedicationModal';
import CalendarSection from './CalendarSection';
import TimeOfDaySection from './TimeOfDaySection';
import LoadingSpinner from '../common/LoadingSpinner';
import { CloseButton } from './styles';

// API Services
import {
  searchDrugsByName,
  getDrugDetails,
} from '../../services/api';

Modal.setAppElement('#root');

const ITEMS_PER_PAGE = 5;
const TakePromptModal = ({
  isOpen,
  onRequestClose,
  medication,
  doseIndex,
  doseTime,
  onTake,
  actionLoading,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Take Medication Prompt"
      style={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
        },
        content: {
          maxWidth: '400px',
          height: 'fit-content',
          margin: 'auto',
          borderRadius: '8px',
          padding: '20px',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 500, color: '#333333', margin: 0 }}>
          Take Medication?
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#666666', margin: 0 }}>
          Would you like to take your {medication?.medication_name} dose at {doseTime}?
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onRequestClose}
            disabled={actionLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f5f5f5',
              color: '#333333',
              border: 'none',
              borderRadius: '4px',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
            }}
          >
            No
          </button>
          <button
            onClick={onTake}
            disabled={actionLoading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1a73e8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Yes
          </button>
        </div>
      </div>
    </Modal>
  );
};

// HelpPopup Component
const HelpPopup = ({ isOpen, onRequestClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Help Information"
      style={{
        overlay: {
          backgroundColor: 'transparent',
          zIndex: 1100,
        },
        content: {
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          width: '320px',
          maxHeight: '80vh',
          borderRadius: '8px',
          padding: '0',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          backgroundColor: 'transparent',
          overflow: 'visible',
        },
      }}
    >
      <div className="bg-white rounded-lg shadow-lg overflow-y-auto border border-gray-200 p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Help: Medication Tracker
          </h2>
          <CloseButton onClick={onRequestClose} accentColor="#fd7e14" aria-label="Close modal">
            ✕
          </CloseButton>
        </div>
        <div className="text-sm text-gray-700 space-y-4">
          <p>The Medication Tracker helps you manage your medications effectively. Key features include:</p>
          <ul className="pl-5 list-disc space-y-2">
            <li><span className="font-medium">Add Medications</span>: Enter details like name, dosage, frequency, and dose times to schedule your regimen.</li>
            <li><span className="font-medium">Track Doses</span>: Mark doses as taken within a 2-hour window or undo if needed.</li>
            <li><span className="font-medium">Automatic Prompts</span>: Receive prompts for doses within the 2-hour window or when reminders trigger, across the app.</li>
            <li><span className="font-medium">Manage Reminders</span>: Set, edit, or delete single or daily reminders for doses.</li>
            <li><span className="font-medium">View by Time of Day</span>: See doses organized into Morning, Afternoon, and Evening sections.</li>
            <li><span className="font-medium">Calendar Navigation</span>: Select dates to view scheduled doses and their status.</li>
            <li><span className="font-medium">Dose History</span>: Review past dose statuses (Taken, Missed, Pending).</li>
            <li><span className="font-medium">Daily Checklist</span>: Track all doses for a specific day.</li>
            <li><span className="font-medium">Edit/Delete Medications</span>: Update or remove medications from your list.</li>
          </ul>
          <p>Stay on top of your medication schedule with ease!</p>
        </div>
      </div>
    </Modal>
  );
};

// Main Component
const MedicationTracker = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { socket } = useSocket();

  // Custom hooks for state management
  const {
    medications,
    reminders,
    medicationHistory,
    selectedMedication,
    loading,
    actionLoading,
    fetchMedications,
    fetchReminders,
    addMedication,
    updateDoseStatus,
    deleteMedication,
    markDosesAsMissed,
    dispatch,
    updateMedicationHistory,
    setSelectedMedication,
  } = useMedicationManager();

  const { modals, openModal, closeModal, closeAllModals } = useModalState();
  const {
    loading: reminderLoading,
    fetchReminders: fetchRemindersFromManager,
    createNewReminder,
    deleteReminder,
    handleMarkReminderAsSent,
    checkReminders,
  } = useReminderManager({
    medications,
    promptedDoses,
    openModal,
    setPromptedDoses,
  });
  const { getDoseStatus, getMedicationsByTimeOfDay, isPastDate, isFutureDate } = useDoseCalculations(medications, selectedDate);

  // Local component state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [promptedDoses, setPromptedDoses] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'daily',
    dosage: '',
    timesPerDay: '1',
    startDate: '',
    endDate: '',
    notes: '',
    reminderTime: '',
    isRecurringReminder: false,
  });
  const [searchState, setSearchState] = useState({
    searchQuery: '',
    filteredDrugs: [],
    showDropdown: false,
  });
  const [drugInfo, setDrugInfo] = useState({
    interactions: [],
    dosages: [],
    usage: '',
    description: '',
  });
  const [drugInfoLoading, setDrugInfoLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState({
    medications: 1,
    reminders: 1,
    history: 1,
    allReminders: 1,
  });

  // Sync reminders between useMedicationManager and useReminderManager
  useEffect(() => {
    fetchReminders();
    fetchRemindersFromManager();
  }, [fetchReminders, fetchRemindersFromManager]);

  // Initialize data on mount
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMedications();
    updateMedicationHistory();
  }, [user, navigate, fetchMedications, updateMedicationHistory]);

  // Auto-mark missed doses
  useEffect(() => {
    const interval = setInterval(() => {
      markDosesAsMissed();
    }, 60 * 1000);
    markDosesAsMissed();
    return () => clearInterval(interval);
  }, [markDosesAsMissed]);

  // Check for dose prompts and reminders
  useEffect(() => {
    const interval = setInterval(() => {
      checkDosesForPrompt();
      checkReminders();
    }, 60 * 1000);
    checkDosesForPrompt();
    checkReminders();
    return () => clearInterval(interval);
  }, [checkDosesForPrompt, checkReminders]);

  // Reset prompted doses daily
  useEffect(() => {
    const now = moment().local();
    const currentDateKey = now.format('YYYY-MM-DD');
    setPromptedDoses((prev) => {
      const newSet = new Set();
      prev.forEach((doseKey) => {
        const [_, date] = doseKey.split('-', 2);
        if (date === currentDateKey) {
          newSet.add(doseKey);
        }
      });
      return newSet;
    });
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleMedicationUpdated = (updatedMedication) => {
      dispatch({ type: 'UPDATE_MEDICATION', payload: updatedMedication });
    };

    const handleReminderSent = (reminder) => {
      toast(`Reminder: ${reminder.message}`);
    };

    socket.on('medicationUpdated', handleMedicationUpdated);
    socket.on('reminderSent', handleReminderSent);

    return () => {
      socket.off('medicationUpdated', handleMedicationUpdated);
      socket.off('reminderSent', handleReminderSent);
    };
  }, [socket, dispatch]);

  // Handle drug search
  const handleDrugSearch = async (query) => {
    setFormData((prev) => ({ ...prev, name: query }));
    if (query.length < 2) {
      setSearchState({ searchQuery: query, filteredDrugs: [], showDropdown: false });
      return;
    }
    try {
      const drugs = await searchDrugsByName(query);
      const filtered = drugs.filter(
        (drug) =>
          drug.displayName.toLowerCase().includes(query.toLowerCase()) ||
          drug.synonym.toLowerCase().includes(query.toLowerCase())
      );
      setSearchState({ searchQuery: query, filteredDrugs: filtered, showDropdown: true });
    } catch (error) {
      console.error('Error searching drugs:', error);
      setSearchState({ searchQuery: query, filteredDrugs: [], showDropdown: false });
    }
  };

  // Handle drug selection
  const handleDrugSelect = (drug) => {
    setFormData((prev) => ({ ...prev, name: drug.displayName }));
    setSearchState((prev) => ({ ...prev, showDropdown: false }));
  };

  // Open medication details
  const openMedicationDetail = async (med) => {
    setSelectedMedication(med);
    setDrugInfoLoading(true);
    try {
      const drugs = await searchDrugsByName(med.medication_name);
      const selectedDrug = drugs.find(
        (drug) => drug.name.toLowerCase() === med.medication_name.toLowerCase()
      );
      if (selectedDrug) {
        const drugDetails = await getDrugDetails(selectedDrug.id, selectedDrug.displayName);
        setDrugInfo(drugDetails);
      } else {
        setDrugInfo({ interactions: [], dosages: [], usage: '', description: 'No details available' });
      }
    } catch (error) {
      console.error('Error fetching drug details:', error);
      setDrugInfo({ interactions: [], dosages: [], usage: '', description: 'Failed to fetch details' });
    } finally {
      setDrugInfoLoading(false);
      openModal('showDetailModal');
    }
  };

  // Calculate progress for selected medication
  const calculateProgress = () => {
    if (!selectedMedication) return 0;
    const start = moment(selectedMedication.start_date);
    const end = moment(selectedMedication.end_date);
    const totalDays = end.diff(start, 'days') + 1;
    const daysPassed = moment().diff(start, 'days');
    return Math.min(100, Math.round((daysPassed / totalDays) * 100));
  };

  // Calculate days remaining
  const calculateDaysRemaining = () => {
    if (!selectedMedication) return 0;
    const end = moment(selectedMedication.end_date);
    const today = moment();
    return Math.max(0, end.diff(today, 'days'));
  };

  // Check for doses that need prompting
  const checkDosesForPrompt = useCallback(() => {
    if (!user) return;
    const now = moment().local();
    const currentDateKey = now.format('YYYY-MM-DD');

    for (const med of medications) {
      const doses = med.doses?.[currentDateKey] || [];
      if (!doses.length) continue;

      for (const dose of doses) {
        const doseIndex = dose.doseIndex;
        const { isTaken, isMissed, isWithinWindow } = getDoseStatus(med, doseIndex, new Date());
        const doseKey = `${med.id}-${currentDateKey}-${doseIndex}`;

        if (isTaken || isMissed || !isWithinWindow || promptedDoses.has(doseKey)) {
          continue;
        }

        const hasReminder = reminders.some((reminder) => {
          const reminderDateKey = reminder.type === 'daily' ? currentDateKey : reminder.date;
          return (
            reminder.medicationId === med.id &&
            reminder.doseIndex === doseIndex &&
            reminderDateKey === currentDateKey &&
            reminder.status !== 'sent'
          );
        });

        if (!hasReminder) {
          openModal('showTakePrompt', {
            medicationId: med.id,
            doseIndex,
            doseTime: dose.time,
          });
          setPromptedDoses((prev) => new Set(prev).add(doseKey));
          break;
        }
      }
    }
  }, [user, medications, reminders, getDoseStatus, promptedDoses, openModal]);

  // Calculate dose status for display
  const calculateDoseStatus = (med) => {
    const dateKey = moment(selectedDate).format('YYYY-MM-DD');
    const doses = med.doses?.[dateKey] || med.times.map((time, index) => ({
      time,
      taken: false,
      missed: false,
      takenAt: null,
      doseIndex: index,
    }));
    const totalDoses = doses.length;
    const takenDoses = doses.filter((dose) => dose.taken).length;
    const missedDoses = doses.filter((dose) => dose.missed).length;
    return { totalDoses, takenDoses, missedDoses };
  };

  // Memoized computations for rendering
  const timeofdaymeds = getMedicationsByTimeOfDay;
  const dailyDoses = useMemo(() => {
    return medications
      .flatMap((med) => {
        const dateKey = moment(selectedDate).format('YYYY-MM-DD');
        const doses = med.doses?.[dateKey] || [];
        return doses.map((dose) => ({
          ...med,
          doseTime: dose.time,
          doseIndex: dose.doseIndex,
          timeOfDay: (() => {
            const [hours] = dose.time.split(':').map(Number);
            if (hours >= 5 && hours < 12) return 'Morning';
            if (hours >= 12 && hours < 17) return 'Afternoon';
            return 'Evening';
          })(),
        }));
      })
      .filter(Boolean);
  }, [medications, selectedDate]);

  const effectiveReminders = useMemo(() => {
    const selectedDateKey = moment(selectedDate).format('YYYY-MM-DD');
    return reminders
      .map((reminder) => {
        if (reminder.type === 'daily') {
          return { ...reminder, effectiveDate: selectedDateKey };
        }
        return { ...reminder, effectiveDate: reminder.date };
      })
      .filter((reminder) => reminder.effectiveDate === selectedDateKey);
  }, [reminders, selectedDate]);

  // Validate dose prompts and reminders for current time (02:04 PM +08, May 28, 2025)
  // Example: Medication ID 13 (8 HR acetaminophen) with dose at 05:00:00
  // Window: 03:00–07:00 AM (passed by 02:04 PM), should be marked as missed
  // Medication ID 14 (adamol) with dose at 13:00:00
  // Window: 11:00 AM–03:00 PM (current time within window), should prompt if not taken

  if (loading || reminderLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <Header
        user={user}
        onViewAllReminders={() => openModal('showAllRemindersModal')}
        onViewChecklist={() => openModal('showChecklistModal')}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <div className="flex flex-col lg:space-x-6 space-y-6 lg:space-y-0">
        <div className="flex flex-col lg:flex-row lg:space-x-6 space-y-6 lg:space-y-0 w-full gap-2">
          <div className="flex flex-col space-y-3 lg:w-2/3 md:w-2/3 w-full justify-center">
            <TimeOfDaySection
              title="Morning"
              meds={timeofdaymeds}
              icon={<WiDaySunnyOvercast style={{ fontSize: '1.5rem', color: '#ffca28' }} />}
              reminders={effectiveReminders}
              setShowReminderModal={(data) => openModal('showReminderModal', data)}
              setSelectedMedication={setSelectedMedication}
              getDoseStatus={getDoseStatus}
            />
          </div>
          <div className="lg:w-1/3 md:w-1/3 sm:w-full">
            <CalendarSection
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              isFutureDate={isFutureDate}
            />
          </div>
        </div>
        <div className="flex flex-col lg:space-x-6 space-y-6 lg:space-y-0 w-full gap-4 mt-4">
          <MedicationList
            medications={medications}
            loading={loading}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            calculateDoseStatus={calculateDoseStatus}
            onAddMedication={() => openModal('showAddModal')}
            openMedicationDetail={openMedicationDetail}
            setShowTakeModal={(data) => openModal('showTakeModal', data)}
            setShowUndoModal={(data) => openModal('showUndoModal', data)}
            confirmDeleteMedication={(medicationId) => openModal('showDeleteModal', medicationId)}
            actionLoading={actionLoading}
            searchQuery={searchQuery}
            getDoseStatus={getDoseStatus}
            confirmTakenStatus={(medicationId, doseIndex, taken) => {
              openModal('showConfirmModal', {
                message: taken
                  ? 'Are you sure you want to mark this dose as taken?'
                  : 'Not yet taken your medication?',
                action: () => updateDoseStatus(medicationId, doseIndex, taken, selectedDate),
              });
            }}
            selectedDate={selectedDate}
            isPastDate={isPastDate}
            isFutureDate={isFutureDate}
          />
          <RemindersSection
            reminders={effectiveReminders}
            medications={medications}
            selectedDate={selectedDate}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            handleMarkReminderAsSent={handleMarkReminderAsSent}
            handleDeleteReminder={deleteReminder}
            setEditReminderModal={(data) => openModal('editReminderModal', data)}
            setReminderTime={(value) => setFormData((prev) => ({ ...prev, reminderTime: value }))}
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

      {/* Floating Help Icon */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
        onClick={() => openModal('showHelpPopup')}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          backgroundColor: '#1a73e8',
          color: 'white',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          cursor: 'pointer',
          zIndex: 1100,
          opacity: '70%',
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Open help information"
      >
        <FiHelpCircle style={{ fontSize: '24px', opacity: '70%' }} />
      </motion.button>

      {/* Modals */}
      <AnimatePresence>
        {modals.showAddModal && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
          >
            <AddMedicationModal
              isOpen={modals.showAddModal}
              onRequestClose={() => closeModal('showAddModal')}
              name={formData.name}
              setName={(value) => setFormData((prev) => ({ ...prev, name: value }))}
              frequency={formData.frequency}
              setFrequency={(value) => setFormData((prev) => ({ ...prev, frequency: value }))}
              dosage={formData.dosage}
              setDosage={(value) => setFormData((prev) => ({ ...prev, dosage: value }))}
              timesPerDay={formData.timesPerDay}
              setTimesPerDay={(value) => setFormData((prev) => ({ ...prev, timesPerDay: value }))}
              startDate={formData.startDate}
              setStartDate={(value) => setFormData((prev) => ({ ...prev, startDate: value }))}
              endDate={formData.endDate}
              setEndDate={(value) => setFormData((prev) => ({ ...prev, endDate: value }))}
              notes={formData.notes}
              setNotes={(value) => setFormData((prev) => ({ ...prev, notes: value }))}
              handleAddMedication={async (e, doseTimes) => {
                try {
                  const createdMedication = await addMedication(
                    {
                      medication_name: formData.name,
                      frequency: formData.frequency,
                      dosage: formData.dosage,
                      times_per_day: parseInt(formData.timesPerDay),
                      start_date: formData.startDate,
                      end_date: formData.endDate,
                      notes: formData.notes,
                    },
                    doseTimes
                  );
                  setFormData({
                    name: '',
                    frequency: 'daily',
                    dosage: '',
                    timesPerDay: '1',
                    startDate: '',
                    endDate: '',
                    notes: '',
                    reminderTime: '',
                    isRecurringReminder: false,
                  });
                  closeModal('showAddModal');
                  setSelectedMedication(createdMedication);
                  setDrugInfo(createdMedication.drugInfo || { interactions: [], dosages: [], usage: '', description: '' });
                  openModal('showDetailModal');
                } catch (error) {
                  console.error('Failed to add medication:', error);
                }
              }}
              actionLoading={actionLoading}
              filteredDrugs={searchState.filteredDrugs}
              showDropdown={searchState.showDropdown}
              handleDrugSearch={handleDrugSearch}
              setShowDropdown={(value) => setSearchState((prev) => ({ ...prev, showDropdown: value }))}
              handleDrugSelect={handleDrugSelect}
              onMedicationAdded={(data) => {
                setSelectedMedication(data);
                setDrugInfo(data.drugInfo || { interactions: [], dosages: [], usage: '', description: '' });
                openModal('showDetailModal');
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modals.showDetailModal && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
          >
            <MedicationDetailModal
              isOpen={modals.showDetailModal}
              onRequestClose={() => closeModal('showDetailModal')}
              selectedMedication={selectedMedication}
              drugInfo={drugInfo}
              drugInfoLoading={drugInfoLoading}
              calculateProgress={calculateProgress}
              calculateDaysRemaining={calculateDaysRemaining}
              getDoseStatus={getDoseStatus}
              confirmTakenStatus={(medicationId, doseIndex, taken) => {
                openModal('showConfirmModal', {
                  message: taken
                    ? 'Are you sure you want to mark this dose as taken?'
                    : 'Not yet taken your medication?',
                  action: () => updateDoseStatus(medicationId, doseIndex, taken, selectedDate),
                });
              }}
              actionLoading={actionLoading}
              isPastDate={isPastDate}
              isFutureDate={isFutureDate}
              selectedDate={selectedDate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modals.showChecklistModal && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
          >
            <DailyChecklistModal
              isOpen={modals.showChecklistModal}
              onRequestClose={() => closeModal('showChecklistModal')}
              dailyDoses={dailyDoses}
              selectedDate={selectedDate}
              getDoseStatus={getDoseStatus}
              confirmTakenStatus={(medicationId, doseIndex, taken) => {
                openModal('showConfirmModal', {
                  message: taken
                    ? 'Are you sure you want to mark this dose as taken?'
                    : 'Not yet taken your medication?',
                  action: () => updateDoseStatus(medicationId, doseIndex, taken, selectedDate),
                });
              }}
              actionLoading={actionLoading}
              isPastDate={isPastDate}
              isFutureDate={isFutureDate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modals.showConfirmModal && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
          >
            <ConfirmModal
              isOpen={modals.showConfirmModal}
              onRequestClose={() => closeModal('showConfirmModal')}
              message={modals.showConfirmModal.message}
              onConfirm={modals.showConfirmModal.action}
              actionLoading={actionLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modals.showDeleteConfirmModal && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
          >
            <DeleteConfirmModal
              isOpen={modals.showDeleteConfirmModal}
              onRequestClose={() => closeModal('showDeleteConfirmModal')}
              onConfirm={() => deleteMedication(modals.showDeleteModal)}
              actionLoading={actionLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modals.showAllRemindersModal && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
          >
            <AllRemindersModal
              isOpen={modals.showAllRemindersModal}
              onRequestClose={() => closeModal('showAllRemindersModal')}
              reminders={reminders}
              medications={medications}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={ITEMS_PER_PAGE}
              handleMarkReminderAsSent={handleMarkReminderAsSent}
              handleDeleteReminder={deleteReminder}
              setEditReminderModal={(data) => openModal('editReminderModal', data)}
              setReminderTime={(value) => setFormData((prev) => ({ ...prev, reminderTime: value }))}
              selectedDate={selectedDate}
              actionLoading={actionLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modals.showReminderModal && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
          >
            <SetReminderModal
              isOpen={!!modals.showReminderModal}
              onRequestClose={() => closeModal('showReminderModal')}
              reminderTime={formData.reminderTime}
              setReminderTime={(value) => setFormData((prev) => ({ ...prev, reminderTime: value }))}
              isRecurringReminder={formData.isRecurringReminder}
              setIsRecurringReminder={(value) => setFormData((prev) => ({ ...prev, isRecurringReminder: value }))}
              handleSetReminder={(e) => {
                createNewReminder({
                  medicationId: modals.showReminderModal.medicationId,
                  doseIndex: modals.showReminderModal.doseIndex,
                  reminderTime: formData.reminderTime,
                  date: moment(selectedDate).format('YYYY-MM-DD'),
                  type: formData.isRecurringReminder ? 'daily' : 'single',
                });
                closeModal('showReminderModal');
              }}
              showReminderModal={modals.showReminderModal}
              actionLoading={actionLoading}
              selectedDate={selectedDate}
              medication={medications.find((m) => m.id === modals.showReminderModal?.medicationId)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modals.showAddReminderPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
          >
            <AddReminderPromptModal
              isOpen={!!modals.showAddReminderPrompt}
              onRequestClose={() => closeModal('showAddReminderPrompt')}
              showAddReminderPrompt={modals.showAddReminderPrompt}
              setShowReminderModal={(data) => openModal('showReminderModal', data)}
              selectedDate={selectedDate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modals.editReminderModal && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
          >
            <EditReminderModal
              isOpen={!!modals.editReminderModal}
              onRequestClose={() => closeModal('editReminderModal')}
              reminderTime={formData.reminderTime}
              setReminderTime={(value) => setFormData((prev) => ({ ...prev, reminderTime: value }))}
              isRecurringReminder={formData.isRecurringReminder}
              setIsRecurringReminder={(value) => setFormData((prev) => ({ ...prev, isRecurringReminder: value }))}
              handleUpdateReminder={(e) => {
                // Implement update reminder logic if needed
                closeModal('editReminderModal');
              }}
              actionLoading={actionLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modals.showTakeModal && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
          >
            <TakeMedicationModal
              isOpen={!!modals.showTakeModal}
              onRequestClose={() => closeModal('showTakeModal')}
              showTakeModal={modals.showTakeModal}
              medications={medications}
              selectedDate={selectedDate}
              getDoseStatus={getDoseStatus}
              confirmTakenStatus={(medicationId, doseIndex, taken) => {
                openModal('showConfirmModal', {
                  message: taken
                    ? 'Are you sure you want to mark this dose as taken?'
                    : 'Not yet taken your medication?',
                  action: () => updateDoseStatus(medicationId, doseIndex, taken, selectedDate),
                });
              }}
              actionLoading={actionLoading}
              isPastDate={isPastDate}
              isFutureDate={isFutureDate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modals.showDeleteModal && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
          >
            <DeleteMedicationModal
              isOpen={!!modals.showDeleteModal}
              onRequestClose={() => closeModal('showDeleteModal')}
              medicationId={modals.showDeleteModal}
              medications={medications}
              confirmDeleteMedication={() => deleteMedication(modals.showDeleteModal)}
              actionLoading={actionLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modals.showUndoModal && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
          >
            <UndoTakenMedicationModal
              isOpen={!!modals.showUndoModal}
              onRequestClose={() => closeModal('showUndoModal')}
              showUndoModal={modals.showUndoModal}
              medications={medications}
              selectedDate={selectedDate}
              getDoseStatus={getDoseStatus}
              confirmTakenStatus={(medicationId, doseIndex, taken) => {
                openModal('showConfirmModal', {
                  message: taken
                    ? 'Are you sure you want to mark this dose as taken?'
                    : 'Not yet taken your medication?',
                  action: () => updateDoseStatus(medicationId, doseIndex, taken, selectedDate),
                });
              }}
              actionLoading={actionLoading}
              isPastDate={isPastDate}
              isFutureDate={isFutureDate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modals.showTakePrompt && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
          >
            <TakePromptModal
              isOpen={!!modals.showTakePrompt}
              onRequestClose={() => closeModal('showTakePrompt')}
              medication={medications.find((m) => m.id === modals.showTakePrompt.medicationId)}
              doseIndex={modals.showTakePrompt.doseIndex}
              doseTime={modals.showTakePrompt.doseTime}
              onTake={() => {
                openModal('showTakeModal', {
                  medicationId: modals.showTakePrompt.medicationId,
                  doseIndex: modals.showTakePrompt.doseIndex,
                });
                closeModal('showTakePrompt');
              }}
              actionLoading={actionLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modals.showHelpPopup && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <HelpPopup
              isOpen={modals.showHelpPopup}
              onRequestClose={() => closeModal('showHelpPopup')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MedicationTracker;