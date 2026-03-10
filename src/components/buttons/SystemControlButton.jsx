import { useState } from "react";
import RebootConfirmModal from "../modals/RebootConfirmModal";

const ACTIVE_COMMAND_STATES = [
  "RUNNING",
  "LOGGING_IN",
  "NAVIGATING",
  "REBOOTING",
  "WAITING",
  "CHECKING_CONNECTION",
];

const OVERLAY_TEXT = {
  RUNNING: "Opening browser...",
  LOGGING_IN: "Logging in...",
  NAVIGATING: "Navigating...",
  CHECKING_CONNECTION: "Checking connection...",
  REBOOTING: "Rebooting...",
  WORKING: "Working...",
};

const getCommandById = (commands, commandId) =>
  commands.find((candidate) => candidate.id === commandId);

const getOverlayText = ({ command, commandState, isActiveCommand }) => {
  if (!isActiveCommand) {
    return null;
  }

  if (command.id === "reboot") {
    if (commandState.state === "WAITING" && commandState.countdown != null) {
      return `${OVERLAY_TEXT.REBOOTING} ${commandState.countdown}s`;
    }
    if (commandState.state === "CHECKING_CONNECTION") {
      return OVERLAY_TEXT.CHECKING_CONNECTION;
    }
    return OVERLAY_TEXT.REBOOTING;
  }

  return (
    OVERLAY_TEXT[commandState.state] ||
    commandState.message ||
    OVERLAY_TEXT.WORKING
  );
};

const SystemControlButton = ({
  command,
  icon,
  commandState,
  commandStatuses,
  commands,
  backendOnline = true,
  backendError,
  onTrigger,
  pendingCommandIds,
  setPendingCommandIds,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isReboot = command.id === "reboot";
  const status = commandStatuses?.[command.id];
  const isActiveCommand =
    commandState?.command === command.id &&
    ACTIVE_COMMAND_STATES.includes(commandState.state);
  const isSelfPending = pendingCommandIds.includes(command.id);
  // Pending commands must participate in the lock rules immediately, before
  // the backend emits its first SSE state update.
  const pendingBlockingCommandId = pendingCommandIds.find((commandId) => {
    const pendingCommand = getCommandById(commands, commandId);
    return pendingCommand?.blocksOthers;
  });
  const activeCommandIds = Object.entries(commandStatuses || {})
    .filter(([, value]) => value?.active)
    .map(([commandId]) => commandId);
  const activeBlockingCommandId = activeCommandIds.find((commandId) => {
    const activeCommand = getCommandById(commands, commandId);
    return activeCommand?.blocksOthers;
  });
  const blockingCommandId = pendingBlockingCommandId || activeBlockingCommandId;
  const anotherBlockingCommandExists =
    blockingCommandId != null && blockingCommandId !== command.id;
  const otherPendingCommandIds = pendingCommandIds.filter(
    (commandId) => commandId !== command.id,
  );
  const anotherCommandIsActive =
    activeCommandIds.some((commandId) => commandId !== command.id) ||
    otherPendingCommandIds.length > 0;
  const disallowedWhileBusy =
    anotherCommandIsActive && command.allowWhileBusy === false;
  // disableSelf covers the common UX case where a button should lock itself
  // as soon as it is clicked, even if it does not block other commands.
  const selfDisabled =
    command.disableSelf &&
    (isSelfPending || status?.active || isActiveCommand);
  const backendDisabled = backendOnline === false;
  const disabled =
    backendDisabled ||
    anotherBlockingCommandExists ||
    disallowedWhileBusy ||
    selfDisabled;
  const overlayText = getOverlayText({ command, commandState, isActiveCommand });
  const disabledTitle = backendDisabled
    ? backendError || "Command backend offline."
    : undefined;

  const removePendingCommand = () => {
    setPendingCommandIds?.((prev) =>
      prev.filter((commandId) => commandId !== command.id),
    );
  };

  const handleTrigger = async () => {
    setPendingCommandIds?.((prev) =>
      prev.includes(command.id) ? prev : [...prev, command.id],
    );
    try {
      const res = await onTrigger?.(command.id);
      if (!res?.ok) {
        removePendingCommand();
      }
    } catch {
      removePendingCommand();
    }
  };

  const handleClick = () => {
    if (command.confirm) {
      if (!disabled) setShowConfirmModal(true);
      return;
    }

    if (!disabled) {
      handleTrigger();
    }
  };

  const handleConfirm = async () => {
    setShowConfirmModal(false);
    await handleTrigger();
  };

  return (
    <>
      <button
        className={`${command.buttonClass} disabled:opacity-60 disabled:cursor-not-allowed`}
        onClick={handleClick}
        disabled={disabled}
        type="button"
        aria-label={command.label}
        title={disabledTitle}
      >
        <img
          src={icon}
          alt={command.label}
          className="w-4.5 h-4.5 pointer-events-none select-none"
        />
        <p>{overlayText != null ? overlayText : command.label}</p>
      </button>
      <RebootConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
};

export default SystemControlButton;
