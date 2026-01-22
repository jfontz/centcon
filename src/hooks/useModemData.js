// React hook for managing modem data state

import { useState, useEffect, useCallback, useRef } from "react";
import { modemApi } from "../services/modemAPI";

export const useModemData = (autoRefreshInterval = 60000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [status, setStatus] = useState("offline"); // 'online' | 'offline' | 'error'
  const isInitialLoad = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      if (isInitialLoad.current) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const modemData = await modemApi.getData();

      setData(modemData);
      setStatus("online");
      setLastUpdated(new Date());

      if (isInitialLoad.current) {
        isInitialLoad.current = false;
      }
    } catch (err) {
      console.error("Error fetching modem data:", err);
      setError(err.message);
      setStatus("error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
    refreshing,
    error,
    status,
    lastUpdated,
    refresh: fetchData,
  };
};
