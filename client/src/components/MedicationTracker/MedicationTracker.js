import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
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

const MedicationTracker = () => {
    const { user } = useContext(AuthContext);
    const { socket } = useSocket();
    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedMedication, setSelectedMedication] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [name, setName] = useState("");
    const [frequency, setFrequency] = useState("");
    const [dosage, setDosage] = useState("");
    const [timeOfDay, setTimeOfDay] = useState("morning");

    useEffect(() => {
        const fetchMedications = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const token = await auth.currentUser.getIdToken(true);
                const userMedications = await getUserMedications(token);
                setMedications(userMedications);
            } catch (err) {
                toast.error("Failed to load medications");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchMedications();

        if (!socket) return;

        socket.on("medicationAdded", (newMedication) => {
            setMedications((prev) => [newMedication, ...prev]);
            toast.success(`New medication added: ${newMedication.name}`);
        });

        socket.on("medicationUpdated", (updatedMedication) => {
            setMedications((prev) =>
                prev.map((med) => (med.id === updatedMedication.id ? updatedMedication : med))
            );
            if (selectedMedication?.id === updatedMedication.id) {
                setSelectedMedication(updatedMedication);
            }
            toast.success(`Medication updated: ${updatedMedication.name}`);
        });

        socket.on("medicationDeleted", (id) => {
            setMedications((prev) => prev.filter((med) => med.id !== id));
            if (selectedMedication?.id === id) setShowDetailModal(false);
            toast.success("Medication deleted");
        });

        return () => {
            socket.off("medicationAdded");
            socket.off("medicationUpdated");
            socket.off("medicationDeleted");
        };
    }, [user, socket, selectedMedication?.id]);

    const handleAddMedication = async (e) => {
        e.preventDefault();
        if (!user) {
            toast.error("You must be logged in to add a medication");
            return;
        }
        if (!name || !frequency || !dosage) {
            toast.error("Please fill in all fields");
            return;
        }
        try {
            const token = await auth.currentUser.getIdToken(true);
            const newMedication = {
                name,
                frequency,
                dosage,
                timeOfDay,
                createdAt: new Date().toISOString(),
            };
            const createdMedication = await createMedication(newMedication, token);
            socket.emit("medicationAdded", createdMedication);
            setName("");
            setFrequency("");
            setDosage("");
            setTimeOfDay("morning");
            setShowAddModal(false);
            toast.success("Medication added successfully");
        } catch (err) {
            toast.error("Failed to add medication");
            console.error(err);
        }
    };

    const handleDeleteMedication = async (id) => {
        try {
            const token = await auth.currentUser.getIdToken(true);
            await deleteMedication(id, token);
            socket.emit("medicationDeleted", id);
        } catch (err) {
            toast.error("Failed to delete medication");
            console.error(err);
        }
    };

    const handleUpdateTakenStatus = async (id, taken) => {
        try {
            const token = await auth.currentUser.getIdToken(true);
            const updatedMedication = await updateMedicationTakenStatus(id, taken, token);
            socket.emit("medicationUpdated", updatedMedication);
        } catch (err) {
            toast.error("Failed to update medication status");
            console.error(err);
        }
    };

    const handleMarkAsMissed = async (id) => {
        try {
            const token = await auth.currentUser.getIdToken(true);
            const updatedMedication = await markMedicationAsMissed(id, token);
            socket.emit("medicationUpdated", updatedMedication);
        } catch (err) {
            toast.error("Failed to mark medication as missed");
            console.error(err);
        }
    };

    const openMedicationDetail = (med) => {
        setSelectedMedication(med);
        setShowDetailModal(true);
    };

    const calculateProgress = () => Math.floor(Math.random() * 100);
    const calculateDaysRemaining = () => Math.floor(Math.random() * 30) + 1;

    const filteredMeds = (time) =>
        medications.filter((med) => {
            const medTime = med.timeOfDay || "morning";
            const medMoment = moment(med.createdAt);
            const selectedMoment = moment(selectedDate);
            return (
                medTime === time &&
                medMoment.isSame(selectedMoment, "day") // Match exact day
            );
        });

    const morningMeds = filteredMeds("morning");
    const afternoonMeds = filteredMeds("afternoon");
    const eveningMeds = filteredMeds("evening");

    const isPastDate = (date) => moment(date).isBefore(moment(), "day");

    const CalendarContainer = styled.div`
        max-width: 100%;
        margin-top: 20px;
        background-color: #ffffff;
        padding: 16px;
        border-radius: 8px;
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
                margin-bottom: 16px;

                &__label {
                    font-weight: 600;
                    color: #333;
                    flex-grow: 1;
                    text-align: center;
                }

                &__arrow {
                    background-color: #f0f0f0;
                    color: #333;
                    border-radius: 4px;
                    padding: 6px;
                    border: 1px solid #e0e0e0;
                    width: 30px;
                    height: 30px;
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
                    grid-template-columns: repeat(7, 1fr); /* 7 equal columns for Sun-Sat */
                    width: 100%;
                    text-align: center;
                    color: #555;
                    font-weight: 500;
                    margin-bottom: 8px;
                    
                    abbr {
                        text-decoration: none;
                        border-bottom: none;
                    }
                    
                    &__weekday {
                        padding: 5px 0;
                        box-sizing: border-box;
                    }
                }

                &__days {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr); /* 7 equal columns for dates */
                    width: 100%;
                    gap: 4px;
                }
            }

            &__tile {
                padding: 10px 0;
                background-color: #f8f8f8;
                color: #333;
                border-radius: 4px;
                border: 1px solid #eaeaea;
                box-sizing: border-box;
                aspect-ratio: 1/1;
                display: flex;
                align-items: center;
                justify-content: center;
                
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
    return (
        <div className="min-h-screen bg-gray-100 text-black p-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Hello, {user?.displayName || "User"}
                </h1>
                <p className="text-gray-600 mt-1">Track your medications with ease</p>
            </header>

            <div className="flex flex-col lg:flex-row lg:space-x-8 mb-8">
                <div className="flex-1">
                <CalendarContainer>
                    <Calendar
                        onChange={setSelectedDate}
                        value={selectedDate}
                        locale="en-US"
                        showNeighboringMonth={true}
                        showFixedNumberOfWeeks={true}
                    />
                </CalendarContainer>
                </div>
                <div className="flex-1 lg:flex lg:flex-col lg:space-y-6 mt-6 lg:mt-0">
                    {[
                        { 
                            title: (
                                <span className="flex items-center">
                                    <WiDaySunnyOvercast className="mr-2 text-2xl" /> Morning
                                </span>
                            ), 
                            meds: morningMeds 
                        },
                        { 
                            title: (
                                <span className="flex items-center">
                                    <WiDaySunny className="mr-2 text-2xl" /> Afternoon
                                </span>
                            ), 
                            meds: afternoonMeds 
                        },
                        { 
                            title: (
                                <span className="flex items-center">
                                    <WiDayWindy className="mr-2 text-2xl" /> Evening
                                </span>
                            ), 
                            meds: eveningMeds 
                        },
                    ].map(({ title, meds }) => (
                        <div
                            key={title.toString()}
                            className="bg-white rounded-lg p-4 shadow-md border border-gray-200"
                        >
                            <h2 className="text-xl font-semibold text-gray-800 mb-3">{title}</h2>
                            {meds.length === 0 ? (
                                <p className="text-gray-500">No {title.toString().toLowerCase().replace(/[^a-z\s]/g, '')} medications</p>
                            ) : (
                                meds.map((med) => (
                                    <div
                                        key={med.id}
                                        className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0"
                                    >
                                        <span className="text-gray-900">{med.name}</span>
                                        {isPastDate(selectedDate) ? (
                                            <span
                                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                    med.taken
                                                        ? "bg-green-500 text-white"
                                                        : med.missedDose
                                                        ? "bg-red-500 text-white"
                                                        : "bg-yellow-400 text-gray-800"
                                                }`}
                                            >
                                                {med.taken ? "Taken" : med.missedDose ? "Skipped" : "Not Taken"}
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleUpdateTakenStatus(med.id, !med.taken)}
                                                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                                    med.taken
                                                        ? "bg-green-500 text-white hover:bg-green-600"
                                                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                                                }`}
                                            >
                                                {med.taken ? "Taken" : "Take"}
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Your Medications</h2>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-md"
                    >
                        + Add Medication
                    </button>
                </div>
                {loading ? (
                    <p className="text-gray-600 text-center py-4">Loading medications...</p>
                ) : medications.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">No medications added yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-left text-gray-600">
                                    <th className="py-3 px-4">Name</th>
                                    <th className="py-3 px-4">Time</th>
                                    <th className="py-3 px-4">Dosage</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {medications.map((med) => (
                                    <tr
                                        key={med.id}
                                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => openMedicationDetail(med)}
                                    >
                                        <td className="py-3 px-4">
                                            <div className="font-medium text-gray-900">{med.name}</div>
                                            <div className="text-xs text-gray-500">{med.frequency}</div>
                                        </td>
                                        <td className="py-3 px-4 capitalize text-gray-900">{med.timeOfDay}</td>
                                        <td className="py-3 px-4 text-gray-900">{med.dosage}</td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    med.taken
                                                        ? "bg-green-500 text-white"
                                                        : "bg-yellow-400 text-gray-800"
                                                }`}
                                            >
                                                {med.taken ? "Taken" : "Not Taken"}
                                            </span>
                                            {med.missedDose && (
                                                <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-red-500 text-white">
                                                    Missed
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleUpdateTakenStatus(med.id, !med.taken)}
                                                    className={`px-3 py-1 rounded text-sm ${
                                                        med.taken
                                                            ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                                                            : "bg-green-500 text-white hover:bg-green-600"
                                                    }`}
                                                >
                                                    {med.taken ? "Undo" : "Take"}
                                                </button>
                                                <button
                                                    onClick={() => handleMarkAsMissed(med.id)}
                                                    className="px-3 py-1 rounded bg-yellow-400 text-gray-800 hover:bg-yellow-500 text-sm"
                                                >
                                                    Miss
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMedication(med.id)}
                                                    className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal
                isOpen={showAddModal}
                onRequestClose={() => setShowAddModal(false)}
                contentLabel="Add Medication Modal"
                style={{
                    overlay: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
                    content: {
                        background: "white",
                        color: "black",
                        maxWidth: "450px",
                        height: "fit-content",
                        margin: "auto",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "1.5rem",
                    },
                }}
            >
                <h2 className="text-xl font-semibold mb-4">Add Medication</h2>
                <form onSubmit={handleAddMedication} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                        <input
                            type="text"
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                        <input
                            type="text"
                            value={dosage}
                            onChange={(e) => setDosage(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Time of Day</label>
                        <select
                            value={timeOfDay}
                            onChange={(e) => setTimeOfDay(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        >
                            <option value="morning">Morning</option>
                            <option value="afternoon">Afternoon</option>
                            <option value="evening">Evening</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowAddModal(false)}
                            className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800 transition-colors"
                        >
                            {loading ? "Adding..." : "Add"}
                        </button>
                    </div>
                </form>
            </Modal>

            {showDetailModal && selectedMedication && (
                <Modal
                    isOpen={showDetailModal}
                    onRequestClose={() => setShowDetailModal(false)}
                    contentLabel="Medication Detail Modal"
                    style={{
                        overlay: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
                        content: {
                            background: "white",
                            color: "black",
                            maxWidth: "450px",
                            height: "fit-content",
                            margin: "auto",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            padding: "1.5rem",
                        },
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">
                            {selectedMedication.name} {selectedMedication.dosage}
                        </h3>
                        <button
                            onClick={() => setShowDetailModal(false)}
                            className="text-gray-600 hover:text-gray-900 text-lg"
                        >
                            ✕
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                        Solgar's {selectedMedication.name} {selectedMedication.dosage}. High concentration of EPA and DHA. Supports cardiovascular, joint, and brain health. Molecularly distilled for purity.
                    </p>
                    <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>{calculateProgress()}% complete</span>
                            <span>{calculateDaysRemaining()} days/60 days</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded mt-1">
                            <div
                                className="bg-black h-2 rounded"
                                style={{ width: `${calculateProgress()}%` }}
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Schedule</h4>
                        <p className="text-xs text-gray-500">9:00 AM - 10:00 AM (Morning, Everyday)</p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => handleUpdateTakenStatus(selectedMedication.id, !selectedMedication.taken)}
                            className={`flex-1 py-2 rounded text-sm ${
                                selectedMedication.taken
                                    ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                                    : "bg-green-500 text-white hover:bg-green-600"
                            }`}
                        >
                            {selectedMedication.taken ? "Mark Not Taken" : "Mark as Taken"}
                        </button>
                        <button
                            onClick={() => handleMarkAsMissed(selectedMedication.id)}
                            className="flex-1 py-2 bg-yellow-400 text-gray-800 rounded hover:bg-yellow-500 text-sm"
                        >
                            Skip Dose
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default MedicationTracker;