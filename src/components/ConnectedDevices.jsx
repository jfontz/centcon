import { useState } from "react";
import SectionContainer from "./ui/SectionContainer";
import LANCard from "./cards/LANCard";
import WiFi24Card from "./cards/WiFi24Card";
import WiFi5Card from "./cards/WiFi5Card";
import DeviceListModal from "./modals/DeviceListModal";
import { useRouter } from "../context/RouterContext";
import { newTab } from "../assets/icons";

const ConnectedDevices = () => {
  const { data, loading } = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  const devices = data?.connectedDevices || {
    lan: 0,
    wifi24: 0,
    wifi5: 0,
    total: 0,
    devices: [],
  };

  return (
    <>
      <SectionContainer
        title={`Connected Devices (${loading ? "..." : devices.total})`}
        className="w-full h-full"
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 text-[11px] text-[#666660] hover:text-[#24241f] dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors cursor-pointer"
            title="View all connected devices"
          >
            <span className="text-xs">View all</span>
            <img
              src={newTab}
              alt="View all"
              className="w-3.5 h-3.5 pointer-events-none select-none"
            />
          </button>
        }
      >
        <div className="flex-col md:flex-row flex gap-4 h-full">
          <LANCard value={devices.lan.toString()} loading={loading} />
          <WiFi24Card value={devices.wifi24.toString()} loading={loading} />
          <WiFi5Card value={devices.wifi5.toString()} loading={loading} />
        </div>
      </SectionContainer>

      <DeviceListModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        devices={devices.devices || []}
      />
    </>
  );
};

export default ConnectedDevices;
