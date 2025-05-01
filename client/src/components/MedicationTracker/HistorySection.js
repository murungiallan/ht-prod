import React, { useState } from "react";
import { Section } from "./styles";
import { formatTimeForDisplay } from "./utils/utils";
import Pagination from "./Pagination";

const HistorySection = ({ medicationHistory, currentPage, setCurrentPage, itemsPerPage, searchQuery }) => {
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });

  // Sort data by start date and end date (ascending/descending)
  const sortData = (data, key, direction) => {
    return [...data].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      if (key === "date" || key === "time") {
        aValue = new Date(`${a.date} ${a.time}`);
        bValue = new Date(`${b.date} ${b.time}`);
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Search query filter by name/dosage/time
  const filteredHistory = medicationHistory.filter(
    (entry) =>
      entry.medication_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.dosage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatTimeForDisplay(entry.time).toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedHistory = sortData(filteredHistory, sortConfig.key, sortConfig.direction);

  const paginate = (items, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  return (
    <Section>
      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "#333333",
          marginBottom: "16px",
        }}
      >
        Meducation History & Future Medications
      </h2>
      {filteredHistory.length === 0 ? (
        <p
          style={{
            fontSize: "0.875rem",
            color: "#666666",
          }}
        >
          No medication history available.
        </p>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid #e0e0e0",
                    textAlign: "left",
                    color: "#666666",
                  }}
                >
                  <th
                    style={{ padding: "8px", fontWeight: 600, cursor: "pointer" }}
                    onClick={() => handleSort("medication_name")}
                  >
                    Medication {sortConfig.key === "medication_name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    style={{ padding: "8px", fontWeight: 600, cursor: "pointer" }}
                    onClick={() => handleSort("dosage")}
                  >
                    Dosage {sortConfig.key === "dosage" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    style={{ padding: "8px", fontWeight: 600, cursor: "pointer" }}
                    onClick={() => handleSort("date")}
                  >
                    Date {sortConfig.key === "date" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    style={{ padding: "8px", fontWeight: 600, cursor: "pointer" }}
                    onClick={() => handleSort("time")}
                  >
                    Time {sortConfig.key === "time" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    style={{ padding: "8px", fontWeight: 600, cursor: "pointer" }}
                    onClick={() => handleSort("status")}
                  >
                    Status {sortConfig.key === "status" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginate(sortedHistory, currentPage.history).map((entry, index) => (
                  <tr
                    key={index}
                    style={{
                      borderBottom: "1px solid #e0e0e0",
                    }}
                  >
                    <td style={{ padding: "8px" }}>{entry.medication_name}</td>
                    <td style={{ padding: "8px" }}>{entry.dosage}</td>
                    <td style={{ padding: "8px" }}>{entry.date}</td>
                    <td style={{ padding: "8px" }}>
                      {formatTimeForDisplay(entry.time)}
                    </td>
                    <td style={{ padding: "8px" }}>
                      <span
                        style={{
                          color: entry.status === "Taken" ? "#28a745" : "#dc3545",
                          fontWeight: 500,
                        }}
                      >
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            totalItems={filteredHistory.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage.history}
            setCurrentPage={setCurrentPage}
            pageKey="history"
          />
        </>
      )}
    </Section>
  );
};

export default HistorySection;