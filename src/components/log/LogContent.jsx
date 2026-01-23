import { log } from "../../assets/icons";

const LogContent = ({ logs, logContainerRef, loading, getIcon }) => {
  const LogEntry = ({ log }) => {
    return (
      <div className="flex items-start gap-3">
        <span className="text-gray-500 shrink-0">{getIcon(log.type)}</span>
        <span
          className={`
            ${log.type === "header" ? "text-gray-400 font-semibold" : ""}
            ${log.type === "success" ? "text-green-400" : ""}
            ${log.type === "progress" ? "text-blue-400" : ""}
            ${log.type === "error" ? "text-red-400" : ""}
            ${log.type === "warning" ? "text-yellow-400" : ""}
            ${
              log.type === "info" || log.type === "checking"
                ? "text-gray-300"
                : ""
            }
          `}
        >
          {log.timestamp && (
            <span className="text-gray-600 mr-2">
              [{new Date(log.timestamp).toLocaleTimeString()}]
            </span>
          )}
          {log.text}
        </span>
      </div>
    );
  };

  return (
    <div
      ref={logContainerRef}
      className="log-scrollbar flex-1 overflow-y-auto p-4 space-y-2 min-h-0 border-l border-r border-b border-card-black rounded-lg rounded-t-none"
    >
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center text-gray-500">
          <div className="w-12 h-12 mb-2 my-1">
            <img src={log} alt="Logs" className="w-12 h-12" />
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
        logs.map((log, index) => <LogEntry key={index} log={log} />)
      )}
    </div>
  );
};

export default LogContent;
