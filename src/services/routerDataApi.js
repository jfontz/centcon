import {
  isValidDevice,
  isValidInternetConnection,
} from "../utils/validators.js";

import {
  safelyParse,
  countDevicesByType,
  extractConnectionInfo,
} from "../utils/routerHelpers.js";

import { formatUptime } from "../utils/formatters.js";

// API endpoint for fetching router information
const API_ENDPOINT = "/login_globe.cgi?info";
const DEFAULT_ROUTER_IP = "192.168.254.254";
const USER_AGENT = "Mozilla/5.0";
const LAN_INTERFACE = "Ethernet";
const WIFI_24_INTERFACE = "802.11";
const WIFI_5_INTERFACE = "802.11ac";

/**
 * API client for interacting with the router
 * Handles fetching, parsing, and transforming router data
 */
class RouterApiClient {
  // Temperature is returned in 1/256 degrees, so divide by 256
  static TEMP_DIVISOR = 256;

  // Array indices for WiFi interfaces in wlan_info
  static WIFI_24_INDEX = 0; // 2.4GHz WiFi at index 0
  static WIFI_5_INDEX = 4; // 5GHz WiFi at index 4

  constructor() {
    this.routerIp = import.meta.env.VITE_ROUTER_IP || DEFAULT_ROUTER_IP;
    // Use Vite proxy in development, direct router URL in production
    this.baseUrl = import.meta.env.DEV ? "/api" : `http://${this.routerIp}`;
  }

  /**
   * Fetch raw router data from the JSON API
   * @returns {Promise<Object>} Raw router data with wlan_info, onu_info, etc.
   * @throws {Error} If fetch fails or returns non-OK status
   */
  async fetchRouterData() {
    const url = `${this.baseUrl}${API_ENDPOINT}`;

    // Set appropriate headers based on environment
    const headers = import.meta.env.DEV
      ? { "User-Agent": USER_AGENT }
      : {
          "User-Agent": USER_AGENT,
          Referer: `http://${this.routerIp}/`,
        };

    try {
      const response = await fetch(url, { method: "GET", headers });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch router data:", error);
      throw error;
    }
  }

  /**
   * Parse and transform raw router data into a usable format
   * Uses safelyParse to handle null/undefined data gracefully
   *
   * @param {Object} rawData - Raw data from router API
   * @returns {Object} Parsed router data with wireless, device, optical, wan, connectedDevices
   */
  parseRouterData(rawData) {
    return {
      wireless: safelyParse(rawData.wlan_info, (d) => this.parseWireless(d)),
      device: safelyParse(rawData.onu_info, (d) => this.parseDevice(d)),
      optical: safelyParse(rawData.optical_info, (d) => this.parseOptical(d)),
      wan: safelyParse(rawData.wan_info, (d) => this.parseWan(d)),
      connectedDevices: this.parseConnectedDevices(rawData.device_info),
    };
  }

  /**
   * Parse wireless network information
   * @param {Array} wlanInfo - Array of WLAN interfaces
   * @returns {Object} Object with ssid24 and ssid5
   */
  parseWireless(wlanInfo) {
    return {
      ssid24: wlanInfo[RouterApiClient.WIFI_24_INDEX]?.SSID || "N/A",
      ssid5: wlanInfo[RouterApiClient.WIFI_5_INDEX]?.SSID || "N/A",
    };
  }

  /**
   * Parse device/ONU information
   * @param {Object} onuInfo - ONU information object
   * @returns {Object} Parsed device info with model, serial, CPU, memory, uptime
   */
  parseDevice(onuInfo) {
    // Calculate memory usage percentage
    const memUsage =
      onuInfo.Total && onuInfo.Free
        ? (((onuInfo.Total - onuInfo.Free) / onuInfo.Total) * 100).toFixed(0)
        : 0;

    return {
      model: onuInfo.ModelName || "Unknown",
      software: onuInfo.SoftwareVersion || "Unknown",
      cpuUsage: onuInfo.CPUUsage || 0,
      memoryUsage: parseInt(memUsage, 10),
      uptime: onuInfo.UpTime || 0,
      uptimeFormatted: formatUptime(onuInfo.UpTime || 0),
    };
  }

