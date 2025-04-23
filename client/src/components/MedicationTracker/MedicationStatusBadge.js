// src/components/MedicationTracker/MedicationStatusBadge.js
import React from "react";
import { BsCheck2Circle, BsXCircle, BsClock } from "react-icons/bs";
import { CiWarning } from "react-icons/ci";
import styled from "styled-components";
import { theme } from "./styles";
import moment from "moment";

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 16px;
  font-weight: 500;
  transition: filter 0.2s ease;

  &.taken {
    background-color: ${theme.colors.success}20;
    color: ${theme.colors.success};
  }

  &.missed {
    background-color: ${theme.colors.danger}20;
    color: ${theme.colors.danger};
  }

  &.overdue {
    background-color: ${theme.colors.warning}20;
    color: ${theme.colors.warning};
  }

  &.pending {
    background-color: ${theme.colors.secondary};
    color: ${theme.colors.textLight};
  }

  &:hover {
    filter: brightness(95%);
  }
`;

const MedicationStatusBadge = React.memo(({ med, getDoseStatus }) => {
  // Confirming getDoseStatus is available
  if (!getDoseStatus) {
    console.error("getDoseStatus function is required in MedicationStatusBadge");
    return null;
  }

  // Fetching the dose status using the provided getDoseStatus function
  const { isTaken, isMissed, isTimeToTake, isWithinWindow } = getDoseStatus(med, med.doseIndex);

  if (isTaken) {
    return (
      <StatusBadge className="taken">
        <BsCheck2Circle/> Taken
      </StatusBadge>
    );
  }

  if (isMissed) {
    return (
      <StatusBadge className="missed">
        <BsXCircle/> Missed
      </StatusBadge>
    );
  }

  // Check if the dose is overdue (time has passed but within the 1-hour window)
  const isOverdue = isTimeToTake && isWithinWindow && !isTaken && !isMissed;

  return (
    <StatusBadge className={isOverdue ? "overdue" : "pending"}>
      {isOverdue ? (
        <>
          <BsClock/> Overdue
        </>
      ) : (
        <>
          <CiWarning/> Pending
        </>
      )}
    </StatusBadge>
  );
});

export default MedicationStatusBadge;