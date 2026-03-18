const SectionContainer = ({ title, children, className = "", action }) => {
  return (
    <div className={`card-dark relative flex flex-col ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-header">{title}</h2>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
};

export default SectionContainer;
