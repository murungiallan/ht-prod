import React from "react";
import Modal from "react-modal";
import { ModalContentWrapper, CloseButton, Button, ModalOverlay, ModalContent } from "../styles";
import { toast } from "react-toastify";

const DeleteMedicationModal = ({
  isOpen,
  onRequestClose,
  medicationId,
  medications,
  confirmDeleteMedication,
  actionLoading,
}) => {
  const medication = medications.find((m) => m.id === medicationId);

  const handleDelete = () => {
    confirmDeleteMedication(medicationId);
    onRequestClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Delete Medication Confirmation"
      style={{ overlay: ModalOverlay, content: ModalContent }}
    >
      <ModalContentWrapper borderColor="#dc3545">
        <CloseButton onClick={onRequestClose} accentColor="#dc3545" aria-label="Close modal">
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
          Delete Medication
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#666666",
            marginBottom: "16px",
          }}
        >
          Are you sure you want to delete <strong>{medication?.medication_name || "this medication"}</strong>?
          This action cannot be undone, and all associated reminders will also be deleted.
        </p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <Button
            onClick={onRequestClose}
            style={{ backgroundColor: "#6c757d" }}
            aria-label="Cancel deletion"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={actionLoading}
            style={{ backgroundColor: "#dc3545" }}
            aria-label="Confirm deletion"
          >
            Delete
          </Button>
        </div>
      </ModalContentWrapper>
    </Modal>
  );
};

export default DeleteMedicationModal;