import SectionContainer from "./ui/SectionContainer";
import LANCard from "./cards/LANCard";
import WiFi24Card from "./cards/WiFi24Card";
import WiFi5Card from "./cards/WiFi5Card";
import { useModem } from "../context/ModemContext";

const ConnectedDevices = () => {
  const { data, loading } = useModem();

  const devices = data?.connectedDevices || {
    lan: 0,
    wifi24: 0,
    wifi5: 0,
    total: 0,
  };

  return (
    <SectionContainer
      title={`Connected Devices (${loading ? "..." : devices.total})`}
      className="w-full h-full"
    >
      <div className="flex-col md:flex-row flex gap-4 h-full">
        <LANCard value={devices.lan.toString()} loading={loading} />
        <WiFi24Card value={devices.wifi24.toString()} loading={loading} />
        <WiFi5Card value={devices.wifi5.toString()} loading={loading} />
      </div>
    </SectionContainer>
  );
};

export default ConnectedDevices;
