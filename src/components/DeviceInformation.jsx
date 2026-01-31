import SectionContainer from "./ui/SectionContainer";
import DeviceModelCard from "./cards/DeviceModelCard";
import DeviceSoftwareCard from "./cards/DeviceSoftwareCard";
import { useModem } from "../context/ModemContext";

const DeviceInformation = () => {
  const { data, loading } = useModem();

  const deviceInfo = data?.device;

  return (
    <SectionContainer title="Device Information" className="w-full h-full">
      <div className="grid grid-cols-1 gap-4">
        <DeviceModelCard value={deviceInfo?.model} loading={loading} />
        <DeviceSoftwareCard value={deviceInfo?.software} loading={loading} />
      </div>
    </SectionContainer>
  );
};

export default DeviceInformation;
