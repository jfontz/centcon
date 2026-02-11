import { useEffect } from "react";
import { warning } from "../../assets/icons";

const RebootConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reboot-modal-title"
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-icon">
          <img src={warning} alt="" className="w-12 h-12 pointer-events-none select-none" />
        </div>
        <h2 id="reboot-modal-title" className="modal-title">
          Reboot Router?
        </h2>
        <p className="modal-message">
          This will restart your router. You will lose connection for approximately 2 minutes.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-modal-confirm" onClick={onConfirm}>
            Reboot
          </button>
        </div>
      </div>
    </div>
  );
};

export default RebootConfirmModal;
