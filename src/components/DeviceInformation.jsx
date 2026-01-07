import SectionContainer from "./ui/SectionContainer";
import MetricCard from "./ui/MetricCard";
import { device, serial } from "../assets/icons";

const DeviceInformation = () => {
  return (
    <div className="bg-black text-white">
      {/* System Status Section */}
      <SectionContainer title="Device Information" className="max-w-3xl">
        <div className="grid grid-cols-1 gap-4">
          <MetricCard
            icon={<img src={device} alt="Device model" className="w-5 h-5" />}
            label="Device Model"
            value="G-1426G-A"
          />

          <MetricCard
            icon={<img src={serial} alt="Model serial" className="w-5 h-5" />}
            label="Model Serial"
            value="ALCLEB48FC61"
          />
        </div>
      </SectionContainer>
    </div>
  );
};

export default DeviceInformation;
