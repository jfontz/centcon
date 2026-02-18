const REBOOT_API_BASE =
  import.meta.env.VITE_REBOOT_API_URL || "http://localhost:8000";

/**
 * Get authentication configuration from backend
 * @returns {Promise<{ showLogin: boolean, message: string }>}
 */
export const getAuthConfig = async () => {
  const response = await fetch(`${REBOOT_API_BASE}/auth-config`);
  return response.json();
};

/**
 * Verify PIN with backend
 * @param {string} pin - PIN entered by user
 * @returns {Promise<{ ok: boolean, message: string }>}
 */
export const verifyPin = async (pin) => {
  const response = await fetch(`${REBOOT_API_BASE}/verify-pin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  return response.json();
};
