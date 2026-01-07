const MetricCard = ({
  icon,
  label,
  value,
  subValue,
  subValueColor = "text-green-500",
}) => {
  return (
    <div
      className="
      group flex flex-col justify-between
      h-full w-full
      p-5 rounded-lg
      border border-white/5 
      bg-transparent
      hover:bg-white/2 hover:border-white/20
      transition-all duration-300 ease-out
    "
    >
      {/* Header: Icon + Label */}
      <div className="flex items-center gap-3 mb-3">
        {/* Render the icon wrapper */}
        <div className="text-zinc-400 group-hover:text-white transition-colors duration-300">
          {icon}
        </div>
        <span className="text-sm font-montserrat tracking-[0.15em] uppercase text-zinc-500">
          {label}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-end gap-3">
        <span className="text-lg font-montserrat font-medium text-zinc-100 tracking-wide">
          {value}
        </span>

        {/* Optional Sub-value for temperature */}
        {subValue && (
          <span
            className={`text-[10px] font-normal uppercase tracking-wider mb-1 ${subValueColor}`}
          >
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
