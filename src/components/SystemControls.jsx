import { useEffect, useState } from "react";
import * as icons from "../assets/icons";
import { useModem } from "../context/ModemContext";
import SystemControlButton from "./buttons/SystemControlButton";
import SectionContainer from "./ui/SectionContainer";

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

  useEffect(() => {
    // Keep pending ids only until the backend has marked that command terminal.
    setPendingCommandIds((prev) =>
      prev.filter((commandId) => {
        const status = commandStatuses[commandId];
        return !status || status.active;
      }),
    );
  }, [commandStatuses]);

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
              onTrigger={triggerCommand}
            />
          ))}
        </div>
      </SectionContainer>
    </div>
  );
};

export default SystemControls;
