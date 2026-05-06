import { useState, useEffect, useRef } from "react";
import { useRouter } from "../context/RouterContext";
import LogHeader from "./log/LogHeader";
import LogContent from "./log/LogContent";
import HistoryView from "./log/HistoryView";
import { getIcon } from "../utils/getIcon.jsx";
import { appendHistory, HISTORY_TYPES } from "../utils/historyStorage";

const MAX_LOG_ENTRIES = 50;

const LogPanel = () => {
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("log");
  const logContainerRef = useRef(null);
  const hasShownStartup = useRef(false);
  const { data, loading, error, status, commandLogs, clearCommandLogs } =
    useRouter();

  const commandEntries = commandLogs.map((entry) => ({
    type: entry.level,
    text: entry.message,
    timestamp: entry.timestamp,
    id: entry.id,
    command: entry.command,
  }));
  const merged = [...logs, ...commandEntries];
  const sortedLogs = [...merged].sort(
    (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0),
  );

  const prevLosRef = useRef(null);
  const prevRouterReachable = useRef(null);
  const prevInternetUp = useRef(null);
  const prevWanIpRef = useRef(null);
  const prevDevicesRef = useRef(null);
  const prevDeviceCountRef = useRef(null);
  const rebootPersistedRef = useRef(false);

  // Thresholds for device detection
  const DEVICE_COUNT_THRESHOLD = 20;
  const DEVICE_SPIKE_THRESHOLD = 3;

  const persistHistory = (event) => appendHistory(event);

  // Track reboot commands from commandLogs
  useEffect(() => {
    const hasRebootHeader = commandLogs.some(
      (e) => e.command === "reboot" && e.level === "header",
    );

    if (hasRebootHeader && !rebootPersistedRef.current) {
      rebootPersistedRef.current = true;
      persistHistory({
        type: HISTORY_TYPES.REBOOT,
        text: "Router reboot triggered via CENTCON",
      });
    }

    // Reset when logs are cleared so the next reboot can be recorded
    if (!hasRebootHeader) {
      rebootPersistedRef.current = false;
    }
  }, [commandLogs]);

  useEffect(() => {
    if (sortedLogs.length > 0 && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [sortedLogs.length]);

  // Add log entries based on router data and error state
  useEffect(() => {
    const timestamp = new Date().toISOString();
    const newLogs = [];

    // 1. Router Reachability (check FIRST — data is null when unreachable)
    const routerReachable = data !== null && !error;
    const isFirstCheck = prevRouterReachable.current === null;

    if (isFirstCheck) {
      // First check - set the ref but DON'T log
      prevRouterReachable.current = routerReachable;
    } else if (prevRouterReachable.current !== routerReachable) {
      if (hasShownStartup.current) {
        newLogs.push({
          type: routerReachable
            ? prevLosRef.current === true
              ? "warning"
              : "success"
            : "error",
          text: routerReachable
            ? prevLosRef.current === true
              ? "Router reachable — Dashboard is back, but fiber signal is still lost."
              : "Router connection restored — Dashboard is back online."
            : "Router unreachable — Make sure your device is connected to the local network.",
          timestamp,
          id: crypto.randomUUID(),
        });
        persistHistory({
          type: HISTORY_TYPES.UNREACHABLE,
          text: routerReachable
            ? "Router connection restored"
            : "Router became unreachable",
        });
      }
      prevRouterReachable.current = routerReachable;
    }

    // ONLY check LOS and Internet when router is reachable (fresh data)
      if (data && routerReachable) {
        // INITIAL STARTUP
        if (!hasShownStartup.current) {
          newLogs.push({
            type: "header",
            text: "CENTCON Monitoring Started",
          timestamp,
          id: crypto.randomUUID(),
        });
        newLogs.push({
          type: "navigate",
          text: `Connected to router: ${data.device?.model || "Unknown"}`,
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
        // Log immediately if LOS is detected on startup — don't wait for a transition
        if (hasLOS) {
          newLogs.push({
            type: "error",
            text: "Fiber signal lost — Check the fiber cable on your router. Try rebooting. If the problem persists, contact Globe at 211.",
            timestamp,
            id: crypto.randomUUID(),
          });
          persistHistory({
            type: HISTORY_TYPES.LOS,
            text: "Fiber signal lost (detected on startup)",
          });
        }
      } else if (prevLosRef.current !== hasLOS) {
        newLogs.push({
          type: hasLOS ? "error" : "success",
          text: hasLOS
            ? "Fiber signal lost — Check the fiber cable on your router. Try rebooting. If the problem persists, contact Globe at 211."
            : "Fiber signal restored — Connection is back.",
          timestamp,
          id: crypto.randomUUID(),
        });
        persistHistory({
          type: HISTORY_TYPES.LOS,
          text: hasLOS ? "Fiber signal lost" : "Fiber signal restored",
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
              : "Internet connection lost — WAN disconnected. Try rebooting your router. If the problem persists, contact Globe at 211.",
            timestamp,
            id: crypto.randomUUID(),
          });
          persistHistory({
            type: HISTORY_TYPES.INTERNET,
            text: internetUp ? "Internet restored" : "Internet connection lost",
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
        persistHistory({
          type: HISTORY_TYPES.WARNING,
          text: `WAN IP changed to ${currentIp}`,
        });
      }
      if (currentIp && currentIp !== "Empty") {
        prevWanIpRef.current = currentIp;
      }

      // 5. Device Connected Detection
      // Uses hostname|ip as a stable key since MAC is not exposed by this router's API
      const currentDevices = data?.connectedDevices?.devices ?? [];
      const currentDeviceKeys = new Set(
        currentDevices.map((d) => `${d.hostname}|${d.ip}`),
      );

      if (prevDevicesRef.current === null) {
        // First poll — set baseline without logging
        prevDevicesRef.current = currentDeviceKeys;
      } else {
        const newDevices = currentDevices.filter(
          (d) => !prevDevicesRef.current.has(`${d.hostname}|${d.ip}`),
        );
        newDevices.forEach((d) => {
          const band =
            d.interface === "802.11ac"
              ? "5GHz"
              : d.interface === "802.11"
                ? "2.4GHz"
                : d.interface;
          newLogs.push({
            type: "progress",
            text: `Device connected: ${d.hostname} (${band})`,
            timestamp,
            id: crypto.randomUUID(),
          });
        });
        prevDevicesRef.current = currentDeviceKeys;
      }

      // 6. High Device Count Detection
      const currentTotal = data?.connectedDevices?.total ?? 0;
      const prevTotal = prevDeviceCountRef.current;
      if (prevTotal !== null) {
        const spike = currentTotal - prevTotal >= DEVICE_SPIKE_THRESHOLD;
        const overThreshold =
          currentTotal >= DEVICE_COUNT_THRESHOLD &&
          (prevTotal < DEVICE_COUNT_THRESHOLD || spike);
        if (spike && !overThreshold) {
          newLogs.push({
            type: "warning",
            text: `Device count jumped to ${currentTotal} — Unusual number of devices joined the network.`,
            timestamp,
            id: crypto.randomUUID(),
          });
          persistHistory({
            type: HISTORY_TYPES.WARNING,
            text: `Device count spiked to ${currentTotal}`,
          });
        } else if (overThreshold) {
          newLogs.push({
            type: "warning",
            text: `High device count (${currentTotal}) — Consider checking for unknown or unauthorized devices.`,
            timestamp,
            id: crypto.randomUUID(),
          });
          persistHistory({
            type: HISTORY_TYPES.WARNING,
            text: `High device count: ${currentTotal}`,
          });
        }
      }
      prevDeviceCountRef.current = currentTotal;

      // DEVICE HEALTH WARNINGS
      if (data.device) {
        const { cpuUsage, memoryUsage } = data.device;
        if (cpuUsage > 80) {
          newLogs.push({
            type: "warning",
            text: `High CPU usage (${cpuUsage}%) — Router is under load. Consider rebooting if performance degrades.`,
            timestamp,
            id: crypto.randomUUID(),
          });
          persistHistory({
            type: HISTORY_TYPES.WARNING,
            text: `High CPU usage: ${cpuUsage}%`,
          });
        }
        if (memoryUsage > 90) {
          newLogs.push({
            type: "warning",
            text: `High memory usage (${memoryUsage}%) — Router memory is critically low. A reboot is recommended.`,
            timestamp,
            id: crypto.randomUUID(),
          });
          persistHistory({
            type: HISTORY_TYPES.WARNING,
            text: `High memory usage: ${memoryUsage}%`,
          });
        }
      }

      // TEMPERATURE WARNING
      if (data.optical?.temperature) {
        const temp = parseFloat(data.optical.temperature);
        if (temp > 70) {
          newLogs.push({
            type: "warning",
            text: `High temperature (${temp}°C) — Ensure the router has adequate ventilation and is not enclosed.`,
            timestamp,
            id: crypto.randomUUID(),
          });
          persistHistory({
            type: HISTORY_TYPES.WARNING,
            text: `High temperature: ${temp}°C`,
          });
        }
      }
    }

    // Reset all tracking refs when router becomes unreachable
    if (!routerReachable) {
      prevWanIpRef.current = null;
      prevDevicesRef.current = null;
      prevDeviceCountRef.current = null;
    }

    // STATUS CHECK LOG — only when everything is OK
    const hasAnyIssues =
      !routerReachable ||
      (data &&
        ((Number(data?.optical?.txPower ?? 0) === 0 &&
          Number(data?.optical?.rxPower ?? 0) === 0) ||
          !data?.wan?.connected)) ||
      error ||
      status === "error" ||
      status === "los" ||
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
    <div className="h-full max-h-[40vh] sm:max-h-[45vh] lg:max-h-[calc(100vh-10rem)] flex flex-col lg:sticky lg:top-28 bg-black text-gray-300 text-sm overflow-hidden rounded-lg">
      <LogHeader
        onClearLogs={clearLogs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      {activeTab === "log" ? (
        <LogContent
          logs={sortedLogs}
          logContainerRef={logContainerRef}
          loading={loading}
          getIcon={getIcon}
        />
      ) : (
        <div
          className="flex-1 overflow-y-auto log-scrollbar border-l border-r border-b border-card-black rounded-lg rounded-t-none"
          style={{ scrollbarGutter: "stable" }}
        >
          <HistoryView refreshTick={sortedLogs.length} />
        </div>
      )}
    </div>
  );
};

export default LogPanel;
