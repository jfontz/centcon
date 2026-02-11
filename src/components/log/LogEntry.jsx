import { formatLogTime } from "../../utils/formatters";

const LogEntry = ({ log, getIcon }) => {
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
            [{formatLogTime(log.timestamp)}]
          </span>
        )}
        {log.text}
      </span>
    </div>
  );
};

export default LogEntry;
