import { toast } from "react-hot-toast";
import { getAdminUserActivityTrends } from "../../../services/api";

export const fetchUserActivityTrends = async (
  user,
  setLoading,
  setError,
  setTrends,
  getUserToken,
  handleSessionExpired
) => {
  if (!user) return;
  setLoading(true);
  try {
    const token = await getUserToken();
    const response = await getAdminUserActivityTrends(token);
    setTrends(response || []);
  } catch (err) {
    setError("Failed to fetch user activity trends: " + err.message);
    toast.error("Failed to fetch user activity trends");
  } finally {
    setLoading(false);
  }
};