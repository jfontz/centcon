/**
 * Helper functions for parsing and transforming router data
 * These utilities provide reusable parsing logic to keep the API client clean
 */

/**
 * Safely parse data with a parser function, returning a default value if data is null/undefined
 * This eliminates the need for repetitive null checks in parsing methods
 *
 * @param {*} data - The data to parse (can be null/undefined)
 * @param {Function} parser - Function to parse the data if it exists
 * @param {*} defaultValue - Value to return if data is null/undefined (default: null)
 * @returns {*} Parsed data or default value
 *
 * @example
 * // Instead of:
 * // const result = rawData ? parseWireless(rawData) : null;
 * // Use:
 * const result = safelyParse(rawData, parseWireless);
 */
export const safelyParse = (data, parser, defaultValue = null) => {
  return data ? parser(data) : defaultValue;
};

/**
 * Count devices by their interface type and validate them
 * Provides a reusable pattern for filtering and counting devices
 *
 * @param {Array} devices - Array of device objects from router API
 * @param {string} interfaceType - Type to filter by (e.g., "Ethernet", "802.11", "802.11ac")
 * @param {Function} validator - Function to validate each device
 * @returns {number} Count of valid devices matching the interface type
 *
 * @example
 * const lanCount = countDevicesByType(devices, "Ethernet", isValidDevice);
 * const wifiCount = countDevicesByType(devices, "802.11", isValidDevice);
 */
export const countDevicesByType = (devices, interfaceType, validator) => {
  if (!devices) return 0;

  return devices.filter(
    (device) => device.InterfaceType === interfaceType && validator(device),
  ).length;
};

/**
 * Extract connection information from either IPoE or PPPoE connections
 * Provides unified logic for both connection types, reducing code duplication
 *
 * @param {Object} conn - Connection object from WAN info
 * @param {string} connectionType - Either "IPoE" or "PPPoE"
 * @param {Object} currentState - Current WAN state with v4Addr and wanType
 * @returns {Object|null} Object with connection and type, or null if no valid connection
 *
 * @example
 * const ipoeInfo = extractConnectionInfo(conn, "IPoE", state);
 * if (ipoeInfo && isValidInternetConnection(ipoeInfo.connection, state.v4Addr)) {
 *   // Use the connection info
 * }
 */
export const extractConnectionInfo = (conn, connectionType, currentState) => {
  // Determine which connection list to check based on type
  // IPoE uses ipConns, PPPoE uses pppConns
  const connList = connectionType === "IPoE" ? conn.ipConns : conn.pppConns;

  // Return null if connection list doesn't exist or is empty
  if (!connList?.length) {
    return null;
  }

  // Get the first connection from the list (router typically has one active connection)
  const connection = connList[0];

  return {
    connection,
    type: connectionType,
  };
};
