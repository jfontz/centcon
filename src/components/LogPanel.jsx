import { useState, useEffect, useRef } from "react";
import { useModem } from "../context/ModemContext";
import LogHeader from "./log/LogHeader";
import LogContent from "./log/LogContent";

const LogPanel = () => {
  const [logs, setLogs] = useState([]);
  const logContainerRef = useRef(null);
  const prevLogsLengthRef = useRef(0);
  const { data, loading, error, status } = useModem();

  // Auto-scroll to bottom only when new logs are added
  useEffect(() => {
    if (logs.length > prevLogsLengthRef.current && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
    prevLogsLengthRef.current = logs.length;
  }, [logs]);

  // Add log entries based on modem data changes
  useEffect(() => {
    if (!data) return;

    const timestamp = new Date().toISOString();
    const newLogs = [];

    // Initial load
    if (logs.length === 0) {
      newLogs.push({
        type: "header",
        text: "CENTCON Monitoring Started",
        timestamp,
      });
      newLogs.push({
        type: "info",
        text: `Connected to modem: ${data.device?.model || "Unknown"}`,
        timestamp,
      });
    }

    // Status changes
    if (status === "online") {
      newLogs.push({
        type: "success",
        text: "Modem data fetched successfully",
        timestamp,
      });
    }

    // Device stats
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

    // Temperature warnings
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

    if (newLogs.length > 0) {
      setLogs((prev) => [...prev, ...newLogs].slice(-50)); // Keep last 50 logs
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

  // Helper function to get icon based on type
  const getIcon = (type) => {
    const icons = {
      header: "⚙️",
      info: "↳",
      success: "✓",
      progress: "⏳",
      checking: "↻",
      error: "✗",
      warning: "⚠️",
    };
    return icons[type] || "•";
  };
  // TODO: replace with svg icons

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="h-full max-h-[40vh] sm:max-h-[45vh] lg:max-h-[calc(100vh-10rem)] flex flex-col lg:sticky lg:top-28 bg-black text-gray-300 font-mono text-sm overflow-hidden rounded-lg">
      <LogHeader status={status} loading={loading} onClearLogs={clearLogs} />
      <LogContent
        logs={logs}
        logContainerRef={logContainerRef}
        loading={loading}
        getIcon={getIcon}
      />
    </div>
  );
};

export default LogPanel;
