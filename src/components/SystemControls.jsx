import { useEffect, useState } from "react";
import * as icons from "../assets/icons";
import { useModem } from "../context/ModemContext";
import SystemControlButton from "./buttons/SystemControlButton";
import SectionContainer from "./ui/SectionContainer";

const SystemControls = () => {
  const { commands, commandState, commandStatuses, triggerCommand } = useModem();
  const [pendingCommandIds, setPendingCommandIds] = useState([]);

  useEffect(() => {
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
          {commands.map((command) => (
            <SystemControlButton
              key={command.id}
              command={command}
              icon={icons[command.icon]}
              commandState={commandState}
              commandStatuses={commandStatuses}
              commands={commands}
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
