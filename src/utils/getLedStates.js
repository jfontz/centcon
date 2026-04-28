/**
 * getLedStates
 *
 * Maps router data, status, and command state to LED configurations
 * for the RouterVisual component.
 *
 * Returns an array of 5 LED objects:
 * { id, label, color, animate }
 *
 * Colors:  "green" | "amber" | "red" | "off"
 * Animate: "pulse" | "blink" | null
 *
 * LED order: PWR → FIBER → INTERNET → 2.4G → 5G
 */

const REBOOT_STATES = [
  "LOGGING_IN",
  "NAVIGATING",
  "REBOOTING",
  "WAITING",
  "CHECKING_CONNECTION",
];

export const getLedStates = (data, status, commandState) => {
  const isRebooting =
    commandState?.command === "reboot" &&
    REBOOT_STATES.includes(commandState?.state);

  const isUnreachable = data === null;

  // During reboot: PWR pulses amber, everything else off
  if (isRebooting) {
    return [
      { id: "pwr", label: "PWR", color: "amber", animate: "pulse" },
      { id: "fiber", label: "FIBER", color: "off", animate: null },
      { id: "internet", label: "INTERNET", color: "off", animate: null },
      { id: "wifi24", label: "2.4G", color: "off", animate: null },
      { id: "wifi5", label: "5G", color: "off", animate: null },
    ];
  }

  // Router completely unreachable: all off, unit dimmed
  if (isUnreachable || status === "offline") {
    return [
      { id: "pwr", label: "PWR", color: "off", animate: null },
      { id: "fiber", label: "FIBER", color: "off", animate: null },
      { id: "internet", label: "INTERNET", color: "off", animate: null },
      { id: "wifi24", label: "2.4G", color: "off", animate: null },
      { id: "wifi5", label: "5G", color: "off", animate: null },
    ];
  }

  const hasLOS = status === "los";
  const wanConnected = Boolean(data?.wan?.connected);
  const wifi24Devices = (data?.connectedDevices?.wifi24 ?? 0) > 0;
  const wifi5Devices = (data?.connectedDevices?.wifi5 ?? 0) > 0;

  // LOS: fiber signal lost — FIBER pulses red, internet and wi-fi off
  if (hasLOS) {
    return [
      { id: "pwr", label: "PWR", color: "green", animate: null },
      { id: "fiber", label: "FIBER", color: "red", animate: "pulse" },
      { id: "internet", label: "INTERNET", color: "off", animate: null },
      { id: "wifi24", label: "2.4G", color: "off", animate: null },
      { id: "wifi5", label: "5G", color: "off", animate: null },
    ];
  }

  // No WAN but fiber is fine
  if (!wanConnected) {
    return [
      { id: "pwr", label: "PWR", color: "green", animate: null },
      { id: "fiber", label: "FIBER", color: "green", animate: null },
      { id: "internet", label: "INTERNET", color: "red", animate: null },
      {
        id: "wifi24",
        label: "2.4G",
        color: wifi24Devices ? "green" : "amber",
        animate: null,
      },
      {
        id: "wifi5",
        label: "5G",
        color: wifi5Devices ? "green" : "amber",
        animate: null,
      },
    ];
  }

  // All systems online
  return [
    { id: "pwr", label: "PWR", color: "green", animate: null },
    { id: "fiber", label: "FIBER", color: "green", animate: null },
    { id: "internet", label: "INTERNET", color: "green", animate: null },
    {
      id: "wifi24",
      label: "2.4G",
      color: wifi24Devices ? "green" : "amber",
      animate: null,
    },
    {
      id: "wifi5",
      label: "5G",
      color: wifi5Devices ? "green" : "amber",
      animate: null,
    },
  ];
};
