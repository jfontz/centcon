import { BACKEND_URL } from "./apiConfig";

// --- Selenium command SSE & API (backend at VITE_BACKEND_URL) ---
const COMMAND_API_BASE = BACKEND_URL;

/**
 * Connect to reboot SSE stream. Call onEvent for each event; returns EventSource (call .close() on unmount).
 *
 * Event types:
 * - 'state': { type, state, message, progress, countdown? }
 * - 'log': { type, level, message, timestamp }
 * - 'countdown': { type, countdown }
 * - 'heartbeat': { type }
 *
 * @param {function(object): void} onEvent - callback invoked with each parsed event payload.
 */
export const connectToCommandEvents = (onEvent, { onOpen, onError } = {}) => {
  const eventSource = new EventSource(`${COMMAND_API_BASE}/events`);
  if (onOpen) {
    eventSource.onopen = () => onOpen();
  }
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onEvent(data);
    } catch (e) {
      console.warn("Command SSE parse error", e);
    }
  };
  eventSource.onerror = (event) => {
    if (onError) {
      onError(event);
    }
    eventSource.close();
  };
  return eventSource;
};

/**
 * Trigger a Selenium-backed modem command.
 * @returns {Promise<{ ok: boolean, message?: string }>}
 */
export const triggerCommand = async (commandId) => {
  const response = await fetch(`${COMMAND_API_BASE}/commands/${commandId}`, {
    method: "POST",
  });
  return response.json();
};

/**
 * Trigger the Wi-Fi credentials Selenium workflow.
 * @param {Array<{ssid_index: number, freq: string, modem_index: string, new_name: string, new_pass: string}>} targets
 * @returns {Promise<{ ok: boolean, message?: string }>}
 */
export const triggerWifiCredentials = async (targets) => {
  const response = await fetch(
    `${COMMAND_API_BASE}/commands/wifi-credentials`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targets }),
    },
  );
  return response.json();
};
