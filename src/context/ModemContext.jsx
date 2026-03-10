/**
 * Modem Context
 * Manages modem telemetry plus command state, logs, and available controls.
 * Uses frontend command config and backend SSE updates for command status.
 */

import { createContext, useContext, useState, useEffect } from "react";
import { useModemData } from "../hooks/useModemData";
import SYSTEM_COMMANDS from "../config/systemCommands";
import {
  connectToCommandEvents,
  triggerCommand as apiTriggerCommand,
} from "../services/commandApi";

const ModemContext = createContext(null);

const initialCommandState = {
  state: "IDLE",
  message: "",
  progress: 0,
  countdown: null,
  command: null,
};

const TERMINAL_COMMAND_STATES = ["FAILED", "ONLINE", "SUCCEEDED"];
const INITIAL_COMMAND_STATUS = {
  state: "IDLE",
  message: "",
  progress: 0,
  countdown: null,
  active: false,
};
const BACKEND_OFFLINE_MESSAGE =
  "Backend not running. Start the backend service to enable controls.";

export const ModemProvider = ({ children }) => {
  const [commandState, setCommandState] = useState(initialCommandState);
  const [commandLogs, setCommandLogs] = useState([]);
  const [commandStatuses, setCommandStatuses] = useState({});
  const [commandBackendOnline, setCommandBackendOnline] = useState(true);
  const [commandBackendError, setCommandBackendError] = useState("");
  const modemState = useModemData(commandState);

  const commands = SYSTEM_COMMANDS;

  const markBackendOnline = () => {
    setCommandBackendOnline(true);
    setCommandBackendError("");
  };

  const markBackendOffline = () => {
    setCommandBackendOnline(false);
    setCommandBackendError(BACKEND_OFFLINE_MESSAGE);
  };

  useEffect(() => {
    const eventSource = connectToCommandEvents(
      (event) => {
        markBackendOnline();
        const mergeCommandStatus = (commandId, partial) => {
          setCommandStatuses((prev) => ({
            ...prev,
            [commandId]: {
              ...(prev[commandId] || INITIAL_COMMAND_STATUS),
              ...partial,
            },
          }));
        };

        if (event.type === "state") {
          setCommandState((prev) => ({ ...prev, ...event }));
          if (event.command) {
            // Keep a per-command status map so button-disable rules do not depend
            // on whichever command most recently updated the shared SSE state.
            mergeCommandStatus(event.command, {
              state: event.state,
              message: event.message || "",
              progress: event.progress ?? 0,
              countdown: event.countdown ?? undefined,
              active: !TERMINAL_COMMAND_STATES.includes(event.state),
            });
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
            // Countdown events arrive separately from state events, so merge them
            // into the cached command status without resetting the rest of the entry.
            mergeCommandStatus(event.command, {
              countdown: event.countdown,
            });
          }
        }
      },
      {
        onOpen: markBackendOnline,
        onError: markBackendOffline,
      },
    );
    return () => eventSource.close();
  }, []);

  const triggerCommand = async (commandId) => {
    try {
      const res = await apiTriggerCommand(commandId);
      markBackendOnline();
      return res;
    } catch (error) {
      markBackendOffline();
      throw error;
    }
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
        commandBackendOnline,
        commandBackendError,
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
