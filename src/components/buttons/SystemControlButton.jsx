import { useEffect, useState } from "react";
import RebootConfirmModal from "../modals/RebootConfirmModal";

const ACTIVE_COMMAND_STATES = [
  "RUNNING",
  "LOGGING_IN",
  "NAVIGATING",
  "REBOOTING",
  "WAITING",
  "CHECKING_CONNECTION",
];

const SystemControlButton = ({
  command,
  icon,
  commandState,
  commandStatuses,
  commands,
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
    const pendingCommand = commands.find((candidate) => candidate.id === commandId);
    return pendingCommand?.blocksOthers;
  });
  const activeCommandIds = Object.entries(commandStatuses || {})
    .filter(([, value]) => value?.active)
    .map(([commandId]) => commandId);
  const activeBlockingCommandId = activeCommandIds.find((commandId) => {
    const activeCommand = commands.find((candidate) => candidate.id === commandId);
    return activeCommand?.blocksOthers;
  });
  const blockingCommandId = pendingBlockingCommandId || activeBlockingCommandId;
  const anotherBlockingCommandIsActive =
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
  const disabled =
    anotherBlockingCommandIsActive || disallowedWhileBusy || selfDisabled;

  useEffect(() => {
    setPendingCommandIds((prev) =>
      prev.filter((commandId) => {
        const currentStatus = commandStatuses?.[commandId];
        return !currentStatus || currentStatus.active;
      }),
    );
  }, [commandStatuses, setPendingCommandIds]);

  const overlayText = (() => {
    if (!isActiveCommand) {
      return null;
    }

    if (isReboot) {
      if (commandState.state === "WAITING" && commandState.countdown != null) {
        return `Rebooting... ${commandState.countdown}s`;
      }
      if (commandState.state === "CHECKING_CONNECTION") {
        return "Checking connection...";
      }
      return "Rebooting...";
    }

    if (commandState.state === "RUNNING") return "Opening browser...";
    if (commandState.state === "LOGGING_IN") return "Logging in...";
    if (commandState.state === "NAVIGATING") return "Navigating...";

    return commandState.message || "Working...";
  })();

  const handleTrigger = async () => {
    setPendingCommandIds?.((prev) =>
      prev.includes(command.id) ? prev : [...prev, command.id],
    );
    try {
      const res = await onTrigger?.(command.id);
      if (!res?.ok) {
        setPendingCommandIds?.((prev) =>
          prev.filter((commandId) => commandId !== command.id),
        );
      }
    } catch {
      setPendingCommandIds?.((prev) =>
        prev.filter((commandId) => commandId !== command.id),
      );
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
