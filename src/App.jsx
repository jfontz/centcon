import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MainLayout from "./components/ui/MainLayout";
import SystemControls from "./components/SystemControls";
import SystemStatus from "./components/SystemStatus";
import DeviceInformation from "./components/DeviceInformation";
import LogPanel from "./components/LogPanel";
import ConnectedDevices from "./components/ConnectedDevices";
import { RouterProvider } from "./context/RouterContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Setup from "./pages/Setup";
import { checkSetupNeeded } from "./services/setupAPI";

function Dashboard() {
  return (
    <RouterProvider>
      <MainLayout>
        {/* The Main Grid 
         - On Mobile: 1 column
         - On Desktop (lg): 12 columns. 
           Left side takes 7 or 8 columns. Right side takes the rest.
      */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* LEFT COLUMN (Controls + Status) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Top: System Controls */}
            <SystemControls />

            {/* Log panel appears 2nd in order in mobile */}
            <div className="lg:hidden">
              <LogPanel />
            </div>

            <div className="flex flex-col lg:flex-row w-full gap-5 items-stretch">
              <div className="flex-2">
                <SystemStatus />
              </div>

              <div className="flex-1">
                <DeviceInformation />
              </div>
            </div>

            {/* Bottom: Connected Devices */}
            <ConnectedDevices />
          </div>

          {/* RIGHT COLUMN (Log) - visible on desktop only  */}
          <div className="hidden lg:flex lg:col-span-4 h-full flex-col">
            <LogPanel />
          </div>
        </motion.div>
      </MainLayout>
    </RouterProvider>
  );
}

function AppContent() {
  const { isAuthenticated, configLoaded } = useAuth();
  const [setupData, setSetupData] = useState(null);
  const [setupChecked, setSetupChecked] = useState(false);

  // Check if setup is needed on mount
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const data = await checkSetupNeeded();
        if (data.setupRequired) {
          setSetupData(data);
        }
      } catch (error) {
        console.error("Setup check failed:", error);
      } finally {
        setSetupChecked(true);
      }
    };
    
    checkSetup();
  }, []);

  // Handle setup completion
  const handleSetupComplete = () => {
    setSetupData(null);
    window.location.reload(); // Reload to apply new config
  };

  // Show loading while checking setup and config
  if (!setupChecked || !configLoaded) {
    return (
      <div className="min-h-screen bg-[#e9e6df] dark:bg-black flex items-center justify-center">
        <div className="text-[#24241f] dark:text-white text-lg">Loading...</div>
      </div>
    );
  }

  // If setup is needed, show setup wizard
  if (setupData) {
    return <Setup setupData={setupData} onComplete={handleSetupComplete} />;
  }

  return (
    <AnimatePresence mode="wait">
      {isAuthenticated ? <Dashboard key="dashboard" /> : <Login key="login" />}
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
