import Header from "../Header";

const MainLayout = ({ children }) => {
  return (
    // Handles Font, Background, and Text Color
    <div className="min-h-screen bg-black text-zinc-400 font-montserrat selection:bg-green-500/30 selection:text-green-200">
      {/* Fixed Header */}
      <Header />
      {/* Main Content Area */}
      <main className="pt-28 pb-10 px-6 mx-auto">{children}</main>
    </div>
  );
};

export default MainLayout;
