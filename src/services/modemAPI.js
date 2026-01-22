// ============================================
// FILE: src/services/modemApi.js
// ============================================
// Main API client for fetching modem data

const API_ENDPOINT = "/login_globe.cgi?info";

class ModemApiClient {
  // Optical conversion constants
  static OPTICAL_MULTIPLIER = 0.00001;
  static DB_CONVERSION_FACTOR = 10;
  static TEMP_DIVISOR = 256;
  static VOLTAGE_MULTIPLIER = 0.0001;
  static CURRENT_MULTIPLIER = 0.002;

  // WiFi interface indices
  static WIFI_24_INDEX = 0;
  static WIFI_5_INDEX = 4;

  constructor() {
    this.modemIp = import.meta.env.VITE_MODEM_IP || "192.168.254.254";
    // Use proxy in development, direct URL in production
    // The Vite proxy handles /api requests and forwards them to the modem
    this.baseUrl = import.meta.env.DEV ? "/api" : `http://${this.modemIp}`;
  }

  /**
   * Fetch raw modem data from the JSON API
   * @param {number} retries - Number of retry attempts
   * @returns {Promise<Object>} Raw modem data
   */
  async fetchModemData(retries = 3) {
    const url = `${this.baseUrl}${API_ENDPOINT}`;

    const headers = import.meta.env.DEV
      ? { "User-Agent": "Mozilla/5.0" }
      : {
          "User-Agent": "Mozilla/5.0",
          Referer: `http://${this.modemIp}/`,
        };

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, { method: "GET", headers });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`Fetch attempt ${i + 1} failed:`, error);

        if (i === retries - 1) {
          console.error("Failed to fetch modem data after all retries");
          throw error;
        }

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  /**
   * Parse and transform raw modem data into a usable format
   * @param {Object} rawData - Raw data from modem API
   * @returns {Object} Parsed modem data
   */
  parseModemData(rawData) {
    return {
      wireless: this.parseWireless(rawData.wlan_info),
      device: this.parseDevice(rawData.onu_info),
      optical: this.parseOptical(rawData.optical_info),
      wan: this.parseWan(rawData.wan_info),
      voice: this.parseVoice(rawData.voice_info),
      connectedDevices: this.parseConnectedDevices(rawData.device_info),
      raw: rawData, // Keep raw data for debugging
    };
  }

  parseWireless(wlanInfo) {
    if (!wlanInfo?.length) return null;

    return {
      ssid24: wlanInfo[ModemApiClient.WIFI_24_INDEX]?.SSID || "N/A",
      ssid5: wlanInfo[ModemApiClient.WIFI_5_INDEX]?.SSID || "N/A",
    };
  }

  parseDevice(onuInfo) {
    if (!onuInfo) return null;

    const memUsage =
      onuInfo.Total && onuInfo.Free
        ? (((onuInfo.Total - onuInfo.Free) / onuInfo.Total) * 100).toFixed(0)
        : 0;

    return {
      model: onuInfo.ModelName || "Unknown",
      serial: onuInfo.SerialNumber || "Unknown",
      software: onuInfo.SoftwareVersion || "Unknown",
      cpuUsage: onuInfo.CPUUsage || 0,
      memoryUsage: parseInt(memUsage),
      uptime: onuInfo.UpTime || 0,
      uptimeFormatted: this.formatUptime(onuInfo.UpTime || 0),
    };
  }

  parseOptical(opticalInfo) {
    if (!opticalInfo) return null;

    const toDbm = (mw) => {
      if (!mw || mw === "0") return null;
      const mwValue = parseInt(mw) * ModemApiClient.OPTICAL_MULTIPLIER;
      return (
        (Math.log(mwValue) / Math.LN10) *
        ModemApiClient.DB_CONVERSION_FACTOR
      ).toFixed(2);
    };

    return {
      txPower: toDbm(opticalInfo.TXPower),
      rxPower: toDbm(opticalInfo.RXPower),
      temperature: (
        (opticalInfo.TransceiverTemperature || 0) / ModemApiClient.TEMP_DIVISOR
      ).toFixed(2),
      voltage: (
        (opticalInfo.SupplyVoltage || 0) * ModemApiClient.VOLTAGE_MULTIPLIER
      ).toFixed(2),
      current: (
        (opticalInfo.BiasCurrent || 0) * ModemApiClient.CURRENT_MULTIPLIER
      ).toFixed(2),
    };
  }

  parseWan(wanInfo) {
    if (!wanInfo) return null;

    let v4Addr = "Empty";
    let v6Addr = "Empty";
    let wanType = "";

    wanInfo.forEach((conn) => {
      if (conn.ipConns?.length) {
        const ipConn = conn.ipConns[0];
        if (
          ipConn.X_CT_COM_ServiceList?.indexOf("INTERNET") !== -1 &&
          ipConn.ConnectionStatus === "Connected" &&
          ipConn.ExternalIPAddress &&
          v4Addr === "Empty"
        ) {
          v4Addr = ipConn.ExternalIPAddress;
          wanType = "IPoE";
        }
      } else if (conn.pppConns?.length) {
        const pppConn = conn.pppConns[0];
        if (
          pppConn.X_CT_COM_ServiceList?.indexOf("INTERNET") !== -1 &&
          pppConn.ConnectionStatus === "Connected" &&
          pppConn.ExternalIPAddress &&
          v4Addr === "Empty"
        ) {
          v4Addr = pppConn.ExternalIPAddress;
          wanType = "PPPoE";
        }
      }
    });

    return {
      type: wanType,
      ipv4: v4Addr,
      ipv6: v6Addr,
    };
  }

    // TODO: remove unused parsers such as parseVoice. Make sure to check for dependencies first.

  parseVoice(voiceInfo) {
    if (!voiceInfo) return null;

    let voiceNum = "Empty";
    voiceInfo.forEach((voice) => {
      if (
        voice.phNumber &&
        voice.phNumber !== "Empty" &&
        voiceNum === "Empty"
      ) {
        voiceNum = voice.phNumber;
      }
    });

    return {
      phoneNumber: voiceNum,
    };
  }

  parseConnectedDevices(deviceInfo) {
    if (!deviceInfo) return { lan: 0, wifi24: 0, wifi5: 0, total: 0 };

    const lan = deviceInfo.filter(
      (d) => d.InterfaceType === "Ethernet" && d.HostName && d.IPAddress
    ).length;

    const wifi24 = deviceInfo.filter(
      (d) => d.InterfaceType === "802.11" && d.HostName && d.IPAddress
    ).length;

    const wifi5 = deviceInfo.filter(
      (d) => d.InterfaceType === "802.11ac" && d.HostName && d.IPAddress
    ).length;

    return {
      lan,
      wifi24,
      wifi5,
      total: lan + wifi24 + wifi5,
    };
  }

  formatUptime(seconds) {
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
  }

  /**
   * Get parsed modem data
   * @returns {Promise<Object>} Parsed modem data
   */
  async getData() {
    const rawData = await this.fetchModemData();
    return this.parseModemData(rawData);
  }
}

// Export singleton instance
export const modemApi = new ModemApiClient();
