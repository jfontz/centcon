/**
 * Router Context
 * Manages router telemetry plus command state, logs, and available controls.
 * Uses frontend command config and backend SSE updates for command status.
 *
 * All command API calls and the SSE connection now carry the JWT issued after
 * PIN verification. The token is read from AuthContext and is available for the
 * full 8-hour session.
 *
 * Fix: transient SSE disconnect false-offline race condition
 * -----------------------------------------------------------
 * When Selenium closes Chrome, the SSE connection drops briefly (1–3s) and
 * onError fires immediately. Without debouncing, this marks the backend as
 * offline before the SSE reconnects, blocking valid commands and showing a
 * misleading error message.
 *
 * Fix: instead of marking offline instantly on onError, we start a 4-second
 * timer. If onOpen fires before the timer expires the blip was transient and
 * we cancel the timer. Only if the error persists past 4 seconds do we mark
 * the backend as truly offline. 4s sits comfortably above the 1–3s reconnect
 * window so legitimate outages are still caught promptly.
 */

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
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
  countdown: null,
  command: null,
};

const TERMINAL_COMMAND_STATES = ["FAILED", "ONLINE", "SUCCEEDED"];
const INITIAL_COMMAND_STATUS = {
  state: "IDLE",
  message: "",
  countdown: null,
  active: false,
};
const BACKEND_OFFLINE_MESSAGE =
  "Backend not running. Start the backend service to enable controls.";

// Grace period before a transient SSE error is treated as a real outage.
// Must be longer than the typical SSE reconnect window (1–3s).
const OFFLINE_DEBOUNCE_MS = 4000;

export const RouterProvider = ({ children }) => {
  const { token } = useAuth();

  const [commandState, setCommandState] = useState(initialCommandState);
  const [commandLogs, setCommandLogs] = useState([]);
  const [commandStatuses, setCommandStatuses] = useState({});
  const [commandBackendOnline, setCommandBackendOnline] = useState(true);
  const [commandBackendError, setCommandBackendError] = useState("");
  const [commands, setCommands] = useState([]);

  const refreshPaused = (() => {
    const activeCommandId = commandState?.command;
    const isTerminal = ["FAILED", "ONLINE", "SUCCEEDED", "IDLE"].includes(
      commandState?.state,
    );

    if (activeCommandId && !isTerminal) {
      const commandDef = commands.find(
        (command) => command.id === activeCommandId,
      );
      if (commandDef?.pausesRefresh) return true;
    }

    if (commandStatuses["wifi-credentials"]?.active) return true;

    return false;
  })();

  // Timer ref for debounced offline detection, cancelled if SSE reconnects
  // before the grace period expires.
  const offlineTimerRef = useRef(null);

  const routerState = useRouterData({ commandState, refreshPaused });

  const markBackendOnline = () => {
    if (offlineTimerRef.current) {
      clearTimeout(offlineTimerRef.current);
      offlineTimerRef.current = null;
    }
    setCommandBackendOnline(true);
    setCommandBackendError("");
  };

  const scheduleMarkBackendOffline = () => {
    if (offlineTimerRef.current) return;

    offlineTimerRef.current = setTimeout(() => {
      offlineTimerRef.current = null;
      setCommandBackendOnline(false);
      setCommandBackendError(BACKEND_OFFLINE_MESSAGE);
    }, OFFLINE_DEBOUNCE_MS);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
    };
  }, []);

  // Fetch command list whenever the backend comes online or the token changes.
  useEffect(() => {
    let cancelled = false;
    if (!commandBackendOnline) return;

    const loadCommands = async () => {
      try {
        const list = await fetchCommands(token);
        if (!cancelled) setCommands(list);
      } catch {
        if (!cancelled) setCommands([]);
      }
    };

    loadCommands();

    return () => {
      cancelled = true;
    };
  }, [commandBackendOnline, token]);

  // Open SSE connection. Re-opens automatically if the token changes (e.g. after
  // re-login in the same tab), though in practice the token lasts 8 hours.
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
            mergeCommandStatus(event.command, {
              state: event.state,
              message: event.message || "",
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
            mergeCommandStatus(event.command, {
              countdown: event.countdown,
            });
          }
        }
      },
      {
        onOpen: markBackendOnline,
        onError: scheduleMarkBackendOffline,
        token,
      },
    );

    return () => eventSource.close();
    // Re-open the SSE connection if the token changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const triggerCommand = async (commandId) => {
    try {
      const res = await apiTriggerCommand(commandId, token);
      markBackendOnline();
      return res;
    } catch (error) {
      scheduleMarkBackendOffline();
      throw error;
    }
  };

  const clearCommandLogs = () => setCommandLogs([]);

  return (
    <RouterContext.Provider
      value={{
        ...routerState,
        refreshing: routerState.refreshing,
        refreshPaused,
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
