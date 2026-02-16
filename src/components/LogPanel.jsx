import { useState, useEffect, useRef } from "react";
import { useModem } from "../context/ModemContext";
import LogHeader from "./log/LogHeader";
import LogContent from "./log/LogContent";
import { getIcon } from "../utils/getIcon.jsx";

const LogPanel = () => {
  const [logs, setLogs] = useState([]);
  const logContainerRef = useRef(null);
  const prevLogsLengthRef = useRef(0);
  const { data, loading, error, status, rebootLogs, clearRebootLogs } = useModem();

  const rebootEntries = rebootLogs.map((r) => ({
    type: r.level,
    text: r.message,
    timestamp: r.timestamp,
    id: r.id,
  }));
  const merged = [...logs, ...rebootEntries];
  const sortedLogs = [...merged].sort(
    (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
  );
  const prevInternetRef = useRef(null);
  const prevModemReachable = useRef(null);
  const prevLosRef = useRef(null);
  const prevInternetUp = useRef(null);

  // Auto-scroll to bottom (newest log) when logs change
  useEffect(() => {
    if (sortedLogs.length > 0 && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [sortedLogs.length]);

  // Add log entries based on modem data changes
  useEffect(() => {
    if (!data) return;

    const timestamp = new Date().toISOString();
    const newLogs = [];

    // INITIAL STARTUP
    if (logs.length === 0) {
      newLogs.push({
        type: "header",
        text: "CENTCON Monitoring Started",
        timestamp,
      });

      newLogs.push({
        type: "navigate",
        text: `Connected to modem: ${data.device?.model || "Unknown"}`,
        timestamp,
      });
    }

    // DERIVED STATES — priority: LOS → modem reachability → WAN
    const hasLOS =
      data?.optical?.enable === 0 ||
      (Number(data?.optical?.rxPower ?? 0) === 0 &&
        Number(data?.optical?.txPower ?? 0) === 0);

    const modemReachable =
      status !== "error" && error !== "LOCAL_NETWORK_DOWN";

    const internetUp = !hasLOS && Boolean(data?.wan?.connected);

    // 1. LOS (Loss of Signal) — most critical
    if (prevLosRef.current === null) {
      prevLosRef.current = hasLOS;
    } else if (prevLosRef.current !== hasLOS) {
      newLogs.push({
        type: hasLOS ? "error" : "success",
        text: hasLOS
          ? "LOS (Loss of Signal) - Physical fiber connection to ISP lost"
          : "LOS cleared - Fiber signal restored",
        timestamp,
      });
      prevLosRef.current = hasLOS;
    }

    // 2. Modem reachability
    if (prevModemReachable.current === null) {
      prevModemReachable.current = modemReachable;
    } else if (prevModemReachable.current !== modemReachable) {
      newLogs.push({
        type: modemReachable ? "success" : "error",
        text: modemReachable
          ? "Modem connection restored"
          : "Modem unreachable - Local network connection lost",
        timestamp,
      });
      prevModemReachable.current = modemReachable;
    }

    // 3. WAN / Internet (only when no LOS)
    if (prevInternetUp.current === null) {
      prevInternetUp.current = internetUp;
    } else if (prevInternetUp.current !== internetUp) {
      if (!hasLOS) {
        newLogs.push({
          type: internetUp ? "success" : "error",
          text: internetUp
            ? "Internet connection restored"
            : "Internet disconnected - WAN connection lost",
          timestamp,
        });
      }
      prevInternetUp.current = internetUp;
    }

    // DEVICE HEALTH WARNINGS
    if (data.device) {
      const { cpuUsage, memoryUsage } = data.device;

      if (cpuUsage > 80) {
        newLogs.push({
          type: "warning",
          text: `High CPU usage detected: ${cpuUsage}%`,
          timestamp,
        });
      }

      if (memoryUsage > 90) {
        newLogs.push({
          type: "warning",
          text: `High memory usage detected: ${memoryUsage}%`,
          timestamp,
        });
      }
    }

    // TEMPERATURE WARNING
    if (data.optical?.temperature) {
      const temp = parseFloat(data.optical.temperature);
      if (temp > 70) {
        newLogs.push({
          type: "warning",
          text: `High temperature detected: ${temp}°C`,
          timestamp,
        });
      }
    }

    // PASSIVE STATUS SNAPSHOT
    const hasIssues =
      !modemReachable || hasLOS || !internetUp || status === "error";

    if (!hasIssues && newLogs.length === 0 && !loading) {
      newLogs.push({
        type: "success",
        text: "Status check — All systems operational",
        timestamp,
      });
    }

    // COMMIT LOGS
    if (newLogs.length > 0) {
      setLogs((prev) => [...prev, ...newLogs].slice(-50));
    }
  }, [data, status]);

  // Error logging
  useEffect(() => {
    if (error) {
      setLogs((prev) =>
        [
          ...prev,
          {
            type: "error",
            text: `Error: ${error}`,
            timestamp: new Date().toISOString(),
          },
        ].slice(-50),
      );
    }
  }, [error]);

  const clearLogs = () => {
    setLogs([]);
    clearRebootLogs();
  };

  return (
    <div className="h-full max-h-[40vh] sm:max-h-[45vh] lg:max-h-[calc(100vh-10rem)] flex flex-col lg:sticky lg:top-28 bg-black text-gray-300 font-mono text-sm overflow-hidden rounded-lg">
      <LogHeader status={status} loading={loading} onClearLogs={clearLogs} />
      <LogContent
        logs={sortedLogs}
        logContainerRef={logContainerRef}
        loading={loading}
        getIcon={getIcon}
      />
    </div>
  );
};

export default LogPanel;
