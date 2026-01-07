// src/App.jsx (or Dashboard.jsx)
import MainLayout from "./components/ui/MainLayout";
import SectionContainer from "./components/ui/SectionContainer";
import SystemControls from "./components/SystemControls";
import SystemStatus from "./components/SystemStatus";
import DeviceInformation from "./components/DeviceInformation";

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

          <div className="flex w-full gap-5">
            {/* Middle: System Status (Grid inside a Grid) */}
            <SystemStatus />
            <DeviceInformation />
          </div>

          {/* Bottom: Connected Devices */}
          <SectionContainer title="Connected Devices">
            {/* Device cards go here */}
          </SectionContainer>
        </div>

        {/* RIGHT COLUMN (Log) */}
        <div className="lg:col-span-4 h-full">
          <SectionContainer title="Log" className="h-full min-h-[500px]">
            {/* ConsoleLog component goes here */}
          </SectionContainer>
        </div>
      </div>
    </MainLayout>
  );
}

export default App;
