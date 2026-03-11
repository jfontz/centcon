import { useEffect, useState } from "react";
import * as icons from "../assets/icons";
import { useModem } from "../context/ModemContext";
import SystemControlButton from "./buttons/SystemControlButton";
import SectionContainer from "./ui/SectionContainer";
import WiFiCredentialModal from "./modals/WifiCredentialModal";

const SystemControls = () => {
  const {
    commands,
    commandState,
    commandStatuses,
    triggerCommand,
    commandBackendOnline,
    commandBackendError,
  } = useModem();
  const [pendingCommandIds, setPendingCommandIds] = useState([]);
  const [wifiModalOpen, setWifiModalOpen] = useState(false);

  useEffect(() => {
    setPendingCommandIds((prev) =>
      prev.filter((commandId) => {
        const status = commandStatuses[commandId];
        return !status || status.active;
      }),
    );
  }, [commandStatuses]);

  const handleTrigger = (commandId) => {
    if (commandId === "wifi-credentials") {
      setWifiModalOpen(true);
      return { ok: true };
    }
    return triggerCommand(commandId);
  };

  return (
    <div className="bg-black text-white text-sm">
      <SectionContainer title="System Controls" className="flex">
        <div className="flex flex-col gap-4">
          {!commandBackendOnline && (
            <p className="text-[11px] text-amber-400">
              {commandBackendError ||
                "Backend not running. Start the backend service to enable controls."}
            </p>
          )}
          {commands.map((command) => (
            <SystemControlButton
              key={command.id}
              command={command}
              icon={icons[command.icon]}
              commandState={commandState}
              commandStatuses={commandStatuses}
              commands={commands}
              backendOnline={commandBackendOnline}
              backendError={commandBackendError}
              pendingCommandIds={pendingCommandIds}
              setPendingCommandIds={setPendingCommandIds}
              onTrigger={handleTrigger}
            />
          ))}
        </div>
      </SectionContainer>

      <WiFiCredentialModal
        open={wifiModalOpen}
        onClose={() => {
          setWifiModalOpen(false);
          setPendingCommandIds((prev) =>
            prev.filter((id) => id !== "wifi-credentials"),
          );
        }}
      />
    </div>
  );
};

export default SystemControls;
