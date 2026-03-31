import { useState, useEffect } from "react";
import { formatTimeAgo } from "../../utils/formatters";

const MetaInfo = ({ className, lastUpdated }) => {
  const routerIp = import.meta.env.VITE_ROUTER_IP || "192.168.254.254";
  const [timeAgo, setTimeAgo] = useState(formatTimeAgo(lastUpdated));

  useEffect(() => {
    setTimeAgo(formatTimeAgo(lastUpdated));
  }, [lastUpdated]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgo(formatTimeAgo(lastUpdated));
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className={className}>
      <span>{routerIp}</span>
      <span>•</span>
      <span>Last updated: {timeAgo}</span>
    </div>
  );
};

export default MetaInfo;
