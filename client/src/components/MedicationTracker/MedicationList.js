import React, { useState } from "react";
import { Section, Button, SecondaryButton, TableContainer } from "./styles";
import { MdDelete, MdCheck, MdUndo, MdInfo, MdClear, MdPending } from "react-icons/md";
import { formatTimeForDisplay, moment } from "./utils/utils";
import Pagination from "./Pagination";
import { toast } from "react-toastify";

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
  confirmTakenStatus,
  selectedDate,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: "medication_name", direction: "asc" });

  const paginate = (items, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

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
    try {
      const dateKey = moment(selectedDate).format("YYYY-MM-DD");
      const doses = med.doses?.[dateKey] || med.times.map((time) => ({
        time,
        taken: false,
        missed: false,
        takenAt: null,
      }));

      return doses.some((_, index) => {
        const { isTaken, isMissed, isWithinWindow } = getDoseStatus(med, selectedDate, index);
        return !isTaken && !isMissed && isWithinWindow;
      });
    } catch (err) {
      console.error("Error checking if medication can be taken:", err);
      return false;
    }
  };

  const handleTakeClick = (medicationId) => {
    try {
      setShowTakeModal({ medicationId, doseIndex: null });
    } catch (err) {
      console.error("Error handling take click:", err);
      toast.error("Failed to open take medication modal");
    }
  };

  const handleUndoClick = (medicationId) => {
    try {
      setShowUndoModal(medicationId);
    } catch (err) {
      console.error("Error handling undo click:", err);
      toast.error("Failed to open undo medication modal");
    }
  };

  const handleDeleteClick = (medicationId) => {
    try {
      confirmDeleteMedication(medicationId);
    } catch (err) {
      console.error("Error handling delete click:", err);
      toast.error("Failed to initiate medication deletion");
    }
  };

  const filteredMedications = medications.filter(
    (med) =>
      med.medication_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.dosage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.frequency.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedMedications = sortData(filteredMedications, sortConfig.key, sortConfig.direction);
  const paginatedMedications = paginate(sortedMedications, currentPage.medications);

  return (
    <Section>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "#333333",
            margin: 0,
          }}
        >
          Medication List
        </h2>
        <SecondaryButton onClick={onAddMedication} aria-label="Add new medication">
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>+</span>
            <span>Add Medication</span>
          </span>
        </SecondaryButton>
      </div>

      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "32px",
            color: "#666666",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "20px",
              height: "20px",
              border: "2px solid #1a73e8",
              borderTop: "2px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <p style={{ margin: 0 }}>Loading medications...</p>
        </div>
      ) : filteredMedications.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "32px",
            color: "#666666",
            background: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          {searchQuery ? (
            <p style={{ margin: 0 }}>No medications found matching "{searchQuery}"</p>
          ) : (
            <p style={{ margin: 0 }}>No medications added yet. Click "Add Medication" to get started.</p>
          )}
        </div>
      ) : (
        <>
          <TableContainer>
            <table>
              <thead>
                <tr>
                  <th
                    onClick={() => handleSort("medication_name")}
                    style={{ cursor: "pointer", maxWidth: "200px" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      Name
                      {sortConfig.key === "medication_name" && (
                        <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("times_per_day")}
                    style={{ cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                      Times
                      {sortConfig.key === "times_per_day" && (
                        <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th style={{ textAlign: "right" }}>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMedications.map((med) => {
                  const { totalDoses, takenDoses } = calculateDoseStatus(med);
                  const dateKey = moment(selectedDate).format("YYYY-MM-DD");
                  const doses = med.doses?.[dateKey] || med.times.map((time) => ({
                    time,
                    taken: false,
                    missed: false,
                    takenAt: null,
                  }));

                  return (
                    <tr key={med.id}>
                      <td>
                        <div style={{ fontWeight: 500, maxWidth: "200px" }}>{med.medication_name}</div>
                        <div style={{ fontSize: "0.875rem", color: "#666666" }}>
                          {med.dosage}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
                          {med.times.map((time, index) => (
                            <div
                              key={index}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                color: doses[index]?.taken ? "#28a745" : "#666666",
                              }}
                            >
                              {doses[index]?.taken && <MdCheck size={16} />}
                              {doses[index]?.missed && <MdClear size={16} />}
                              {formatTimeForDisplay(time)}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "100px",
                              height: "6px",
                              backgroundColor: "#e0e0e0",
                              borderRadius: "3px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${(takenDoses / totalDoses) * 100}%`,
                                height: "100%",
                                backgroundColor: "#28a745",
                                transition: "width 0.3s ease",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "0.875rem", color: "#666666" }}>
                            {takenDoses}/{totalDoses}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                            justifyContent: "flex-end",
                          }}
                        >
                          <Button
                            onClick={() => handleTakeClick(med.id)}
                            disabled={actionLoading || !canTakeAnyDose(med)}
                            style={{ padding: "6px 12px" }}
                          >
                            <MdCheck size={16} />
                            <span>Take</span>
                          </Button>
                          <Button
                            onClick={() => handleUndoClick(med.id)}
                            disabled={actionLoading || takenDoses === 0}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#f5f5f5",
                              color: "#666666",
                            }}
                          >
                            <MdUndo size={16} />
                            <span>Undo</span>
                          </Button>
                          <Button
                            onClick={() => openMedicationDetail(med)}
                            style={{
                              padding: "6px",
                              backgroundColor: "#f5f5f5",
                              color: "#666666",
                            }}
                          >
                            <MdInfo size={16} />
                          </Button>
                          <Button
                            onClick={() => handleDeleteClick(med.id)}
                            style={{
                              padding: "6px",
                              backgroundColor: "#dc3545",
                            }}
                          >
                            <MdDelete size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableContainer>

          {sortedMedications.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage.medications}
              totalItems={sortedMedications.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) =>
                setCurrentPage((prev) => ({ ...prev, medications: page }))
              }
            />
          )}
        </>
      )}
    </Section>
  );
};

export default MedicationList;