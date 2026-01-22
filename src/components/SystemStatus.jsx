// ============================================
// FILE: src/components/SystemStatus.jsx
// ============================================
import { useEffect, useState } from "react";
import SectionContainer from "./ui/SectionContainer";
import RuntimeCard from "./cards/RuntimeCard";
import TemperatureCard from "./cards/TemperatureCard";
import CPUCard from "./cards/CPUCard";
import MemoryCard from "./cards/MemoryCard";
import { useModem } from "../context/ModemContext";
import { getTemperatureStatus, getTemperatureColor } from "../utils/formatters";

// Local formatter to keep the runtime display consistent with the modem API
const formatUptime = (seconds) => {
  if (seconds == null) return null;

  const totalSeconds = Math.max(0, Math.floor(seconds));
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(" ");
};

const SystemStatus = () => {
  const { data, loading } = useModem();

  const deviceInfo = data?.device;
  const opticalInfo = data?.optical;

  const [uptimeSeconds, setUptimeSeconds] = useState(deviceInfo?.uptime ?? null);

  // Whenever a new uptime value comes from the modem, reset our local counter
  useEffect(() => {
    if (deviceInfo?.uptime == null) {
      setUptimeSeconds(null);
      return;
    }

    setUptimeSeconds(deviceInfo.uptime);

    const interval = setInterval(() => {
      setUptimeSeconds((prev) => (prev == null ? null : prev + 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [deviceInfo?.uptime]);

  const tempStatus = getTemperatureStatus(opticalInfo?.temperature);
  const tempColor = getTemperatureColor(opticalInfo?.temperature);

  const runtimeValue =
    loading || uptimeSeconds == null
      ? loading
        ? "..."
        : deviceInfo?.uptimeFormatted || "N/A"
      : formatUptime(uptimeSeconds);

  return (
    <SectionContainer title="System Status" className="w-full h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        <RuntimeCard value={runtimeValue} loading={loading} />

        <TemperatureCard
          value={opticalInfo?.temperature}
          loading={loading}
          status={tempStatus}
          statusColor={tempColor}
        />

        <CPUCard value={deviceInfo?.cpuUsage} loading={loading} />

        <MemoryCard value={deviceInfo?.memoryUsage} loading={loading} />
      </div>
    </SectionContainer>
  );
};

export default SystemStatus;
