import SectionContainer from "./ui/SectionContainer";
import MetricCard from "./ui/MetricCard";
import { runtime, temperature, cpu, memory } from "../assets/icons";

const SystemStatus = () => {
  return (
    <div className="bg-black text-white">
      {/* System Status Section */}
      <SectionContainer title="System Status" className="max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricCard
            icon={<img src={runtime} alt="Runtime" className="w-5 h-5" />}
            label="Runtime"
            value="6d 15h 27m 15s"
          />

          <MetricCard
            icon={<img src={temperature} alt="Runtime" className="w-5 h-5" />}
            label="Temperature"
            value="48.80 °C"
            subValue="Normal"
          />

          <MetricCard
            icon={<img src={cpu} alt="Cpu usage" className="w-5 h-5" />}
            label="CPU Usage"
            value="2%"
          />

          <MetricCard
            icon={<img src={memory} alt="Memory usage" className="w-5 h-5" />}
            label="Memory Usage"
            value="65%"
          />
        </div>
      </SectionContainer>
    </div>
  );
};

export default SystemStatus;
