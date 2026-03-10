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
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-zinc-400 tracking-wide">
      {label}
    </label>
    <input
      type={type}
      value={formData[field]}
      onChange={(e) => {
        const val = transform ? transform(e.target.value) : e.target.value;
        onChange(field, val);
      }}
      className={`w-full px-3 py-2.5 rounded-md bg-black text-white text-sm border transition-colors outline-none placeholder:text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed
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

export default InputField;
