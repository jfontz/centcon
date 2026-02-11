import { createContext, useContext, useState, useEffect } from "react";
import { useModemData } from "../hooks/useModemData";
import { connectToRebootEvents, triggerReboot as apiTriggerReboot } from "../services/modemAPI";

const ModemContext = createContext(null);

const initialRebootState = {
  state: "IDLE",
  message: "",
  progress: 0,
  countdown: null,
};

export const ModemProvider = ({ children, refreshInterval }) => {
  const modemState = useModemData(refreshInterval);
  const [rebootState, setRebootState] = useState(initialRebootState);
  const [rebootLogs, setRebootLogs] = useState([]);

  useEffect(() => {
    const eventSource = connectToRebootEvents((event) => {
      if (event.type === "state") {
        setRebootState((prev) => ({ ...prev, ...event }));
      }
      if (event.type === "log") {
        setRebootLogs((prev) => [
          ...prev,
          { ...event, id: `reboot-${Date.now()}-${prev.length}`, timestamp: new Date().toISOString() },
        ]);
      }
      if (event.type === "countdown") {
        setRebootState((prev) => ({ ...prev, countdown: event.countdown }));
      }
    });
    return () => eventSource.close();
  }, []);

  const triggerReboot = async () => {
    const res = await apiTriggerReboot();
    if (res?.ok) {
      setRebootLogs([]);
    }
    return res;
  };

  return (
    <ModemContext.Provider
      value={{
        ...modemState,
        rebootState,
        rebootLogs,
        triggerReboot,
      }}
    >
      {children}
    </ModemContext.Provider>
  );
};

export const useModem = () => {
  const context = useContext(ModemContext);
  if (!context) {
    throw new Error("useModem must be used within ModemProvider");
  }
  return context;
};
