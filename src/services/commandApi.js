import { BACKEND_URL } from "./apiConfig";

// --- Selenium command SSE & API (backend at VITE_BACKEND_URL) ---
const COMMAND_API_BASE = BACKEND_URL;

/**
 * Connect to reboot SSE stream. Call onEvent for each event; returns EventSource (call .close() on unmount).
 *
 * Event types:
 * - 'state': { type, state, message, countdown? }
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
  };
  return eventSource;
};

/**
 * Fetch available command metadata from the backend.
 * @returns {Promise<Array>} Array of command definitions.
 */
export const fetchCommands = async () => {
  const response = await fetch(`${COMMAND_API_BASE}/commands`);
  const data = await response.json();
  if (!response.ok) {
    const message = data?.detail || data?.message || "Failed to load commands";
    throw new Error(message);
  }
  return data?.commands || [];
};

/**
 * Trigger a Selenium-backed router command.
 * @returns {Promise<{ ok: boolean, message?: string }>}
 */
export const triggerCommand = async (commandId) => {
  const response = await fetch(`${COMMAND_API_BASE}/commands/${commandId}`, {
    method: "POST",
  });
  const data = await response.json();
  if (!response.ok) {
    const message = data?.detail || data?.message || "Command failed";
    throw new Error(message);
  }
  return data;
};

/**
 * Trigger the Wi-Fi credentials Selenium workflow.
 * @param {Array<{ssid_index: number, freq: string, router_index: string, new_name: string, new_pass: string}>} targets
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
  const data = await response.json();
  if (!response.ok) {
    const message = data?.detail || data?.message || "Command failed";
    throw new Error(message);
  }
  return data;
};
