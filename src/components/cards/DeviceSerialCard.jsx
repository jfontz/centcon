import MetricCard from "../ui/MetricCard";
import IconWrapper from "../ui/IconWrapper";
import { serial } from "../../assets/icons";

const DeviceSerialCard = ({ value, loading }) => {
  const displayValue = value || (loading ? "..." : "N/A");

  return (
    <MetricCard
      icon={<IconWrapper src={serial} alt="Model serial" />}
      label="Model Serial"
      value={displayValue}
    />
  );
};

export default DeviceSerialCard;
