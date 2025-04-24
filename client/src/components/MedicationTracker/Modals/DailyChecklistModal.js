import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { ModalContentWrapper, CloseButton, Button, ModalOverlay, ModalContent } from "../styles";
import { moment, formatTimeForDisplay } from "../utils/utils";

const DailyChecklistModal = ({
  isOpen,
  onRequestClose,
  dailyDoses,
  selectedDate,
  getDoseStatus,
  confirmTakenStatus,
  actionLoading,
  isPastDate,
  isFutureDate,
}) => {
  // State to store the current time
  const [currentTime, setCurrentTime] = useState(moment().format("h:mm A"));

  // Update the current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(moment().format("h:mm:ss A"));
    }, 1000);

    // Cleanup the interval on component unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Daily Medication Checklist"
      style={{ overlay: ModalOverlay, content: ModalContent }}
    >
      <ModalContentWrapper minWidth="60vw" borderColor="#6f42c1">
        <CloseButton onClick={onRequestClose} accentColor="#6f42c1" aria-label="Close modal">
          ✕
        </CloseButton>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "#333333",
            marginBottom: "8px",
          }}
        >
          Daily Medication Checklist
        </h2>
        <p
          style={{
            fontSize: ".9rem",
            color: "#333",
            marginBottom: "16px",
          }}
        >
          Current Time: {currentTime}
        </p>
        {dailyDoses.length === 0 ? (
          <p
            style={{
              fontSize: "0.875rem",
              color: "#666666",
            }}
          >
            No medications scheduled for {moment(selectedDate).format("MMMM D, YYYY")}.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {dailyDoses.map((med, index) => {
              const { isTaken, isMissed, isTimeToTake } = getDoseStatus(med, med.doseIndex);
              return (
                <div
                  key={`${med.id}-${med.doseIndex}-${index}`}
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
                      }}
                    >
                      {med.medication_name} ({med.dosage})
                    </span>
                    <span
                      style={{
                        fontSize: "0.875rem",
                        color: "#666666",
                      }}
                    >
                      {med.timeOfDay} - {formatTimeForDisplay(med.doseTime)}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                      onClick={() => confirmTakenStatus(med.id, med.doseIndex, !isTaken)}
                      disabled={isTaken || isMissed || !isTimeToTake || actionLoading || isPastDate(selectedDate) || isFutureDate(selectedDate)}
                      style={{
                        backgroundColor: isTaken ? "#e8e8e8" : "#1a73e8",
                        color: isTaken ? "#333333" : "white",
                      }}
                      aria-label={isTaken ? "Undo dose" : "Mark dose as taken"}
                    >
                      {isTaken ? "Undo" : "Take"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ModalContentWrapper>
    </Modal>
  );
};

export default DailyChecklistModal;