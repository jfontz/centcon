import MetricCard from "../ui/MetricCard";
import IconWrapper from "../ui/IconWrapper";
import { lan } from "../../assets/icons";

const LANCard = ({ value, loading }) => {
  const displayValue = value || (loading ? "..." : "N/A");

  return (
    <MetricCard
      icon={<IconWrapper src={lan} alt="Lan" />}
      label="Wired/LAN"
      value={displayValue}
    />
  );
};

export default LANCard;
