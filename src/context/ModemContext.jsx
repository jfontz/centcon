/**
 * Modem Context
 * Manages modem state including real-time data, reboot state, and logs.
 * Integrates with the backend API for device control and server-sent events for status updates.
 * 
 * Provides:
 * - Modem data (wireless, device, optical, WAN, connected devices)
 * - Reboot state and logs with real-time streaming
 * - Methods to trigger reboot/login operations
 * - Status tracking and error handling
 */

import { createContext, useContext, useState, useEffect } from "react";
import { useModemData } from "../hooks/useModemData";
import {
  connectToRebootEvents,
  fetchCommands as apiFetchCommands,
  triggerCommand as apiTriggerCommand,
} from "../services/modemAPI";

const ModemContext = createContext(null);

const initialCommandState = {
  state: "IDLE",
  message: "",
  progress: 0,
  countdown: null,
  command: null,
};

const TERMINAL_COMMAND_STATES = ["FAILED", "ONLINE", "SUCCEEDED"];

export const ModemProvider = ({ children }) => {
  const [commandState, setCommandState] = useState(initialCommandState);
  const [commandLogs, setCommandLogs] = useState([]);
  const [commands, setCommands] = useState([]);
  const [commandStatuses, setCommandStatuses] = useState({});
  const modemState = useModemData(commandState);

  useEffect(() => {
    const loadCommands = async () => {
      try {
        const availableCommands = await apiFetchCommands();
        setCommands(availableCommands);
      } catch (error) {
        console.error("Failed to load commands:", error);
      }
    };

    loadCommands();
  }, []);

  useEffect(() => {
    const eventSource = connectToRebootEvents((event) => {
      if (event.type === "state") {
        setCommandState((prev) => ({ ...prev, ...event }));
        if (event.command) {
          setCommandStatuses((prev) => ({
            ...prev,
            [event.command]: {
              state: event.state,
              message: event.message || "",
              progress: event.progress ?? 0,
              countdown:
                event.countdown ?? prev[event.command]?.countdown ?? null,
              active: !TERMINAL_COMMAND_STATES.includes(event.state),
            },
          }));
        }
      }
      if (event.type === "log") {
        const timestamp = event.timestamp || new Date().toISOString();
        setCommandLogs((prev) => [
          ...prev,
          {
            ...event,
            id: `${event.command || "system"}-${timestamp}-${prev.length}`,
            timestamp,
          },
        ]);
      }
      if (event.type === "countdown") {
        setCommandState((prev) => ({ ...prev, countdown: event.countdown }));
        if (event.command) {
          setCommandStatuses((prev) => ({
            ...prev,
            [event.command]: {
              ...(prev[event.command] || {
                state: "IDLE",
                message: "",
                progress: 0,
                countdown: null,
                active: false,
              }),
              countdown: event.countdown,
            },
          }));
        }
      }
    });
    return () => eventSource.close();
  }, []);

  const triggerCommand = async (commandId) => {
    const res = await apiTriggerCommand(commandId);
    return res;
  };

  const clearCommandLogs = () => setCommandLogs([]);

  return (
    <ModemContext.Provider
      value={{
        ...modemState,
        commands,
        commandState,
        commandStatuses,
        commandLogs,
        triggerCommand,
        clearCommandLogs,
        rebootState: commandState,
        rebootLogs: commandLogs,
        clearRebootLogs: clearCommandLogs,
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
