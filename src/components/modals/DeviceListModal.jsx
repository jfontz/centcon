import { useState } from "react";
import { motion } from "framer-motion";

const MotionDiv = motion.div;

// Trusted devices are keyed by hostname|ip and persisted in localStorage.
// Trust survives router reboots since storage lives in the browser, not the router.
// Trust is only lost if a device's IP changes (e.g. DHCP lease expiry reassigning a different IP).
// MAC address would be the ideal key but the router API does not expose MAC addresses.
// Hostname-only keying would survive IP changes but risks merging two devices with the same hostname.
const TRUSTED_KEY = "centcon:trusted_devices";

const getBandLabel = (interfaceType) => {
  if (interfaceType === "802.11ac") return "5GHz";
  if (interfaceType === "802.11") return "2.4GHz";
  if (interfaceType === "Ethernet") return "LAN";
  return interfaceType || "Unknown";
};

const BAND_ORDER = { LAN: 0, "2.4GHz": 1, "5GHz": 2, Unknown: 3 };

const loadTrusted = () => {
  try {
    return JSON.parse(localStorage.getItem(TRUSTED_KEY) || "{}");
  } catch {
    return {};
  }
};

const saveTrusted = (trusted) => {
  try {
    localStorage.setItem(TRUSTED_KEY, JSON.stringify(trusted));
  } catch (err) {
    console.warn("Failed to save trusted data:", err);
  }
};

export default function DeviceListModal({ open, onClose, devices = [] }) {
  const [trusted, setTrusted] = useState(() => loadTrusted());

  const toggleTrusted = (key) => {
    setTrusted((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      saveTrusted(next);
      return next;
    });
  };

  // Group devices by band and sort groups
  const grouped = devices.reduce((acc, device) => {
    const band = getBandLabel(device.interface);
    if (!acc[band]) acc[band] = [];
    acc[band].push(device);
    return acc;
  }, {});

  const sortedBands = Object.keys(grouped).sort(
    (a, b) => (BAND_ORDER[a] ?? 99) - (BAND_ORDER[b] ?? 99),
  );

  const unknownCount = devices.filter((d) => {
    const key = `${d.hostname}|${d.ip}`;
    return !trusted[key];
  }).length;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/35 dark:bg-black/80 backdrop-blur-sm z-60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#f7f4ee] border border-[#cec8bc] dark:bg-zinc-950 dark:border-zinc-800 rounded-xl overflow-hidden z-60 shadow-2xl flex flex-col"
        style={{ maxHeight: "calc(100dvh - 8rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#cec8bc] dark:border-zinc-900">
          <div>
            <h2 className="text-sm font-semibold text-[#1a1a1a] dark:text-white tracking-wide">
              Connected Devices
            </h2>
            <p className="text-xs text-[#666660] dark:text-zinc-500 mt-0.5">
              {devices.length} device{devices.length !== 1 ? "s" : ""} connected
              {unknownCount > 0 && (
                <span className="text-[#b7791f] dark:text-amber-400 ml-1">
                  · {unknownCount} not marked as trusted
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#666660] hover:text-[#24241f] dark:text-zinc-600 dark:hover:text-zinc-300 transition-colors text-lg leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Device list */}
        <div className="overflow-y-auto log-scrollbar flex flex-col gap-4 p-5">
          {devices.length === 0 ? (
            <p className="text-[#666660] dark:text-zinc-600 text-sm text-center py-4">
              No devices currently connected.
            </p>
          ) : (
            sortedBands.map((band) => (
              <div key={band} className="flex flex-col gap-2">
                {/* Band label */}
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#666660] dark:text-zinc-500">
                  {band} — {grouped[band].length} device
                  {grouped[band].length !== 1 ? "s" : ""}
                </span>

                {/* Devices in this band */}
                {grouped[band].map((device) => {
                  const key = `${device.hostname}|${device.ip}`;
                  const isTrusted = Boolean(trusted[key]);
                  return (
                    <MotionDiv
                      key={key}
                      layout
                      className={`flex items-center justify-between px-3 py-2.5 rounded-md border transition-colors ${
                        isTrusted
                          ? "bg-[#f0ede6] border-[rgba(123,123,116,0.24)] dark:bg-zinc-900/60 dark:border-zinc-800"
                          : "bg-[#e5e1d5] border-[rgba(160,120,20,0.32)] dark:bg-zinc-900 dark:border-amber-900/40"
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span
                          className={`text-sm truncate ${
                            isTrusted
                              ? "text-[#4f4f49] dark:text-zinc-300"
                              : "text-[#3a3520] dark:text-white"
                          }`}
                        >
                          {device.hostname}
                        </span>
                        <span className="text-[11px] text-[#8a8a83] dark:text-zinc-600">
                          {device.ip}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleTrusted(key)}
                        className={`ml-3 shrink-0 text-[10px] px-2.5 py-1 rounded font-bold tracking-wider transition-all cursor-pointer border ${
                          isTrusted
                            ? "bg-[#f0ede6] text-[#7b7b74] border-[rgba(33,140,79,0.24)] hover:border-[#5b5b56] hover:text-[#7b7b74] dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
                            : "bg-[#d7ca91] text-[#4a4020] border-[rgba(160,120,20,0.4)] hover:bg-[#c9bb7c] hover:text-[#3a3218] dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60 dark:hover:bg-amber-950/70"
                        }`}
                      >
                        {isTrusted ? "TRUSTED" : "UNKNOWN"}
                      </button>
                    </MotionDiv>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-3 border-t border-[#cec8bc] dark:border-zinc-900">
          <p className="text-[11px] text-[#666660] dark:text-zinc-600">
            Trusted status is saved locally on this machine. Click a device to
            toggle.
          </p>
        </div>
      </div>
    </div>
  );
}
