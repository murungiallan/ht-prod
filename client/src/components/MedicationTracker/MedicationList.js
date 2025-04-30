import React, { useState } from "react";
import { Section, Button, SecondaryButton } from "./styles";
import { MdDelete } from "react-icons/md";
import { formatTimeForDisplay, moment } from "./utils/utils";
import Pagination from "./Pagination";

const MedicationList = ({
  medications,
  loading,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  calculateDoseStatus,
  onAddMedication,
  openMedicationDetail,
  setShowTakeModal,
  setShowUndoModal,
  confirmDeleteMedication,
  actionLoading,
  searchQuery,
  getDoseStatus,
  selectedDate,
  isPastDate,
  isFutureDate,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: "medication_name", direction: "asc" });

  const sortData = (data, key, direction) => {
    return [...data].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      if (key === "status") {
        const { takenDoses: aTaken, totalDoses: aTotal } = calculateDoseStatus(a);
        const { takenDoses: bTaken, totalDoses: bTotal } = calculateDoseStatus(b);
        aValue = aTaken / aTotal || 0;
        bValue = bTaken / bTotal || 0;
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

  const canTakeAnyDose = (med) => {
    const dateKey = moment(selectedDate).format("YYYY-MM-DD");
    const doses = med.doses?.[dateKey] || med.times.map((time) => ({
      time,
      taken: false,
      missed: false,
      takenAt: null,
    }));
    return doses.some((_, index) => {
      const { isTaken, isMissed, isWithinWindow } = getDoseStatus(med, index); // Remove incorrect destructuring
      return !isTaken && !isMissed && isWithinWindow && !isPastDate(selectedDate) && !isFutureDate(selectedDate);
    });
  };

  const filteredMedications = medications.filter(
    (med) =>
      med.medication_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.dosage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.frequency.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedMedications = sortData(filteredMedications, sortConfig.key, sortConfig.direction);

  const paginate = (items, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  return (
    <Section>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "#333333",
          }}
        >
          Medication List
        </h2>
        <SecondaryButton onClick={onAddMedication} aria-label="Add new medication">
          + Add Medication
        </SecondaryButton>
      </div>
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "16px 0",
            color: "#666666",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "16px",
              height: "16px",
              border: "2px solid #333333",
              borderTop: "2px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <p>Loading medications...</p>
        </div>
      ) : filteredMedications.length === 0 ? (
        <p
          style={{
            textAlign: "center",
            padding: "16px 0",
            color: "#666666",
          }}
        >
          No medications found.
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
                    style={{ padding: "10px", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
                    onClick={() => handleSort("medication_name")}
                  >
                    Name {sortConfig.key === "medication_name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    style={{ padding: "10px", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
                    onClick={() => handleSort("times_per_day")}
                  >
                    Times {sortConfig.key === "times_per_day" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    style={{ padding: "10px", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
                    onClick={() => handleSort("dosage")}
                  >
                    Dosage {sortConfig.key === "dosage" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    style={{ padding: "10px", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
                    onClick={() => handleSort("status")}
                  >
                    Status {sortConfig.key === "status" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      textAlign: "right",
                    }}
                  ></th>
                </tr>
              </thead>
              <tbody>
                {paginate(sortedMedications, currentPage.medications).map((med) => {
                  const { totalDoses, takenDoses, missedDoses } = calculateDoseStatus(med);
                  const canTake = canTakeAnyDose(med);
                  return (
                    <tr
                      key={med.id}
                      onClick={() => openMedicationDetail(med)}
                      style={{
                        borderBottom: "1px solid #e0e0e0",
                        cursor: "pointer",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      role="button"
                      tabIndex={0}
                      onKeyPress={(e) => e.key === "Enter" && openMedicationDetail(med)}
                    >
                      <td style={{ padding: "10px" }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <div style={{ fontWeight: 500, fontSize: "0.875rem", color: "#333333" }}>{med.medication_name}</div>
                          <div style={{ color: "#666666", textTransform: "capitalize" }}>
                            {med.frequency}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px", fontSize: "0.875rem" }}>
                        {(Array.isArray(med.times) ? med.times : []).map((time) => formatTimeForDisplay(time)).join(", ")} (
                        {med.times_per_day} times/day)
                      </td>
                      <td style={{ padding: "10px", fontSize: "0.875rem" }}>{med.dosage}</td>
                      <td style={{ padding: "10px", fontSize: "0.875rem" }}>
                        <span style={{ color: "#666666" }}>
                          Taken: {takenDoses}/{totalDoses}, Missed: {missedDoses}
                        </span>
                      </td>
                      <td
                        style={{ padding: "10px", textAlign: "right" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "nowrap" }}>
                          <Button
                            onClick={() => setShowTakeModal(med.id)}
                            style={{ backgroundColor: "#28a745" }}
                            disabled={actionLoading || !canTake}
                            aria-label="Take medication"
                          >
                            Take
                          </Button>
                          <SecondaryButton
                            onClick={() => setShowUndoModal(med.id)}
                            disabled={actionLoading || takenDoses === 0}
                            aria-label="Undo taken medication"
                          >
                            Undo
                          </SecondaryButton>
                          <button
                            onClick={() => confirmDeleteMedication(med.id)}
                            disabled={actionLoading}
                            style={{
                              color: "#dc3545",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              transition: "color 0.2s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#c82333")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "#dc3545")}
                            aria-label="Delete medication"
                          >
                            <MdDelete />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            totalItems={filteredMedications.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage.medications}
            setCurrentPage={setCurrentPage}
            pageKey="medications"
          />
        </>
      )}
    </Section>
  );
};

export default MedicationList;