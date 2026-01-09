const SectionContainer = ({ title, children, className = "" }) => {
  return (
    <div className={`card-dark relative flex flex-col ${className}`}>
      {/* The Section Title */}
      {title && (
        <h2 className="section-header mb-6">
          {title}
        </h2>
      )}

      {/* Content Area */}
      <div className="flex-1">{children}</div>
    </div>
  );
};

export default SectionContainer;
