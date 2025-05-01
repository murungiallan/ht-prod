import React from "react";
import Modal from "react-modal";
import { ModalContentWrapper, CloseButton, Button, ModalOverlay, ModalContent, theme } from "../styles";
import { formatTimeForDisplay, moment } from "../utils/utils";

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
  const medication = medications.find((m) => m.id === showTakeModal);
  const dateKey = moment(selectedDate).format("YYYY-MM-DD");
  const doses = medication?.doses?.[dateKey] || medication?.times.map((time) => ({
    time,
    taken: false,
    missed: false,
    takenAt: null,
  })) || [];

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Take Medication"
      style={{ overlay: ModalOverlay, content: ModalContent }}
    >
      <ModalContentWrapper>
        <CloseButton onClick={onRequestClose} accentColor={theme.colors.primary} aria-label="Close modal">
          ✕
        </CloseButton>
        <h2>Take Medication</h2>
        <p>Select the dose you want to mark as taken.</p>

        <div className="modal-list">
          {doses.map((dose, index) => {
            const { isTaken, isMissed, isWithinWindow, canTake } = getDoseStatus(medication, index);
            
            return (
              <div key={index} className="modal-list-item">
                <div className="modal-time">
                  {formatTimeForDisplay(dose?.time || "Unknown time")}
                </div>
                <Button
                  onClick={() => {
                    onRequestClose();
                    confirmTakenStatus(showTakeModal, index, true);
                  }}
                  disabled={
                    actionLoading ||
                    !canTake ||
                    isPastDate(selectedDate) ||
                    isFutureDate(selectedDate)
                  }
                  style={{
                    backgroundColor: isTaken ? theme.colors.success : theme.colors.primary,
                    padding: theme.spacing.small + " " + theme.spacing.medium,
                  }}
                >
                  {isTaken ? "Taken" : "Take"}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="modal-actions">
          <Button
            onClick={onRequestClose}
            style={{
              backgroundColor: theme.colors.secondary,
              color: theme.colors.textLight,
            }}
          >
            Cancel
          </Button>
        </div>
      </ModalContentWrapper>
    </Modal>
  );
};

export default TakeMedicationModal;