import { createContext, useContext, useState, useEffect } from "react";
import { getAuthConfig } from "../services/authAPI";

const AuthContext = createContext(null);

const AUTH_KEY = "centcon_authenticated";

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check localStorage on mount
    return localStorage.getItem(AUTH_KEY) === "true";
  });
  
  const [showLogin, setShowLogin] = useState(true);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Fetch auth config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getAuthConfig();
        setShowLogin(config.showLogin);
        
        // If login is disabled, auto-authenticate
        if (!config.showLogin) {
          setIsAuthenticated(true);
          localStorage.setItem(AUTH_KEY, "true");
        }
      } catch (error) {
        console.error("Failed to load auth config:", error);
        // Default to showing login on error
        setShowLogin(true);
      } finally {
        setConfigLoaded(true);
      }
    };
    
    loadConfig();
  }, []);

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem(AUTH_KEY, "true");
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_KEY);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        login, 
        logout, 
        showLogin,
        configLoaded 
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
