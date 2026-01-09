// src/App.jsx (or Dashboard.jsx)
import MainLayout from "./components/ui/MainLayout";
import SectionContainer from "./components/ui/SectionContainer";
import SystemControls from "./components/SystemControls";
import SystemStatus from "./components/SystemStatus";
import DeviceInformation from "./components/DeviceInformation";
import LogPanel from "./components/LogPanel";
import ConnectedDevices from "./components/ConnectedDevices";

function App() {
  return (
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

        {/* RIGHT COLUMN (Log) */}
        <div className="lg:col-span-4 h-full">
          <SectionContainer
            title="Log"
            className="h-full min-h-125 fixed top-0"
          >
            <LogPanel />
          </SectionContainer>
        </div>
      </div>
    </MainLayout>
  );
}

export default App;
