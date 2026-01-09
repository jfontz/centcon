import SectionContainer from "./ui/SectionContainer";
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
            <button key={label} className={buttonClass}>
              <img src={icon} alt={label} className="w-4.5 h-4.5" />
              <p>{label}</p>
            </button>
          ))}
        </div>
      </SectionContainer>
    </div>
  );
};

export default SystemControls;
