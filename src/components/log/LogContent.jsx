import { log } from "../../assets/icons";
import LogEntry from "./LogEntry.jsx";

const LogContent = ({ logs, logContainerRef, loading, getIcon }) => {
  return (
    <div
      ref={logContainerRef}
      className="log-scrollbar flex-1 overflow-y-auto p-4 space-y-2 min-h-0 border-l border-r border-b border-card-black rounded-lg rounded-t-none"
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
        logs.map((log, index) => (
          <LogEntry
            key={log.id ?? `log-${log.timestamp ?? index}-${index}`}
            log={log}
            getIcon={getIcon}
          />
        ))
      )}
    </div>
  );
};

export default LogContent;
