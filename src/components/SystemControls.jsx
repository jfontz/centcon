import SectionContainer from "./ui/SectionContainer";
import SystemControlButton from "./buttons/SystemControlButton";
import { useModem } from "../context/ModemContext";
import { reboot, newTab } from "../assets/icons";

const controls = [
  {
    icon: reboot,
    label: "Reboot Modem",
    buttonClass: "btn-reboot",
    isReboot: true,
  },
  {
    icon: newTab,
    label: "Login to Modem",
    buttonClass: "control-btn",
    isReboot: false,
  },
];

const SystemControls = () => {
  const { rebootState, triggerReboot } = useModem();

  return (
    <div className="bg-black text-white text-sm">
      <SectionContainer title="System Controls" className="flex">
        <div className="flex flex-col gap-4">
          {controls.map(({ icon, label, buttonClass, isReboot }) => (
            <SystemControlButton
              key={label}
              icon={icon}
              label={label}
              buttonClass={buttonClass}
              onClick={isReboot ? undefined : undefined}
              rebootState={isReboot ? rebootState : undefined}
              triggerReboot={isReboot ? triggerReboot : undefined}
            />
          ))}
        </div>
      </SectionContainer>
    </div>
  );
};

export default SystemControls;
