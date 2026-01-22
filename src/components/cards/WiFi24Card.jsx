import MetricCard from "../ui/MetricCard";
import IconWrapper from "../ui/IconWrapper";
import { wifi } from "../../assets/icons";

const WiFi24Card = ({ value, loading }) => {
  const displayValue = value || (loading ? "..." : "N/A");

  return (
    <MetricCard
      icon={<IconWrapper src={wifi} alt="Wifi" />}
      label="Wireless 2.4"
      value={displayValue}
    />
  );
};

export default WiFi24Card;
