import { Outlet, useLocation } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";
import { SavedHomesProvider } from "../../context/SavedHomesContext";
import RendaAssistantWidget from "../../components/RendaAssistantWidget";

const isWebAssistantEnabled = import.meta.env.VITE_RENDA_ASSISTANT_WEB_ENABLED === "true";

export default function PublicLayout() {
  const location = useLocation();

  return (
    <SavedHomesProvider>
      <div className="min-h-screen bg-[#F0F7F4] text-[#013E43]">
        <Navbar />
        <main key={location.pathname}>
          <Outlet />
        </main>
        <Footer />
        {isWebAssistantEnabled && <RendaAssistantWidget />}
      </div>
    </SavedHomesProvider>
  );
}
