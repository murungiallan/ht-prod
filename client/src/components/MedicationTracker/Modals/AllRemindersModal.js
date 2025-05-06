import React, { useState } from "react";
import Modal from "react-modal";
import { ModalContentWrapper, CloseButton, ModalOverlay, ModalContent, TableContainer } from "../styles";
import { MdEdit, MdDelete } from "react-icons/md";
import { formatTimeForDisplay, moment } from "../utils/utils";
import Pagination from "../Pagination";

const AllRemindersModal = ({
  isOpen,
  onRequestClose,
  reminders,
  medications,
  selectedDate,
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

  const formatDateForDisplay = (date) => {
    return moment(date).format("MMMM D, YYYY");
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="All Reminders"
      style={{
        overlay: ModalOverlay,
        content: {
          ...ModalContent,
          maxWidth: "90vw",
          width: "auto",
        },
      }}
    >
      <ModalContentWrapper>
        <CloseButton onClick={onRequestClose} accentColor="#20c997" aria-label="Close modal">
          ✕
        </CloseButton>
        <h2>Reminders</h2>
        {sortedReminders.length === 0 ? (
          <p>No reminders set.</p>
        ) : (
          <>
            <TableContainer>
              <table>
                <thead>
                  <tr>
                    <th onClick={() => handleSort("medication")}>
                      Medication Name {sortConfig.key === "medication" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th>
                      Medication Time
                    </th>
                    <th onClick={() => handleSort("reminderTime")}>
                      Reminder Time {sortConfig.key === "reminderTime" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSort("effectiveDate")}>
                      Date {sortConfig.key === "effectiveDate" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSort("type")}>
                      Type {sortConfig.key === "type" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSort("status")}>
                      Status {sortConfig.key === "status" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginate(sortedReminders, currentPage.allReminders).map((reminder) => {
                    const med = medications.find((m) => m.id === reminder.medicationId);
                    return (
                      <tr key={reminder.id}>
                        <td style={{ wordBreak: "break-word", maxWidth: "200px" }}>
                          {med?.medication_name || "Unknown"}
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          {formatTimeForDisplay(reminder.reminderTime)}
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          {formatTimeForDisplay(reminder.reminderTime)}
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          {formatDateForDisplay(reminder.effectiveDate)}
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>{reminder.type}</td>
                        <td>
                          <span
                            style={{
                              color: reminder.status === "sent" ? "#28a745" : "#ffc107",
                              fontWeight: 500,
                            }}
                          >
                            {reminder.status || "pending"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="modal-buttons">
                            {reminder.status !== "sent" && (
                              <button
                                onClick={() => handleMarkReminderAsSent(reminder.id)}
                                disabled={actionLoading}
                                aria-label="Mark reminder as sent"
                              >
                                Mark as Sent
                              </button>
                            )}
                            {reminder.status === "sent" && (
                                <p style={{ marginBottom: 0 }}>Reminder sent</p>
                            )}
                            <button
                              onClick={() => {
                                setEditReminderModal(reminder);
                                setReminderTime(moment(reminder.reminderTime, "HH:mm:ss").format("HH:mm"));
                              }}
                              disabled={actionLoading}
                              aria-label="Edit reminder"
                            >
                              <MdEdit style={{ fontSize: "1.125rem" }} />
                              <span style={{ display: "none" }}>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteReminder(reminder.id)}
                              disabled={actionLoading}
                              aria-label="Delete reminder"
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
            </TableContainer>
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