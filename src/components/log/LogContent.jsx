import { log } from "../../assets/icons";
import LogEntry from "./LogEntry.jsx";

// Human-readable labels for command group headers
const COMMAND_LABELS = {
  reboot: "Reboot",
  "wifi-credentials": "Wi-Fi Credentials",
};

/**
 * Groups a flat log array into segments.
 * Consecutive entries sharing the same command value form a group.
 * Entries without a command field are standalone segments.
 *
 * Returns an array of segments:
 * - { type: "group", command, entries[] }
 * - { type: "entry", entry }
 */
const groupLogs = (logs) => {
  const segments = [];
  let currentGroup = null;

  logs.forEach((entry) => {
    if (entry.command) {
      if (currentGroup && currentGroup.command === entry.command) {
        currentGroup.entries.push(entry);
      } else {
        currentGroup = { type: "group", command: entry.command, entries: [entry] };
        segments.push(currentGroup);
      }
    } else {
      currentGroup = null;
      segments.push({ type: "entry", entry });
    }
  });

  return segments;
};

const LogContent = ({ logs, logContainerRef, loading, getIcon }) => {
  const segments = groupLogs(logs);

  return (
    <div
      ref={logContainerRef}
      className="log-entries log-scrollbar flex-1 overflow-y-auto p-4 space-y-2 min-h-0 border-l border-r border-b border-card-black rounded-lg rounded-t-none"
    >
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center text-gray-500">
          <div className="w-12 h-12 mb-2 my-1">
            <img src={log} alt="Logs" className="w-12 h-12 pointer-events-none select-none" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            {loading ? "Initializing..." : "No activity detected"}
          </p>
          {!loading && (
            <p className="text-xs text-gray-500 mt-1">
              Events will appear here when detected
            </p>
          )}
        </div>
      ) : (
        segments.map((segment, idx) => {
          if (segment.type === "entry") {
            return (
              <LogEntry
                key={segment.entry.id}
                log={segment.entry}
                getIcon={getIcon}
              />
            );
          }

          // Command group — left border accent with subtle bg tint
          const label = COMMAND_LABELS[segment.command] || segment.command;
          return (
            <div
              key={`group-${idx}`}
              className="border-l-2 border-zinc-700 bg-white/2 rounded-r-md pl-3 py-2 flex flex-col gap-2"
            >
              <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-600 font-semibold">
                {label}
              </span>
              {segment.entries.map((entry) => (
                <LogEntry
                  key={entry.id}
                  log={entry}
                  getIcon={getIcon}
                />
              ))}
            </div>
          );
        })
      )}
    </div>
  );
};

export default LogContent;