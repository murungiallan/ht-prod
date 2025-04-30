import React from "react";

const Pagination = ({ currentPage, totalPages, setPage }) => (
    <div className="flex justify-center gap-2 mt-4">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => setPage(page)}
          className={`px-3 py-1 rounded-md text-sm ${
            currentPage === page
              ? "bg-teal-600 text-white"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          {page}
        </button>
      ))}
    </div>
  );

  export default Pagination;