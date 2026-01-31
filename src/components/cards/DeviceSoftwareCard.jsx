import MetricCard from "../ui/MetricCard";
import IconWrapper from "../ui/IconWrapper";
import { software } from "../../assets/icons";

const DeviceSoftwareCard = ({ value, loading }) => {
  const displayValue = value || (loading ? "..." : "N/A");

  return (
    <MetricCard
      icon={<IconWrapper src={software} alt="Software Version" />}
      label="Software Version"
      value={displayValue}
    />
  );
};

export default DeviceSoftwareCard;
