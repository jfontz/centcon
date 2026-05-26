import { BACKEND_URL } from "./apiConfig";

/**
 * Verify PIN with backend.
 * On success the backend returns a signed JWT that must be attached to all
 * subsequent command requests.
 *
 * @param {string} pin - PIN entered by user
 * @returns {Promise<{ ok: boolean, message: string, token?: string }>}
 */
export const verifyPin = async (pin) => {
  let response;
  try {
    response = await fetch(`${BACKEND_URL}/verify-pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
  } catch {
    throw new Error("Cannot connect to the backend. Is the server running?");
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const err = new Error(
      data?.detail || `PIN verification failed (${response.status})`,
    );
    err.status = response.status;
    throw err;
  }

  return response.json();
};
