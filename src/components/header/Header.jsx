import { refreshData, logout } from "../../assets/icons";
import MetaInfo from "./MetaInfo";
import HeaderButton from "./HeaderButton";
import StatusBadge from "./StatusBadge";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
      {/* Main Header Bar */}
      <div className="max-w-[1800px] mx-auto px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* Left: Branding & Meta Info */}
        <div className="flex items-center gap-3 sm:gap-6">
          <h1 className="text-base sm:text-xl font-light tracking-[0.2em] text-white">
            CENTCON
          </h1>

          {/* Divider */}
          <div className="h-4 w-px bg-white/10 hidden md:block"></div>

          {/* Meta Info (Hidden on mobile, shown on md+) */}
          <MetaInfo className="hidden md:flex items-center gap-3 text-xs tracking-wider font-medium opacity-60" />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Status Badge - TODO: replace `status="online"` with dynamic {status} prop */}
          <StatusBadge status="online" />

          {/* Refresh Button */}
          <HeaderButton
            icon={refreshData}
            label="Refresh"
            rotate
            hoverClasses="hover:border-white/30 hover:bg-white/5"
          />

          {/* Logout Button */}
          <HeaderButton
            icon={logout}
            label="Logout"
            hoverClasses="hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400"
          />
        </div>
      </div>

      {/* Mobile Meta Info Bar (Shown only on mobile) */}
      <MetaInfo className="md:hidden border-t border-white/10 bg-black/60 max-w-[1800px] mx-auto px-3 py-2 flex items-center justify-center gap-3 text-[10px] tracking-wider font-medium opacity-60" />
    </header>
  );
};

export default Header;
