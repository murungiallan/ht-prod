import React from "react";
import Modal from "react-modal";
import { ModalContentWrapper, CloseButton, Button, ModalOverlay, ModalContent } from "../styles";
import { moment, formatTimeForDisplay } from "../utils/utils";

const UndoTakenMedicationModal = ({
  isOpen,
  onRequestClose,
  showUndoModal,
  medications,
  selectedDate,
  getDoseStatus,
  confirmTakenStatus,
  actionLoading,
  isPastDate,
  isFutureDate,
}) => {
  const medication = medications.find((m) => m.id === showUndoModal);
  const dateKey = moment(selectedDate).format("YYYY-MM-DD");
  const doses = medication?.doses?.[dateKey] || medication?.times.map((time) => ({
    time,
    taken: false,
    missed: false,
    takenAt: null,
  })) || [];

  const handleUndoClick = (medicationId, doseIndex) => {
    confirmTakenStatus(medicationId, doseIndex, false);
    onRequestClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Undo Taken Medication"
      style={{ overlay: ModalOverlay, content: ModalContent }}
    >
      <ModalContentWrapper borderColor="#0dcaf0">
        <CloseButton onClick={onRequestClose} accentColor="#0dcaf0" aria-label="Close modal">
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
          Undo Taken Medication
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#666666",
            marginBottom: "16px",
          }}
        >
          Select the dose you want to undo the taken status for.
        </p>
        {doses.map((dose, index) => {
          const doseStatus = getDoseStatus(medication, index);
          const isTaken = doseStatus.isTaken;
          
          return (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid #e0e0e0",
              }}
            >
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "#666666",
                }}
              >
                {formatTimeForDisplay(dose?.time || "Unknown time")} 
              </span>
              <Button
                onClick={() => handleUndoClick(showUndoModal, index)}
                disabled={
                  !isTaken ||
                  actionLoading ||
                  isPastDate(selectedDate) ||
                  isFutureDate(selectedDate)
                }
                style={{ backgroundColor: "#0dcaf0" }}
                aria-label="Undo dose taken status"
              >
                Undo
              </Button>
            </div>
          );
        })}
      </ModalContentWrapper>
    </Modal>
  );
};

export default UndoTakenMedicationModal;