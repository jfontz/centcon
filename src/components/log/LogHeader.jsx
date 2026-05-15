import { log, clear, history } from "../../assets/icons";

const LogHeader = ({ onClearLogs, activeTab, onTabChange }) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border border-[#cec8bc] bg-[#f5f3ed] dark:border-[#222222] dark:bg-[#050505] rounded-lg rounded-b-none">
      {/* Tabs */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onTabChange("log")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-sm transition-all cursor-pointer ${
            activeTab === "log"
              ? "bg-[#ddd9d0] text-[#24241f] dark:bg-zinc-800 dark:text-gray-200"
              : "text-[#8a8a83] hover:text-[#666660] hover:bg-[#f0ede6] dark:text-zinc-600 dark:hover:text-zinc-400 dark:hover:bg-zinc-900"
          }`}
        >
          <img
            src={log}
            alt=""
            className="w-4 h-4 pointer-events-none select-none"
            style={{ opacity: activeTab === "log" ? 1 : 0.4 }}
          />
          <span>LOG</span>
        </button>
        <button
          onClick={() => onTabChange("history")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-sm transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-[#ddd9d0] text-[#24241f] dark:bg-zinc-800 dark:text-gray-200"
              : "text-[#8a8a83] hover:text-[#666660] hover:bg-[#f0ede6] dark:text-zinc-600 dark:hover:text-zinc-400 dark:hover:bg-zinc-900"
          }`}
        >
          <img
            src={history}
            alt=""
            className="w-4 h-4 pointer-events-none select-none"
            style={{ opacity: activeTab === "history" ? 1 : 0.4 }}
          />
          <span>HISTORY</span>
        </button>
      </div>

      {/* Clear — only on log tab */}
      {activeTab === "log" && (
        <button
          type="button"
          onClick={onClearLogs}
          aria-label="Clear log entries"
          className="cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
        >
          <img src={clear} alt="" className="w-4.5 h-4.5" />
        </button>
      )}
    </div>
  );
};

export default LogHeader;
