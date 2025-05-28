// src/components/MedicationTracker/MedicationStatusBadge.js
import React from "react";
import { BsCheck2Circle, BsXCircle, BsClock } from "react-icons/bs";
import { CiWarning } from "react-icons/ci";
import styled from "styled-components";
import { theme } from "./styles";
import moment from "moment";
import PropTypes from "prop-types";

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
  if (!getDoseStatus) {
    console.error("getDoseStatus function is required in MedicationStatusBadge");
    return (
      <StatusBadge className="pending">
        <CiWarning />
      </StatusBadge>
    );
  }

  const { isTaken, isMissed, isTimeToTake, isWithinWindow } = getDoseStatus(med, med.doseIndex);

  if (isTaken) {
    return (
      <StatusBadge className="taken">
        <BsCheck2Circle />
      </StatusBadge>
    );
  }

  if (isMissed) {
    return (
      <StatusBadge className="missed">
        <BsXCircle />
      </StatusBadge>
    );
  }

  const isOverdue = isWithinWindow && !isTaken;

  return (
    <StatusBadge className={isOverdue ? "overdue" : "pending"}>
      {isOverdue ? (
        <>
          <BsClock />
        </>
      ) : (
        <>
          <CiWarning />
        </>
      )}
    </StatusBadge>
  );
});

MedicationStatusBadge.propTypes = {
  med: PropTypes.object.isRequired,
  getDoseStatus: PropTypes.func.isRequired,
};

export default MedicationStatusBadge;