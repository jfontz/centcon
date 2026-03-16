import { useState, useEffect, useRef } from "react";
import { useModem } from "../context/ModemContext";
import LogHeader from "./log/LogHeader";
import LogContent from "./log/LogContent";
import { getIcon } from "../utils/getIcon.jsx";

const MAX_LOG_ENTRIES = 50;

const LogPanel = () => {
  const [logs, setLogs] = useState([]);
  const logContainerRef = useRef(null);
  const hasShownStartup = useRef(false);
  const { data, loading, error, status, commandLogs, clearCommandLogs } =
    useModem();
  const commandEntries = commandLogs.map((entry) => ({
    type: entry.level,
    text: entry.message,
    timestamp: entry.timestamp,
    id: entry.id,
  }));
  const merged = [...logs, ...commandEntries];
  const sortedLogs = [...merged].sort(
    (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0),
  );
  const prevLosRef = useRef(null);
  const prevModemReachable = useRef(null);
  const prevInternetUp = useRef(null);
  const prevWanIpRef = useRef(null);

  // Auto-scroll to bottom (newest log) when logs change
  useEffect(() => {
    if (sortedLogs.length > 0 && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [sortedLogs.length]);

  // Add log entries based on modem data and error state
  useEffect(() => {
    const timestamp = new Date().toISOString();
    const newLogs = [];

    // 1. Modem Reachability (check FIRST — data is null when unreachable)
    const modemReachable = data !== null && !error;

    const isFirstCheck = prevModemReachable.current === null;

    if (isFirstCheck) {
      // First check - set the ref but DON'T log
      prevModemReachable.current = modemReachable;
    } else if (prevModemReachable.current !== modemReachable) {
      if (hasShownStartup.current) {
        newLogs.push({
          type: modemReachable ? "success" : "error",
          text: modemReachable
            ? "Modem connection restored — Dashboard is back online."
            : "Modem unreachable — Make sure your device is connected to the local network.",
          timestamp,
          id: crypto.randomUUID(),
        });
      }
      prevModemReachable.current = modemReachable;
    }

    // ONLY check LOS and Internet when modem is reachable (fresh data)
    if (data && modemReachable) {
      // INITIAL STARTUP
      if (logs.length === 0) {
        newLogs.push({
          type: "header",
          text: "CENTCON Monitoring Started",
          timestamp,
          id: crypto.randomUUID(),
        });
        newLogs.push({
          type: "navigate",
          text: `Connected to modem: ${data.device?.model || "Unknown"}`,
          timestamp,
          id: crypto.randomUUID(),
        });
        hasShownStartup.current = true;
      }

      // 2. LOS (Loss of Signal) Detection
      const hasLOS =
        Number(data?.optical?.txPower ?? 0) === 0 &&
        Number(data?.optical?.rxPower ?? 0) === 0;

      if (prevLosRef.current === null) {
        prevLosRef.current = hasLOS;
      } else if (prevLosRef.current !== hasLOS) {
        newLogs.push({
          type: hasLOS ? "error" : "success",
          text: hasLOS
            ? "Fiber signal lost — Check the fiber cable on your modem. Try rebooting. If the problem persists, contact Globe at 211."
            : "Fiber signal restored — Connection is back.",
          timestamp,
          id: crypto.randomUUID(),
        });
        prevLosRef.current = hasLOS;
      }

      // 3. Internet Connection (WAN)
      const internetUp = !hasLOS && Boolean(data?.wan?.connected);

      if (prevInternetUp.current === null) {
        prevInternetUp.current = internetUp;
      } else if (prevInternetUp.current !== internetUp) {
        if (!hasLOS) {
          newLogs.push({
            type: internetUp ? "success" : "error",
            text: internetUp
              ? "Internet connection restored."
              : "Internet connection lost — WAN disconnected. Try rebooting your modem. If the problem persists, contact Globe at 211.",
            timestamp,
            id: crypto.randomUUID(),
          });
        }
        prevInternetUp.current = internetUp;
      }

      // 4. WAN IP Change Detection
      const currentIp = data?.wan?.ipv4;
      if (
        currentIp &&
        currentIp !== "Empty" &&
        prevWanIpRef.current !== null &&
        prevWanIpRef.current !== currentIp
      ) {
        newLogs.push({
          type: "warning",
          text: "WAN IP changed — If you're hosting anything locally, your external IP has updated.",
          timestamp,
          id: crypto.randomUUID(),
        });
      }
      if (currentIp && currentIp !== "Empty") {
        prevWanIpRef.current = currentIp;
      }

      // DEVICE HEALTH WARNINGS
      if (data.device) {
        const { cpuUsage, memoryUsage } = data.device;
        if (cpuUsage > 80) {
          newLogs.push({
            type: "warning",
            text: `High CPU usage (${cpuUsage}%) — Modem is under load. Consider rebooting if performance degrades.`,
            timestamp,
            id: crypto.randomUUID(),
          });
        }
        if (memoryUsage > 90) {
          newLogs.push({
            type: "warning",
            text: `High memory usage (${memoryUsage}%) — Modem memory is critically low. A reboot is recommended.`,
            timestamp,
            id: crypto.randomUUID(),
          });
        }
      }

      // TEMPERATURE WARNING
      if (data.optical?.temperature) {
        const temp = parseFloat(data.optical.temperature);
        if (temp > 70) {
          newLogs.push({
            type: "warning",
            text: `High temperature (${temp}°C) — Ensure the modem has adequate ventilation and is not enclosed.`,
            timestamp,
            id: crypto.randomUUID(),
          });
        }
      }
    }

    // Reset all tracking refs when modem becomes unreachable
    if (!modemReachable) {
      prevLosRef.current = null;
      prevInternetUp.current = null;
      prevWanIpRef.current = null;
    }

    // STATUS CHECK LOG — only when everything is OK
    const hasAnyIssues =
      !modemReachable ||
      (data &&
        ((Number(data?.optical?.txPower ?? 0) === 0 &&
          Number(data?.optical?.rxPower ?? 0) === 0) ||
          !data?.wan?.connected)) ||
      error ||
      status === "error" ||
      status === "offline";

    if (!hasAnyIssues && newLogs.length === 0 && !loading && data) {
      newLogs.push({
        type: "success",
        text: "Status check — All systems operational",
        timestamp,
        id: crypto.randomUUID(),
      });
    }

    // COMMIT LOGS
    if (newLogs.length > 0) {
      setLogs((prev) => [...prev, ...newLogs].slice(-MAX_LOG_ENTRIES));
    }
  }, [data, status, error, loading]);

  const clearLogs = () => {
    setLogs([]);
    clearCommandLogs();
  };

  return (
    <div className="h-full max-h-[40vh] sm:max-h-[45vh] lg:max-h-[calc(100vh-10rem)] flex flex-col lg:sticky lg:top-28 bg-black text-gray-300 font-mono text-sm overflow-hidden rounded-lg">
      <LogHeader onClearLogs={clearLogs} />
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
