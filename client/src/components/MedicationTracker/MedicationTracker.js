import { useState, useContext, useRef, useEffect } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { FaPills, FaPlus, FaTimes, FaCheck, FaEdit, FaTrash, FaBell, FaCalendarAlt } from "react-icons/fa";

const MedicationTracker = () => {
  const { user } = useContext(AuthContext);
  const userName = user?.displayName || "User";
  const modalRef = useRef(null);

  // State for form inputs
  const [showModal, setShowModal] = useState(false);
  const [medicationName, setMedicationName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("8 hours");
  const [mealTiming, setMealTiming] = useState("After");
  const [nextDose, setNextDose] = useState("8:00 am");
  const [tabletCount, setTabletCount] = useState("1");

  // State for medication logs
  const [medications, setMedications] = useState([
    { id: "01", name: "Kefuclav 500mg", frequency: "8 hours", dosage: "1 Tablet", taken: 1, mealTiming: "After", nextDose: "8:00 am", missedDose: "None" },
    { id: "02", name: "Sergel 20mg", frequency: "12 hours", dosage: "1 Tablet", taken: 1, mealTiming: "Before", nextDose: "10:00 pm", missedDose: "None" },
    { id: "03", name: "Taflin", frequency: "8 hours", dosage: "1 Tablet", taken: 0, mealTiming: "After", nextDose: "8:00 am", missedDose: "Missed" },
    { id: "04", name: "Napa 500mg", frequency: "6 hours", dosage: "2 Tablet", taken: 2, mealTiming: "After", nextDose: "9:00 am", missedDose: "None" },
    { id: "05", name: "Flexi 100mg", frequency: "8 hours", dosage: "1 Tablet", taken: 1, mealTiming: "After", nextDose: "8:00 am", missedDose: "None" },
    { id: "06", name: "Monas", frequency: "12 hours", dosage: "1 Tablet", taken: 1, mealTiming: "After", nextDose: "8:00 am", missedDose: "None" },
  ]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalRef]);

  const handleAddMedication = (e) => {
    e.preventDefault();
    if (medicationName && dosage && frequency) {
      const newId = String(medications.length + 1).padStart(2, "0");
      setMedications([
        ...medications,
        {
          id: newId,
          name: medicationName,
          frequency: frequency,
          dosage: `${tabletCount} Tablet`,
          taken: 0,
          mealTiming: mealTiming,
          nextDose: nextDose,
          missedDose: "None",
        },
      ]);
      setMedicationName("");
      setDosage("");
      setFrequency("8 hours");
      setMealTiming("After");
      setNextDose("8:00 am");
      setTabletCount("1");
      setShowModal(false);
    }
  };

  // Format frequency string for better display
  const formatFrequency = (freq) => {
    switch(freq) {
      case "6 hours": return "X4";
      case "8 hours": return "X3";
      case "12 hours": return "X2";
      case "24 hours": return "X1";
      default: return freq;
    }
  };

  // Responsive card for small screens
  const MedicationCard = ({ med }) => (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-gray-100">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-gray-800">{med.name}</h3>
        <div className="flex space-x-2">
          <button className="text-blue-500 hover:text-blue-600">
            <FaEdit />
          </button>
          <button className="text-red-500 hover:text-red-600">
            <FaTrash />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="text-gray-500">Dosage:</div>
        <div className="text-gray-700">{med.dosage}</div>
        
        <div className="text-gray-500">Frequency:</div>
        <div className="text-gray-700">{formatFrequency(med.frequency)}</div>
        
        <div className="text-gray-500">Meal Timing:</div>
        <div className="text-gray-700">{med.mealTiming}</div>
        
        <div className="text-gray-500">Next Dose:</div>
        <div className="text-gray-700">{med.nextDose}</div>
        
        <div className="text-gray-500">Taken:</div>
        <div className="text-gray-700">{med.taken}</div>
        
        <div className="text-gray-500">Missed:</div>
        <div className={med.missedDose === "Missed" ? "text-red-500 font-medium" : "text-gray-700"}>
          {med.missedDose}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Hello, {userName}
        </h1>
        <p className="text-gray-500 mt-1">Track your medication schedule</p>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Adherence Chart and Calendar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Adherence Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaPills className="mr-2 text-blue-500" /> Adherence Overview
            </h2>
            <p className="text-gray-600">Chart placeholder (Adherence over time)</p>
          </div>

          {/* Calendar Placeholder */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaCalendarAlt className="mr-2 text-blue-500" /> Medication Schedule
            </h2>
            <p className="text-gray-600">Calendar placeholder (Click to view medications on a date)</p>
          </div>
        </div>

        {/* Right Column: Medication Logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Medication Tracker Section */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">Medication Tracker</h2>
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-500 text-white rounded-full h-10 w-10 flex items-center justify-center hover:bg-blue-600 transition-colors"
              >
                <FaPlus />
              </button>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden p-4">
              {medications.map((med) => (
                <MedicationCard key={med.id} med={med} />
              ))}
            </div>

            {/* Responsive Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="py-4 px-3 text-left">#</th>
                    <th className="py-4 px-3 text-left">Name</th>
                    <th className="py-4 px-3 text-left">Freq.</th>
                    <th className="py-4 px-3 text-left">Dosage</th>
                    <th className="py-4 px-3 text-left">Taken</th>
                    <th className="py-4 px-3 text-left">Meal</th>
                    <th className="py-4 px-3 text-left">Next</th>
                    <th className="py-4 px-3 text-left">Missed</th>
                    <th className="py-4 px-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {medications.map((med) => (
                    <tr key={med.id} className="text-sm">
                      <td className="py-4 px-3 text-gray-400">{med.id}</td>
                      <td className="py-4 px-3 font-medium text-gray-800 max-w-[150px] truncate" title={med.name}>
                        {med.name}
                      </td>
                      <td className="py-4 px-3 text-gray-600 whitespace-nowrap">
                        {formatFrequency(med.frequency)}
                      </td>
                      <td className="py-4 px-3 text-gray-600">{med.dosage}</td>
                      <td className="py-4 px-3 text-gray-600">{med.taken}</td>
                      <td className="py-4 px-3 text-gray-600">{med.mealTiming}</td>
                      <td className="py-4 px-3 text-gray-600 whitespace-nowrap">{med.nextDose}</td>
                      <td className="py-4 px-3">
                        <span className={med.missedDose === "Missed" ? "text-red-500" : "text-gray-600"}>
                          {med.missedDose}
                        </span>
                      </td>
                      <td className="py-4 px-3 flex space-x-2">
                        <button className="text-blue-500 hover:text-blue-600">
                          <FaEdit />
                        </button>
                        <button className="text-red-500 hover:text-red-600">
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Medication Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black opacity-50"></div>

          {/* Modal */}
          <div ref={modalRef} className="bg-white rounded-xl shadow-lg w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 p-4 sm:p-6 sticky top-0 bg-white">
              <h3 className="text-xl font-semibold text-gray-800">Add New Medication</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddMedication} className="p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Medication Name</label>
                  <input
                    type="text"
                    value={medicationName}
                    onChange={(e) => setMedicationName(e.target.value)}
                    placeholder="e.g., Aspirin"
                    className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Tablet Count</label>
                    <select
                      value={tabletCount}
                      onChange={(e) => setTabletCount(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                    >
                      <option value="1">1 Tablet</option>
                      <option value="2">2 Tablets</option>
                      <option value="3">3 Tablets</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Frequency</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                    >
                      <option value="6hour">Every 6 hours</option>
                      <option value="8hour">Every 8 hours</option>
                      <option value="12hour">Every 12 hours</option>
                      <option value="24hour">Once daily</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Meal Timing</label>
                    <select
                      value={mealTiming}
                      onChange={(e) => setMealTiming(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                    >
                      <option value="Before">Before meal</option>
                      <option value="After">After meal</option>
                      <option value="With">With meal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Next Dose Time</label>
                    <select
                      value={nextDose}
                      onChange={(e) => setNextDose(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                    >
                      <option value="8:00 am">8:00 am</option>
                      <option value="9:00 am">9:00 am</option>
                      <option value="12:00 pm">12:00 pm</option>
                      <option value="4:00 pm">4:00 pm</option>
                      <option value="8:00 pm">8:00 pm</option>
                      <option value="10:00 pm">10:00 pm</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Category</label>
                  <select
                    className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                  >
                    <option value="">Select a category</option>
                    <option value="Pain Relief">Pain Relief</option>
                    <option value="Chronic Condition">Chronic Condition</option>
                    <option value="Allergy">Allergy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Refill Reminder Date</label>
                  <input
                    type="date"
                    className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="recurring"
                    className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="recurring" className="text-sm text-gray-600">
                    Set as recurring medication
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="notifications"
                    className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="notifications" className="text-sm text-gray-600 flex items-center">
                    <FaBell className="mr-1" /> Enable notifications
                  </label>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Additional Notes (Optional)</label>
                  <textarea
                    className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                    rows="2"
                    placeholder="Any special instructions..."
                  ></textarea>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center w-full sm:w-auto"
                >
                  <FaCheck className="mr-2" /> Save Medication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationTracker;