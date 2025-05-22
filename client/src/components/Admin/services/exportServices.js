import { toast } from "react-hot-toast";
import {
  getAllAdminUsers,
  getAllAdminMedications,
  getAllAdminFoodLogs,
  getAllAdminExercises,
  getAdminSystemSettings,
  getAllAdminReminders,
} from "../../../services/api";

const convertToCSV = (data, columns) => {
  if (!data || data.length === 0) return "";

  const headers = columns.map((col) => col.label).join(",");

  const rows = data.map((item) =>
    columns
      .map((col) => {
        let value = col.render ? col.render(item) : item[col.key];
        if (value === undefined || value === null) value = "";
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(",")
  );

  return [headers, ...rows].join("\n");
};

const downloadCSV = (csvContent, fileName) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const handleExportData = async (
  user,
  entity,
  format,
  getUserToken, // Callback to get the token
  handleSessionExpired
) => {
  if (!user) {
    handleSessionExpired();
    return;
  }

  try {
    const token = await getUserToken(); // Execute the callback to get the token
    let data, columns, fileName;

    switch (entity) {
      case "users":
        data = (await getAllAdminUsers(token, 1000, 1)).users || [];
        columns = [
          { key: "email", label: "Email" },
          { key: "username", label: "Name" },
          { key: "role", label: "Role" },
          {
            key: "created_at",
            label: "Created At",
            render: (item) => new Date(item.created_at).toLocaleDateString(),
          },
        ];
        fileName = "users_export";
        break;

      case "medications":
        data = (await getAllAdminMedications(token, 1000, 1)).medications || [];
        columns = [
          { key: "medication_name", label: "Medication Name" },
          { key: "user_id", label: "User ID" },
          { key: "dosage", label: "Dosage" },
          { key: "frequency", label: "Frequency" },
          { key: "times_per_day", label: "Times/Day" },
          {
            key: "start_date",
            label: "Start Date",
            render: (item) => item.start_date?.split("T")[0] || "-",
          },
        ];
        fileName = "medications_export";
        break;

      case "foodLogs":
        data = (await getAllAdminFoodLogs(token, 1000, 1)).foodLogs || [];
        columns = [
          { key: "user_id", label: "User ID" },
          { key: "food_name", label: "Food Name" },
          { key: "calories", label: "Calories" },
          { key: "carbs", label: "Carbs (g)" },
          { key: "protein", label: "Protein (g)" },
          { key: "fats", label: "Fats (g)" },
          {
            key: "date_logged",
            label: "Date",
            render: (item) => item.date_logged?.split("T")[0] || "-",
          },
          { key: "meal_type", label: "Meal Type" },
        ];
        fileName = "food_logs_export";
        break;

      case "exercises":
        data = (await getAllAdminExercises(token, 1000, 1)).exercises || [];
        columns = [
          { key: "user_id", label: "User ID" },
          { key: "activity", label: "Activity" },
          { key: "duration", label: "Duration (min)" },
          { key: "calories_burned", label: "Calories Burned" },
          {
            key: "date_logged",
            label: "Date",
            render: (item) => item.date_logged?.split("T")[0] || "-",
          },
        ];
        fileName = "exercises_export";
        break;

      case "reminders":
        data = (await getAllAdminReminders(token, 1000, 1)).reminders || [];
        columns = [
          { key: "user_id", label: "User ID" },
          { key: "medication_id", label: "Medication ID" },
          // { key: "dose_index", label: "Dose Index" },
          { key: "reminder_time", label: "Time" },
          {
            key: "date",
            label: "Date",
            render: (item) => item.date?.split("T")[0] || "-",
          },
          { key: "status", label: "Status" },
        ];
        fileName = "reminders_export";
        break;

      case "settings":
        data = (await getAdminSystemSettings(token, 1000, 1)).settings || [];
        columns = [
          { key: "setting_key", label: "Setting Key" },
          { key: "value", label: "Value" },
        ];
        fileName = "settings_export";
        break;

      default:
        throw new Error("Invalid entity for export");
    }

    if (data.length === 0) {
      toast.error(`No ${entity} data available to export`);
      return;
    }

    const csv = convertToCSV(data, columns);
    downloadCSV(csv, fileName);
    toast.success(`${entity.charAt(0).toUpperCase() + entity.slice(1)} exported successfully`);
  } catch (err) {
    toast.error(`Failed to export ${entity}: ${err.message}`);
  }
};