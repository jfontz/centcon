import { refreshData, logout } from "../assets/icons";

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
          <div className="hidden md:flex items-center gap-3 text-xs tracking-wider font-medium opacity-60">
            <span>192.168.254.254</span>
            <span>•</span>
            <span>Last updated: 12s ago</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Online Badge */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[9px] sm:text-[10px] font-bold text-green-500 uppercase tracking-widest">
              Online
            </span>
          </div>

          {/* Refresh Button */}
          <button className="group flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 rounded border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all duration-300">
            <img
              src={refreshData}
              alt="Refresh"
              className="group-hover:rotate-180 transition-transform duration-500 w-4 h-4 sm:w-5 sm:h-5"
            />
            <span className="hidden sm:inline text-xs font-medium uppercase tracking-wider">
              Refresh
            </span>
          </button>

          {/* Logout Button */}
          <button className="group flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 rounded border border-white/10 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 transition-all duration-300">
            <img src={logout} alt="Logout" className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline text-xs font-medium uppercase tracking-wider">
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Meta Info Bar (Shown only on mobile) */}
      <div className="md:hidden border-t border-white/10 bg-black/60">
        <div className="max-w-[1800px] mx-auto px-3 py-2 flex items-center justify-center gap-3 text-[10px] tracking-wider font-medium opacity-60">
          <span>192.168.254.254</span>
          <span>•</span>
          <span>Last updated: 12s ago</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
