// Utility functions for formatting data

export const formatTimeAgo = (date) => {
  if (!date) return "Never";

  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export const getTemperatureStatus = (temp) => {
  if (!temp) return "Unknown";
  const temperature = parseFloat(temp);

  if (temperature < 40) return "Cool";
  if (temperature < 55) return "Normal";
  if (temperature < 70) return "Warm";
  return "Hot";
};

export const getTemperatureColor = (temp) => {
  if (!temp) return "text-gray-400";
  const temperature = parseFloat(temp);

  if (temperature < 40) return "text-blue-400";
  if (temperature < 55) return "text-green-400";
  if (temperature < 70) return "text-yellow-400";
  return "text-red-400";
};
