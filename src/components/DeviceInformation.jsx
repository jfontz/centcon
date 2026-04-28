// DeviceInformation.jsx
import SectionContainer from "./ui/SectionContainer";
import RouterVisual from "./RouterVisual";

const DeviceInformation = () => (
  <SectionContainer title="Device" className="w-full h-full z-0">
    <div className="flex items-center justify-center h-full">
      <RouterVisual />
    </div>
  </SectionContainer>
);

export default DeviceInformation;
