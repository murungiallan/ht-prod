import React, { useState } from "react";
import Modal from "react-modal";
import { ModalContentWrapper, CloseButton, ModalOverlay, ModalContent } from "../styles";
import { MdEdit, MdDelete } from "react-icons/md";
import { formatTimeForDisplay, moment } from "../utils/utils";
import Pagination from "../Pagination";

const AllRemindersModal = ({
  isOpen,
  onRequestClose,
  reminders,
  medications,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  handleMarkReminderAsSent,
  handleDeleteReminder,
  setEditReminderModal,
  setReminderTime,
  actionLoading,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: "medication", direction: "asc" });

  // Compute effective reminders for all dates
  const effectiveReminders = reminders.map((reminder) => {
    if (reminder.type === "daily") {
      return { ...reminder, effectiveDate: reminder.date };
    }
    return { ...reminder, effectiveDate: reminder.date };
  });

  const sortData = (data, key, direction) => {
    return [...data].sort((a, b) => {
      let aValue, bValue;

      if (key === "medication") {
        const medA = medications.find((m) => m.id === a.medicationId);
        const medB = medications.find((m) => m.id === b.medicationId);
        aValue = medA?.medication_name || "Unknown";
        bValue = medB?.medication_name || "Unknown";
      } else if (key === "effectiveDate") {
        aValue = a.effectiveDate;
        bValue = b.effectiveDate;
      } else {
        aValue = a[key];
        bValue = b[key];
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

  const sortedReminders = sortData(effectiveReminders, sortConfig.key, sortConfig.direction);

  const paginate = (items, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="All Reminders"
      style={{ overlay: ModalOverlay, content: ModalContent }}
    >
      <ModalContentWrapper style={{minWidth:"60vw", borderColor:"#6f42c1"}}>
        <CloseButton onClick={onRequestClose} accentColor="#20c997" aria-label="Close modal">
          ✕
        </CloseButton>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "#333333",
            marginBottom: "16px",
          }}
        >
          All Reminders
        </h2>
        {sortedReminders.length === 0 ? (
          <p
            style={{
              fontSize: "0.875rem",
              color: "#666666",
            }}
          >
            No reminders set.
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
                      style={{ padding: "12px", fontWeight: 600, cursor: "pointer" }}
                      onClick={() => handleSort("medication")}
                    >
                      Medication {sortConfig.key === "medication" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      style={{ padding: "12px", fontWeight: 600, cursor: "pointer" }}
                      onClick={() => handleSort("reminderTime")}
                    >
                      Time {sortConfig.key === "reminderTime" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      style={{ padding: "12px", fontWeight: 600, cursor: "pointer" }}
                      onClick={() => handleSort("effectiveDate")}
                    >
                      Date {sortConfig.key === "effectiveDate" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      style={{ padding: "12px", fontWeight: 600, cursor: "pointer" }}
                      onClick={() => handleSort("type")}
                    >
                      Type {sortConfig.key === "type" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      style={{ padding: "12px", fontWeight: 600, cursor: "pointer" }}
                      onClick={() => handleSort("status")}
                    >
                      Status {sortConfig.key === "status" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      style={{
                        padding: "12px",
                        fontWeight: 600,
                        textAlign: "right",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginate(sortedReminders, currentPage.allReminders).map((reminder) => {
                    const med = medications.find((m) => m.id === reminder.medicationId);
                    return (
                      <tr
                        key={reminder.id}
                        style={{
                          borderBottom: "1px solid #e0e0e0",
                        }}
                      >
                        <td style={{ padding: "12px" }}>
                          {med?.medication_name || "Unknown"}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {formatTimeForDisplay(reminder.reminderTime)}
                        </td>
                        <td style={{ padding: "12px" }}>{reminder.effectiveDate}</td>
                        <td style={{ padding: "12px" }}>{reminder.type}</td>
                        <td style={{ padding: "12px" }}>
                          <span
                            style={{
                              color: reminder.status === "sent" ? "#28a745" : "#ffc107",
                              fontWeight: 500,
                            }}
                          >
                            {reminder.status || "pending"}
                          </span>
                        </td>
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            {reminder.status !== "sent" && (
                              <button
                                onClick={() => handleMarkReminderAsSent(reminder.id)}
                                style={{
                                  color: "#1a73e8",
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  fontSize: "0.875rem",
                                  transition: "color 0.2s ease",
                                }}
                                disabled={actionLoading}
                                aria-label="Mark reminder as sent"
                                onMouseEnter={(e) => (e.currentTarget.style.color = "#0d5bd1")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "#1a73e8")}
                              >
                                Mark as Sent
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditReminderModal(reminder);
                                setReminderTime(moment(reminder.reminderTime, "HH:mm:ss").format("HH:mm"));
                              }}
                              style={{
                                color: "#ffc107",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                transition: "color 0.2s ease",
                              }}
                              disabled={actionLoading}
                              aria-label="Edit reminder"
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#e0a800")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "#ffc107")}
                            >
                              <MdEdit style={{ fontSize: "1.125rem" }} />
                              <span style={{ display: "none" }}>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteReminder(reminder.id)}
                              style={{
                                color: "#dc3545",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                transition: "color 0.2s ease",
                              }}
                              disabled={actionLoading}
                              aria-label="Delete reminder"
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#c82333")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "#dc3545")}
                            >
                              <MdDelete style={{ fontSize: "1.125rem" }} />
                              <span style={{ display: "none" }}>Delete</span>
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
              totalItems={sortedReminders.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage.allReminders}
              setCurrentPage={setCurrentPage}
              pageKey="allReminders"
            />
          </>
        )}
      </ModalContentWrapper>
    </Modal>
  );
};

export default AllRemindersModal;