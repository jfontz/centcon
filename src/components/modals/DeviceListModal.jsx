import { useState, useEffect } from "react";
import { motion } from "framer-motion";

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
  const [trusted, setTrusted] = useState({});

  // Load trusted devices from localStorage on open
  useEffect(() => {
    if (open) setTrusted(loadTrusted());
  }, [open]);

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
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden z-60 shadow-2xl flex flex-col"
        style={{ maxHeight: "calc(100dvh - 8rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide">
              Connected Devices
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {devices.length} device{devices.length !== 1 ? "s" : ""} connected
              {unknownCount > 0 && (
                <span className="text-amber-400 ml-1">
                  · {unknownCount} not marked as trusted
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-zinc-300 transition-colors text-lg leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Device list */}
        <div className="overflow-y-auto log-scrollbar flex flex-col gap-4 p-5">
          {devices.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-4">
              No devices currently connected.
            </p>
          ) : (
            sortedBands.map((band) => (
              <div key={band} className="flex flex-col gap-2">
                {/* Band label */}
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500">
                  {band} — {grouped[band].length} device
                  {grouped[band].length !== 1 ? "s" : ""}
                </span>

                {/* Devices in this band */}
                {grouped[band].map((device) => {
                  const key = `${device.hostname}|${device.ip}`;
                  const isTrusted = Boolean(trusted[key]);
                  return (
                    <motion.div
                      key={key}
                      layout
                      className={`flex items-center justify-between px-3 py-2.5 rounded-md border transition-colors ${
                        isTrusted
                          ? "bg-zinc-900/60 border-zinc-800"
                          : "bg-zinc-900 border-amber-900/40"
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span
                          className={`text-sm font-mono truncate ${
                            isTrusted ? "text-zinc-300" : "text-white"
                          }`}
                        >
                          {device.hostname}
                        </span>
                        <span className="text-[11px] text-zinc-600 font-mono">
                          {device.ip}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleTrusted(key)}
                        className={`ml-3 shrink-0 text-[10px] px-2.5 py-1 rounded font-bold tracking-wider transition-all cursor-pointer border ${
                          isTrusted
                            ? "bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-500 hover:text-zinc-300"
                            : "bg-amber-950/40 text-amber-400 border-amber-800/60 hover:bg-amber-950/70"
                        }`}
                      >
                        {isTrusted ? "TRUSTED" : "UNKNOWN"}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-3 border-t border-zinc-900">
          <p className="text-[11px] text-zinc-600">
            Trusted status is saved locally on this machine. Click a device to
            toggle.
          </p>
        </div>
      </div>
    </div>
  );
}
