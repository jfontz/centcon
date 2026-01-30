import MetricCard from "../ui/MetricCard";
import IconWrapper from "../ui/IconWrapper";
import { firmware } from "../../assets/icons";

const DeviceSerialCard = ({ value, loading }) => {
  const displayValue = value || (loading ? "..." : "N/A");

  return (
    <MetricCard
      icon={<IconWrapper src={firmware} alt="Firmware Version" />}
      label="Firmware Version"
      value={displayValue}
    />
  );
};

export default DeviceSerialCard;
