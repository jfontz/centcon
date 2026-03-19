const HelpTooltip = ({
  label,
  buttonAriaLabel,
  placement = "top",
  widthClass = "w-64",
  alignClass = "left-0",
  arrowClass = "",
  children,
}) => {
  const isTop = placement === "top";
  const offsetClass = isTop ? "bottom-full mb-2" : "top-full mt-2";

  return (
    <div className="relative group">
      <button
        type="button"
        aria-label={buttonAriaLabel}
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-zinc-700 text-zinc-600 hover:text-zinc-400 hover:border-zinc-500 transition-colors text-[9px] font-bold leading-none"
      >
        ?
      </button>
      <div className={`absolute ${offsetClass} ${alignClass} ${widthClass} hidden group-hover:block z-10`}>
        {!isTop && (
          <div
            className={`w-2 h-2 bg-zinc-900 border-l border-t border-zinc-700 rotate-45 -mb-1 ${arrowClass}`}
          />
        )}
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 shadow-xl">
          {label && (
            <p className="text-[11px] font-semibold text-zinc-300 mb-1.5">
              {label}
            </p>
          )}
          {children}
        </div>
        {isTop && (
          <div
            className={`w-2 h-2 bg-zinc-900 border-r border-b border-zinc-700 rotate-45 mx-auto -mt-1 ${arrowClass}`}
          />
        )}
      </div>
    </div>
  );
};

export default HelpTooltip;
