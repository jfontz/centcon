const HeaderButton = ({ icon, label, hoverClasses, rotate = false }) => (
  <button
    className={`group flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 rounded border border-white/10 transition-all duration-300 ${hoverClasses}`}
  >
    <img
      src={icon}
      alt={label}
      className={`w-4 h-4 sm:w-5 sm:h-5 min-w-4 min-h-4 transition-transform duration-500 ${
        rotate ? "group-hover:rotate-180" : ""
      }`}
    />
    <span className="hidden sm:inline text-xs font-medium uppercase tracking-wider">
      {label}
    </span>
  </button>
);

export default HeaderButton;
// TODO: Update colors for base and hover states after creating custom Tailwind classes and utilities
