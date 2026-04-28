// src/components/modals/ClearHistoryModal.jsx
import { useEffect } from "react";
import { warning } from "../../assets/icons";

const ClearHistoryModal = ({ isOpen, onClose, onConfirm }) => {
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

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[modal-fade-in_0.25s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-history-modal-title"
    >
      <div
        className="w-full max-w-md rounded-xl p-6 flex flex-col items-center text-center shadow-xl bg-[#0a0a0a] border border-card-black animate-[modal-slide-in_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-center text-amber-500">
          <img
            src={warning}
            alt=""
            className="w-12 h-12 pointer-events-none select-none"
          />
        </div>
        <h2
          id="clear-history-modal-title"
          className="text-lg font-semibold text-white tracking-wide mb-2"
        >
          Clear History?
        </h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          This will permanently delete all recorded router events. This cannot
          be undone.
        </p>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            type="button"
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer text-gray bg-transparent border border-card-black hover:bg-[#2f2f2f33]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer text-red-400 bg-[#7f1d1d1a] border border-[#7f1d1d4d] hover:bg-[#7f1d1d33]"
            onClick={onConfirm}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClearHistoryModal;
