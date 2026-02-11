import { useState } from "react";
import {
  hourglass,
  process as processIcon,
  check,
  error as errorIcon,
} from "../../assets/icons";
import RebootConfirmModal from "../modals/RebootConfirmModal";

const REBOOT_BUSY_STATES = ["REBOOTING", "WAITING", "CHECKING_CONNECTION"];

const SystemControlButton = ({
  icon,
  label,
  buttonClass,
  onClick,
  rebootState,
  triggerReboot,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const isReboot = label === "Reboot Modem" && (rebootState != null || triggerReboot != null);
  const busy =
    isReboot &&
    rebootState &&
    REBOOT_BUSY_STATES.includes(rebootState.state);
  const disabled = busy;
  const showSuccess = isReboot && rebootState?.state === "ONLINE";
  const showError = isReboot && rebootState?.state === "FAILED";

  const overlayText = (() => {
    if (!isReboot || !rebootState || !busy) return null;
    if (rebootState.state === "REBOOTING") return "Rebooting…";
    if (rebootState.state === "WAITING" && rebootState.countdown != null)
      return `Rebooting… ${rebootState.countdown}s`;
    if (rebootState.state === "WAITING") return "Rebooting…";
    if (rebootState.state === "CHECKING_CONNECTION")
      return "Checking connection…";
    return "Rebooting…";
  })();

  const displayIcon = (() => {
    if (showSuccess) return check;
    if (showError) return errorIcon;
    if (busy && rebootState)
      return rebootState.state === "CHECKING_CONNECTION"
        ? processIcon
        : hourglass;
    return icon;
  })();

  const handleClick = () => {
    if (isReboot && triggerReboot) {
      setShowConfirmModal(true);
      return;
    }
    onClick?.();
  };

  const handleConfirmReboot = () => {
    setShowConfirmModal(false);
    triggerReboot?.();
  };

  return (
    <>
      <button
        className={`${buttonClass} disabled:opacity-60 disabled:cursor-not-allowed`}
        onClick={handleClick}
        disabled={disabled}
        type="button"
      >
        <img
          src={displayIcon}
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
