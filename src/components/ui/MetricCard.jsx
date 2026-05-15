const MetricCard = ({
  icon,
  label,
  value,
  subValue,
  subValueColor = "text-[#218c4f] dark:text-[#28a745]",
}) => {
  return (
    <div className="rounded-lg p-4 bg-[#f5f3ed] border border-[#cec8bc] dark:bg-[#050505] dark:border-[#222222] group flex flex-col justify-between h-full w-full hover:bg-[#f0ede6] hover:border-[#bfb8ab] dark:hover:bg-white/2 dark:hover:border-white/20 transition-all duration-300 ease-out">
      {/* Header: Icon + Label */}
      <div className="flex items-center gap-3 mb-3">
        {/* Render the icon wrapper */}
        <div className="text-[#666660] group-hover:text-[#24241f] dark:text-zinc-400 dark:group-hover:text-white transition-colors duration-300 pointer-events-none select-none">
          {icon}
        </div>
        <span className="text-sm tracking-[0.15em] uppercase text-[#666660] dark:text-[#858585]">
          {label}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-center gap-3">
        <span className="text-lg font-light text-[#24241f] dark:text-zinc-100 tracking-widest lg:break-all">
          {value}
        </span>

        {/* Optional Sub-value for temperature */}
        {subValue && (
          <span
            className={
              subValue === "Normal"
                ? "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-[#218c4f] dark:text-[#28a745]"
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
