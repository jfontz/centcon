import SectionContainer from "./ui/SectionContainer";
import DeviceModelCard from "./cards/DeviceModelCard";
import DeviceSoftwareCard from "./cards/DeviceSoftwareCard";
import { useRouter } from "../context/RouterContext";

const DeviceInformation = () => {
  const { data, loading } = useRouter();

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
