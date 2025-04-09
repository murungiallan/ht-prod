
import Nav from "./Nav";

const MainLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Navbar */}
      <Nav />

      {/* Main Content */}
      <main className="flex-1 pt-16 px-1 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-2">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;