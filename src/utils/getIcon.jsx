import {
  check,
  process,
  log as logIcon,
  hourglass,
  warning,
  error,
} from "../assets/icons";

const ICON_CLASSES = "w-4 h-4 inline-block pointer-events-none select-none";

const ICON_MAP = {
  header: process,
  info: logIcon,
  success: check,
  progress: hourglass,
  checking: process,
  error: error,
  warning: warning,
};

export const getIcon = (type) => {
  const icon = ICON_MAP[type];

  if (!icon) return <span>•</span>;

  return <img src={icon} className={ICON_CLASSES} alt={type} />;
};
