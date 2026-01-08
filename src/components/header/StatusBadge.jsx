const StatusBadge = ({ status }) => {
  const statusMap = {
    online: {
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      dot: "bg-green-500 animate-pulse",
      text: "text-green-500",
      label: "Online",
    },
    error: {
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      dot: "bg-red-500",
      text: "text-red-500",
      label: "Error",
    },
    offline: {
      bg: "bg-gray-500/10",
      border: "border-gray-500/20",
      dot: "bg-gray-500",
      text: "text-gray-500",
      label: "Offline",
    },
  };

  const current = statusMap[status] || statusMap.offline;

  return (
    <div
      className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border ${current.bg} ${current.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span
        className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${current.text}`}
      >
        {current.label}
      </span>
    </div>
  );
};

export default StatusBadge;
