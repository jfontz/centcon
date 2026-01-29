const HeaderButton = ({
  icon,
  label,
  buttonClass,
  rotate = false,
  onClick,
}) => {
  const getButtonClass = () => {
    if (buttonClass) return buttonClass;
    if (label === "Refresh") return "btn-refresh";
    if (label === "Logout") return "btn-logout";
    return "";
  };

  return (
    <button className={`group cursor-pointer ${getButtonClass()}`} onClick={onClick}>
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
};

export default HeaderButton;
