import moment from "moment-timezone";

// Format time for display
const formatTimeForDisplay = (time) => {
  if (!time || typeof time !== "string") return "Unknown time";

  const [hours, minutes] = time.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return "Unknown time";

  // Create a moment object with a fixed date and the specified time
  const date = moment().set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });

  // Format the time in 12-hour format with AM/PM
  return date.format("h:mm A");
};

export { moment, formatTimeForDisplay };