import { formatLogTime } from "../../utils/formatters";
import { motion } from "framer-motion";

const MotionDiv = motion.div;

const LogEntry = ({ log, getIcon }) => {
  return (
    <MotionDiv
      className="flex items-start gap-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <span className="text-[#666660] dark:text-gray-500 shrink-0">{getIcon(log.type)}</span>
      <span
        className={`
          ${log.type === "header" ? "text-[#24241f] dark:text-white" : ""}
          ${log.type === "success" ? "text-[#218c4f] dark:text-green-400" : ""}
          ${log.type === "progress" ? "text-[#326dcf] dark:text-blue-400" : ""}
          ${log.type === "connected" ? "text-[#326dcf] dark:text-blue-400" : ""}
          ${log.type === "action" ? "text-[#666660] dark:text-gray-400" : ""}
          ${log.type === "error" ? "text-[#c44955] dark:text-red-400" : ""}
          ${log.type === "warning" ? "text-[#b7791f] dark:text-yellow-400" : ""}
          ${
            log.type === "info" ||
            log.type === "checking" ||
            log.type === "navigate"
              ? "text-[#4f4f49] dark:text-gray-300"
              : ""
          }
        `}
      >
        {log.timestamp && (
          <span className="text-[#8a8a83] dark:text-gray-600 mr-2">
            [{formatLogTime(log.timestamp)}]
          </span>
        )}
        {log.text}
      </span>
    </MotionDiv>
  );
};

export default LogEntry;
