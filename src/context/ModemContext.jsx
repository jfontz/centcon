import { createContext, useContext, useState, useEffect } from "react";
import { useModemData } from "../hooks/useModemData";
import {
  connectToRebootEvents,
  triggerReboot as apiTriggerReboot,
  triggerLogin as apiTriggerLogin,
} from "../services/modemAPI";

const ModemContext = createContext(null);

const initialRebootState = {
  state: "IDLE",
  message: "",
  progress: 0,
  countdown: null,
};

export const ModemProvider = ({ children, refreshInterval }) => {
  const [rebootState, setRebootState] = useState(initialRebootState);
  const [rebootLogs, setRebootLogs] = useState([]);
  const modemState = useModemData(refreshInterval, rebootState);

  useEffect(() => {
    const eventSource = connectToRebootEvents((event) => {
      if (event.type === "state") {
        setRebootState((prev) => ({ ...prev, ...event }));
      }
      if (event.type === "log") {
        const timestamp = event.timestamp || new Date().toISOString();
        setRebootLogs((prev) => [
          ...prev,
          { ...event, id: `reboot-${timestamp}-${prev.length}`, timestamp },
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
    // Do not clear logs automatically; they should persist across reboots.
    return res;
  };

  const triggerLogin = async () => {
    const res = await apiTriggerLogin();
    return res;
  };

  const clearRebootLogs = () => setRebootLogs([]);

  return (
    <ModemContext.Provider
      value={{
        ...modemState,
        rebootState,
        rebootLogs,
        triggerReboot,
        triggerLogin,
        clearRebootLogs,
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
