import React from "react";
import { SecondaryButton } from "./styles";

const Header = ({ onViewChecklist, onViewAllReminders, searchQuery, setSearchQuery }) => {
  return (
    
    <header className="flex flex-col md:items-start gap-4 mb-4 w-full">
      <div className="flex flex-col lg:flex-row justify-between items-start w-full gap-4">
        <div className="">
          <h1 className="text-2xl font-bold text-gray-800 font-mono">
            Your Medications
          </h1>
          <p className="text-sm text-gray-600 mt-1 font-mono">
            Track your medications with ease
          </p>
        </div>
        <div>
          <SecondaryButton 
              onClick={onViewChecklist}
              // className="mr-2 px-4 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-600 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label="View daily checklist"
            >
              Daily Checklist
          </SecondaryButton>
          
          <button 
            onClick={onViewAllReminders}
            className="mx-2 px-4 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-600 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label="View all reminders"
          >
            Reminders
          </button>
        </div>
      </div>
      
      <div className="bg-transparent px-4 py-3 focus-within:border-blue-500 overflow-hidden w-full">
        <input
          type="text"
          placeholder="Search your medications, reminders, medication history..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent w-full font-mono bg-transparent"
          aria-label="Search medications"
        />        
      </div>
    </header>
  );
};

export default Header;