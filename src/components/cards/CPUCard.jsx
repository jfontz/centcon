import MetricCard from "../ui/MetricCard";
import IconWrapper from "../ui/IconWrapper";
import { cpu } from "../../assets/icons";

const CPUCard = ({ value, loading }) => {
  const displayValue = value ? `${value}%` : loading ? "..." : "N/A";

  return (
    <MetricCard
      icon={<IconWrapper src={cpu} alt="CPU usage" />}
      label="CPU Usage"
      value={displayValue}
    />
  );
};

export default CPUCard;
