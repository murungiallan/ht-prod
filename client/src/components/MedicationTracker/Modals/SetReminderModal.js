import React from "react";
import Modal from "react-modal";
import { ModalContentWrapper, CloseButton, Input, Button, SecondaryButton, ModalOverlay, ModalContent } from "../styles";

const SetReminderModal = ({
  isOpen,
  onRequestClose,
  handleSetReminder,
  showReminderModal,
  reminderTime,
  setReminderTime,
  isRecurringReminder,
  setIsRecurringReminder,
  actionLoading,
}) => {
  // Normalize time format to HH:mm:ss
  const handleTimeChange = (e) => {
    let time = e.target.value;
    // If time is in HH:mm format, append :00
    if (time && time.split(":").length === 2) {
      time += ":00";
    }
    setReminderTime(time);
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Set Reminder"
      style={{ overlay: ModalOverlay, content: ModalContent }}
    >
      <ModalContentWrapper borderColor="#fd7e14">
        <CloseButton onClick={onRequestClose} accentColor="#fd7e14" aria-label="Close modal">
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
          Set Reminder
        </h2>
        <form
          onSubmit={(e) => handleSetReminder(e, showReminderModal.medicationId, showReminderModal.doseIndex)}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div>
            <label
              htmlFor="reminder-time"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#333333",
                marginBottom: "4px",
              }}
            >
              Reminder Time
            </label>
            <Input
              id="reminder-time"
              type="time"
              value={reminderTime.split(":").slice(0, 2).join(":")} // Display only HH:mm in the input
              onChange={handleTimeChange}
              required
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              id="recurring-reminder"
              type="checkbox"
              checked={isRecurringReminder}
              onChange={(e) => setIsRecurringReminder(e.target.checked)}
              style={{
                height: "16px",
                width: "16px",
                accentColor: "#fd7e14",
                cursor: "pointer",
              }}
            />
            <label
              htmlFor="recurring-reminder"
              style={{
                fontSize: "0.875rem",
                color: "#333333",
              }}
            >
              Set as daily recurring reminder
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <SecondaryButton type="button" onClick={onRequestClose} aria-label="Cancel setting reminder">
              Cancel
            </SecondaryButton>
            <Button
              type="submit"
              disabled={actionLoading}
              style={{ backgroundColor: "#fd7e14" }}
              aria-label="Set reminder"
            >
              {actionLoading && (
                <div
                  style={{
                    display: "inline-block",
                    width: "16px",
                    height: "16px",
                    border: "2px solid #ffffff",
                    borderTop: "2px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    marginRight: "8px",
                  }}
                />
              )}
              Set Reminder
            </Button>
          </div>
        </form>
      </ModalContentWrapper>
    </Modal>
  );
};

export default SetReminderModal;