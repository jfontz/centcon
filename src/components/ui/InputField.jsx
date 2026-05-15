import { useState } from "react";
import { eye } from "../../assets/icons";
import { eyeSlash } from "../../assets/icons";
import HelpTooltip from "./HelpTooltip";

const InputField = ({
  field,
  label,
  type = "text",
  placeholder,
  maxLength,
  transform,
  formData,
  errors,
  loading,
  onChange,
  revealable = false,
  tooltip = null,
}) => {
  const [revealed, setRevealed] = useState(false);
  const showToggle = revealable && type === "password";
  const inputType = showToggle && revealed ? "text" : type;

  return (
    <div className="flex flex-col gap-1">
      {(label || tooltip) && (
        <div className="flex items-center gap-1.5">
          {label && (
            <label className="text-xs font-medium text-[#4f4f49] dark:text-zinc-400 tracking-wide">
              {label}
            </label>
          )}
          {tooltip && (
            <HelpTooltip
              placement="bottom"
              widthClass="w-56"
              alignClass="left-0"
              arrowClass="ml-3"
              buttonAriaLabel={`Learn more about ${label}`}
            >
              <p className="text-xs text-[#666660] dark:text-zinc-500 leading-relaxed">{tooltip}</p>
            </HelpTooltip>
          )}
        </div>
      )}
      <div className="relative">
        <input
          type={inputType}
          value={formData[field]}
          onChange={(e) => {
            const val = transform ? transform(e.target.value) : e.target.value;
            onChange(field, val);
          }}
          className={`w-full px-3 py-2.5 rounded-md bg-[#f6f3ed] text-[#24241f] dark:bg-black dark:text-white text-sm border transition-colors outline-none placeholder:text-[#8a8a83] dark:placeholder:text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed
            ${showToggle ? "pr-9" : ""}
            ${
              errors[field]
                ? "border-[#c44955] focus:border-[#c44955] focus:ring-1 focus:ring-[rgba(196,73,85,0.24)] dark:border-red-900 dark:focus:border-red-800 dark:focus:ring-red-900/50"
                : "border-[#cec8bc] focus:border-[#a8a191] dark:border-zinc-800 dark:focus:border-zinc-600"
            }`}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={loading}
          autoComplete={type === "password" ? "current-password" : "off"}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setRevealed((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666660] hover:text-[#24241f] dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:text-[#a0a099] dark:disabled:text-zinc-700"
            aria-label={revealed ? "Hide password" : "Show password"}
            title={revealed ? "Hide password" : "Show password"}
            disabled={loading}
          >
            {revealed ? (
              <img src={eye} width={20} height={20} />
            ) : (
              <img src={eyeSlash} width={20} height={20} />
            )}
          </button>
        )}
      </div>
      {errors[field] && (
        <p className="flex items-center gap-1.5 text-xs text-[#c44955] dark:text-red-400 mt-0.5">
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[rgba(196,73,85,0.1)] text-[#c44955] dark:bg-red-900/60 dark:text-red-400 font-bold text-[9px] flex-shrink-0">
            !
          </span>
          {errors[field]}
        </p>
      )}
    </div>
  );
};

export default InputField;
