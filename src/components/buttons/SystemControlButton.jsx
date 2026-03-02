import { useState, useEffect } from "react";
import RebootConfirmModal from "../modals/RebootConfirmModal";

const REBOOT_BUSY_STATES = [
  "LOGGING_IN",
  "NAVIGATING",
  "REBOOTING",
  "WAITING",
  "CHECKING_CONNECTION",
];

const SystemControlButton = ({
  icon,
  label,
  buttonClass,
  onClick,
  rebootState,
  triggerReboot,
  loginInProgress = false,
  rebootPending,
  setRebootPending,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isReboot =
    label === "Reboot Modem" && (rebootState != null || triggerReboot != null);
  
  const isLogin = label === "Login to Modem";

  const isRebooting =
    rebootState && REBOOT_BUSY_STATES.includes(rebootState.state);

  // Disable reboot button when rebooting or pending
  // Disable login button when login in progress OR reboot pending
  // Disable ALL buttons when rebooting
  const disabled = isReboot 
    ? (isRebooting || rebootPending) 
    : isLogin 
    ? (loginInProgress || rebootPending)
    : isRebooting;

  // Clear pending when reboot finishes (ONLINE or FAILED)
  useEffect(() => {
    if (rebootState?.state === "ONLINE" || rebootState?.state === "FAILED") {
      setRebootPending?.(false);
    }
  }, [rebootState?.state, setRebootPending]);

  const overlayText = (() => {
    // Reboot overlay text
    if (isReboot && rebootState && disabled) {
      if (rebootState.state === "WAITING" && rebootState.countdown != null)
        return `Rebooting… ${rebootState.countdown}s`;
      if (rebootState.state === "CHECKING_CONNECTION")
        return "Checking connection…";
      return "Rebooting…";
    }
    
    // Login overlay text
    if (isLogin && loginInProgress) {
      return "Opening browser…";
    }
    
    return null;
  })();

  const handleClick = () => {
    if (isReboot && triggerReboot) {
      if (!disabled) setShowConfirmModal(true);
      return;
    }
    
    // For login button - respect disabled state
    if (!disabled) {
      onClick?.();
    }
  };

  const handleConfirmReboot = async () => {
    setShowConfirmModal(false);
    setRebootPending?.(true);
    try {
      const res = await triggerReboot?.();
      if (!res?.ok) setRebootPending?.(false);
    } catch {
      setRebootPending?.(false);
    }
  };

  return (
    <>
      <button
        className={`${buttonClass} disabled:opacity-60 disabled:cursor-not-allowed`}
        onClick={handleClick}
        disabled={disabled}
        type="button"
        aria-label={label}
      >
        <img
          src={icon}
          alt={label}
          className="w-4.5 h-4.5 pointer-events-none select-none"
        />
        <p>{overlayText != null ? overlayText : label}</p>
      </button>
      <RebootConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmReboot}
      />
    </>
  );
};

export default SystemControlButton;