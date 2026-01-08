import SectionContainer from "./ui/SectionContainer";
import { reboot, newTab } from "../assets/icons";

const controls = [
  {
    icon: reboot,
    label: "Reboot Modem",
    textClass: "text-[#F87171]",
    borderClass: "border-[#7f1d1d4d]",
    bgClass: "bg-[#811d1d1a]",
  },
  {
    icon: newTab,
    label: "Login to Modem",
    textClass: "text-white",
    borderClass: "border-[#222222]",
    bgClass: "bg-[#050505]",
  },
];

const SystemControls = () => {
  return (
    <div className="bg-black text-white text-sm">
      <SectionContainer title="System Controls" className="flex">
        <div className="flex flex-col gap-4">
          {controls.map(({ icon, label, textClass, borderClass, bgClass }) => (
            <div
              key={label}
              className={`flex items-center justify-center gap-3 py-3 border rounded-[5px] ${borderClass} ${bgClass} ${textClass} `}
            >
              <img src={icon} alt={label} className="w-4.5 h-4.5" />
              <p>{label}</p>
            </div>
          ))}
        </div>
      </SectionContainer>
    </div>
  );
};

export default SystemControls;
