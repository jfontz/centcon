import MetricCard from "../ui/MetricCard";
import IconWrapper from "../ui/IconWrapper";
import { runtime } from "../../assets/icons";

const RuntimeCard = ({ value, loading }) => {
  const displayValue = value || (loading ? "..." : "N/A");

  return (
    <MetricCard
      icon={<IconWrapper src={runtime} alt="Runtime" />}
      label="Runtime"
      value={displayValue}
    />
  );
};

export default RuntimeCard;
