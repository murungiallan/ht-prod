import React, { useState } from "react";
import { IoMdNotifications } from "react-icons/io";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import MedicationStatusBadge from "./MedicationStatusBadge";
import moment from "moment";
import styled from "styled-components";
import { WiDaySunnyOvercast, WiDaySunny, WiDayWindy } from "react-icons/wi";

// Styled components for tabs
const TabsContainer = styled.div`
  display: flex;
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  margin-bottom: ${({ theme }) => theme.spacing.medium};
  position: relative;
`;

const Tab = styled.button`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.small} 0;
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  color: ${({ theme, active }) =>
    active ? theme.colors.primary : theme.colors.textLight};
  cursor: pointer;
  position: relative;
  transition: color 0.3s ease;
  text-align: center;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: 0.875rem;
    padding: ${({ theme }) => theme.spacing.xs} 0;
  }
`;

const TabIndicator = styled.div`
  position: absolute;
  bottom: -2px;
  left: ${({ activeTab }) => activeTab * (100 / 3)}%;
  width: 33.33%;
  height: 2px;
  background-color: ${({ theme }) => theme.colors.primary};
  transition: left 0.3s ease;
`;

const SectionWrapper = styled.section`
  background-color: white;
  border-radius: 12px;
  min-height: 45vh;
  box-shadow: 0 4px 12px ${({ theme }) => theme.colors.shadow};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.large};
  margin-bottom: ${({ theme }) => theme.spacing.large};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px ${({ theme }) => theme.colors.shadow};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing.medium};
    margin-bottom: ${({ theme }) => theme.spacing.medium};
  }
`;

const TimeOfDaySection = React.memo(
  ({ meds, reminders, setShowReminderModal, setSelectedMedication, getDoseStatus }) => {
    const [activeTab, setActiveTab] = useState(0);

    // Function to categorize doseTime into Morning, Afternoon, or Evening
    const getTimeOfDay = (doseTime) => {
      const hour = moment(doseTime, "HH:mm:ss").hour();
      if (hour >= 0 && hour < 12) return "Morning";
      if (hour >= 12 && hour < 18) return "Afternoon";
      return "Evening";
    };

    const morningMedsList = meds?.morningMeds || [];
    const afternoonMedsList = meds?.afternoonMeds || [];
    const eveningMedsList = meds?.eveningMeds || [];
    
    // Apply the (redundant) filter to the safe lists
    const morningMeds = morningMedsList.filter((med) => getTimeOfDay(med.doseTime) === "Morning");
    const afternoonMeds = afternoonMedsList.filter((med) => getTimeOfDay(med.doseTime) === "Afternoon");
    const eveningMeds = eveningMedsList.filter((med) => getTimeOfDay(med.doseTime) === "Evening");

    // Array of tab data
    const tabs = [
      {
        name: "Morning",
        meds: morningMeds,
        icon: <WiDaySunnyOvercast style={{ fontSize: "1.2em", color: "#ffca28", marginRight: '4px' }} />
      },
      {
        name: "Afternoon",
        meds: afternoonMeds,
        icon: <WiDaySunny style={{ fontSize: "1.2em", color: "#ffb300", marginRight: '4px' }} />
      },
      {
        name: "Evening",
        meds: eveningMeds,
        icon: <WiDayWindy style={{ fontSize: "1.2em", color: "#ff8f00", marginRight: '4px' }} />
      },
    ];

    // Get the meds for the active tab
    const activeMeds = tabs[activeTab].meds;

    return (
      <SectionWrapper>
        <TabsContainer>
          {tabs.map((tab, index) => (
            <Tab
              key={tab.name}
              active={activeTab === index}
              onClick={() => setActiveTab(index)}
            >
              {tab.icon} {tab.name}
            </Tab>
          ))}
          <TabIndicator activeTab={activeTab} />
        </TabsContainer>

        {activeMeds.length === 0 ? (
          <p className="text-sm text-gray-500">
            No medications scheduled for this time
          </p>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
              {tabs[activeTab].name}
              <span className="text-sm font-normal text-gray-500">
                ({activeMeds.length} medications)
              </span>
            </h2>
            <div className="divide-y divide-gray-200">
              {activeMeds.map((med) => {
                const hasReminder = reminders.some(
                  (rem) =>
                    rem.medicationId === med.id &&
                    rem.doseIndex === med.doseIndex &&
                    rem.effectiveDate === moment(med.selectedDate).format("YYYY-MM-DD")
                );

                const doseStatus = getDoseStatus(med, med.doseIndex);

                return (
                  <div
                    key={`${med.id}-${med.doseIndex}`}
                    className="py-3 transition-colors duration-200 hover:bg-gray-50 rounded-md"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 w-full px-2">
                      <div className="flex flex-col gap-1">
                        <div className="font-medium text-gray-800">
                          {med.medication_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {med.dosage} - {med.times_per_day} time(s) {med.frequency}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Tippy
                          content={hasReminder ? "Reminder set" : "Set reminder"}
                          placement="top"
                        >
                          <button
                            onClick={() => {
                              setSelectedMedication(med);
                              setShowReminderModal({
                                medicationId: med.id,
                                doseIndex: med.doseIndex,
                              });
                            }}
                            className={`${
                              hasReminder
                                ? "text-blue-600 hover:text-blue-800"
                                : "text-gray-500 hover:text-gray-700"
                            } 
                            transition-colors duration-200 bg-transparent border-none cursor-pointer p-2 rounded-full hover:bg-gray-100`}
                            aria-label={hasReminder ? "Reminder set" : "Set reminder"}
                          >
                            <IoMdNotifications className="text-xl" />
                          </button>
                        </Tippy>

                        <div className="flex flex-col items-end">
                          <span className="text-sm text-gray-600 mb-1">
                            {moment(med.doseTime, "HH:mm:ss").format("h:mm A")}
                          </span>
                          <MedicationStatusBadge status={doseStatus.status} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </SectionWrapper>
    );
  }
);

TimeOfDaySection.displayName = "TimeOfDaySection";

export default TimeOfDaySection;