// React hook for managing modem data state

import { useState, useEffect, useCallback } from "react";
import { modemApi } from "../services/modemAPI";

export const useModemData = (autoRefreshInterval = 60000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [status, setStatus] = useState("offline"); // 'online' | 'offline' | 'error'

  const fetchData = useCallback(async () => {
    try {
      // Only set loading to true if we don't have data yet (initial load)
      if (!data) {
        setLoading(true);
      }
      setError(null);

      const modemData = await modemApi.getData();

      setData(modemData);
      setStatus("online");
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching modem data:", err);
      setError(err.message);
      setStatus("error");
    } finally {
      // Only set loading to false if it was true
      if (!data) {
        setLoading(false);
      }
    }
  }, [data]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefreshInterval) return;

    const interval = setInterval(fetchData, autoRefreshInterval);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchData]);

  return {
    data,
    loading,
    error,
    status,
    lastUpdated,
    refresh: fetchData,
  };
};
