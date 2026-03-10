import { BACKEND_URL } from "./apiConfig";

/**
 * Check if first-run setup is needed.
 * @returns {Promise<{ setupRequired: boolean, missingFields: string[], invalidFields: string[], defaults?: object }>}
 */
export const checkSetupNeeded = async () => {
  const response = await fetch(`${BACKEND_URL}/api/setup-needed`);
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
  const extractErrorDetail = async (res) => {
    const body = await res.json();
    if (!body.detail) return null;
    return Array.isArray(body.detail)
      ? body.detail.map((e) => e.msg || e.message || String(e)).join(", ")
      : String(body.detail);
  };

  try {
    response = await fetch(`${BACKEND_URL}/api/setup-complete`, {
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
      const detail = await extractErrorDetail(response);
      // FastAPI validation errors come as { detail: [...] } or { detail: "string" }
      if (detail) throw new Error(detail);
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
