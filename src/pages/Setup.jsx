import { useState, useRef, useEffect } from "react";
import { submitSetup } from "../services/setupAPI";

const InputField = ({ field, label, type = "text", placeholder, maxLength, transform, formData, errors, loading, onChange }) => (
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
        ${errors[field]
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
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-900/60 text-red-400 font-bold text-[9px] flex-shrink-0">!</span>
        {errors[field]}
      </p>
    )}
  </div>
);

const Setup = ({ setupData, onComplete }) => {
  const { defaults, fieldDescriptions } = setupData;

  const allFields = Object.keys(fieldDescriptions);

  const initialFormData = {};
  allFields.forEach((field) => {
    initialFormData[field] = defaults?.[field] || "";
  });

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const errorRef = useRef(null);

  useEffect(() => {
    if (submitError && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [submitError]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    if (submitError) setSubmitError("");
  };

  const validate = () => {
    const newErrors = {};

    if (allFields.includes("MODEM_IP")) {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!formData.MODEM_IP || !ipRegex.test(formData.MODEM_IP)) {
        newErrors.MODEM_IP = "Invalid IP address format";
      }
    }

    if (allFields.includes("MODEM_USERNAME") && !formData.MODEM_USERNAME) {
      newErrors.MODEM_USERNAME = "Username is required";
    }

    if (allFields.includes("MODEM_PASSWORD") && !formData.MODEM_PASSWORD) {
      newErrors.MODEM_PASSWORD = "Password is required";
    }

    if (allFields.includes("CENTCON_PIN")) {
      if (!formData.CENTCON_PIN || formData.CENTCON_PIN.length !== 4) {
        newErrors.CENTCON_PIN = "PIN must be exactly 4 characters";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSubmitError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await submitSetup(formData);
      if (result.ok) {
        onComplete();
      } else {
        setSubmitError(result.message || "Setup failed. Please try again.");
      }
    } catch (error) {
      setSubmitError(error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const sectionLabel = "text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-600 mb-4";

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[500px]">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-base sm:text-xl font-light tracking-[0.2em] text-white mb-1.5">
            CENTCON
          </h1>
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-600">
            First-Run Setup
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="rounded-xl border border-zinc-900 bg-zinc-950 overflow-hidden">

            {/* Modem Connection */}
            {(allFields.includes("MODEM_IP") || allFields.includes("MODEM_USERNAME") || allFields.includes("MODEM_PASSWORD")) && (
              <div className="p-6 flex flex-col gap-4">
                <div>
                  <p className={sectionLabel}>Modem Connection</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed -mt-2">
                    Enter the login details of your <span className="text-zinc-300">existing modem</span>. This is not a registration page — CENTCON needs these to connect to your modem on your behalf. You can find these credentials on your modem's admin page or on the sticker on your modem.
                  </p>
                </div>

                {allFields.includes("MODEM_IP") && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-medium text-zinc-400 tracking-wide">IP Address</label>
                      <div className="relative group">
                        <button type="button" className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-zinc-700 text-zinc-600 hover:text-zinc-400 hover:border-zinc-500 transition-colors text-[9px] font-bold leading-none">?</button>
                        <div className="absolute top-full left-0 mt-2 w-64 hidden group-hover:block z-10">
                          <div className="w-2 h-2 bg-zinc-900 border-l border-t border-zinc-700 rotate-45 ml-3 -mb-1" />
                          <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 shadow-xl">
                            <p className="text-[11px] font-semibold text-zinc-300 mb-1.5">What is the modem IP address?</p>
                            <p className="text-[10px] text-zinc-500 leading-relaxed mb-2">
                              It's the local address used to access your modem's admin page — not your public internet IP. Think of it as your modem's "home address" on your home network.
                            </p>
                            <p className="text-[10px] text-zinc-400 font-medium mb-1">How to find it:</p>
                            <ul className="text-[10px] text-zinc-500 leading-relaxed space-y-1">
                              <li>• Open a browser and try <code className="text-zinc-400">192.168.254.254</code> — this is the Globe default</li>
                              <li>• Or check the sticker on the back/underside of your modem</li>
                              <li>• On Windows: run <code className="text-zinc-400">ipconfig</code> and look for "Default Gateway"</li>
                              <li>• On Mac/Linux: run <code className="text-zinc-400">ip route</code> or <code className="text-zinc-400">netstat -nr</code></li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={formData.MODEM_IP}
                      onChange={(e) => handleChange("MODEM_IP", e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-md bg-black text-white text-sm border transition-colors outline-none placeholder:text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed
                        ${errors.MODEM_IP
                          ? "border-red-900 focus:border-red-800 focus:ring-1 focus:ring-red-900/50"
                          : "border-zinc-800 focus:border-zinc-600"
                        }`}
                      placeholder="192.168.254.254"
                      disabled={loading}
                      autoComplete="off"
                    />
                    {errors.MODEM_IP && (
                      <p className="flex items-center gap-1.5 text-xs text-red-400 mt-0.5">
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-900/60 text-red-400 font-bold text-[9px] flex-shrink-0">!</span>
                        {errors.MODEM_IP}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {allFields.includes("MODEM_USERNAME") && (
                    <InputField
                      field="MODEM_USERNAME"
                      label="Username"
                      placeholder={defaults?.MODEM_USERNAME || "admin"}
                      formData={formData}
                      errors={errors}
                      loading={loading}
                      onChange={handleChange}
                    />
                  )}
                  {allFields.includes("MODEM_PASSWORD") && (
                    <InputField
                      field="MODEM_PASSWORD"
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      formData={formData}
                      errors={errors}
                      loading={loading}
                      onChange={handleChange}
                    />
                  )}
                </div>
              </div>
            )}

            {/* PIN */}
            {allFields.includes("CENTCON_PIN") && (
              <div className="p-6 flex flex-col gap-4 border-t border-zinc-900">
                <div>
                  <p className={sectionLabel}>Access PIN</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed -mt-2">
                    This PIN is <span className="text-zinc-300">not from your modem</span> — it's a password you choose for CENTCON itself, used as a simple lock screen when you open the tool.{" "}
                    <span className="text-zinc-400">Remember it well.</span> If you ever forget it or want to change any of your settings, you can view and edit everything in the <code className="text-zinc-400">.env</code> file in the CENTCON folder.
                  </p>
                </div>
                <div className="w-36 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-medium text-zinc-400 tracking-wide">4-Character PIN</label>
                    <div className="relative group">
                      <button type="button" className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-zinc-700 text-zinc-600 hover:text-zinc-400 hover:border-zinc-500 transition-colors text-[9px] font-bold leading-none">?</button>
                      <div className="absolute bottom-full left-0 mb-2 w-56 hidden group-hover:block z-10">
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 shadow-xl">
                          <p className="text-[11px] font-semibold text-zinc-300 mb-1.5">About the CENTCON PIN</p>
                          <p className="text-[10px] text-zinc-500 leading-relaxed mb-2">
                            4 alphanumeric characters (letters and numbers). This locks the CENTCON dashboard so others on the same machine can't access it casually.
                          </p>
                          <p className="text-[10px] text-zinc-500 leading-relaxed">
                            Forgot it? Open the <code className="text-zinc-400">.env</code> file in the CENTCON folder — all your settings including this PIN are stored there in plain text.
                          </p>
                        </div>
                        <div className="w-2 h-2 bg-zinc-900 border-r border-b border-zinc-700 rotate-45 ml-3 -mt-1" />
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={formData.CENTCON_PIN}
                    onChange={(e) => handleChange("CENTCON_PIN", e.target.value.toUpperCase())}
                    className={`w-full px-3 py-2.5 rounded-md bg-black text-white text-lg font-bold text-center tracking-[0.5em] border transition-colors outline-none placeholder:text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed
                      ${errors.CENTCON_PIN
                        ? "border-red-900 focus:border-red-800"
                        : "border-zinc-800 focus:border-zinc-600"
                      }`}
                    placeholder="····"
                    maxLength={4}
                    disabled={loading}
                    autoComplete="off"
                  />
                  {errors.CENTCON_PIN && (
                    <p className="flex items-center gap-1.5 text-xs text-red-400 mt-0.5">
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-900/60 font-bold text-[9px] flex-shrink-0">!</span>
                      {errors.CENTCON_PIN}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Submit error */}
            {submitError && (
              <div
                ref={errorRef}
                className="mx-6 mb-4 px-4 py-3 rounded-lg bg-red-950/30 border border-red-900/50 flex items-start gap-3"
              >
                <span className="text-[9px] font-bold tracking-widest uppercase text-red-400 bg-red-900/40 rounded px-1.5 py-0.5 flex-shrink-0 mt-0.5">
                  ERR
                </span>
                <p className="text-xs text-red-300/80 leading-relaxed">{submitError}</p>
              </div>
            )}

            {/* Footer */}
            <div className="p-6 flex flex-col gap-3 border-t border-zinc-900">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-md bg-white text-black text-xs font-bold tracking-[0.2em] uppercase transition-all hover:bg-zinc-200 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Complete Setup"}
              </button>
              <p className="text-center text-[10px] text-zinc-700 leading-relaxed">
                Your settings will be saved to the <code className="text-zinc-500">.env</code> file on this machine and loaded on every startup.
              </p>
            </div>

            {/* Compatibility Notice */}
            <div className="px-6 pb-6">
              <div className="rounded-lg border border-zinc-800/60 bg-black px-4 py-3 flex items-start gap-3">
                <span className="text-amber-500/80 text-xs mt-0.5 flex-shrink-0">⚠</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[11px] font-semibold text-zinc-400">Compatibility Notice</p>
                    {/* Tooltip */}
                    <div className="relative group">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-zinc-700 text-zinc-600 hover:text-zinc-400 hover:border-zinc-500 transition-colors text-[9px] font-bold leading-none"
                      >
                        ?
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 hidden group-hover:block z-10">
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 shadow-xl">
                          <p className="text-[11px] font-semibold text-zinc-300 mb-1">How to check your modem model</p>
                          <p className="text-[10px] text-zinc-500 leading-relaxed">
                            Flip your modem over or check the back panel — the model number and software version are usually printed on a sticker.
                          </p>
                        </div>
                        {/* Arrow */}
                        <div className="w-2 h-2 bg-zinc-900 border-r border-b border-zinc-700 rotate-45 mx-auto -mt-1" />
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-600 leading-relaxed">
                    Built and tested for the{" "}
                    <span className="text-zinc-400 font-medium">Globe G-1426G-A</span> with Software Version{" "}
                    <span className="text-zinc-400 font-medium">3TN00802HJLI90</span>. It may not work with other models due to differences in IP address, page navigation, and API endpoints.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </form>

      </div>
    </div>
  );
};

export default Setup;