import Header from "../header/Header";

const MainLayout = ({ children }) => {
  return (
    // Handles Font, Background, and Text Color
    <div className="min-h-screen bg-black text-zinc-400 font-montserrat selection:bg-green-500/30 selection:text-green-200">
      {/* Fixed Header */}
      <Header />
      {/* Main Content Area - Responsive top padding accounts for header height changes:
    pt-32: Mobile (smaller header + meta info bar below)
    pt-36: Small tablets (taller header + meta info bar below) 
    pt-28: Medium+ (full header with meta info inline) */}
      <main className="pt-32 sm:pt-36 md:pt-28 pb-10 px-6 mx-auto">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
