/**
 * Setup/Configuration Page Component
 * Handles initial device configuration including router connection settings and PIN setup.
 * Displayed only on first run when setup is required or when missing values are detected.
 * Collects router IP, username, password, and PIN configuration from the user.
 */

import { useState, useRef, useEffect } from "react";
import InputField from "../components/ui/InputField";
import HelpTooltip from "../components/ui/HelpTooltip";
import { submitSetup } from "../services/setupAPI";
import { eye } from "../assets/icons";
import { eyeSlash } from "../assets/icons";

const SECTION_LABEL_CLASS =
  "text-xs font-semibold tracking-[0.2em] uppercase text-zinc-600 mb-4";
const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const ERR_INVALID_IP = "Invalid IP address format";
const ERR_USERNAME_REQUIRED = "Username is required";
const ERR_PASSWORD_REQUIRED = "Password is required";
const ERR_PIN_LENGTH = "PIN must be exactly 4 characters";
const DEFAULT_SETUP_ERROR = "Setup failed. Please try again.";
const PASSWORD_PLACEHOLDER = "••••••••";
const PIN_PLACEHOLDER = "····";

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
  const [pinRevealed, setPinRevealed] = useState(false);
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

    if (allFields.includes("ROUTER_IP")) {
      if (!formData.ROUTER_IP || !IP_REGEX.test(formData.ROUTER_IP)) {
        newErrors.ROUTER_IP = ERR_INVALID_IP;
      }
    }

    if (allFields.includes("ROUTER_USERNAME") && !formData.ROUTER_USERNAME) {
      newErrors.ROUTER_USERNAME = ERR_USERNAME_REQUIRED;
    }

    if (allFields.includes("ROUTER_PASSWORD") && !formData.ROUTER_PASSWORD) {
      newErrors.ROUTER_PASSWORD = ERR_PASSWORD_REQUIRED;
    }

    if (allFields.includes("CENTCON_PIN")) {
      if (!formData.CENTCON_PIN || formData.CENTCON_PIN.length !== 4) {
        newErrors.CENTCON_PIN = ERR_PIN_LENGTH;
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
        setSubmitError(result.message || DEFAULT_SETUP_ERROR);
      }
    } catch (error) {
      setSubmitError(error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[500px]">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-base sm:text-xl font-light tracking-[0.2em] text-white mb-1.5">
            CENTCON
          </h1>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-600">
            First-Run Setup
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="rounded-xl border border-zinc-900 bg-zinc-950 overflow-hidden">
            {/* Router Connection */}
            {(allFields.includes("ROUTER_IP") ||
              allFields.includes("ROUTER_USERNAME") ||
              allFields.includes("ROUTER_PASSWORD")) && (
              <div className="p-6 flex flex-col gap-4">
                <div>
                  <p className={SECTION_LABEL_CLASS}>Router Connection</p>
                  <p className="text-[13px] text-zinc-500 leading-relaxed -mt-2">
                    Enter the login details of your{" "}
                    <span className="text-zinc-300">existing router</span>.
                    CENTCON uses these credentials to access your router's admin
                    panel on your behalf. These are never stored outside your
                    local machine. You can find these credentials on your
                    router&apos;s admin page or on the sticker on your router.
                  </p>
                </div>

                {allFields.includes("ROUTER_IP") && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <label className="text-sm font-medium text-zinc-400 tracking-wide">
                        IP Address
                      </label>
                      <HelpTooltip
                        placement="bottom"
                        widthClass="w-64"
                        alignClass="-left-2"
                        arrowClass="ml-3"
                        buttonAriaLabel="Get help finding your router IP address"
                        label="What is the router IP address?"
                      >
                        <p className="text-xs text-zinc-500 leading-relaxed mb-2">
                          This is the local address your router uses on your home
                          network — separate from your public internet IP.
                        </p>
                        <p className="text-xs text-zinc-400 font-medium mb-1">
                          How to find it:
                        </p>
                        <ul className="text-xs text-zinc-500 leading-relaxed space-y-1">
                          <li>
                            • Open a browser and try{" "}
                            <code className="text-zinc-400">
                              192.168.254.254
                            </code>{" "}
                            — this is the Globe default
                          </li>
                          <li>
                            • Or check the sticker on the back/underside of your
                            router
                          </li>
                          <li>
                            • On Windows: run{" "}
                            <code className="text-zinc-400">ipconfig</code> and
                            look for &quot;Default Gateway&quot;
                          </li>
                          <li>
                            • On Mac/Linux: run{" "}
                            <code className="text-zinc-400">ip route</code> or{" "}
                            <code className="text-zinc-400">netstat -nr</code>
                          </li>
                        </ul>
                      </HelpTooltip>
                    </div>
                    <input
                      type="text"
                      value={formData.ROUTER_IP}
                      onChange={(e) => handleChange("ROUTER_IP", e.target.value)}
                      className={`w-full px-3 py-2.5 rounded-md bg-black text-white text-[15px] border transition-colors outline-none placeholder:text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed
                        ${
                          errors.ROUTER_IP
                            ? "border-red-900 focus:border-red-800 focus:ring-1 focus:ring-red-900/50"
                            : "border-zinc-800 focus:border-zinc-600"
                        }`}
                      placeholder="192.168.254.254"
                      disabled={loading}
                      autoComplete="off"
                    />
                    {errors.ROUTER_IP && (
                      <p className="flex items-center gap-1.5 text-sm text-red-400 mt-0.5">
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-900/60 text-red-400 font-bold text-[11px] flex-shrink-0">
                          !
                        </span>
                        {errors.ROUTER_IP}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {allFields.includes("ROUTER_USERNAME") && (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-medium text-zinc-400 tracking-wide">
                          Username
                        </label>
                        <HelpTooltip
                          placement="bottom"
                          widthClass="w-56"
                          alignClass="-left-2"
                          arrowClass="ml-3"
                          buttonAriaLabel="Learn more about Username"
                        >
                          <p className="text-xs text-zinc-500 leading-relaxed">
                            Your router's admin username — found on the sticker
                            on the back or underside of your router.
                          </p>
                        </HelpTooltip>
                      </div>
                      <InputField
                        field="ROUTER_USERNAME"
                        label={null}
                        placeholder={defaults?.ROUTER_USERNAME || "admin"}
                        formData={formData}
                        errors={errors}
                        loading={loading}
                        onChange={handleChange}
                      />
                    </div>
                  )}
                  {allFields.includes("ROUTER_PASSWORD") && (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-medium text-zinc-400 tracking-wide">
                          Password
                        </label>
                        <HelpTooltip
                          placement="bottom"
                          widthClass="w-56"
                          alignClass="-right-2"
                          arrowClass="ml-auto mr-3"
                          buttonAriaLabel="Learn more about Password"
                        >
                          <p className="text-xs text-zinc-500 leading-relaxed">
                            Your router's admin password — found on the same
                            sticker as the username. This is not your Wi-Fi
                            password.
                          </p>
                        </HelpTooltip>
                      </div>
                      <InputField
                        field="ROUTER_PASSWORD"
                        label={null}
                        type="password"
                        revealable
                        placeholder={PASSWORD_PLACEHOLDER}
                        formData={formData}
                        errors={errors}
                        loading={loading}
                        onChange={handleChange}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PIN */}
            {allFields.includes("CENTCON_PIN") && (
              <div className="p-6 flex flex-col gap-4 border-t border-zinc-900">
                <div>
                  <p className={SECTION_LABEL_CLASS}>Access PIN</p>
                  <p className="text-[13px] text-zinc-500 leading-relaxed -mt-2">
                    A personal PIN you choose to lock the dashboard. Editable
                    anytime in the <code className="text-zinc-400">.env</code>{" "}
                    file if forgotten.
                  </p>
                </div>
                <div className="w-36 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <label className="text-sm font-medium text-zinc-400 tracking-wide">
                      4-Character PIN
                    </label>
                    <HelpTooltip
                      placement="top"
                      widthClass="w-56"
                      alignClass="-left-2"
                      arrowClass="ml-3"
                      buttonAriaLabel="Learn more about the CENTCON access PIN"
                      label="About the CENTCON PIN"
                    >
                      <p className="text-xs text-zinc-500 leading-relaxed mb-2">
                        4 alphanumeric characters (letters and numbers). This
                        protects the CENTCON dashboard from casual access by
                        others on the same machine."
                      </p>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        Forgot it? Open the{" "}
                        <code className="text-zinc-400">.env</code> file in the
                        CENTCON folder — all your settings including this PIN
                        are stored there in plain text.
                      </p>
                    </HelpTooltip>
                  </div>
                  <div className="relative">
                    <input
                      type={pinRevealed ? "text" : "password"}
                      value={formData.CENTCON_PIN}
                      onChange={(e) =>
                        handleChange(
                          "CENTCON_PIN",
                          e.target.value.toUpperCase(),
                        )
                      }
                      className={`w-full px-3 py-2.5 rounded-md bg-black text-white text-lg font-bold text-center tracking-[0.5em] border transition-colors outline-none placeholder:text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed
                        pr-9
                        ${
                          errors.CENTCON_PIN
                            ? "border-red-900 focus:border-red-800"
                            : "border-zinc-800 focus:border-zinc-600"
                        }`}
                      placeholder={PIN_PLACEHOLDER}
                      maxLength={4}
                      disabled={loading}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setPinRevealed((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:text-zinc-700"
                      aria-label={pinRevealed ? "Hide PIN" : "Show PIN"}
                      title={pinRevealed ? "Hide PIN" : "Show PIN"}
                      disabled={loading}
                    >
                      {pinRevealed ? (
                        <img src={eye} width={20} height={20} />
                      ) : (
                        <img src={eyeSlash} width={20} height={20} />
                      )}
                    </button>
                  </div>
                  {errors.CENTCON_PIN && (
                    <p className="flex items-center gap-1.5 text-sm text-red-400 mt-0.5">
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-900/60 font-bold text-[11px] flex-shrink-0">
                        !
                      </span>
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
                <span className="text-[11px] font-bold tracking-widest uppercase text-red-400 bg-red-900/40 rounded px-1.5 py-0.5 flex-shrink-0 mt-0.5">
                  ERR
                </span>
                <p className="text-sm text-red-300/80 leading-relaxed">
                  {submitError}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="p-6 flex flex-col gap-3 border-t border-zinc-900">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-md bg-white text-black text-sm font-bold tracking-[0.2em] uppercase transition-all hover:bg-zinc-200 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Complete Setup"}
              </button>
              <p className="text-center text-xs text-zinc-700 leading-relaxed">
                Your settings will be saved to the{" "}
                <code className="text-zinc-500">.env</code> file on this machine
                and loaded on every startup.
              </p>
            </div>

            {/* Compatibility Notice */}
            <div className="px-6 pb-6">
              <div className="rounded-lg border border-zinc-800/60 bg-black px-4 py-3 flex items-start gap-3">
                <span className="text-amber-500/80 text-sm mt-0.5 flex-shrink-0">
                  ⚠
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[13px] font-semibold text-zinc-400">
                      Compatibility Notice
                    </p>
                    {/* Tooltip */}
                    <HelpTooltip
                      placement="top"
                      widthClass="w-52"
                      alignClass="left-1/2 -translate-x-1/2"
                      buttonAriaLabel="How to check your router model"
                      label="How to check your router model"
                    >
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        Flip your router over or check the back panel — the model
                        number and software version are usually printed on a
                        sticker.
                      </p>
                    </HelpTooltip>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Built and tested for the{" "}
                    <span className="text-zinc-400 font-medium">
                      Globe G-1426G-A
                    </span>{" "}
                    with Software Version{" "}
                    <span className="text-zinc-400 font-medium">
                      3TN00802HJLI90
                    </span>
                    . It may not work with other models due to differences in IP
                    address, page navigation, and API endpoints.
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
