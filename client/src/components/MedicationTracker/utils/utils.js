import moment from "moment-timezone";

// Set the default timezone to MYT
moment.tz.setDefault("Asia/Kuala_Lumpur");

// Format time for display
export const formatTimeForDisplay = (time) => {
  if (!time || typeof time !== "string") return "Unknown time";

  const [hours, minutes] = time.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return "Unknown time";

  // Create a moment object for today with the specified hours and minutes
  const date = moment().set({ hour: hours, minute: minutes, second: 0 });

  // Format the time in 12-hour format with AM/PM
  return date.format("h:mm A");
};

export { moment };