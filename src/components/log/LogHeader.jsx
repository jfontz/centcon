import { log, clear } from "../../assets/icons";

const LogHeader = ({ onClearLogs }) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border border-card-black bg-card-black rounded-lg rounded-b-none">
      <div className="flex items-center gap-1">
        <img src={log} alt="Log icon" className="w-4.5 h-4.5" />
        <span className="text-gray-400">LOG</span>
      </div>
      <button onClick={onClearLogs}>
        <img
          src={clear}
          alt="Clear log"
          className="w-4.5 h-4.5 cursor-pointer"
        />
      </button>
    </div>
  );
};

export default LogHeader;
