import React, { useEffect } from "react";
import Modal from "react-modal";
import moment from "moment-timezone";
import { ModalContentWrapper, CloseButton, Button, ModalOverlay, ModalContent } from "../styles";
import { formatInTimeZone } from "date-fns-tz";

const formatTimeForDisplay = (time) => {
  if (!time || typeof time !== "string") return "Unknown time";
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
};

const MedicationDetailModal = ({
  isOpen,
  onRequestClose,
  selectedMedication,
  drugInfo,
  drugInfoLoading,
  drugInfoError,
  calculateProgress,
  calculateDaysRemaining,
  getDoseStatus,
  confirmTakenStatus,
  actionLoading,
  isPastDate,
  isFutureDate,
  selectedDate,
}) => {
  const formattedDate = selectedDate
  ? formatInTimeZone(selectedDate, Intl.DateTimeFormat().resolvedOptions().timeZone, "yyyy-MM-dd")
  : formatInTimeZone(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone, "yyyy-MM-dd");
  const dosesForDate = selectedMedication?.doses?.[formattedDate] || [];
  const timesArray = Array.isArray(selectedMedication?.times)
    ? selectedMedication.times
    : [];

  // Calculate progress
  const progress = calculateProgress() || 0;
  const safeProgress = isNaN(progress) || progress < 0 ? 0 : progress > 100 ? 100 : progress;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Medication Details"
      style={{ overlay: ModalOverlay, content: ModalContent }}
    >
      <ModalContentWrapper maxWidth="36rem" borderColor="#28a745">
        <CloseButton
          onClick={onRequestClose}
          accentColor="#28a745"
          aria-label="Close medication details modal"
        >
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
          {selectedMedication?.medication_name || "Unknown Medication"}{" "}
          {selectedMedication?.dosage || ""}
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#666666",
            marginBottom: "16px",
          }}
        >
          {drugInfo?.description ||
            selectedMedication?.notes ||
            "No additional notes provided."}
        </p>
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.875rem",
              color: "#666666",
            }}
          >
            <span>{safeProgress}% complete</span>
            <span>{calculateDaysRemaining() || 0} days remaining</span>
          </div>
          <div
            style={{
              width: "100%",
              backgroundColor: "#e0e0e0",
              height: "8px",
              borderRadius: "4px",
              marginTop: "4px",
            }}
          >
            <div
              style={{
                width: `${safeProgress}%`,
                backgroundColor: "#1a73e8",
                height: "8px",
                borderRadius: "4px",
              }}
            />
          </div>
        </div>
        <section style={{ marginBottom: "16px" }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 500,
              color: "#333333",
              marginBottom: "8px",
            }}
          >
            Schedule
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#666666",
            }}
          >
            {timesArray.length > 0
              ? timesArray
                  .map((time) => formatTimeForDisplay(time))
                  .join(", ")
              : "No schedule provided."}{" "}
            ({selectedMedication?.frequency || "N/A"},{" "}
            {selectedMedication?.times_per_day || 0} times/day, from{" "}
            {selectedMedication?.start_date || "N/A"} to{" "}
            {selectedMedication?.end_date || "N/A"})
          </p>
        </section>
        <section style={{ marginBottom: "16px" }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 500,
              color: "#333333",
              marginBottom: "8px",
            }}
          >
            Doses
          </h3>
          {dosesForDate.length > 0 ? (
            dosesForDate.map((dose, index) => {
              const { isTaken, isMissed, isTimeToTake } = getDoseStatus(
                selectedMedication,
                index
              );
              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
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
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                      onClick={() =>
                        confirmTakenStatus(selectedMedication.id, index, !isTaken)
                      }
                      disabled={
                        isTaken ||
                        isMissed ||
                        !isTimeToTake ||
                        actionLoading ||
                        isPastDate(selectedDate) ||
                        isFutureDate(selectedDate)
                      }
                      style={{
                        backgroundColor: isTaken ? "#e8e8e8" : "#1a73e8",
                        color: isTaken ? "#333333" : "white",
                        padding: "6px 12px",
                        fontSize: "0.875rem",
                      }}
                      aria-label={isTaken ? "Undo dose taken" : "Mark dose as taken"}
                    >
                      {isTaken ? "Undo" : "Take"}
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666666",
              }}
            >
              No doses scheduled for this date.
            </p>
          )}
        </section>
        <section style={{ marginBottom: "16px" }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 500,
              color: "#333333",
              marginBottom: "8px",
            }}
          >
            Available Forms
          </h3>
          {drugInfoLoading ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666666",
              }}
            >
              Loading forms...
            </p>
          ) : drugInfoError ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#d32f2f",
              }}
            >
              Failed to load dosage forms.
            </p>
          ) : drugInfo?.dosages?.length > 0 ? (
            <ul style={{ listStyleType: "disc", paddingLeft: "16px" }}>
              {drugInfo.dosages.map((dosage, index) => (
                <li
                  key={index}
                  style={{
                    fontSize: "0.875rem",
                    color: "#666666",
                    marginBottom: "4px",
                  }}
                >
                  {dosage}
                </li>
              ))}
            </ul>
          ) : (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666666",
              }}
            >
              No dosage forms available.
            </p>
          )}
        </section>
        <section style={{ marginBottom: "16px" }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 500,
              color: "#333333",
              marginBottom: "8px",
            }}
          >
            Interactions
          </h3>
          {drugInfoLoading ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666666",
              }}
            >
              Loading interactions...
            </p>
          ) : drugInfoError ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#d32f2f",
              }}
            >
              Failed to load interactions.
            </p>
          ) : drugInfo?.interactions?.length > 0 ? (
            <ul style={{ listStyleType: "disc", paddingLeft: "16px" }}>
              {drugInfo.interactions.map((interaction, index) => (
                <li
                  key={index}
                  style={{
                    fontSize: "0.875rem",
                    color: "#666666",
                    marginBottom: "4px",
                  }}
                >
                  {interaction}
                </li>
              ))}
            </ul>
          ) : (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666666",
              }}
            >
              No interactions found.
            </p>
          )}
        </section>
        <section>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 500,
              color: "#333333",
              marginBottom: "8px",
            }}
          >
            Usage Instructions
          </h3>
          {drugInfoLoading ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666666",
              }}
            >
              Loading usage instructions...
            </p>
          ) : drugInfoError ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#d32f2f",
              }}
            >
              Failed to load usage instructions.
            </p>
          ) : drugInfo?.usage ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666666",
              }}
            >
              {drugInfo.usage}
            </p>
          ) : (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666666",
              }}
            >
              No usage instructions available.
            </p>
          )}
        </section>
      </ModalContentWrapper>
    </Modal>
  );
};

export default MedicationDetailModal;