// auditServices.js
import { toast } from "react-hot-toast";
import { getAdminAuditLogs } from "../../../services/api";

export const fetchAuditLogs = async (
  user,
  setLoading,
  setError,
  setAuditLogs,
  getUserToken,
  handleSessionExpired,
  page = 1,
  limit = 10,
  sortConfig = { key: "timestamp", direction: "asc" },
  query = ""
) => {
  if (!user) return;
  setLoading(true);
  try {
    const token = await getUserToken();
    const response = await getAdminAuditLogs(token, limit, page, sortConfig, query);
    setAuditLogs({
      logs: response.logs || [],
      total: response.total || 0,
    });
  } catch (err) {
    const errorMessage = `Failed to fetch last 200 audit logs: ${err.message}`;
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};