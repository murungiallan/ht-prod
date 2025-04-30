import React, { useState } from "react";
import { MdExpandMore, MdExpandLess, MdAdd } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

const MealSection = ({ mealType, meals }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-3 px-4 text-sm font-medium text-gray-800 hover:bg-gray-50"
      >
        <span>{mealType} ({meals.length})</span>
        {isOpen ? <MdExpandLess className="text-lg" /> : <MdExpandMore className="text-lg" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {meals.length === 0 ? (
              <p className="px-4 py-2 text-sm text-gray-600">No {mealType} logged.</p>
            ) : (
              meals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex justify-between items-center px-4 py-2 hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{meal.name}</p>
                    <p className="text-xs text-gray-600">{meal.calories} kcal</p>
                  </div>
                  <button className="text-teal-600 hover:text-teal-800" aria-label="Edit meal">
                    <MdAdd className="text-lg" />
                  </button>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MealSection;
