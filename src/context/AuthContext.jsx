/**
 * Authentication Context
 *
 * Manages authentication state with time-based session expiry.
 *
 * Session design:
 * - Duration: 8 hours from last login
 * - Storage: sessionStorage — clears automatically when the tab is closed,
 *   persists across refreshes within the same tab session
 * - Expiry check: on mount + every 60 seconds via interval
 * - No inactivity timeout — session runs for the full 8 hours regardless
 *   of whether the user is active
 *
 * Provides:
 * - isAuthenticated: Whether the session is valid right now
 * - login / logout: Explicit auth state changes
 * - showLogin: Whether to display login UI (from backend config)
 * - configLoaded: Whether auth config has been fetched
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getAuthConfig } from "../services/authAPI";

const AuthContext = createContext(null);

const SESSION_KEY = "centcon_auth_expires";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours
const EXPIRY_CHECK_INTERVAL_MS = 60 * 1000; // check every 60 seconds

const isSessionValid = () => {
  const expires = sessionStorage.getItem(SESSION_KEY);
  if (!expires) return false;
  return Date.now() < parseInt(expires, 10);
};

const setSession = () => {
  const expires = Date.now() + SESSION_DURATION_MS;
  sessionStorage.setItem(SESSION_KEY, expires.toString());
};

const clearSession = () => {
  sessionStorage.removeItem(SESSION_KEY);
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    isSessionValid(),
  );
  const [showLogin, setShowLogin] = useState(true);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Expire the session and redirect to login
  const logout = useCallback(() => {
    clearSession();
    setIsAuthenticated(false);
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

  // Fetch auth config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getAuthConfig();
        setShowLogin(config.showLogin);

        // If login is disabled by backend config, bypass auth entirely
        if (!config.showLogin) {
          setSession();
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Failed to load auth config:", error);
        setShowLogin(true);
      } finally {
        setConfigLoaded(true);
      }
    };

    loadConfig();
  }, []);

  const login = () => {
    setSession();
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        showLogin,
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
