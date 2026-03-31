const MetricCard = ({
  icon,
  label,
  value,
  subValue,
  subValueColor = "text-green",
}) => {
  return (
    <div className="card-stat group flex flex-col justify-between h-full w-full hover:bg-white/2 hover:border-white/20 transition-all duration-300 ease-out">
      {/* Header: Icon + Label */}
      <div className="flex items-center gap-3 mb-3">
        {/* Render the icon wrapper */}
        <div className="text-zinc-400 group-hover:text-white transition-colors duration-300 pointer-events-none select-none">
          {icon}
        </div>
        <span className="text-sm tracking-[0.15em] uppercase text-gray">
          {label}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-center gap-3">
        <span className="text-lg font-light text-zinc-100 tracking-widest lg:break-all">
          {value}
        </span>

        {/* Optional Sub-value for temperature */}
        {subValue && (
          <span
            className={
              subValue === "Normal"
                ? "temp-normal"
                : `text-[10px] font-normal uppercase tracking-wider mb-1 ${subValueColor}`
            }
          >
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
