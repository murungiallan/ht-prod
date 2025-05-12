import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { ModalContentWrapper, CloseButton, Button, ModalOverlay, ModalContent } from "../styles";
import { moment, formatTimeForDisplay } from "../utils/utils";
import { toast } from 'react-hot-toast';

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
  const [currentTime, setCurrentTime] = useState(moment().format("h:mm:ss A"));
  const [selectedFilter, setSelectedFilter] = useState("All");

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const now = moment().local();
        setCurrentTime(now.format("h:mm:ss A"));
      } catch (err) {
        console.error("Error updating current time:", err);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTakeClick = (medicationId, doseIndex, isWithinWindow) => {
    if (!isWithinWindow) {
      toast.error("You can only take this dose within a 2-hour window of the scheduled time.");
      return;
    } else {
      try {
        confirmTakenStatus(medicationId, doseIndex, true);
      } catch (err) {
        console.error("Error taking medication:", err);
        toast.error(err.message || "Failed to mark dose as taken");
      }
    }
  };

  // Define handleTimeOfDayChange to handle changes to individual dose timeOfDay
  const handleTimeOfDayChange = (medicationId, doseIndex, value) => {
    // Placeholder for handling timeOfDay changes (e.g., API call or state update)
    console.log(`Time of day changed for medication ${medicationId}, dose ${doseIndex}: ${value}`);
    // Future implementation: Update med.timeOfDay via API or parent component callback
  };

  // Sort dailyDoses by doseTime in ascending order
  const sortedDoses = dailyDoses.slice().sort((a, b) => {
    if (!a.doseTime || !b.doseTime) return 0;
    return a.doseTime.localeCompare(b.doseTime);
  });

  // Filter doses based on selected time of day
  const filteredDoses = selectedFilter === "All"
    ? sortedDoses
    : sortedDoses.filter((med) => med.timeOfDay === selectedFilter);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Daily Medication Checklist"
      style={{ overlay: ModalOverlay, 
        content: {
          ...ModalContent,
          minWidth: "40vw",
          maxHeight: "70vh",
        }
      }}
    >
      <ModalContentWrapper style={{ borderColor: "#6f42c1" }}>
        <CloseButton onClick={onRequestClose} accentcolor="#6f42c1" aria-label="Close modal">
          ✕
        </CloseButton>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#333333",
            marginBottom: "8px",
          }}
        >
          Daily Medication Checklist
        </h2>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px", marginBottom: "16px" }}>
          <p
            style={{
              fontSize: ".9rem",
              color: "#333",
            }}
          >
            Current Time: {currentTime}
          </p>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            style={{
              fontSize: "0.9rem",
              padding: "4px 8px",
              border: "1px solid lightgray",
              borderRadius: "4px",
              backgroundColor: "white",
              color: "#333333",
              cursor: "pointer",
              outline: "none",
            }}
            aria-label="Filter medications by time of day"
          >
            <option value="All">All</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Evening">Evening</option>
          </select>
        </div>
        {filteredDoses.length === 0 ? (
          <p
            style={{
              fontSize: "0.875rem",
              color: "#666666",
            }}
          >
            No medications scheduled for {moment(selectedDate).format("MMMM D, YYYY")} in the selected category.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredDoses.map((med, index) => {
              try {
                const { isTaken, isMissed, isWithinWindow } = getDoseStatus(med, selectedDate, med.doseIndex);
                return (
                  <div
                    key={`${med.id}-${med.doseIndex}-${index}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #e0e0e0",
                      maxWidth: "550px",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
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
                        onClick={() => {
                          onRequestClose();
                          handleTakeClick(med.id, med.doseIndex, isWithinWindow);
                        }}
                        disabled={isTaken || isMissed || !isWithinWindow || actionLoading}
                        style={{
                          backgroundColor: isTaken ? "#D0F0C0" : isMissed ? "#FBCEB1" : "white",
                          color: isTaken ? "#49796B" : isMissed ? "#FF033E" : "white",
                        }}
                        aria-label={isTaken ? "Undo dose" : "Mark dose as taken"}
                      >
                        {isTaken ? "Taken" : isMissed ? "Missed" : ""}
                      </Button>
                    </div>
                  </div>
                );
              } catch (err) {
                console.error("Error rendering medication dose:", err);
                return null;
              }
            })}
          </div>
        )}
      </ModalContentWrapper>
    </Modal>
  );
};

export default DailyChecklistModal;