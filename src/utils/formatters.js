/**
 * Utility functions for formatting data displayed in the UI
 * Handles time formatting, temperature status classification, and color coding
 */

/** Format date for log display: [HH:MM:SS] */
export const formatLogTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("en-GB", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

/**
 * Format a date as relative time (e.g., "5m ago", "2h ago")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string or "Never" if no date provided
 */
export const formatTimeAgo = (date) => {
  if (!date) return "Never";

  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

/**
 * Get descriptive status for a temperature reading
 * @param {number|string} temp - Temperature in Celsius
 * @returns {string} Status: "Cool", "Normal", "Warm", or "Hot"
 */
export const getTemperatureStatus = (temp) => {
  if (!temp) return "Unknown";
  const temperature = parseFloat(temp);

  if (temperature < 40) return "Cool";
  if (temperature < 55) return "Normal";
  if (temperature < 70) return "Warm";
  return "Hot";
};

/**
 * Get Tailwind color class for temperature visualization
 * @param {number|string} temp - Temperature in Celsius
 * @returns {string} Tailwind text color class (blue/green/yellow/red/gray)
 */
export const getTemperatureColor = (temp) => {
  if (!temp) return "text-[#8a8a83] dark:text-gray-400";
  const temperature = parseFloat(temp);

  if (temperature < 40) return "text-[#326dcf] dark:text-blue-400";
  if (temperature < 55) return "text-[#218c4f] dark:text-green-400";
  if (temperature < 70) return "text-[#b7791f] dark:text-yellow-400";
  return "text-[#c44955] dark:text-red-400";
};

/**
 * Format uptime seconds into human-readable string
 * @param {number} seconds - Uptime in seconds
 * @returns {string} Formatted uptime (e.g., "5d 3h 21m 45s")
 */
export const formatUptime = (seconds) => {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  let result = [];
  if (days > 0) result.push(`${days}d`);
  result.push(`${hours}h`);
  result.push(`${minutes}m`);
  result.push(`${secs}s`);

  return result.join(" ");
};
