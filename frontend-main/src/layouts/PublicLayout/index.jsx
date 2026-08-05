import { Outlet, useLocation } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";

export default function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#F0F7F4] text-[#013E43]">
      <Navbar />
      <main key={location.pathname}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
