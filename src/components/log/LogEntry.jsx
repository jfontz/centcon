import { formatLogTime } from "../../utils/formatters";
import { motion } from "framer-motion";

const LogEntry = ({ log, getIcon }) => {
  return (
    <motion.div
      className="flex items-start gap-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <span className="text-gray-500 shrink-0">{getIcon(log.type)}</span>
      <span
        className={`
          ${log.type === "header" ? "text-white" : ""}
          ${log.type === "success" ? "text-green-400" : ""}
          ${log.type === "progress" ? "text-blue-400" : ""}
          ${log.type === "action" ? "text-gray-400" : ""}
          ${log.type === "error" ? "text-red-400" : ""}
          ${log.type === "warning" ? "text-yellow-400" : ""}
          ${
            log.type === "info" ||
            log.type === "checking" ||
            log.type === "navigate"
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
    </motion.div>
  );
};

export default LogEntry;
