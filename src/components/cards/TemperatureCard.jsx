import MetricCard from "../ui/MetricCard";
import IconWrapper from "../ui/IconWrapper";
import { temperature } from "../../assets/icons";

const TemperatureCard = ({ value, loading, status, statusColor }) => {
  const displayValue = value ? `${value} \u00B0C` : loading ? "..." : "N/A";

  return (
    <MetricCard
      icon={<IconWrapper src={temperature} alt="Temperature" />}
      label="Temperature"
      value={displayValue}
      subValue={status}
      subValueColor={statusColor}
    />
  );
};

export default TemperatureCard;
