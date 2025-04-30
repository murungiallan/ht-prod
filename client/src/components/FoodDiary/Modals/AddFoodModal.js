import React from "react";
import Modal from "react-modal";
import { MdClose } from "react-icons/md";

const AddFoodModal = ({ isOpen, onRequestClose }) => (
  <Modal
    isOpen={isOpen}
    onRequestClose={onRequestClose}
    contentLabel="Add Food"
    className="bg-gray-100 rounded-xl shadow-lg w-full max-w-md overflow-hidden relative border border-gray-200 p-4"
    overlayClassName="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 mb-0"
  >
    <div className="relative">
      <button
        onClick={onRequestClose}
        className="absolute top-0 right-0 text-teal-600 hover:text-teal-800 text-lg font-bold p-2"
        aria-label="Close modal"
      >
        <MdClose />
      </button>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Food</h2>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Food Name</label>
          <input
            type="text"
            placeholder="e.g., Grilled Chicken"
            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Calories</label>
          <input
            type="number"
            placeholder="e.g., 200"
            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Meal Type</label>
          <select
            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
          >
            <option>Breakfast</option>
            <option>Lunch</option>
            <option>Dinner</option>
            <option>Snacks</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Date</label>
          <input
            type="date"
            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-600 focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onRequestClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 transition-all duration-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-500 focus:ring-2 focus:ring-teal-500 transition-all duration-300"
          >
            Add Food
          </button>
        </div>
      </form>
    </div>
  </Modal>
);

export default AddFoodModal;
