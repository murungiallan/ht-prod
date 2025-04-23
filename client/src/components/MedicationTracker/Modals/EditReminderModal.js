import React from "react";
import Modal from "react-modal";
import { ModalContentWrapper, CloseButton, Input, Button, SecondaryButton, ModalOverlay, ModalContent } from "../styles";

const EditReminderModal = ({
  isOpen,
  onRequestClose,
  handleUpdateReminder,
  editReminderModal,
  reminderTime,
  setReminderTime,
  actionLoading,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Edit Reminder"
      style={{ overlay: ModalOverlay, content: ModalContent }}
    >
      <ModalContentWrapper borderColor="#6610f2">
        <CloseButton onClick={onRequestClose} accentColor="#6610f2" aria-label="Close modal">
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
          Edit Reminder
        </h2>
        <form
          onSubmit={(e) => handleUpdateReminder(e, editReminderModal.id)}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div>
            <label
              htmlFor="edit-reminder-time"
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
              id="edit-reminder-time"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              required
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <SecondaryButton type="button" onClick={onRequestClose} aria-label="Cancel editing reminder">
              Cancel
            </SecondaryButton>
            <Button
              type="submit"
              disabled={actionLoading}
              style={{ backgroundColor: "#6610f2" }}
              aria-label="Update reminder"
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
              Update Reminder
            </Button>
          </div>
        </form>
      </ModalContentWrapper>
    </Modal>
  );
};

export default EditReminderModal;