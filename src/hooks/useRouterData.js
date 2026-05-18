// React hook for managing router data state

import { useState, useEffect, useCallback, useRef } from "react";
import { routerApi } from "../services/routerDataApi";

export const useRouterData = (
  { commandState, refreshPaused } = {},
) => {
  void commandState;

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
  const isRebootingRef = useRef(false);

  const isRefreshPaused = refreshPaused ?? false;

  // Keep ref in sync so fetchData can read it without being recreated
  isRebootingRef.current = isRefreshPaused;

  const fetchData = useCallback(async () => {
    // Pause telemetry refresh while an active command holds the refresh lock.
    if (isRebootingRef.current) {
      console.log("Auto-refresh paused — active command holds refresh");
      return;
    }

    try {
      if (isInitialLoad.current) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      const routerData = await routerApi.getData();

      setData(routerData);

      // LOS (Loss of Signal): treat fiber loss as a higher-priority failure than WAN down.
      // Globe G-1426G-A reports both TX and RX power as exactly 0 when the optical link is gone.
      // This applies to both simulated LOS (fiber unplugged) and actual ISP-side LOS.
      const hasLOS =
        Number(routerData?.optical?.txPower ?? 0) === 0 &&
        Number(routerData?.optical?.rxPower ?? 0) === 0;

      if (hasLOS) {
        setStatus("los");
      } else if (routerData?.wan?.connected) {
        setStatus("online");
      } else {
         setStatus("wan_error");
      }

      setLastUpdated(new Date());

      if (isInitialLoad.current) {
        isInitialLoad.current = false;
      }
    } catch (err) {
      console.error("Error fetching router data:", err);

      const message = err?.message || "";

      // Browser-level network failure (WiFi/Ethernet unplugged)
      if (err instanceof TypeError) {
        setError("LOCAL_NETWORK_DOWN");
        setStatus("offline");
        setData(null);
        return;
      }

      // Proxy alive but router unreachable
      if (message.includes("HTTP 500")) {
        setError("Router unreachable");
        setStatus("offline");
        setData(null);
        return;
      }

      // Other fetch/parse errors — treat as router unreachable
      setError(message);
      setStatus("offline");
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // stable — reads refresh pause state via ref

  // Initial fetch — only on mount
  useEffect(() => {
    if (!isRebootingRef.current) {
      fetchData();
    }
  }, [fetchData]);

  // Auto-refresh — restarts only when refresh pause state or interval changes
  useEffect(() => {
    if (!autoRefreshInterval) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    if (isRefreshPaused) {
      console.log("Auto-refresh paused — active command holds refresh");
      return;
    }

    intervalRef.current = setInterval(fetchData, autoRefreshInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefreshInterval, fetchData, isRefreshPaused]);

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
