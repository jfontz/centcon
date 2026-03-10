/**
 * Validation utilities for modem data
 * These functions provide consistent validation logic across the application
 */

/**
 * Check if a device has the minimum required properties to be considered valid
 * A valid device must have both a hostname and IP address assigned
 *
 * @param {Object} device - Device object from modem API
 * @param {string} device.HostName - Device hostname
 * @param {string} device.IPAddress - Device IP address
 * @returns {boolean} True if device has both required properties
 *
 * @example
 * const validDevices = deviceList.filter(isValidDevice);
 */
export const isValidDevice = (device) => {
  return device?.HostName && device?.IPAddress;
};

/**
 * Check if a connection is valid for internet service
 * Validates that the connection:
 * - Is configured for INTERNET service
 * - Has a "Connected" status
 * - Has an external IP address assigned
 * - Is the first connection found (currentAddress is still "Empty")
 *
 * @param {Object} connection - Connection object (IPoE or PPPoE)
 * @param {string} connection.X_CT_COM_ServiceList - Service list (should contain "INTERNET")
 * @param {string} connection.ConnectionStatus - Connection status
 * @param {string} connection.ExternalIPAddress - Assigned external IP
 * @param {string} currentAddress - Current IP address state ("Empty" if not yet set)
 * @returns {boolean} True if connection is valid for internet
 *
 * @example
 * if (isValidInternetConnection(conn, state.v4Addr)) {
 *   state.v4Addr = conn.ExternalIPAddress;
 * }
 */
export const isValidInternetConnection = (connection, currentAddress) => {
  return (
    connection?.X_CT_COM_ServiceList?.indexOf("INTERNET") !== -1 &&
    connection?.ConnectionStatus === "Connected" &&
    connection?.ExternalIPAddress &&
    currentAddress === "Empty"
  );
};
