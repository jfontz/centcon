/**
 * Authentication Context
 *
 * Manages authentication state with time-based session expiry.
 *
 * Session design:
 * - Duration: 8 hours from last login (mirrors JWT expiry on the backend)
 * - Storage: sessionStorage — clears automatically when the tab is closed,
 *   persists across refreshes within the same tab session
 * - Expiry check: on mount + every 60 seconds via interval
 * - No inactivity timeout — session runs for the full 8 hours regardless
 *
 * Stale session guard: both the expiry timestamp AND a token must be present
 * for isSessionValid() to return true. A pre-JWT session (expiry present but
 * no token) is treated as expired and cleared on mount.
 *
 * Provides:
 * - isAuthenticated: Whether the session is valid right now
 * - token: The JWT returned by /verify-pin (null when logged out)
 * - login(token) / logout: Explicit auth state changes
 * - configLoaded: Whether the backend connection was confirmed on mount
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const AuthContext = createContext(null);

const SESSION_KEY = "centcon_auth_expires";
const TOKEN_KEY = "centcon_auth_token";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours
const EXPIRY_CHECK_INTERVAL_MS = 60 * 1000; // check every 60 seconds

/**
 * A session is only valid when BOTH the expiry timestamp is in the future
 * AND a token is present. This prevents pre-JWT sessions (expiry stored but
 * no token) from being treated as authenticated after the JWT upgrade.
 */
const isSessionValid = () => {
  const expires = sessionStorage.getItem(SESSION_KEY);
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!expires || !token) return false;
  return Date.now() < parseInt(expires, 10);
};

const setSession = (token) => {
  const expires = Date.now() + SESSION_DURATION_MS;
  sessionStorage.setItem(SESSION_KEY, expires.toString());
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
};

const clearSession = () => {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
};

const getStoredToken = () => sessionStorage.getItem(TOKEN_KEY);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    isSessionValid(),
  );
  const [token, setToken] = useState(() =>
    isSessionValid() ? getStoredToken() : null,
  );
  // configLoaded signals that the initial session check is done and the app
  // can render. Previously this waited for /auth-config; now it resolves
  // immediately since PIN is always required and there is no remote config.
  const [configLoaded, setConfigLoaded] = useState(false);

  // Expire the session and redirect to login
  const logout = useCallback(() => {
    clearSession();
    setIsAuthenticated(false);
    setToken(null);
  }, []);

  // Periodic expiry check — catches tabs left open past the 8-hour window
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      if (!isSessionValid()) {
        logout();
      }
    }, EXPIRY_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isAuthenticated, logout]);

  // Mark config as loaded on mount — no remote fetch needed since PIN is
  // always required and there is no CENTCON_SHOW_LOGIN toggle.
  useEffect(() => {
    setConfigLoaded(true);
  }, []);

  /**
   * Call after a successful /verify-pin response.
   * @param {string} jwtToken - The token returned by the backend.
   */
  const login = (jwtToken) => {
    setSession(jwtToken);
    setToken(jwtToken);
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        login,
        logout,
        configLoaded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};