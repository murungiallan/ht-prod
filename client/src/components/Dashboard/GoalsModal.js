const GoalsModal = ({ isOpen, onClose }) => {

    const [foodGoal, setFoodGoal] = useState('');
      const [exerciseGoal, setExerciseGoal] = useState('');
    
      const handleSubmit = () => {
        if (!foodGoal || !exerciseGoal) {
          alert("Please enter both goals.");
          return;
        }
        onSave(Number(foodGoal), Number(exerciseGoal));
        onClose();
        toast.success("Weekly Goals Updated!");
      };
    
      if (!isOpen) return null;
    
      return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 mb-0">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md m-2">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Set Your Weekly Goals</h2>
            <p className="text-gray-600 mb-4">Please set your weekly calorie goals for food intake and exercise.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weekly Food Calorie Goal (kcal)
              </label>
              <input
                type="number"
                value={foodGoal}
                onChange={(e) => setFoodGoal(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 14000"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weekly Exercise Calorie Goal (kcal)
              </label>
              <input
                type="number"
                value={exerciseGoal}
                onChange={(e) => setExerciseGoal(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2000"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Goals
              </button>
            </div>
          </div>
        </div>
      );

};

export default GoalsModal;