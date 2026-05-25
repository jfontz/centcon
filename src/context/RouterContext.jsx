/**
 * Router Context
 * Manages router telemetry plus command state, logs, and available controls.
 *
 * Auth error handling:
 * - 401 responses from the backend mean the token is missing or expired.
 *   These are treated as "log out and re-authenticate," not "backend offline."
 *   handleAuthError() calls logout() which returns the user to the login screen.
 * - Non-auth connectivity failures continue to use the debounced offline path.
 *
 * SSE disconnect debounce:
 * - When Selenium closes Chrome, the SSE connection drops briefly (1–3s).
 *   Without debouncing this marks the backend as offline before reconnect.
 *   A 4-second timer absorbs transient blips; persistent failures still trigger.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { useRouterData } from "../hooks/useRouterData";
import {
  connectToCommandEvents,
  fetchCommands,
  triggerCommand as apiTriggerCommand,
} from "../services/commandApi";
import { BACKEND_URL } from "../services/apiConfig";

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
  const { token, logout } = useAuth();

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
      const commandDef = commands.find((c) => c.id === activeCommandId);
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

  /**
   * Call when a request returns 401. Logs the user out immediately so they
   * see the login screen rather than a confusing "backend offline" message.
   * The token is invalid or expired — re-authentication is the correct path.
   */
  const handleAuthError = useCallback(() => {
    logout();
  }, [logout]);

  useEffect(() => {
    return () => {
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
    };
  }, []);

  // Fetch command list whenever the backend comes online or the token changes.
  useEffect(() => {
    let cancelled = false;
    if (!commandBackendOnline || !token) return;

    const loadCommands = async () => {
      try {
        const list = await fetchCommands(token);
        if (!cancelled) setCommands(list);
      } catch (error) {
        if (error?.status === 401) {
          handleAuthError();
        } else if (!cancelled) {
          setCommands([]);
        }
      }
    };

    loadCommands();
    return () => {
      cancelled = true;
    };
  }, [commandBackendOnline, token, handleAuthError]);

  useEffect(() => {
    if (!token) return;

    let eventSource = null;
    let cancelled = false;

    const openStream = async () => {
      // Probe /state with a normal fetch before opening the EventSource.
      // This lets us detect a 401 (expired/invalid token) as a real HTTP
      // response and call handleAuthError() immediately. EventSource swallows
      // HTTP error codes as generic onerror events, so without this probe a
      // 401 on /events would only trip the offline debounce and show the wrong
      // message to the user.
      try {
        const probe = await fetch(`${BACKEND_URL}/state`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (probe.status === 401) {
          if (!cancelled) handleAuthError();
          return;
        }
      } catch {
        // Network error on the probe — fall through and let EventSource
        // handle connectivity via the normal offline debounce path.
      }

      if (cancelled) return;

      eventSource = connectToCommandEvents(
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
              { ...event, id: crypto.randomUUID(), timestamp },
            ]);
          }
          if (event.type === "countdown") {
            setCommandState((prev) => ({
              ...prev,
              countdown: event.countdown,
            }));
            if (event.command) {
              mergeCommandStatus(event.command, { countdown: event.countdown });
            }
          }
        },
        {
          onOpen: markBackendOnline,
          // Post-probe SSE errors are transient connectivity issues (e.g. Selenium
          // closing Chrome briefly drops the connection). Use the debounced offline
          // path — auth was already confirmed above by the probe.
          onError: scheduleMarkBackendOffline,
          token,
        },
      );
    };

    openStream();

    return () => {
      cancelled = true;
      eventSource?.close();
    };
  }, [token, handleAuthError]);

  const triggerCommand = async (commandId) => {
    try {
      const res = await apiTriggerCommand(commandId, token);
      markBackendOnline();
      return res;
    } catch (error) {
      if (error?.status === 401) {
        handleAuthError();
      } else {
        scheduleMarkBackendOffline();
      }
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
