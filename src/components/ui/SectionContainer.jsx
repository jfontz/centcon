const SectionContainer = ({ title, children, className = "", action }) => {
  return (
    <div
      className={`rounded-lg p-6 bg-card-black border border-card-black relative flex flex-col ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-gray">
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
