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
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/35 dark:bg-black/50 backdrop-blur-sm animate-[modal-fade-in_0.25s_ease-out]"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reboot-modal-title"
    >
      <div
        className="w-full max-w-md rounded-xl p-6 flex flex-col items-center text-center shadow-xl bg-[#f7f4ee] border border-[#cec8bc] dark:bg-[#0a0a0a] dark:border-[#222222] animate-[modal-slide-in_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-center text-[#b7791f] dark:text-amber-500">
          <img src={warning} alt="" className="w-12 h-12 pointer-events-none select-none" />
        </div>
        <h2 id="reboot-modal-title" className="text-lg font-semibold text-[#1a1a1a] dark:text-white tracking-wide mb-2">
          Reboot Router?
        </h2>
        <p className="text-sm text-[#4f4f49] dark:text-gray-400 mb-6 leading-relaxed">
          This will restart your router. You will lose connection for approximately 2 minutes.
        </p>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            type="button"
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer text-[#666660] bg-transparent border border-[#cec8bc] hover:bg-[#d3cec4] dark:text-[#858585] dark:bg-transparent dark:border-[#222222] dark:hover:bg-[#2f2f2f33]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer text-[#c44955] bg-[rgba(196,73,85,0.1)] border border-[rgba(196,73,85,0.24)] hover:bg-[rgba(196,73,85,0.16)] dark:text-red-400 dark:bg-[#7f1d1d1a] dark:border-[#7f1d1d4d] dark:hover:bg-[#7f1d1d33]"
            onClick={onConfirm}
          >
            Reboot
          </button>
        </div>
      </div>
    </div>
  );
};

export default RebootConfirmModal;
