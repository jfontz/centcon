import {
  check,
  process,
  info,
  hourglass,
  warning,
  error,
  navigate,
  load,
  action,
  connected,
} from "../assets/icons";

const ICON_CLASSES = "w-4 h-4 inline-block pointer-events-none select-none";

const ICON_MAP = {
  header: process,
  navigate: navigate,
  info: info,
  success: check,
  progress: hourglass,
  connected: connected,
  checking: load,
  action: action,
  error: error,
  warning: warning,
};

export const getIcon = (type) => {
  const icon = ICON_MAP[type];

  if (!icon) return <span>{"\u2022"}</span>;

  return <img src={icon} className={ICON_CLASSES} alt={type} />;
};
