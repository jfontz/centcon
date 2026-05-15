import { useEffect, useRef, useState } from "react";

const HeaderButton = ({
  icon,
  label,
  variant = "refresh",
  className = "",
  rotate = false,
  onClick,
  disabled = false,
  title,
}) => {
  const [angle, setAngle] = useState(0);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const angleRef = useRef(0);

  useEffect(() => {
    if (rotate) {
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
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [rotate]);

  const baseClasses =
    "group flex items-center justify-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const variantClasses = {
    refresh:
      "text-[#218c4f] bg-transparent border border-[rgba(33,140,79,0.24)] hover:bg-[rgba(33,140,79,0.12)] dark:text-[#28a745] dark:bg-transparent dark:border-[#28a7454d] dark:hover:bg-[#26894033]",
    logout:
      "text-[#666660] bg-transparent border border-[#cec8bc] hover:bg-[#d3cec4] dark:text-[#858585] dark:bg-transparent dark:border-[#222222] dark:hover:bg-[#2f2f2f33]",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant] || ""} ${className}`}
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
          transition: rotate
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
