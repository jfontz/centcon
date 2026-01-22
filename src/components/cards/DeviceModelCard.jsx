import MetricCard from "../ui/MetricCard";
import IconWrapper from "../ui/IconWrapper";
import { device } from "../../assets/icons";

const DeviceModelCard = ({ value, loading }) => {
  const displayValue = value || (loading ? "..." : "N/A");

  return (
    <MetricCard
      icon={<IconWrapper src={device} alt="Device model" />}
      label="Device Model"
      value={displayValue}
    />
  );
};

export default DeviceModelCard;
