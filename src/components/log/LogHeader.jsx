import { log, clear } from "../../assets/icons";

const LogHeader = ({ onClearLogs, activeTab, onTabChange }) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border border-card-black bg-card-black rounded-lg rounded-b-none">
      {/* Tabs */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onTabChange("log")}
          className={`flex items-center gap-1 transition-colors ${
            activeTab === "log"
              ? "text-gray-300"
              : "text-zinc-600 hover:text-zinc-400"
          }`}
        >
          <img
            src={log}
            alt=""
            className="w-4.5 h-4.5 pointer-events-none select-none"
          />
          <span className="text-gray-400 text-sm">LOG</span>
        </button>
        <button
          onClick={() => onTabChange("history")}
          className={`text-sm transition-colors ${
            activeTab === "history"
              ? "text-gray-300"
              : "text-zinc-600 hover:text-zinc-400"
          }`}
        >
          HISTORY
        </button>
      </div>

      {/* Clear — only on log tab */}
      {activeTab === "log" && (
        <button
          type="button"
          onClick={onClearLogs}
          aria-label="Clear log entries"
        >
          <img src={clear} alt="" className="w-4.5 h-4.5 cursor-pointer" />
        </button>
      )}
    </div>
  );
};

export default LogHeader;
