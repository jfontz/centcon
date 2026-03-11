import { useEffect, useRef, useState } from "react";

const HeaderButton = ({
  icon,
  label,
  buttonClass,
  rotate = false,
  onClick,
  disabled = false,
  title,
}) => {
  const [angle, setAngle] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const angleRef = useRef(0);

  useEffect(() => {
    if (rotate) {
      setIsSpinning(true);

      const spin = (timestamp) => {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        const delta = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;

        angleRef.current += delta * 0.36; // 360deg per second
        setAngle(angleRef.current);
        rafRef.current = requestAnimationFrame(spin);
      };

      rafRef.current = requestAnimationFrame(spin);
    } else {
      // Stop spinning — round up to nearest full rotation so it eases home cleanly
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;

      const nearest360 = Math.ceil(angleRef.current / 360) * 360;
      angleRef.current = nearest360;
      setAngle(nearest360);
      setIsSpinning(false);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [rotate]);

  const getButtonClass = () => {
    if (buttonClass) return buttonClass;
    if (label === "Refresh") return "btn-refresh";
    if (label === "Logout") return "btn-logout";
    return "";
  };

  return (
    <button
      className={`group ${getButtonClass()} disabled:opacity-50 disabled:cursor-not-allowed`}
      onClick={onClick}
      disabled={disabled}
      type="button"
      aria-label={label}
      title={title}
    >
      <img
        src={icon}
        alt={label}
        className="w-4 h-4 sm:w-5 sm:h-5 min-w-4 min-h-4 pointer-events-none select-none"
        style={{
          transform: `rotate(${angle}deg)`,
          transition: isSpinning
            ? "none"
            : "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      />
      <span className="hidden sm:inline text-xs font-medium uppercase tracking-wider">
        {label}
      </span>
    </button>
  );
};

export default HeaderButton;
