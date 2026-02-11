import { useState, useEffect, useRef } from "react";
import { useModem } from "../context/ModemContext";
import LogHeader from "./log/LogHeader";
import LogContent from "./log/LogContent";
import { getIcon } from "../utils/getIcon.jsx";

const LogPanel = () => {
  const [logs, setLogs] = useState([]);
  const logContainerRef = useRef(null);
  const prevLogsLengthRef = useRef(0);
  const { data, loading, error, status, rebootLogs } = useModem();

  const rebootEntries = rebootLogs.map((r) => ({
    type: r.level,
    text: r.message,
    timestamp: r.timestamp,
    id: r.id,
  }));
  const allLogs = [...logs, ...rebootEntries];
  const prevInternetRef = useRef(null);
  const prevModemReachable = useRef(null);
  const prevFiberUp = useRef(null);
  const prevInternetUp = useRef(null);

  // Auto-scroll to bottom only when new logs are added
  useEffect(() => {
    if (allLogs.length > prevLogsLengthRef.current && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
    prevLogsLengthRef.current = allLogs.length;
  }, [allLogs.length]);

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

    // DERIVED STATES
    const modemReachable = status === "online" || status === "offline";

    const fiberUp =
      data?.optical?.temperature !== null &&
      Number(data?.optical?.temperature) > 0;

    const internetUp = Boolean(data?.wan?.connected);

    // MODEM REACHABILITY
    if (prevModemReachable.current === null) {
      prevModemReachable.current = modemReachable;
    } else if (prevModemReachable.current !== modemReachable) {
      newLogs.push({
        type: modemReachable ? "success" : "offline",
        text: modemReachable
          ? "Modem reachable"
          : "Modem unreachable (local connection lost)",
        timestamp,
      });

      prevModemReachable.current = modemReachable;
    }

    // FIBER / LOS
    if (prevFiberUp.current === null) {
      prevFiberUp.current = fiberUp;
    } else if (prevFiberUp.current !== fiberUp) {
      newLogs.push({
        type: fiberUp ? "success" : "error",
        text: fiberUp
          ? "Fiber signal restored"
          : "Fiber signal lost (LOS detected)",
        timestamp,
      });

      prevFiberUp.current = fiberUp;
    }

    // INTERNET STATUS
    if (prevInternetUp.current === null) {
      prevInternetUp.current = internetUp;
    } else if (prevInternetUp.current !== internetUp) {
      newLogs.push({
        type: internetUp ? "success" : "error",
        text: internetUp
          ? "Internet connection restored"
          : "Internet connection lost",
        timestamp,
      });

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
      !modemReachable || !fiberUp || !internetUp || status === "error";

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
  };

  return (
    <div className="h-full max-h-[40vh] sm:max-h-[45vh] lg:max-h-[calc(100vh-10rem)] flex flex-col lg:sticky lg:top-28 bg-black text-gray-300 font-mono text-sm overflow-hidden rounded-lg">
      <LogHeader status={status} loading={loading} onClearLogs={clearLogs} />
      <LogContent
        logs={allLogs}
        logContainerRef={logContainerRef}
        loading={loading}
        getIcon={getIcon}
      />
    </div>
  );
};

export default LogPanel;
