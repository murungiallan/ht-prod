import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { createMedication, getUserMedications, updateMedication, deleteMedication, updateMedicationTakenStatus, markMedicationAsMissed } from "../../services/api";
import { auth } from "../../firebase/config";

const MedicationTracker = () => {
  const { user } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("");
  const [dosage, setDosage] = useState("");
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMedications = async () => {
      if (!user) return;
  
      try {
        setLoading(true);
        // Get fresh token before each request
        const token = await auth.currentUser.getIdToken(true);
        const userMedications = await getUserMedications(token);
        setMedications(userMedications);
      } catch (err) {
        setError("Failed to load medications");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
  
    if (user) fetchMedications();
  }, [user]);

  const handleAddMedication = async (e) => {
    e.preventDefault();
  
    if (!user) {
      setError("You must be logged in to add a medication");
      return;
    }
  
    if (name && frequency && dosage) {
      try {
        const token = await auth.currentUser.getIdToken(true);
        
        const newMedication = {
          name,
          frequency,
          dosage,
          createdAt: new Date().toISOString(),
        };
  
        const createdMedication = await createMedication(newMedication, token);
        setMedications([createdMedication, ...medications]);
  
        setName("");
        setFrequency("");
        setDosage("");
      } catch (err) {
        setError("Failed to add medication");
        console.error(err);
      }
    }
  };

  const handleDeleteMedication = async (id) => {
    try {
      const token = await auth.currentUser.getIdToken(true);
      await deleteMedication(id, token);
      setMedications(medications.filter((med) => med.id !== id));
    } catch (err) {
      setError("Failed to delete medication");
      console.error(err);
    }
  };

  const handleUpdateTakenStatus = async (id, taken) => {
    try {
      const updatedMedication = await updateMedicationTakenStatus(id, taken);
      setMedications(
        medications.map((med) =>
          med.id === id ? { ...med, taken: updatedMedication.taken } : med
        )
      );
    } catch (err) {
      setError("Failed to update medication status");
      console.error(err);
    }
  };

  const handleMarkAsMissed = async (id) => {
    try {
      const updatedMedication = await markMedicationAsMissed(id);
      setMedications(
        medications.map((med) =>
          med.id === id ? { ...med, missedDose: updatedMedication.missedDose } : med
        )
      );
    } catch (err) {
      setError("Failed to mark medication as missed");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Hello, {user?.displayName || "User"}
        </h1>
        <p className="text-gray-600 mt-1">Track your medications</p>
      </header>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Medication</h2>
          <form onSubmit={handleAddMedication} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Medication Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Aspirin"
                className="w-full p-2 border-none rounded-md outline-gray-200 focus:border-gray-400 focus:outline-none focus:ring active:border-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Frequency</label>
              <input
                type="text"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="e.g., Once daily"
                className="w-full p-2 border-none rounded-md outline-gray-200 focus:border-gray-400 focus:outline-none focus:ring active:border-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Dosage</label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g., 1 tablet"
                className="w-full p-2 border-none rounded-md outline-gray-200 focus:border-gray-400 focus:outline-none focus:ring active:border-gray-100"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200"
                disabled={loading}
              >
                {loading ? "Loading..." : "Add Medication"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Medications</h2>
          {loading ? (
            <p className="text-gray-500">Loading medications...</p>
          ) : medications.length === 0 ? (
            <p className="text-gray-500">No medications added yet. Start by adding one above!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {medications.map((med) => (
                <div
                  key={med.id}
                  className="p-4 bg-gray-50 rounded-md flex items-center space-x-4 hover:bg-gray-100 transition"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-700">{med.name}</h3>
                    <p className="text-sm text-gray-600">Frequency: {med.frequency}</p>
                    <p className="text-sm text-gray-600">Dosage: {med.dosage}</p>
                    <p className="text-sm text-gray-600">Status: {med.taken ? "Taken" : "Not Taken"}</p>
                    <p className="text-sm text-gray-600">Missed: {med.missedDose}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdateTakenStatus(med.id, !med.taken)}
                      className="text-green-500 hover:text-green-600"
                    >
                      {med.taken ? "Mark Not Taken" : "Mark Taken"}
                    </button>
                    <button
                      onClick={() => handleMarkAsMissed(med.id)}
                      className="text-yellow-500 hover:text-yellow-600"
                    >
                      Mark Missed
                    </button>
                    <button
                      onClick={() => handleDeleteMedication(med.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicationTracker;