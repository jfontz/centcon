import MainLayout from "./components/ui/MainLayout";
import SystemControls from "./components/SystemControls";
import SystemStatus from "./components/SystemStatus";
import DeviceInformation from "./components/DeviceInformation";
import LogPanel from "./components/LogPanel";
import ConnectedDevices from "./components/ConnectedDevices";
import { ModemProvider } from "./context/ModemContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";

function Dashboard() {
  return (
    <ModemProvider>
      <MainLayout>
        {/* The Main Grid 
         - On Mobile: 1 column
         - On Desktop (lg): 12 columns. 
           Left side takes 7 or 8 columns. Right side takes the rest.
      */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
          <div className="hidden lg:flex lg:col-span-4 h-full flex-col min-h-">
            <LogPanel />
          </div>
        </div>
      </MainLayout>
    </ModemProvider>
  );
}

function AppContent() {
  const { isAuthenticated, showLogin, configLoaded } = useAuth();

  // Show loading while fetching config
  if (!configLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // If login is disabled OR user is authenticated, show dashboard
  if (!showLogin || isAuthenticated) {
    return <Dashboard />;
  }

  // Otherwise show login page
  return <Login />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
