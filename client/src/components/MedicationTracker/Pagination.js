import React from "react";

const Pagination = ({ totalItems, itemsPerPage, currentPage, setCurrentPage, pageKey }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Only one page or no items in the page
  if (totalPages <= 1) return null;

  // Generate the page numbers to display
  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    const pages = [];

    if (totalPages <= maxPagesToShow) {
      // If total pages are less than or equal to maxPagesToShow, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show the first page
      pages.push(1);

      // Calculate the range of pages to show around the current page
      const leftBoundary = Math.max(2, currentPage - 1);
      const rightBoundary = Math.min(totalPages - 1, currentPage + 1);

      // Add ellipsis after the first page if needed
      if (leftBoundary > 2) {
        pages.push("...");
      }

      // Add pages around the current page
      for (let i = leftBoundary; i <= rightBoundary; i++) {
        pages.push(i);
      }

      // Add ellipsis before the last page if needed
      if (rightBoundary < totalPages - 1) {
        pages.push("...");
      }

      // Always show the last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "8px",
        marginTop: "24px",
        flexWrap: "wrap",
      }}
    >
      <button
        style={{
          padding: "6px 12px",
          borderRadius: "8px",
          fontSize: "0.875rem",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          cursor: "pointer",
          transition: "background-color 0.2s ease",
          border: "1px solid #e0e0e0",
          backgroundColor: "white",
          color: "#333333",
          opacity: currentPage === 1 ? 0.5 : 1,
        }}
        onClick={() => setCurrentPage((prev) => ({ ...prev, [pageKey]: prev[pageKey] - 1 }))}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        Previous
      </button>

      {pages.map((page, index) =>
        page === "..." ? (
          <span
            key={`ellipsis-${index}`}
            style={{
              padding: "6px 12px",
              fontSize: "0.875rem",
              fontFamily: "'Inter', sans-serif",
              color: "#666666",
            }}
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              cursor: "pointer",
              transition: "background-color 0.2s ease",
              border: "1px solid #e0e0e0",
              backgroundColor: page === currentPage ? "#1a73e8" : "white",
              color: page === currentPage ? "white" : "#333333",
            }}
            onClick={() => setCurrentPage((prev) => ({ ...prev, [pageKey]: page }))}
            aria-label={`Go to page ${page}`}
          >
            {page}
          </button>
        )
      )}

      <button
        style={{
          padding: "6px 12px",
          borderRadius: "8px",
          fontSize: "0.875rem",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          cursor: "pointer",
          transition: "background-color 0.2s ease",
          border: "1px solid #e0e0e0",
          backgroundColor: "white",
          color: "#333333",
          opacity: currentPage === totalPages ? 0.5 : 1,
        }}
        onClick={() => setCurrentPage((prev) => ({ ...prev, [pageKey]: prev[pageKey] + 1 }))}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;