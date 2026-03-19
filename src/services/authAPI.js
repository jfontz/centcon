import { BACKEND_URL } from "./apiConfig";

/**
 * Get authentication configuration from backend
 * @returns {Promise<{ showLogin: boolean, message: string }>}
 */
export const getAuthConfig = async () => {
  let response;
  try {
    response = await fetch(`${BACKEND_URL}/auth-config`);
  } catch (networkError) {
    throw new Error("Cannot connect to the backend. Is the server running?");
  }

  if (!response.ok) {
    throw new Error(`Auth config failed (${response.status})`);
  }

  return response.json();
};

/**
 * Verify PIN with backend
 * @param {string} pin - PIN entered by user
 * @returns {Promise<{ ok: boolean, message: string }>}
 */
export const verifyPin = async (pin) => {
  let response;
  try {
    response = await fetch(`${BACKEND_URL}/verify-pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
  } catch (networkError) {
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
