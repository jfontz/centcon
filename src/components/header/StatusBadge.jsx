const StatusBadge = ({ status }) => {
  const statusMap = {
    online: {
      statusClass: "status-online",
      dot: "bg-green-500 animate-pulse",
      label: "Online",
    },
    error: {
      statusClass: "status-error",
      dot: "bg-red-500",
      label: "Error",
    },
    offline: {
      statusClass: "status-offline",
      dot: "bg-gray-500",
      label: "Offline",
    },
  };

  const current = statusMap[status] || statusMap.offline;

  return (
    <div className={`status-pill ${current.statusClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
        {current.label}
      </span>
    </div>
  );
};

export default StatusBadge;
