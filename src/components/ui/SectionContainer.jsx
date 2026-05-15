const SectionContainer = ({ title, children, className = "", action }) => {
  return (
    <div
      className={`rounded-lg p-6 bg-[#f5f3ed] border border-[#cec8bc] dark:bg-[#050505] dark:border-[#222222] relative flex flex-col ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-[#666660] dark:text-[#858585]">
            {title}
          </h2>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
};

export default SectionContainer;
