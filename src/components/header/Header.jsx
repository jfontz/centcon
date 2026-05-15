import { refreshData, logout, lightMode, darkMode } from "../../assets/icons";
import MetaInfo from "./MetaInfo";
import HeaderButton from "./HeaderButton";
import StatusBadge from "./StatusBadge";
import { useRouter } from "../../context/RouterContext";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";

const REBOOT_BUSY_STATES = [
  "LOGGING_IN",
  "NAVIGATING",
  "REBOOTING",
  "WAITING",
  "CHECKING_CONNECTION",
];

const Header = () => {
  const { status, refresh, refreshing, lastUpdated, rebootState } = useRouter();
  const { logout: handleLogout, showLogin } = useAuth();
  const { theme, toggle } = useTheme();

  const isRebooting =
    rebootState &&
    rebootState.command === "reboot" &&
    REBOOT_BUSY_STATES.includes(rebootState.state);

  // Change header background to red on system error or LOS
  const headerBg = ["error", "los", "wan_error"].includes(status)
    ? "bg-[rgba(196,73,85,0.1)] dark:bg-red-500/5"
    : "bg-[rgba(245,243,237,0.92)] dark:bg-transparent";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b border-[#cec8bc] dark:border-white/10 backdrop-blur-md transition-colors duration-300 ${headerBg}`}
    >
      <div className="max-w-450 mx-auto px-6 py-3 sm:h-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        {/* Left: Branding & Meta Info */}
        <div className="flex items-center gap-3 sm:gap-6 justify-center sm:justify-start">
          <h1 className="text-base sm:text-xl font-light tracking-[0.2em] text-[#1a1a1a] dark:text-white">
            CENTCON
          </h1>
          <div className="h-4 w-px bg-[#cec8bc] dark:bg-white/10 hidden md:block"></div>
          <MetaInfo
            className="hidden lg:flex items-center gap-3 text-xs tracking-wider font-medium text-[#666660] dark:text-zinc-400 opacity-60"
            lastUpdated={lastUpdated}
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto">
          <StatusBadge status={status} rebootState={rebootState} />

          <HeaderButton
            icon={theme === "dark" ? lightMode : darkMode}
            label={theme === "dark" ? "Light" : "Dark"}
            variant="logout"
            onClick={toggle}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          />

          <HeaderButton
            icon={refreshData}
            label="Refresh"
            rotate={refreshing}
            variant="refresh"
            onClick={refresh}
            disabled={isRebooting || refreshing}
            title={isRebooting ? "Cannot refresh while rebooting" : "Refresh status"}
          />

          {/* Only show logout button if login is enabled */}
          {showLogin && (
            <HeaderButton
              icon={logout}
              label="Logout"
              variant="logout"
              onClick={handleLogout}
            />
          )}
        </div>
      </div>

      {/* Mobile Meta Info Bar */}
      <MetaInfo
        className="lg:hidden border-t border-[#cec8bc] dark:border-white/10 bg-[rgba(245,243,237,0.86)] dark:bg-black/60 max-w-450 mx-auto px-3 py-2 flex items-center justify-center gap-3 text-[10px] tracking-wider font-medium text-[#666660] dark:text-zinc-400 opacity-60"
        lastUpdated={lastUpdated}
      />
    </header>
  );
};

export default Header;
