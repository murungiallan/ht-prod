import React from "react";
import Modal from "react-modal";
import { ModalContentWrapper, CloseButton, Button, ModalOverlay, ModalContent } from "../styles";
import { formatTimeForDisplay } from "../utils/utils";
import { toast } from "react-toastify";
import moment from "moment";

const TakeMedicationModal = ({
  isOpen,
  onRequestClose,
  showTakeModal,
  medications,
  selectedDate,
  getDoseStatus,
  confirmTakenStatus,
  actionLoading,
  isPastDate,
  isFutureDate,
}) => {
  const medication = medications.find((med) => med.id === showTakeModal?.medicationId);
  const dateKey = moment(selectedDate).format("YYYY-MM-DD");
  const doses = medication?.doses?.[dateKey] || medication?.times.map((time) => ({
    time,
    taken: false,
    missed: false,
    takenAt: null,
  }));

  if (!medication) return null;

  const handleTakeDose = (doseIndex) => {
    const { isWithinWindow } = getDoseStatus(medication, selectedDate, doseIndex);
    if (!isWithinWindow) {
      toast.error("You can only take this dose within a 2-hour window of the scheduled time.");
      return;
    }
    confirmTakenStatus(medication.id, doseIndex, true);
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Take Medication"
      style={{ overlay: ModalOverlay, content: ModalContent }}
    >
      <ModalContentWrapper>
        <CloseButton onClick={onRequestClose} aria-label="Close modal">
          ✕
        </CloseButton>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 500, color: "#333333", marginBottom: "16px" }}>
          Take {medication.medication_name} ({medication.dosage})
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {doses.map((dose, index) => {
            const { isTaken, isMissed, isWithinWindow } = getDoseStatus(medication, selectedDate, index);
            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "1px solid #e0e0e0",
                }}
              >
                <span style={{ fontSize: "0.875rem", color: "#333333" }}>
                  {formatTimeForDisplay(dose.time)}
                </span>
                <Button
                  onClick={() => {
                    onRequestClose();
                    handleTakeDose(index)
                  }}
                  disabled={
                    isTaken || 
                    isMissed || 
                    !isWithinWindow || 
                    actionLoading
                  }
                  style={{
                    backgroundColor: isTaken ? "#e8e8e8" : "#1a73e8",
                    color: isTaken ? "#333333" : "white",
                    padding: "6px 12px",
                  }}
                >
                  {isTaken ? "Taken" : "Take"}
                </Button>
              </div>
            );
          })}
        </div>
      </ModalContentWrapper>
    </Modal>
  );
};

export default TakeMedicationModal;