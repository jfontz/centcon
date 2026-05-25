import { BACKEND_URL } from "./apiConfig";

// --- Selenium command SSE & API (backend at VITE_BACKEND_URL) ---
const COMMAND_API_BASE = BACKEND_URL;

/**
 * Connect to the SSE command-events stream.
 *
 * Event types:
 * - 'state': { type, state, message, countdown?, command? }
 * - 'log': { type, level, message, timestamp, command? }
 * - 'countdown': { type, countdown, command? }
 * - 'heartbeat': { type }
 *
 * Because the browser's EventSource API cannot send custom headers, the JWT is
 * passed as a ?token= query parameter. The backend's verify_token_sse accepts
 * this fallback only for /events, not for any other protected route.
 *
 * @param {function(object): void} onEvent - callback for each parsed event payload
 * @param {{ onOpen?: function, onError?: function, token?: string }} options
 * @returns {EventSource} Call .close() on unmount.
 */
export const connectToCommandEvents = (
  onEvent,
  { onOpen, onError, token } = {},
) => {
  const url = new URL(`${COMMAND_API_BASE}/events`);
  if (token) {
    url.searchParams.set("token", token);
  }

  const eventSource = new EventSource(url.toString());

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
 * @param {string} token - JWT from AuthContext
 * @returns {Promise<Array>} Array of command definitions.
 */
export const fetchCommands = async (token) => {
  const response = await fetch(`${COMMAND_API_BASE}/commands`, {
    headers: _authHeaders(token),
  });
  const data = await response.json();
  if (!response.ok) {
    const err = new Error(
      data?.detail || data?.message || "Failed to load commands",
    );
    err.status = response.status;
    throw err;
  }
  return data?.commands || [];
};

/**
 * Trigger a Selenium-backed router command.
 * @param {string} commandId
 * @param {string} token - JWT from AuthContext
 * @returns {Promise<{ ok: boolean, message?: string }>}
 */
export const triggerCommand = async (commandId, token) => {
  const response = await fetch(`${COMMAND_API_BASE}/commands/${commandId}`, {
    method: "POST",
    headers: _authHeaders(token),
  });
  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data?.detail || data?.message || "Command failed");
    err.status = response.status;
    throw err;
  }
  return data;
};

/**
 * Trigger the Wi-Fi credentials Selenium workflow.
 * @param {Array<{ssid_index: number, freq: string, router_index: string, new_name: string, new_pass: string, broadcast_intent?: string | null}>} targets
 * @param {string} token - JWT from AuthContext
 * @returns {Promise<{ ok: boolean, message?: string }>}
 */
export const triggerWifiCredentials = async (targets, token) => {
  const response = await fetch(
    `${COMMAND_API_BASE}/commands/wifi-credentials`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ..._authHeaders(token) },
      body: JSON.stringify({ targets }),
    },
  );
  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data?.detail || data?.message || "Command failed");
    err.status = response.status;
    throw err;
  }
  return data;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build an Authorization header object from a JWT.
 * Returns an empty object when no token is available so fetch calls degrade
 * gracefully (the backend will return 401, which is the correct behaviour).
 */
function _authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
