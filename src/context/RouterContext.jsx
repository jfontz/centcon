/**
 * Router Context
 * Manages router telemetry plus command state, logs, and available controls.
 * Uses frontend command config and backend SSE updates for command status.
 */

import { createContext, useContext, useState, useEffect } from "react";
import { useRouterData } from "../hooks/useRouterData";
import {
  connectToCommandEvents,
  fetchCommands,
  triggerCommand as apiTriggerCommand,
} from "../services/commandApi";

const RouterContext = createContext(null);

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

export const RouterProvider = ({ children }) => {
  const [commandState, setCommandState] = useState(initialCommandState);
  const [commandLogs, setCommandLogs] = useState([]);
  const [commandStatuses, setCommandStatuses] = useState({});
  const [commandBackendOnline, setCommandBackendOnline] = useState(true);
  const [commandBackendError, setCommandBackendError] = useState("");
  const [commands, setCommands] = useState([]);
  const routerState = useRouterData(commandState);

  const markBackendOnline = () => {
    setCommandBackendOnline(true);
    setCommandBackendError("");
  };

  const markBackendOffline = () => {
    setCommandBackendOnline(false);
    setCommandBackendError(BACKEND_OFFLINE_MESSAGE);
  };

  useEffect(() => {
    let cancelled = false;
    if (!commandBackendOnline) return;

    const loadCommands = async () => {
      try {
        const list = await fetchCommands();
        if (!cancelled) setCommands(list);
      } catch {
        if (!cancelled) setCommands([]);
      }
    };

    loadCommands();

    return () => {
      cancelled = true;
    };
  }, [commandBackendOnline]);

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
              id: crypto.randomUUID(),
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
    <RouterContext.Provider
      value={{
        ...routerState,
        refreshing: routerState.refreshing,
        commands,
        commandState,
        commandStatuses,
        commandLogs,
        commandBackendOnline,
        commandBackendError,
        triggerCommand,
        clearCommandLogs,
        rebootState: commandState,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useRouter must be used within RouterProvider");
  }
  return context;
};
