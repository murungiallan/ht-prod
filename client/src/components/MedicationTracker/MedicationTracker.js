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

Modal.setAppElement("#root");

const CalendarContainer = styled.div`
  width: 100%;
  margin-top: 1rem;
  background-color: #ffffff;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid #e0e0e0;

  .react-calendar {
    border: none;
    background: transparent;
    font-family: inherit;
    width: 100%;

    &__viewContainer {
      width: 100%;
    }

    &__navigation {
      display: flex;
      margin-bottom: 1rem;

      &__label {
        font-weight: 600;
        color: #333;
        flex-grow: 1;
        text-align: center;
        font-size: 1.125rem; /* 18px */
      }

      &__arrow {
        background-color: #f0f0f0;
        color: #333;
        border-radius: 0.25rem;
        padding: 0.375rem;
        border: 1px solid #e0e0e0;
        width: 1.875rem;
        height: 1.875rem;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background-color: #e5e5e5;
        }
        &:active {
          background-color: #d9d9d9;
        }
      }
    }

    &__month-view {
      width: 100%;

      &__weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        width: 100%;
        text-align: center;
        color: #555;
        font-weight: 500;
        margin-bottom: 0.5rem;

        abbr {
          text-decoration: none;
          border-bottom: none;
        }

        &__weekday {
          padding: 0.3125rem 0;
          box-sizing: border-box;
          font-size: 0.875rem; /* 14px */
        }
      }

      &__days {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        width: 100%;
        gap: 0.25rem;
      }
    }

    &__tile {
      padding: 0.625rem 0;
      background-color: #f8f8f8;
      color: #333;
      border-radius: 0.25rem;
      border: 1px solid #eaeaea;
      box-sizing: border-box;
      aspect-ratio: 1/1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem; /* 14px */

      &:hover {
        background-color: #e9e9e9;
        border-color: #d0d0d0;
      }
      &:active {
        background-color: #d9d9d9;
      }
      &--active {
        background-color: #e6e6e6;
        color: #000;
        border-color: #ccc;
        font-weight: 600;
      }
      &--range {
        box-shadow: 0 0 4px 1px rgba(0, 0, 0, 0.1);
      }
    }

    &__month-view__days__day--neighboringMonth {
      opacity: 0.55;
      color: #777;
    }

    &__month-view__days__day--weekend {
      color: #555;
    }
  }
`;

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
  padding: "20px",
};

const ModalContentWrapper = {
  background: "white",
  color: "black",
  width: "90%",
  maxWidth: "500px",
  maxHeight: "80vh",
  margin: "auto",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "1.5rem",
  position: "relative",
  overflowY: "auto",
  boxSizing: "border-box",
};

