/*
 * System control button definitions.
 * Adding or removing an entry here automatically adds or removes the button in the UI.
 *
 * Field reference:
 * - id: Unique command id used by backend routes and state.
 * - label: Button text shown in the UI.
 * - buttonClass: CSS class for button styling.
 * - icon: Icon key from assets/icons.
 * - confirm: Show confirmation modal before triggering.
 * - blocksOthers: Prevent other commands from running in parallel.
 * - allowWhileBusy: Disallow start when another command is active.
 * - disableSelf: Disable this button immediately on click.
 */
const SYSTEM_COMMANDS = [
  {
    id: "reboot",
    label: "Reboot Modem",
    buttonClass: "btn-reboot",
    icon: "reboot",
    confirm: true,
    blocksOthers: true,
    allowWhileBusy: false,
    disableSelf: true,
  },
  {
    id: "login",
    label: "Login to Modem",
    buttonClass: "control-btn",
    icon: "newTab",
    confirm: false,
    blocksOthers: false,
    allowWhileBusy: true,
    disableSelf: true,
  },
  {
    id: "wifi-credentials",
    label: "Wi-Fi Credentials",
    buttonClass: "control-btn",
    icon: "wifi",
    confirm: false,
    dangerous: false,
    blocksOthers: false,
    allowWhileBusy: false,
    disableSelf: true,
  },
];

export default SYSTEM_COMMANDS;
