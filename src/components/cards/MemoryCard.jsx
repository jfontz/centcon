import MetricCard from "../ui/MetricCard";
import IconWrapper from "../ui/IconWrapper";
import { memory } from "../../assets/icons";

const MemoryCard = ({ value, loading }) => {
  const displayValue = value ? `${value}%` : loading ? "..." : "N/A";

  return (
    <MetricCard
      icon={<IconWrapper src={memory} alt="Memory usage" />}
      label="Memory Usage"
      value={displayValue}
    />
  );
};

export default MemoryCard;
