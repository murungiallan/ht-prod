import React from "react";
import Modal from "react-modal";
import { ModalContentWrapper, CloseButton, Button, SecondaryButton, ModalOverlay, ModalContent } from "../styles";
import { moment } from "../utils/utils";

const AddReminderPromptModal = ({
  isOpen,
  onRequestClose,
  showAddReminderPrompt,
  setShowReminderModal,
  selectedDate,
}) => {
  // Format the date for display
  const displayDate = showAddReminderPrompt?.suggestedDate
    ? moment(showAddReminderPrompt.suggestedDate).format("MMMM D, YYYY")
    : moment(selectedDate).format("MMMM D, YYYY");

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Add Reminder Prompt"
      style={{ 
        overlay: ModalOverlay, 
        content: {
          ...ModalContent,
          width: "auto",
        }, 
      }}
    >
      <ModalContentWrapper borderColor="#e83e8c">
        <CloseButton onClick={onRequestClose} accentColor="#e83e8c" aria-label="Close modal">
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
          Set a Reminder
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#666666",
            marginBottom: "16px",
            maxWidth: "400px",
          }}
        >
          Would you like to set a reminder for {showAddReminderPrompt?.medication.medication_name} on{" "}
          {displayDate}?
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <SecondaryButton onClick={onRequestClose} aria-label="Skip setting reminder">
            Skip
          </SecondaryButton>
          <Button
            style={{ backgroundColor: "#e83e8c" }}
            onClick={() => {
              setShowReminderModal({
                medicationId: showAddReminderPrompt.medication.id,
                doseIndex: showAddReminderPrompt.doseIndex || 0,
              });
              onRequestClose();
            }}
            aria-label="Set reminder now"
          >
            Set Reminder
          </Button>
        </div>
      </ModalContentWrapper>
    </Modal>
  );
};

export default AddReminderPromptModal;