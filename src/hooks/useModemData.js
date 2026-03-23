// React hook for managing modem data state

import { useState, useEffect, useCallback, useRef } from "react";
import { modemApi } from "../services/modemDataApi";

export const useModemData = (commandState = { state: "IDLE", command: null }) => {
  const autoRefreshInterval =
    Number(import.meta.env.VITE_AUTO_REFRESH_INTERVAL) || 60000;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [status, setStatus] = useState("offline");
  // 'online' | 'offline' | 'los' | 'error'

  const isInitialLoad = useRef(true);
  const intervalRef = useRef(null);

  const isRebooting =
    commandState?.command === "reboot" &&
    [
      "LOGGING_IN",
      "NAVIGATING",
      "REBOOTING",
      "WAITING",
      "CHECKING_CONNECTION",
    ].includes(commandState?.state);

  const fetchData = useCallback(async () => {
    // Pause telemetry refresh while reboot workflow is in progress to avoid
    // spamming "offline" readings while the modem is intentionally unreachable.
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

      // LOS (Loss of Signal): treat fiber loss as a higher-priority failure than WAN down.
      // Globe G-1426G-A reports both TX and RX power as exactly 0 when the optical link is gone.
      // This applies to both simulated LOS (fiber unplugged) and actual ISP-side LOS.
      const hasLOS =
        Number(modemData?.optical?.txPower ?? 0) === 0 &&
        Number(modemData?.optical?.rxPower ?? 0) === 0;

      if (hasLOS) {
        setStatus("los");
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
        setData(null);
        return;
      }

      // Proxy alive but modem unreachable
      if (message.includes("HTTP 500")) {
        setError("Modem unreachable");
        setStatus("offline");
        setData(null);
        return;
      }

      // Other fetch/parse errors — treat as modem unreachable
      setError(message);
      setStatus("offline");
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isRebooting]);

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