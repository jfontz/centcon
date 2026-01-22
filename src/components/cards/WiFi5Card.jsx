import MetricCard from "../ui/MetricCard";
import IconWrapper from "../ui/IconWrapper";
import { wifi } from "../../assets/icons";

const WiFi5Card = ({ value, loading }) => {
  const displayValue = value || (loading ? "..." : "N/A");

  return (
    <MetricCard
      icon={<IconWrapper src={wifi} alt="Wifi" />}
      label="Wireless 5.0"
      value={displayValue}
    />
  );
};

export default WiFi5Card;
