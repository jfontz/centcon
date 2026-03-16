import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useModem } from "../../context/ModemContext";
import { triggerWifiCredentials } from "../../services/commandApi";
import { modemApi } from "../../services/modemDataApi";
import { eye } from "../../assets/icons";
import { eyeSlash } from "../../assets/icons";

const LOG_LEVEL_STYLES = {
  header: "text-zinc-300 font-semibold",
  progress: "text-zinc-500",
  success: "text-emerald-400",
  error: "text-red-400",
  warning: "text-amber-400",
  navigate: "text-blue-400",
};

const LOG_LEVEL_ICON = {
  header: "◈",
  progress: "→",
  success: "✓",
  error: "✕",
  warning: "⚠",
  navigate: "⤷",
};

const getFreqLabel = (index) => (index < 4 ? "2.4" : "5");
const getModemIndex = (index) => index + 1;
const is24 = (index) => index < 4;

const Field = ({
  label,
  value,
  placeholder,
  onChange,
  error,
  type = "text",
  revealable = false,
}) => {
  const [revealed, setRevealed] = useState(false);
  const showToggle = revealable && type === "password";
  const inputType = showToggle && revealed ? "text" : type;

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold tracking-[0.15em] uppercase text-zinc-500">
        {label}
      </label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-3 py-2 rounded-md text-[15px] border outline-none transition-colors bg-black text-white placeholder:text-zinc-700
            ${showToggle ? "pr-9" : ""}
            ${
              error
                ? "border-red-700 focus:border-red-500"
                : "border-zinc-800 focus:border-zinc-500"
            }`}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setRevealed((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            aria-label={revealed ? "Hide password" : "Show password"}
            title={revealed ? "Hide password" : "Show password"}
          >
            {revealed ? (
              <img src={eye} width={20} height={20} />
            ) : (
              <img src={eyeSlash} width={20} height={20} />
            )}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400 leading-snug">{error}</p>}
    </div>
  );
};

const BandGrid = ({
  indices,
  wlanInfo,
  selected,
  onToggle,
  loadState,
  accentClass,
  borderClass,
  disabled,
  broadcastIntents,
  onBroadcastIntent,
}) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
    {indices.map((i) => {
      const isSelected = selected.includes(i);
      const bandSelected = selected.find((s) => is24(s) === is24(i));
      const isDisabled =
        disabled || (!isSelected && bandSelected !== undefined);
      const ssid = wlanInfo?.[i]?.SSID;
      const cardClass = isSelected
        ? `${accentClass} ${borderClass} text-white cursor-pointer`
        : isDisabled
          ? "bg-zinc-900/40 border border-zinc-900 text-zinc-700 cursor-not-allowed"
          : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white cursor-pointer";
      return (
        <div
          key={i}
          className={`py-2 px-1.5 rounded-md transition-all flex flex-col items-center gap-1 ${cardClass}`}
        >
          <button
            type="button"
            onClick={() => {
              if (isDisabled) return;
              onToggle(i);
            }}
            disabled={isDisabled}
            className="w-full flex flex-col items-center gap-1 focus:outline-none cursor-pointer disabled:cursor-not-allowed"
          >
            <span className="text-xs font-bold text-zinc-500">
              SSID {getModemIndex(i)}
            </span>
            {loadState === "loaded" && ssid ? (
              <span className="text-[11px] truncate w-full text-center font-mono leading-tight">
                {ssid}
              </span>
            ) : (
              <span className="text-[11px] text-zinc-700">—</span>
            )}
          </button>
          <div className="flex gap-1 mt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBroadcastIntent(i, "enable");
              }}
              disabled={disabled}
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer disabled:cursor-not-allowed
                ${
                  broadcastIntents?.[i] === "enable"
                    ? "bg-emerald-900 text-emerald-400 border border-emerald-700"
                    : "bg-zinc-800 text-zinc-600 border border-zinc-700 hover:text-zinc-400"
                }`}
            >
              ON
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBroadcastIntent(i, "disable");
              }}
              disabled={disabled}
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer disabled:cursor-not-allowed
                ${
                  broadcastIntents?.[i] === "disable"
                    ? "bg-red-950 text-red-400 border border-red-800"
                    : "bg-zinc-800 text-zinc-600 border border-zinc-700 hover:text-zinc-400"
                }`}
            >
              OFF
            </button>
          </div>
        </div>
      );
    })}
  </div>
);

export default function WiFiCredentialModal({ open, onClose }) {
  const { commandLogs, commandState } = useModem();

  const [loadState, setLoadState] = useState("idle");
  const [wlanInfo, setWlanInfo] = useState(null);
  const [selected, setSelected] = useState([]);
  const [fields, setFields] = useState({});
  const [errors, setErrors] = useState({});
  const [broadcastIntents, setBroadcastIntents] = useState({});
  const [saveState, setSaveState] = useState("idle");
  const [logs, setLogs] = useState([]);
  const logEndRef = useRef(null);
  const logStartIndexRef = useRef(null);
  const seenActiveStateRef = useRef(false);

  const isBusy = saveState === "saving";

  // Fetch real SSID names when modal opens
  useEffect(() => {
    if (!open) return;
    setLoadState("loading");
    modemApi
      .fetchModemData()
      .then((data) => {
        setWlanInfo(data?.wlan_info || null);
        setLoadState("loaded");
      })
      .catch(() => setLoadState("error"));
  }, [open]);

  // Listen to SSE logs from ModemContext — only collect logs that arrived after save started
  useEffect(() => {
    if (saveState !== "saving") return;
    if (logStartIndexRef.current === null) return;

    const newLogs = commandLogs
      .slice(logStartIndexRef.current)
      .filter((e) => e.command === "wifi-credentials")
      .map((e, i) => ({ ...e, id: `wc-${logStartIndexRef.current + i}` }));

    if (newLogs.length > 0) setLogs(newLogs);
  }, [commandLogs, saveState]);

  // Detect completion or failure from commandState
  useEffect(() => {
    if (saveState !== "saving") return;
    if (!commandState || commandState.command !== "wifi-credentials") return;

    const TERMINAL_STATES = ["ONLINE", "FAILED", "SUCCEEDED"];

    if (!TERMINAL_STATES.includes(commandState.state)) {
      // Seen an active state — safe to accept terminal next
      seenActiveStateRef.current = true;
      return;
    }

    // Ignore stale terminal state from previous run
    if (!seenActiveStateRef.current) return;

    if (commandState.state === "ONLINE") setSaveState("saved");
    if (commandState.state === "FAILED") setSaveState("error");
  }, [commandState, saveState]);

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logs.length > 0)
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleToggle = (index) => {
    if (isBusy) return;
    setSaveState("idle");
    setSelected((prev) => {
      if (prev.includes(index)) {
        setFields((f) => {
          const next = { ...f };
          delete next[index];
          return next;
        });
        setErrors((e) => {
          const next = { ...e };
          delete next[index];
          return next;
        });
        return prev.filter((i) => i !== index);
      }
      setFields((f) => ({ ...f, [index]: { newName: "", newPass: "" } }));
      return [...prev, index];
    });
  };

  const handleBroadcastIntent = (index, intent) => {
    if (isBusy) return;
    setBroadcastIntents((prev) => {
      const next = { ...prev };
      if (next[index] === intent) {
        delete next[index];
      } else {
        next[index] = intent;
      }
      return next;
    });
    setSaveState("idle");
  };

  const validateName = (raw) => {
    const value = raw.trim();
    if (value.length === 0) return "Wi-Fi name is required.";
    if (value.length > 32) return "Wi-Fi name must be 1–32 characters.";
    if (!/^[A-Za-z0-9 _-]+$/.test(value)) {
      return "Use letters, numbers, spaces, underscore, or hyphen.";
    }
    return "";
  };

  const validatePassword = (raw) => {
    if (raw.length === 0) return "";
    if (raw.length < 8 || raw.length > 63) {
      return "Password must be 8–63 characters.";
    }
    if (raw.trim() !== raw) {
      return "Password cannot start or end with spaces.";
    }
    return "";
  };

  const updateErrorsForField = (index, next) => {
    const nameError = next.newName ? validateName(next.newName) : "";
    const passError = next.newPass ? validatePassword(next.newPass) : "";
    setErrors((prev) => ({
      ...prev,
      [index]: { name: nameError, pass: passError },
    }));
  };

  const handleFieldChange = (index, key, value) => {
    if (isBusy) return;
    setFields((prev) => {
      const next = { ...prev[index], [key]: value };
      updateErrorsForField(index, next);
      return { ...prev, [index]: next };
    });
    setSaveState("idle");
  };

  const handleSave = async () => {
    setSaveState("saving");
    setLogs([]);
    logStartIndexRef.current = commandLogs.length;
    seenActiveStateRef.current = false; // reset for this run

    const targetIndices = Array.from(
      new Set([
        ...selected,
        ...Object.keys(broadcastIntents).map((i) => Number(i)),
      ]),
    ).sort((a, b) => a - b);

    const targets = targetIndices.map((i) => ({
      ssid_index: i,
      freq: getFreqLabel(i),
      modem_index: String(getModemIndex(i)),
      new_name: fields[i]?.newName || "",
      new_pass: fields[i]?.newPass || "",
      broadcast_intent: broadcastIntents[i] ?? null,
    }));

    setBroadcastIntents({});

    try {
      await triggerWifiCredentials(targets);
    } catch {
      setSaveState("error");
    }
  };

  const handleClose = () => {
    if (isBusy) return;
    onClose();
    setTimeout(() => {
      setLoadState("idle");
      setSaveState("idle");
      setWlanInfo(null);
      setSelected([]);
      setFields({});
      setErrors({});
      setBroadcastIntents({});
      setLogs([]);
      logStartIndexRef.current = null;
    }, 200);
  };

  const hasNewValues = selected.some(
    (i) => fields[i]?.newName || fields[i]?.newPass,
  );
  const hasBroadcastIntents = Object.keys(broadcastIntents).length > 0;
  const hasOnlyBroadcast = !hasNewValues && hasBroadcastIntents;
  const hasBoth = hasNewValues && hasBroadcastIntents;
  const hasValidationErrors = selected.some((i) => {
    const errs = errors[i];
    return Boolean(errs?.name || errs?.pass);
  });
  const selected24 = selected.find((i) => is24(i));
  const selected5 = selected.find((i) => !is24(i));
  const lastLog = logs[logs.length - 1];
  const currentStatusText = isBusy
    ? lastLog?.message || "Starting..."
    : saveState === "saved"
      ? "All changes applied"
      : saveState === "error"
        ? "Something went wrong"
        : null;

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4 ${isBusy ? "cursor-not-allowed" : ""}`}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden z-50 shadow-2xl flex flex-col"
        style={{ maxHeight: "calc(100dvh - 20rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900 sticky top-0 bg-zinc-950 z-10">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide">
              Wi-Fi Credentials
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {loadState === "loading" && "Loading SSIDs from modem..."}
              {loadState === "loaded" &&
                !isBusy &&
                saveState === "idle" &&
                "Select one SSID per band to edit"}
              {loadState === "error" && "Failed to load SSIDs"}
              {isBusy && "Selenium is applying changes — do not close"}
              {saveState === "saved" && "Changes applied successfully"}
              {saveState === "error" &&
                "Something went wrong — check the log below"}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isBusy}
            title={
              isBusy ? "Cannot close while changes are being applied" : "Close"
            }
            className={`transition-colors text-lg leading-none
              ${isBusy ? "text-zinc-800 cursor-not-allowed" : "text-zinc-600 hover:text-zinc-300 cursor-pointer"}`}
          >
            ✕
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5 overflow-y-auto log-scrollbar">
          {/* SSID Grid */}
          <div
            className={`flex flex-col gap-3 ${isBusy ? "opacity-40 pointer-events-none" : ""}`}
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold tracking-[0.15em] uppercase text-zinc-500">
                Select SSID
              </label>
              <span className="text-xs text-zinc-600">
                {selected.length === 0 && "None selected"}
                {selected.length === 1 && "1 band selected"}
                {selected.length === 2 && "Both bands selected"}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-widest text-blue-500 uppercase">
                  2.4 GHz
                </span>
                {selected24 !== undefined && (
                  <span className="text-[11px] text-blue-400 font-mono">
                    {wlanInfo?.[selected24]?.SSID}
                  </span>
                )}
              </div>
              <BandGrid
                indices={[0, 1, 2, 3]}
                wlanInfo={wlanInfo}
                selected={selected}
                onToggle={handleToggle}
                loadState={loadState}
                accentClass="bg-blue-950"
                borderClass="border border-blue-700"
                disabled={isBusy}
                broadcastIntents={broadcastIntents}
                onBroadcastIntent={handleBroadcastIntent}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-widest text-purple-500 uppercase">
                  5 GHz
                </span>
                {selected5 !== undefined && (
                  <span className="text-[11px] text-purple-400 font-mono">
                    {wlanInfo?.[selected5]?.SSID}
                  </span>
                )}
              </div>
              <BandGrid
                indices={[4, 5, 6, 7]}
                wlanInfo={wlanInfo}
                selected={selected}
                onToggle={handleToggle}
                loadState={loadState}
                accentClass="bg-purple-950"
                borderClass="border border-purple-700"
                disabled={isBusy}
                broadcastIntents={broadcastIntents}
                onBroadcastIntent={handleBroadcastIntent}
              />
            </div>

            {loadState === "loading" && (
              <div className="flex items-center gap-2 px-1">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-zinc-600">
                  Loading SSIDs...
                </span>
              </div>
            )}
          </div>

          {/* Credential fields */}
          {(selected.length > 0 || hasBroadcastIntents) && (
            <>
              <div className="border-t border-zinc-900" />
              <div
                className={`flex flex-col gap-4 ${isBusy ? "opacity-40 pointer-events-none" : ""}`}
              >
                <div>
                  <span className="text-xs font-semibold tracking-[0.15em] uppercase text-zinc-500">
                    New Credentials
                  </span>
                  <p className="text-xs text-zinc-600 mt-1">
                    Leave a field blank to keep the current value unchanged.
                  </p>
                </div>
                {selected.map((i) => {
                  const freq = getFreqLabel(i);
                  const modemIdx = getModemIndex(i);
                  const ssid = wlanInfo?.[i]?.SSID;
                  const isBlue = is24(i);
                  return (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-bold tracking-wider
                          ${isBlue ? "bg-blue-950 text-blue-400" : "bg-purple-950 text-purple-400"}`}
                        >
                          {freq} GHz · SSID {modemIdx}
                        </span>
                        {ssid && (
                          <span className="text-xs text-zinc-600 font-mono">
                            {ssid}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Field
                          label="New Wi-Fi Name"
                          value={fields[i]?.newName || ""}
                          placeholder={ssid || "Enter new name"}
                          onChange={(e) =>
                            handleFieldChange(i, "newName", e.target.value)
                          }
                          error={errors[i]?.name}
                        />
                        <Field
                          label="New Password"
                          value={fields[i]?.newPass || ""}
                          placeholder="Enter new password"
                          type="password"
                          revealable
                          onChange={(e) =>
                            handleFieldChange(i, "newPass", e.target.value)
                          }
                          error={errors[i]?.pass}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {selected.length === 0 &&
            loadState === "loaded" &&
            !hasBroadcastIntents && (
              <div className="rounded-lg bg-zinc-900/40 border border-zinc-900 px-4 py-4 text-center">
                <p className="text-[13px] text-zinc-600">
                  Select an SSID above to edit its credentials.
                </p>
              </div>
            )}

          {/* Inline log */}
          {logs.length > 0 && (
            <>
              <div className="border-t border-zinc-900" />
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-[0.15em] uppercase text-zinc-500">
                    Log
                  </span>
                  {isBusy && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 150}ms` }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-zinc-600">Running</span>
                    </div>
                  )}
                  {saveState === "saved" && (
                    <span className="text-xs text-emerald-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />{" "}
                      Complete
                    </span>
                  )}
                  {saveState === "error" && (
                    <span className="text-xs text-red-500">Failed</span>
                  )}
                </div>
                <div className="rounded-lg bg-black border border-zinc-900 p-3 max-h-40 overflow-y-auto log-scrollbar flex flex-col gap-1.5">
                  {logs.map((entry) => (
                    <motion.div
                      key={entry.id}
                      className="flex items-start gap-2"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <span
                        className={`text-xs flex-shrink-0 mt-0.5 ${LOG_LEVEL_STYLES[entry.level] || "text-zinc-500"}`}
                      >
                        {LOG_LEVEL_ICON[entry.level] || "·"}
                      </span>
                      <span
                        className={`text-[13px] leading-relaxed ${LOG_LEVEL_STYLES[entry.level] || "text-zinc-500"}`}
                      >
                        {entry.message}
                      </span>
                      <span className="text-[11px] text-zinc-700 font-mono ml-auto flex-shrink-0 mt-0.5">
                        {entry.timestamp
                          ? new Date(entry.timestamp).toLocaleTimeString(
                              "en-US",
                              { hour12: false },
                            )
                          : ""}
                      </span>
                    </motion.div>
                  ))}
                  <div ref={logEndRef} />
                </div>
                {currentStatusText && (
                  <p
                    className={`text-xs px-1
                    ${saveState === "saved" ? "text-emerald-500" : saveState === "error" ? "text-red-400" : "text-zinc-500"}`}
                  >
                    {currentStatusText}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Save */}
          {(selected.length > 0 || hasBroadcastIntents) && (
            <>
              <div className="border-t border-zinc-900" />
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSave}
                  disabled={
                    (!hasNewValues && !hasBroadcastIntents) ||
                    hasValidationErrors ||
                    isBusy ||
                    saveState === "saved"
                  }
                  className="w-full py-2.5 rounded-md bg-white text-black text-sm font-bold tracking-[0.2em] uppercase hover:bg-zinc-200 active:scale-[0.99] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  {isBusy
                    ? "Applying..."
                    : saveState === "saved"
                      ? "Changes Applied"
                      : hasOnlyBroadcast
                        ? "Apply Broadcast Changes"
                        : hasBoth
                          ? "Apply All Changes"
                          : `Apply Changes${selected.length > 1 ? " to Both Bands" : ""}`}
                </button>
                {isBusy && (
                  <p className="text-center text-xs text-amber-600">
                    Do not close this window while changes are being applied.
                  </p>
                )}
                {!isBusy && saveState === "idle" && (
                  <p className="text-center text-xs text-zinc-700">
                    {hasOnlyBroadcast
                      ? "Selenium will navigate to Wi-Fi Settings → Advanced and update broadcast toggles."
                      : hasBoth
                        ? "Selenium will update credentials on Basic, then broadcast toggles on Advanced."
                        : "Selenium will navigate to Wi-Fi Settings → Basic and save changes."}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
