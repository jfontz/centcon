const SectionContainer = ({ title, children, className = "" }) => {
  return (
    <div
      className={`
      relative flex flex-col 
      border border-white/10 
      bg-black/40 backdrop-blur-sm 
      rounded-xl p-6 
      ${className}
    `}
    >
      {/* The Section Title */}
      {title && (
        <h2 className="text-xs font-medium tracking-[0.2em] text-zinc-500 uppercase mb-6">
          {title}
        </h2>
      )}

      {/* Content Area */}
      <div className="flex-1">{children}</div>
    </div>
  );
};

export default SectionContainer;
