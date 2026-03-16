import { useState } from "react";
import { eye } from "../../assets/icons";
import { eyeSlash } from "../../assets/icons";

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
}) => {
  const [revealed, setRevealed] = useState(false);
  const showToggle = revealable && type === "password";
  const inputType = showToggle && revealed ? "text" : type;

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-400 tracking-wide">
        {label}
      </label>
      <div className="relative">
        <input
          type={inputType}
          value={formData[field]}
          onChange={(e) => {
            const val = transform ? transform(e.target.value) : e.target.value;
            onChange(field, val);
          }}
          className={`w-full px-3 py-2.5 rounded-md bg-black text-white text-sm border transition-colors outline-none placeholder:text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed
            ${showToggle ? "pr-9" : ""}
            ${
              errors[field]
                ? "border-red-900 focus:border-red-800 focus:ring-1 focus:ring-red-900/50"
                : "border-zinc-800 focus:border-zinc-600"
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:text-zinc-700"
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
        <p className="flex items-center gap-1.5 text-xs text-red-400 mt-0.5">
          <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-900/60 text-red-400 font-bold text-[9px] flex-shrink-0">
            !
          </span>
          {errors[field]}
        </p>
      )}
    </div>
  );
};

export default InputField;
