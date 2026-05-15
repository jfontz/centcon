const STATUS_CLASSES = {
  online:
    "text-[#218c4f] border border-[rgba(33,140,79,0.24)] bg-transparent dark:text-[#28a745] dark:border-[#28a7454d] dark:bg-transparent",
  offline:
    "text-[#7b7b74] border border-[rgba(123,123,116,0.24)] bg-transparent dark:text-[#6c757d] dark:border-[#6c757d4d] dark:bg-transparent",
  error:
    "text-[#c44955] border border-[rgba(196,73,85,0.24)] bg-transparent dark:text-[#dc3545] dark:border-[#dc35454d] dark:bg-transparent",
  progress:
    "text-[#326dcf] border border-[rgba(50,109,207,0.22)] bg-transparent dark:text-[#3b82f6] dark:border-[#3b82f64d] dark:bg-transparent",
  waiting:
    "text-[#b7791f] border border-[rgba(183,121,31,0.24)] bg-transparent dark:text-[#f59e0b] dark:border-[#f59e0b4d] dark:bg-transparent",
};

const DOT_CLASSES = {
  online: "bg-[#218c4f] dark:bg-green-500 animate-pulse",
  offline: "bg-[#7b7b74] dark:bg-gray-500",
  error: "bg-[#c44955] dark:bg-red-500",
  errorPulse: "bg-[#c44955] dark:bg-red-500 animate-pulse",
  progress: "bg-[#326dcf] dark:bg-blue-500",
  waiting: "bg-[#b7791f] dark:bg-amber-500",
};

const REBOOT_STATE_MAP = {
  IDLE: { statusClass: STATUS_CLASSES.offline, dot: DOT_CLASSES.offline, label: "" },
  LOGGING_IN: {
    statusClass: STATUS_CLASSES.progress,
    dot: DOT_CLASSES.progress,
    label: "Logging in\u2026",
  },
  NAVIGATING: {
    statusClass: STATUS_CLASSES.progress,
    dot: DOT_CLASSES.progress,
    label: "Navigating\u2026",
  },
  REBOOTING: {
    statusClass: STATUS_CLASSES.waiting,
    dot: DOT_CLASSES.waiting,
    label: "Rebooting\u2026",
  },
  WAITING: {
    statusClass: STATUS_CLASSES.waiting,
    dot: DOT_CLASSES.waiting,
    label: "Rebooting\u2026",
  },
  CHECKING_CONNECTION: {
    statusClass: STATUS_CLASSES.progress,
    dot: DOT_CLASSES.progress,
    label: "Checking connection\u2026",
  },
  ONLINE: {
    statusClass: STATUS_CLASSES.online,
    dot: DOT_CLASSES.online,
    label: "Online",
  },
  FAILED: { statusClass: STATUS_CLASSES.error, dot: DOT_CLASSES.error, label: "Failed" },
};

const ROUTER_STATUS_MAP = {
  online: {
    statusClass: STATUS_CLASSES.online,
    dot: DOT_CLASSES.online,
    label: "Online",
  },
  los: {
    statusClass: STATUS_CLASSES.error,
    dot: DOT_CLASSES.errorPulse,
    label: "LOS - No Signal",
  },
  wan_error: {
    statusClass: STATUS_CLASSES.error,
    dot: DOT_CLASSES.errorPulse,
    label: "Error - No Internet",
  },
  error: {
    statusClass: STATUS_CLASSES.error,
    dot: DOT_CLASSES.error,
    label: "Error",
  },
  offline: {
    statusClass: STATUS_CLASSES.offline,
    dot: DOT_CLASSES.offline,
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
