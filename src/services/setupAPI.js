const API_BASE = import.meta.env.VITE_REBOOT_API_URL || "http://localhost:8000";

/**
 * Check if first-run setup is needed.
 * @returns {Promise<{ setupRequired: boolean, missingFields: string[], invalidFields: string[], defaults?: object }>}
 */
export const checkSetupNeeded = async () => {
  const response = await fetch(`${API_BASE}/api/setup-needed`);
  return response.json();
};

/**
 * Submit setup configuration.
 * @param {object} data - Configuration data
 * @returns {Promise<{ ok: boolean, message: string }>}
 * @throws {Error} with human-readable message on failure
 */
export const submitSetup = async (data) => {
  let response;

  try {
    response = await fetch(`${API_BASE}/api/setup-complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (networkError) {
    throw new Error("Cannot connect to the backend. Is the server running?");
  }

  if (!response.ok) {
    // Try to extract FastAPI's error detail
    try {
      const body = await response.json();
      // FastAPI validation errors come as { detail: [...] } or { detail: "string" }
      if (body.detail) {
        const detail = Array.isArray(body.detail)
          ? body.detail.map((e) => e.msg || e.message || String(e)).join(", ")
          : String(body.detail);
        throw new Error(detail);
      }
    } catch (parseError) {
      if (parseError instanceof SyntaxError) {
        throw new Error(`Server error (${response.status})`);
      }
      throw parseError; // re-throw the meaningful error we built above
    }
    throw new Error(`Setup failed (${response.status})`);
  }

  return response.json();
};