const MedicationTracker = () => {
  const { user } = useContext(AuthContext);
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

  useEffect(() => {
    const fetchMedications = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const token = await auth.currentUser.getIdToken(true);
        const userMedications = await getUserMedications(token);
        console.log("Fetched medications:", userMedications);
        setMedications(userMedications);
      } catch (err) {
        toast.error("Failed to load medications");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchMedications();
  }, [user, selectedMedication?.id]);

  const calculateTimes = (timesPerDay) => {
    const times = [];
    const startHour = 8;

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
      return;
    }
    if (!name || !frequency || !dosage || !timesPerDay || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const attemptRequest = async (retry = true) => {
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
        setName("");
        setFrequency("daily");
        setDosage("");
        setTimesPerDay("1");
        setStartDate("");
        setEndDate("");
        setNotes("");
        setShowAddModal(false);
        toast.success("Medication added successfully");
      } catch (err) {
        if (err.response?.status === 401 && retry) {
          await auth.currentUser.getIdToken(true);
          return attemptRequest(false);
        }
        toast.error("Failed to add medication");
        console.error(err);
      }
    };

    await attemptRequest();
  };

  const handleDeleteMedication = async (id) => {
    try {
      const token = await auth.currentUser.getIdToken(true);
      await deleteMedication(id, token);
      setMedications((prev) => prev.filter((med) => med.id !== id));
      if (selectedMedication?.id === id) setShowDetailModal(false);
      toast.success(`Medication deleted successfully`);
    } catch (err) {
      toast.error("Failed to delete medication");
      console.error(err);
    }
  };

  const handleUpdateTakenStatus = async (id, doseIndex, taken) => {
    try {
      const token = await auth.currentUser.getIdToken(true);
      const updatedMedication = await updateMedicationTakenStatus(id, doseIndex, taken, token);
      setMedications((prev) =>
        prev.map((med) => (med.id === updatedMedication.id ? updatedMedication : med))
      );
      if (selectedMedication?.id === updatedMedication.id) {
        setSelectedMedication(updatedMedication);
      }
      toast.success(`Medication status updated`);
    } catch (err) {
      toast.error("Failed to update medication status");
      console.error(err);
    }
  };

  const handleMarkAsMissed = async (id, doseIndex, missed) => {
    try {
      const token = await auth.currentUser.getIdToken(true);
      const updatedMedication = await markMedicationAsMissed(id, doseIndex, missed, token);
      setMedications((prev) =>
        prev.map((med) => (med.id === updatedMedication.id ? updatedMedication : med))
      );
      if (selectedMedication?.id === updatedMedication.id) {
        setSelectedMedication(updatedMedication);
      }
      toast.success(missed ? "Medication marked as missed" : "Missed status undone");
    } catch (err) {
      toast.error("Failed to update missed status");
      console.error(err);
    }
  };

  const confirmTakenStatus = (id, doseIndex, taken) => {
    setConfirmMessage(`Did you ${taken ? "take" : "undo taking"} your medicine?`);
    setConfirmAction(() => () => handleUpdateTakenStatus(id, doseIndex, taken));
    setShowConfirmModal(true);
  };

  const confirmMissedStatus = (id, doseIndex, missed) => {
    setConfirmMessage(`Did you ${missed ? "miss" : "undo missing"} your medicine?`);
    setConfirmAction(() => () => handleMarkAsMissed(id, doseIndex, missed));
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

  const calculateProgress = () => Math.floor(Math.random() * 100);
  const calculateDaysRemaining = () => Math.floor(Math.random() * 30) + 1;

  const filteredMeds = (timeOfDay) =>
    medications.flatMap((med) => {
      const doses = Array.isArray(med.doses) ? med.doses : [];
      return doses
        .map((dose, index) => {
          if (!dose || !dose.time) {
            return null;
          }

          const medHour = parseInt(dose.time.split(":")[0], 10);
          let doseTimeOfDay = "morning";
          if (medHour >= 12 && medHour < 17) doseTimeOfDay = "afternoon";
          else if (medHour >= 17) doseTimeOfDay = "evening";

          const medMoment = moment(med.start_date || med.createdAt);
          const selectedMoment = moment(selectedDate);
          if (
            doseTimeOfDay === timeOfDay &&
            medMoment.isSame(selectedMoment, "day")
          ) {
            return {
              ...med,
              doseIndex: index,
              doseTime: dose.time,
              doseTaken: dose.taken ?? false,
              doseMissed: dose.missed ?? false,
            };
          }
          return null;
        })
        .filter(Boolean);
    });

  const getDailyDoses = () => {
    return medications.flatMap((med) => {
      const doses = Array.isArray(med.doses) ? med.doses : [];
      const medMoment = moment(med.start_date || med.createdAt);
      const selectedMoment = moment(selectedDate);
      if (medMoment.isSame(selectedMoment, "day")) {
        return doses.map((dose, index) => ({
          ...med,
          doseIndex: index,
          doseTime: dose?.time || "Unknown time",
          doseTaken: dose?.taken ?? false,
          doseMissed: dose?.missed ?? false,
        }));
      }
      return [];
    });
  };

  const morningMeds = filteredMeds("morning");
  const afternoonMeds = filteredMeds("afternoon");
  const eveningMeds = filteredMeds("evening");
  const dailyDoses = getDailyDoses();

  const isPastDate = (date) => moment(date).isBefore(moment(), "day");

  const calculateDoseStatus = (med) => {
    const doses = Array.isArray(med.doses) ? med.doses : [];
    const totalDoses = doses.length;
    const takenDoses = doses.filter((dose) => dose?.taken).length;
    const missedDoses = doses.filter((dose) => dose?.missed).length;
    return { totalDoses, takenDoses, missedDoses };
  };

  return (
    <div className="min-h-screen max-w-7xl mx-auto bg-gray-100 text-gray-900 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Hello, {user?.displayName || "User"}
        </h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
          Track your medications with ease
        </p>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row lg:space-x-6 mb-6">
        {/* Calendar Section */}
        <div className="w-full lg:w-1/3 mb-6 lg:mb-0">
          <CalendarContainer>
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              showNeighboringMonth={true}
              showFixedNumberOfWeeks={false}
            />
          </CalendarContainer>
        </div>

        {/* Time of Day Sections */}
        <div className="w-full lg:w-2/3 flex flex-col space-y-4">
          {[
            {
              id: "morning",
              title: (
                <span className="flex items-center">
                  <WiDaySunnyOvercast className="mr-2 text-xl sm:text-2xl" /> Morning
                </span>
              ),
              meds: morningMeds,
            },
            {
              id: "afternoon",
              title: (
                <span className="flex items-center">
                  <WiDaySunny className="mr-2 text-xl sm:text-2xl" /> Afternoon
                </span>
              ),
              meds: afternoonMeds,
            },
            {
              id: "evening",
              title: (
                <span className="flex items-center">
                  <WiDayWindy className="mr-2 text-xl sm:text-2xl" /> Evening
                </span>
              ),
              meds: eveningMeds,
            },
          ].map(({ id, title, meds }) => (
            <div
              key={id}
              className="bg-white rounded-lg p-4 shadow-md border border-gray-200"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3">
                {title}
              </h2>
              {meds.length === 0 ? (
                <p className="text-gray-500 text-sm sm:text-base">
                  No {id} medications
                </p>
              ) : (
                meds.map((med) => (
                  <div
                    key={`${med.id}-${med.doseIndex}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 last:border-0"
                  >
                    <div className="mb-2 sm:mb-0">
                      <span className="text-gray-900 text-sm sm:text-base font-medium">
                        {med.dosage} of {med.medication_name} should be taken{" "}
                        {med.times_per_day} time{med.times_per_day > 1 ? "s" : ""} a day
                      </span>
                      <div className="text-xs text-gray-500">
                        Frequency: {med.frequency}, Time: {med.doseTime}
                      </div>
                    </div>
                    {isPastDate(selectedDate) ? (
                      <span
                        className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                          med.doseTaken
                            ? "bg-gray-600 text-white"
                            : med.doseMissed
                            ? "bg-gray-500 text-white"
                            : "bg-gray-300 text-gray-800"
                        }`}
                      >
                        {med.doseTaken ? "Taken" : med.doseMissed ? "Skipped" : "Not Taken"}
                      </span>
                    ) : (
                      <button
                        onClick={() => confirmTakenStatus(med.id, med.doseIndex, !med.doseTaken)}
                        className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 ${
                          med.doseTaken
                            ? "bg-gray-600 text-white hover:bg-gray-700"
                            : "bg-gray-300 text-gray-800 hover:bg-gray-400"
                        }`}
                      >
                        {med.doseTaken ? "Taken" : "Take"}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Medications Table Section */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-0">
            Your Medications
          </h2>
          <div className="flex flex-col sm:flex-row sm:space-y-0 w-1/4 sm:w-auto items-center justify-center gap-2">
            <button
              onClick={() => setShowChecklistModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm sm:text-base font-semibold hover:bg-green-800 transition-colors duration-200 w-1/4 sm:w-auto"
            >
              View Daily Checklist
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-800 transition-colors duration-200 w-1/4 sm:w-auto"
            >
              + Add Medication
            </button>
          </div>
        </div>
        {loading ? (
          <p className="text-gray-600 text-center py-4 text-sm sm:text-base">
            Loading medications...
          </p>
        ) : medications.length === 0 ? (
          <p className="text-gray-600 text-center py-4 text-sm sm:text-base">
            No medications added yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="py-3 px-2 sm:px-4 font-semibold">Name</th>
                  <th className="py-3 px-2 sm:px-4 font-semibold">Times</th>
                  <th className="py-3 px-2 sm:px-4 font-semibold">Dosage</th>
                  <th className="py-3 px-2 sm:px-4 font-semibold">Status</th>
                  <th className="py-3 px-2 sm:px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {medications.map((med) => {
                  const { totalDoses, takenDoses, missedDoses } = calculateDoseStatus(med);
                  return (
                    <tr
                      key={med.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => openMedicationDetail(med)}
                    >
                      <td className="py-3 px-2 sm:px-4">
                        <div className="font-medium text-gray-900 text-sm sm:text-base">
                          {med.medication_name}
                        </div>
                        <div className="text-xs text-gray-500">{med.frequency}</div>
                      </td>
                      <td className="py-3 px-2 sm:px-4 capitalize text-gray-900 text-sm sm:text-base">
                        {(Array.isArray(med.times) ? med.times : []).join(", ")} (
                        {med.times_per_day} times/day)
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-gray-900 text-sm sm:text-base">
                        {med.dosage}
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <span className="text-xs text-gray-600">
                          Taken: {takenDoses}/{totalDoses}, Missed: {missedDoses}
                        </span>
                      </td>
                      <td
                        className="py-3 px-2 sm:px-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              confirmTakenStatus(med.id, 0, !(med.doses[0]?.taken ?? false))
                            }
                            disabled={med.doses[0]?.missed ?? false}
                            className={`px-3 py-1 rounded text-xs sm:text-sm font-semibold transition-colors duration-200 ${
                              med.doses[0]?.taken
                                ? "bg-gray-300 text-gray-800 hover:bg-gray-400"
                                : "bg-gray-600 text-white hover:bg-gray-700"
                            } ${med.doses[0]?.missed ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            {med.doses[0]?.taken ? "Undo" : "Take"}
                          </button>
                          <button
                            onClick={() =>
                              confirmMissedStatus(med.id, 0, !(med.doses[0]?.missed ?? false))
                            }
                            disabled={med.doses[0]?.taken ?? false}
                            className={`px-3 py-1 rounded text-xs sm:text-sm font-semibold transition-colors duration-200 ${
                              med.doses[0]?.missed
                                ? "bg-gray-300 text-gray-800 hover:bg-gray-400"
                                : "bg-gray-500 text-white hover:bg-gray-600"
                            } ${med.doses[0]?.taken ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            {med.doses[0]?.missed ? "Undo" : "Miss"}
                          </button>
                          <button
                            onClick={() => handleDeleteMedication(med.id)}
                            className="px-3 py-1 rounded bg-gray-800 text-white hover:bg-gray-900 text-xs sm:text-sm font-semibold transition-colors duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Add Medication</h2>
        <form onSubmit={handleAddMedication} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medication Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            />
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
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded bg-gray-300 text-gray-800 hover:bg-gray-400 text-sm sm:text-base font-semibold transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-gray-900 text-white hover:bg-gray-800 text-sm sm:text-base font-semibold transition-colors duration-200"
            >
              {loading ? "Adding..." : "Add"}
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
            {selectedMedication.notes ||
              `Solgar's ${selectedMedication.medication_name} ${selectedMedication.dosage}. High concentration of EPA and DHA. Supports cardiovascular, joint, and brain health. Molecularly distilled for purity.`}
          </p>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{calculateProgress()}% complete</span>
              <span>{calculateDaysRemaining()} days/60 days</span>
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
            ).map((dose, index) => (
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
                        !(dose?.taken ?? false)
                      )
                    }
                    disabled={dose?.missed ?? false}
                    className={`px-2 py-1 rounded text-xs font-semibold transition-colors duration-200 ${
                      dose?.taken
                        ? "bg-gray-300 text-gray-800 hover:bg-gray-400"
                        : "bg-gray-600 text-white hover:bg-gray-700"
                    } ${dose?.missed ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {dose?.taken ? "Undo" : "Take"}
                  </button>
                  <button
                    onClick={() =>
                      confirmMissedStatus(
                        selectedMedication.id,
                        index,
                        !(dose?.missed ?? false)
                      )
                    }
                    disabled={dose?.taken ?? false}
                    className={`px-2 py-1 rounded text-xs font-semibold transition-colors duration-200 ${
                      dose?.missed
                        ? "bg-gray-300 text-gray-800 hover:bg-gray-400"
                        : "bg-gray-500 text-white hover:bg-gray-600"
                    } ${dose?.taken ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {dose?.missed ? "Undo" : "Miss"}
                  </button>
                </div>
              </div>
            ))}
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
                      Frequency: {dose.frequency}, Time: {dose.doseTime}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                        dose.doseTaken
                          ? "bg-gray-600 text-white"
                          : dose.doseMissed
                          ? "bg-gray-500 text-white"
                          : "bg-gray-300 text-gray-800"
                      }`}
                    >
                      {dose.doseTaken
                        ? "Taken"
                        : dose.doseMissed
                        ? "Missed"
                        : "Pending"}
                    </span>
                    {!isPastDate(selectedDate) && (
                      <>
                        <button
                          onClick={() =>
                            confirmTakenStatus(
                              dose.id,
                              dose.doseIndex,
                              !dose.doseTaken
                            )
                          }
                          disabled={dose.doseMissed}
                          className={`px-2 py-1 rounded text-xs sm:text-sm font-semibold transition-colors duration-200 ${
                            dose.doseTaken
                              ? "bg-gray-300 text-gray-800 hover:bg-gray-400"
                              : "bg-gray-600 text-white hover:bg-gray-700"
                          } ${
                            dose.doseMissed ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {dose.doseTaken ? "Undo" : "Take"}
                        </button>
                        <button
                          onClick={() =>
                            confirmMissedStatus(
                              dose.id,
                              dose.doseIndex,
                              !dose.doseMissed
                            )
                          }
                          disabled={dose.doseTaken}
                          className={`px-2 py-1 rounded text-xs sm:text-sm font-semibold transition-colors duration-200 ${
                            dose.doseMissed
                              ? "bg-gray-300 text-gray-800 hover:bg-gray-400"
                              : "bg-gray-500 text-white hover:bg-gray-600"
                          } ${
                            dose.doseTaken ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {dose.doseMissed ? "Undo" : "Miss"}
                        </button>
                      </>
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
              className="px-4 py-2 rounded bg-gray-300 text-gray-800 hover:bg-gray-400 text-sm sm:text-base font-semibold transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAction}
              className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-800 text-sm sm:text-base font-semibold transition-colors duration-200"
            >
              Confirm
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MedicationTracker;