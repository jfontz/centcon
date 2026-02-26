const API_BASE = import.meta.env.VITE_REBOOT_API_URL || "http://localhost:8000";

/**
 * Check if first-run setup is needed
 * @returns {Promise<{ setupRequired: boolean, missingFields: string[], invalidFields: string[], defaults?: object }>}
 */
export const checkSetupNeeded = async () => {
  const response = await fetch(`${API_BASE}/api/setup-needed`);
  return response.json();
};

/**
 * Submit setup configuration
 * @param {object} data - Configuration data
 * @returns {Promise<{ ok: boolean, message: string }>}
 */
export const submitSetup = async (data) => {
  const response = await fetch(`${API_BASE}/api/setup-complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Setup failed");
  }

  return response.json();
};
