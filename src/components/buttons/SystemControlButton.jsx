const SystemControlButton = ({ icon, label, buttonClass, onClick }) => {
  return (
    <button className={buttonClass} onClick={onClick}>
      <img src={icon} alt={label} className="w-4.5 h-4.5" />
      <p>{label}</p>
    </button>
  );
};

export default SystemControlButton;
