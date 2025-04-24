import React from "react";
import { IoMdNotifications } from "react-icons/io";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import MedicationStatusBadge from "./MedicationStatusBadge";
import { moment, formatTimeForDisplay } from "./utils/utils";

const TimeOfDaySection = React.memo(
  ({ title, meds, icon, reminders, setShowReminderModal, setSelectedMedication, getDoseStatus }) => {
    if (!meds || meds.length === 0) {
      return (
        <section className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
            {icon}
            {title}
          </h2>
          <p className="text-sm text-gray-500">
            No medications for this time
          </p>
        </section>
      );
    }

    return (
      <section className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <div className="divide-y divide-gray-200">
          {meds.map((med) => {
            const hasReminder = reminders.some(
              (rem) =>
                rem.medicationId === med.id &&
                rem.doseIndex === med.doseIndex &&
                rem.date === moment(med.selectedDate).format("YYYY-MM-DD")
            );
            return (
              <div
                key={`${med.id}-${med.doseIndex}`}
                className="py-2"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 w-full">
                  <div className="font-medium text-sm text-gray-800" style={{ maxWidth: "400px" }}>
                    {med.medication_name} ({med.dosage}) - {med.times_per_day}{" "}
                    time(s) {med.frequency}
                  </div>

                  <div className="flex items-center gap-3">
                    <Tippy content="Set Reminder">
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
                                transition-colors duration-200 bg-transparent border-none cursor-pointer`}
                        aria-label="Set reminder"
                      >
                        <IoMdNotifications className="text-lg" />
                      </button>
                    </Tippy>

                    <span className="text-sm text-gray-500 mr-2">
                      Time: {formatTimeForDisplay(med.doseTime)}
                    </span>

                    <MedicationStatusBadge med={med} getDoseStatus={getDoseStatus} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }
);

export default TimeOfDaySection;