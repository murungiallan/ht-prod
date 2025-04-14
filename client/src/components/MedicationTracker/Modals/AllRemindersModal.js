import React from "react";
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
      <ModalContentWrapper maxWidth="36rem" borderColor="#20c997">
        <CloseButton onClick={onRequestClose} accentColor="#20c997" aria-label="Close modal">
          ✕
        </CloseButton>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "#333333",
            marginBottom: "16px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          All Reminders
        </h2>
        {reminders.length === 0 ? (
          <p
            style={{
              fontSize: "0.875rem",
              color: "#666666",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            No reminders set.
          </p>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {paginate(reminders, currentPage.allReminders).map((reminder) => {
                const med = medications.find((m) => m.id === reminder.medicationId);
                return (
                  <div
                    key={reminder.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #e0e0e0",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          color: "#333333",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {med?.medication_name || "Unknown"}
                      </span>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          color: "#666666",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {formatTimeForDisplay(reminder.reminderTime)} on {reminder.date}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {reminder.status !== "sent" && (
                        <button
                          onClick={() => handleMarkReminderAsSent(reminder.id)}
                          style={{
                            color: "#1a73e8",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                            fontFamily: "'Inter', sans-serif",
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
                  </div>
                );
              })}
            </div>
            <Pagination
              totalItems={reminders.length}
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