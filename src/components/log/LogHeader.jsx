import { log, clear, history } from "../../assets/icons";

const LogHeader = ({ onClearLogs, activeTab, onTabChange }) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border border-card-black bg-card-black rounded-lg rounded-b-none">
      {/* Tabs */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onTabChange("log")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-sm transition-all cursor-pointer ${
            activeTab === "log"
              ? "bg-zinc-800 text-gray-200"
              : "text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900"
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
              ? "bg-zinc-800 text-gray-200"
              : "text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900"
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
