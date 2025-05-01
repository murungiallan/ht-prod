import React, { useEffect } from "react";
import Modal from "react-modal";
import { ModalContentWrapper, CloseButton, Button, ModalOverlay, ModalContent } from "../styles";
import { format } from "date-fns";
import { formatTimeForDisplay } from "../utils/utils";

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
  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const displayDate = format(selectedDate, "MMMM d, yyyy");

  const startDateFormatted = selectedMedication?.start_date
    ? format(new Date(selectedMedication.start_date), "MMMM d, yyyy")
    : "N/A";
  const endDateFormatted = selectedMedication?.end_date
    ? format(new Date(selectedMedication.end_date), "MMMM d, yyyy")
    : "N/A";

  const dosesForDate = selectedMedication?.doses?.[dateKey] || [];
  const timesArray = Array.isArray(selectedMedication?.times)
    ? selectedMedication.times
    : [];

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
              fontWeight: "500",
              color: "#333333",
              marginBottom: "8px",
            }}
          >
            Schedule for {displayDate}
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
            {startDateFormatted} to {endDateFormatted})
          </p>
        </section>
        <section style={{ marginBottom: "16px" }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: "500",
              color: "#333333",
              marginBottom: "8px",
            }}
          >
            Doses
          </h3>
          {dosesForDate.length > 0 ? (
            dosesForDate.map((dose, index) => {
              const { isTaken, isMissed, isWithinWindow } = getDoseStatus(
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
                      onClick={() => {
                        onRequestClose();
                        confirmTakenStatus(selectedMedication.id, index, !isTaken);
                      }}
                      disabled={
                        actionLoading ||
                        isPastDate(selectedDate) ||
                        isFutureDate(selectedDate) ||
                        (isTaken ? false : !isWithinWindow)
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
              fontWeight: "500",
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
              fontWeight: "500",
              color: "#333333",
              marginBottom: "8px",
            }}
          >
            Potential Side Effects
          </h3>
          {drugInfoLoading ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666666",
              }}
            >
              Loading side effects...
            </p>
          ) : drugInfoError ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#d32f2f",
              }}
            >
              Failed to load side effects.
            </p>
          ) : drugInfo?.sideEffects?.length > 0 ? (
            <ul style={{ listStyleType: "disc", paddingLeft: "16px" }}>
              {drugInfo.sideEffects.map((sideEffect, index) => (
                <li
                  key={index}
                  style={{
                    fontSize: "0.875rem",
                    color: "#666666",
                    marginBottom: "4px",
                  }}
                >
                  {sideEffect}
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
              No side effects information available.
            </p>
          )}
        </section>
        <section style={{ marginBottom: "16px" }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: "500",
              color: "#333333",
              marginBottom: "8px",
            }}
          >
            Storage Instructions
          </h3>
          {drugInfoLoading ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666666",
              }}
            >
              Loading storage instructions...
            </p>
          ) : drugInfoError ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#d32f2f",
              }}
            >
              Failed to load storage instructions.
            </p>
          ) : drugInfo?.storage ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666666",
              }}
            >
              {drugInfo.storage}
            </p>
          ) : (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666666",
              }}
            >
              No storage instructions available.
            </p>
          )}
        </section>
        <section style={{ marginBottom: "16px" }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: "500",
              color: "#333333",
              marginBottom: "8px",
            }}
          >
            Missed Dose Instructions
          </h3>
          {drugInfoLoading ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666666",
              }}
            >
              Loading missed dose instructions...
            </p>
          ) : drugInfoError ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#d32f2f",
              }}
            >
              Failed to load missed dose instructions.
            </p>
          ) : drugInfo?.missedDose ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666666",
              }}
            >
              {drugInfo.missedDose}
            </p>
          ) : (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666666",
              }}
            >
              No missed dose instructions available. Consult your doctor.
            </p>
          )}
        </section>
        <section style={{ marginBottom: "16px" }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: "500",
              color: "#333333",
              marginBottom: "8px",
            }}
          >
            Food/Drink Interactions
          </h3>
          {drugInfoLoading ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666666",
              }}
            >
              Loading food/drink interactions...
            </p>
          ) : drugInfoError ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#d32f2f",
              }}
            >
              Failed to load food/drink interactions.
            </p>
          ) : drugInfo?.foodInteractions?.length > 0 ? (
            <ul style={{ listStyleType: "disc", paddingLeft: "16px" }}>
              {drugInfo.foodInteractions.map((interaction, index) => (
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
              No food/drink interactions found.
            </p>
          )}
        </section>
        <section style={{ marginBottom: "16px" }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: "500",
              color: "#333333",
              marginBottom: "8px",
            }}
          >
            Refill Information
          </h3>
          {drugInfoLoading ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666666",
              }}
            >
              Loading refill information...
            </p>
          ) : drugInfoError ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#d32f2f",
              }}
            >
              Failed to load refill information.
            </p>
          ) : selectedMedication?.refills || selectedMedication?.nextRefillDate ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666666",
              }}
            >
              {selectedMedication.refills ? `Refills remaining: ${selectedMedication.refills}` : ""}
              {selectedMedication.refills && selectedMedication.nextRefillDate ? " | " : ""}
              {selectedMedication.nextRefillDate
                ? `Next refill: ${format(new Date(selectedMedication.nextRefillDate), "MMMM d, yyyy")}`
                : ""}
            </p>
          ) : (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666666",
              }}
            >
              No refill information available.
            </p>
          )}
        </section>
        <section style={{ marginBottom: "16px" }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: "500",
              color: "#333333",
              marginBottom: "8px",
            }}
          >
            Prescriber Information
          </h3>
          {selectedMedication?.prescriber ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666666",
              }}
            >
              Prescribed by: {selectedMedication.prescriber.name}
              {selectedMedication.prescriber.contact
                ? ` | Contact: ${selectedMedication.prescriber.contact}`
                : ""}
            </p>
          ) : (
            <p
              style={{
                fontSize: "0.875rem",
                color: "#666666",
              }}
            >
              No prescriber information available.
            </p>
          )}
        </section>
        <section style={{ marginBottom: "16px" }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: "500",
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
              fontWeight: "500",
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