// React hook for managing modem data state

import { useState, useEffect, useCallback, useRef } from "react";
import { modemApi } from "../services/modemAPI";

export const useModemData = (
  autoRefreshInterval = 60000,
  rebootState = { state: "IDLE" }
) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [status, setStatus] = useState("offline");
  // 'online' | 'offline' | 'error'

  const isInitialLoad = useRef(true);
  const intervalRef = useRef(null);

  const isRebooting = [
    "LOGGING_IN",
    "NAVIGATING",
    "REBOOTING",
    "WAITING",
    "CHECKING_CONNECTION",
  ].includes(rebootState?.state);

  const fetchData = useCallback(
    async () => {
      // Skip fetch if rebooting
      if (isRebooting) {
        console.log("Auto-refresh paused during reboot");
        return;
      }

      try {
        if (isInitialLoad.current) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError(null);

        const modemData = await modemApi.getData();

        setData(modemData);

        // LOS (Loss of Signal): both TX and RX power are 0
        const hasLOS =
          Number(modemData?.optical?.txPower ?? 0) === 0 &&
          Number(modemData?.optical?.rxPower ?? 0) === 0;

        if (hasLOS) {
          setStatus("error");
        } else if (modemData?.wan?.connected) {
          setStatus("online");
        } else {
          setStatus("offline");
        }

        setLastUpdated(new Date());

        if (isInitialLoad.current) {
          isInitialLoad.current = false;
        }
      } catch (err) {
        console.error("Error fetching modem data:", err);

        const message = err?.message || "";

        // Browser-level network failure (WiFi/Ethernet unplugged)
        if (err instanceof TypeError) {
          setError("LOCAL_NETWORK_DOWN");
          setStatus("offline");
          return;
        }

        // Proxy alive but modem unreachable
        if (message.includes("HTTP 500")) {
          setError("Modem unreachable");
          setStatus("offline");
          return;
        }

        // Other fetch/parse errors — treat as modem unreachable
        setError(message);
        setStatus("offline");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isRebooting]
  );

  // Initial fetch
  useEffect(() => {
    if (!isRebooting) {
      fetchData();
    }
  }, [fetchData, isRebooting]);

  // Auto-refresh with pause during reboot
  useEffect(() => {
    if (!autoRefreshInterval) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Don't start interval if rebooting
    if (isRebooting) {
      console.log("Auto-refresh paused during reboot");
      return;
    }

    // Start interval when not rebooting
    intervalRef.current = setInterval(fetchData, autoRefreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefreshInterval, fetchData, isRebooting]);

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
