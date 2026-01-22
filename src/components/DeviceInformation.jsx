import SectionContainer from "./ui/SectionContainer";
import DeviceModelCard from "./cards/DeviceModelCard";
import DeviceSerialCard from "./cards/DeviceSerialCard";
import { useModem } from "../context/ModemContext";

const DeviceInformation = () => {
  const { data, loading } = useModem();

  const deviceInfo = data?.device;

  return (
    <SectionContainer title="Device Information" className="w-full h-full">
      <div className="grid grid-cols-1 gap-4">
        <DeviceModelCard value={deviceInfo?.model} loading={loading} />
        <DeviceSerialCard value={deviceInfo?.serial} loading={loading} />
      </div>
    </SectionContainer>
  );
};

export default DeviceInformation;