  /**
   * Parse optical transceiver information
   * @param {Object} opticalInfo - Optical module information
   * @returns {Object} Object with temperature, enable, txPower, rxPower, voltage, biasCurrent
   */
  parseOptical(opticalInfo) {
    return {
      temperature: (
        (opticalInfo.TransceiverTemperature || 0) / RouterApiClient.TEMP_DIVISOR
      ).toFixed(1),
      enable: opticalInfo.Enable ?? 0,
      txPower: opticalInfo.TXPower ?? 0,
      rxPower: opticalInfo.RXPower ?? 0,
      voltage: opticalInfo.SupplyVottage ?? 0,
      biasCurrent: opticalInfo.BiasCurrent ?? 0,
    };
  }

  /**
   * Parse WAN connection information
   * Checks both IPoE and PPPoE connections to find active internet connection
   *
   * @param {Array} wanInfo - Array of WAN connection objects
   * @returns {Object} Object with type (IPoE/PPPoE) and ipv4 address
   */
  parseWan(wanInfo) {
    let state = {
      v4Addr: "Empty",
      wanType: "",
      connected: false,
    };

    wanInfo.forEach((conn) => {
      // Try IPoE connection first
      const ipoeInfo = extractConnectionInfo(conn, "IPoE");
      if (
        ipoeInfo &&
        isValidInternetConnection(ipoeInfo.connection, state.v4Addr)
      ) {
        state.v4Addr = ipoeInfo.connection.ExternalIPAddress;
        state.wanType = ipoeInfo.type;
        state.connected = true;
        return;
      }

      // Fall back to PPPoE if IPoE not found
      const pppoeInfo = extractConnectionInfo(conn, "PPPoE");
      if (
        pppoeInfo &&
        isValidInternetConnection(pppoeInfo.connection, state.v4Addr)
      ) {
        state.v4Addr = pppoeInfo.connection.ExternalIPAddress;
        state.wanType = pppoeInfo.type;
        state.connected = true;
      }
    });

    return {
      type: state.wanType,
      ipv4: state.v4Addr,
      connected: state.connected,
    };
  }

  /**
   * Parse connected devices information
   * Counts devices by interface type (LAN, 2.4GHz WiFi, 5GHz WiFi)
   *
   * @param {Array} deviceInfo - Array of connected device objects
   * @returns {Object} Object with lan, wifi24, wifi5 counts and total
   */
  parseConnectedDevices(deviceInfo) {
  if (!deviceInfo) {
    return { lan: 0, wifi24: 0, wifi5: 0, total: 0, devices: [] };
  }

  const lan = countDevicesByType(deviceInfo, LAN_INTERFACE, isValidDevice);
  const wifi24 = countDevicesByType(deviceInfo, WIFI_24_INTERFACE, isValidDevice);
  const wifi5 = countDevicesByType(deviceInfo, WIFI_5_INTERFACE, isValidDevice);

  const devices = deviceInfo
    .filter(isValidDevice)
    .map((d) => ({
      hostname: d.HostName || "Unknown",
      ip: d.IPAddress || "",
      interface: d.InterfaceType || "",
    }));

  return { lan, wifi24, wifi5, total: lan + wifi24 + wifi5, devices };
}

  /**
   * Main method to get parsed router data
   * Fetches raw data and transforms it into a clean, usable format
   *
   * @returns {Promise<Object>} Fully parsed router data
   * @throws {Error} If fetching or parsing fails
   */
  async getData() {
    const rawData = await this.fetchRouterData();
    return this.parseRouterData(rawData);
  }
}

// Export singleton instance for use throughout the application
export const routerApi = new RouterApiClient();
