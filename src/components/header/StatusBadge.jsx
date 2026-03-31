const REBOOT_STATE_MAP = {
  IDLE: { statusClass: "status-offline", dot: "bg-gray-500", label: "" },
  LOGGING_IN: {
    statusClass: "status-reboot-progress",
    dot: "bg-blue-500",
    label: "Logging in…",
  },
  NAVIGATING: {
    statusClass: "status-reboot-progress",
    dot: "bg-blue-500",
    label: "Navigating…",
  },
  REBOOTING: {
    statusClass: "status-reboot-waiting",
    dot: "bg-amber-500",
    label: "Rebooting…",
  },
  WAITING: {
    statusClass: "status-reboot-waiting",
    dot: "bg-amber-500",
    label: "Rebooting…",
  },
  CHECKING_CONNECTION: {
    statusClass: "status-reboot-progress",
    dot: "bg-blue-500",
    label: "Checking connection…",
  },
  ONLINE: {
    statusClass: "status-online",
    dot: "bg-green-500 animate-pulse",
    label: "Online",
  },
  FAILED: { statusClass: "status-error", dot: "bg-red-500", label: "Failed" },
};

const ROUTER_STATUS_MAP = {
  online: {
    statusClass: "status-online",
    dot: "bg-green-500 animate-pulse",
    label: "Online",
  },
  los: {
    statusClass: "status-error",
    dot: "bg-red-500 animate-pulse",
    label: "LOS - No Signal",
  },
  error: {
    statusClass: "status-error",
    dot: "bg-red-500",
    label: "Error",
  },
  offline: {
    statusClass: "status-offline",
    dot: "bg-gray-500",
    label: "Offline",
  },
};

const StatusBadge = ({ status, rebootState }) => {
  // Only show reboot status during active reboot states
  // Once reboot completes (ONLINE/FAILED) or is idle, show actual router status
  const inRebootFlow =
    rebootState &&
    rebootState.command === "reboot" &&
    rebootState.state !== "IDLE" &&
    rebootState.state !== "ONLINE" &&
    rebootState.state !== "FAILED" &&
    rebootState.state !== "SUCCEEDED";

  let current;
  if (inRebootFlow && rebootState) {
    const reboot = REBOOT_STATE_MAP[rebootState.state] || REBOOT_STATE_MAP.IDLE;
    let label = reboot.label || rebootState.message;
    if (rebootState.state === "WAITING" && rebootState.countdown != null) {
      label = `Device rebooting... ${rebootState.countdown}s remaining`;
    } else if (rebootState.message) {
      label = rebootState.message;
    }
    current = { ...reboot, label };
  } else {
    // Use actual router status when not actively rebooting
    current = ROUTER_STATUS_MAP[status] || ROUTER_STATUS_MAP.offline;
  }

  return (
    <div className={`status-pill ${current.statusClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
        {current.label}
      </span>
    </div>
  );
};

export default StatusBadge;
