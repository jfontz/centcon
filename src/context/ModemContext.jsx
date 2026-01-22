import { createContext, useContext } from "react";
import { useModemData } from "../hooks/useModemData";

const ModemContext = createContext(null);

export const ModemProvider = ({ children, refreshInterval }) => {
  const modemState = useModemData(refreshInterval);

  return (
    <ModemContext.Provider value={modemState}>{children}</ModemContext.Provider>
  );
};

export const useModem = () => {
  const context = useContext(ModemContext);
  if (!context) {
    throw new Error("useModem must be used within ModemProvider");
  }
  return context;
};
