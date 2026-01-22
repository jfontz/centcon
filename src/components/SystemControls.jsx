import SectionContainer from "./ui/SectionContainer";
import SystemControlButton from "./buttons/SystemControlButton";
import { reboot, newTab } from "../assets/icons";

const controls = [
  {
    icon: reboot,
    label: "Reboot Modem",
    buttonClass: "btn-reboot",
  },
  {
    icon: newTab,
    label: "Login to Modem",
    buttonClass: "control-btn",
  },
];

const SystemControls = () => {
  return (
    <div className="bg-black text-white text-sm">
      <SectionContainer title="System Controls" className="flex">
        <div className="flex flex-col gap-4">
          {controls.map(({ icon, label, buttonClass }) => (
            <SystemControlButton
              key={label}
              icon={icon}
              label={label}
              buttonClass={buttonClass}
            />
          ))}
        </div>
      </SectionContainer>
    </div>
  );
};

export default SystemControls;
