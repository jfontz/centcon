import { refreshData, logout } from "../../assets/icons";
import MetaInfo from "./MetaInfo";
import HeaderButton from "./HeaderButton";
import StatusBadge from "./StatusBadge";
import { useModem } from "../../context/ModemContext";

const Header = () => {
  const { status, refresh, lastUpdated } = useModem();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="max-w-[1800px] mx-auto px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* Left: Branding & Meta Info */}
        <div className="flex items-center gap-3 sm:gap-6">
          <h1 className="text-base sm:text-xl font-light tracking-[0.2em] text-white">
            CENTCON
          </h1>
          <div className="h-4 w-px bg-white/10 hidden md:block"></div>
          <MetaInfo
            className="hidden md:flex items-center gap-3 text-xs tracking-wider font-medium opacity-60"
            lastUpdated={lastUpdated}
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <StatusBadge status={status} />

          <HeaderButton
            icon={refreshData}
            label="Refresh"
            rotate
            buttonClass="btn-header btn-refresh"
            onClick={refresh}
          />

          <HeaderButton
            icon={logout}
            label="Logout"
            buttonClass="btn-header btn-logout"
          />
        </div>
      </div>

      {/* Mobile Meta Info Bar */}
      <MetaInfo
        className="md:hidden border-t border-white/10 bg-black/60 max-w-[1800px] mx-auto px-3 py-2 flex items-center justify-center gap-3 text-[10px] tracking-wider font-medium opacity-60"
        lastUpdated={lastUpdated}
      />
    </header>
  );
};

export default Header;
