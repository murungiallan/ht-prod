import React from "react";
import { Button } from "./styles";

const Pagination = ({ currentPage, totalItems, itemsPerPage, setCurrentPage, pageKey }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pageNumbers = [];

  // Always show first page, last page, and up to 3 pages around current page
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || // First page
      i === totalPages || // Last page
      (i >= currentPage - 1 && i <= currentPage + 1) // Pages around current page
    ) {
      pageNumbers.push(i);
    } else if (
      (i === currentPage - 2 && currentPage > 3) || // Show dots before
      (i === currentPage + 2 && currentPage < totalPages - 2) // Show dots after
    ) {
      pageNumbers.push("...");
    }
  }

  // Handle page change by updating the specific pageKey in the currentPage object
  const handlePageChange = (page) => {
    if (typeof page === "number" && page >= 1 && page <= totalPages) {
      setCurrentPage((prev) => ({
        ...prev,
        [pageKey]: page,
      }));
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "8px",
        marginTop: "24px",
      }}
    >
      <Button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          backgroundColor: "#f5f5f5",
          color: "#666666",
          padding: "6px 12px",
          minWidth: "auto",
        }}
      >
        ←
      </Button>

      {pageNumbers.map((number, index) => (
        <Button
          key={index}
          onClick={() => typeof number === "number" && handlePageChange(number)}
          disabled={number === "..." || number === currentPage}
          style={{
            backgroundColor: number === currentPage ? "#1a73e8" : "#f5f5f5",
            color: number === currentPage ? "white" : "#666666",
            padding: "6px 12px",
            minWidth: "36px",
            cursor: number === "..." ? "default" : "pointer",
          }}
        >
          {number}
        </Button>
      ))}

      <Button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          backgroundColor: "#f5f5f5",
          color: "#666666",
          padding: "6px 12px",
          minWidth: "auto",
        }}
      >
        →
      </Button>
    </div>
  );
};

export default Pagination;