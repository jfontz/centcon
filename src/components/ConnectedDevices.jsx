import SectionContainer from "./ui/SectionContainer";
import MetricCard from "./ui/MetricCard";
import { lan, wifi } from "../assets/icons";

const ConnectedDevices = () => {
  return (
    <SectionContainer title="Connected Devices (14)" className="w-full h-full">
      {/* TODO: Replace SectionContainer title with dynamic total connected devices */}
      <div className="flex-col md:flex-row flex gap-4 h-full">
        <MetricCard
          icon={<img src={lan} alt="Lan" className="w-5 h-5 min-w-5 min-h-5" />}
          label="Wired/LAN"
          value="1"
        />

        <MetricCard
          icon={
            <img src={wifi} alt="Wifi" className="w-5 h-5 min-w-5 min-h-5" />
          }
          label="Wireless 2.4"
          value="6"
        />

        <MetricCard
          icon={
            <img src={wifi} alt="Wifi" className="w-5 h-5 min-w-5 min-h-5" />
          }
          label="Wireless 5.0"
          value="7"
        />
      </div>
    </SectionContainer>
  );
};

export default ConnectedDevices;
