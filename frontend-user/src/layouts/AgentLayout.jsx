import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  FiBookOpen,
  FiChevronDown,
  FiCopy,
  FiHome,
  FiLink,
  FiLogOut,
  FiMenu,
  FiTrendingUp,
  FiUser,
  FiUsers,
  FiX
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export default function AgentLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const items = useMemo(
    () => [
      { path: "/agent/dashboard", name: "Overview", icon: FiHome, description: "Performance snapshot" },
      { path: "/agent/referrals", name: "Referral Links", icon: FiLink, description: "Share onboarding links" },
      { path: "/agent/landlords", name: "Landlords", icon: FiUsers, description: "Track onboarded owners" },
      { path: "/agent/instructions", name: "Instructions", icon: FiBookOpen, description: "Admin updates" },
      { path: "/agent/profile", name: "Profile", icon: FiUser, description: "Agent account" }
    ],
    []
  );

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  const currentPage = items.find((item) => isActive(item.path)) || items[0];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#F5F8F6] text-[#013E43]">
      {isMobileMenuOpen ? <button type="button" className="fixed inset-0 z-20 bg-black/40 lg:hidden" aria-label="Close menu overlay" onClick={() => setIsMobileMenuOpen(false)} /> : null}

      <aside
        className={`fixed left-0 top-0 z-30 h-full overflow-hidden border-r border-[#DDEAE3] bg-[#0B2F32] text-white transition-all duration-300 ${
          isSidebarOpen ? "w-72" : "w-20"
        } ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              {isSidebarOpen ? (
                <Link to="/agent/dashboard" className="inline-flex items-center gap-3">
                  <img src="/assets/rend.jpeg" alt="RendaHomes" className="h-10 w-auto rounded bg-white" />
                  <span className="text-sm font-bold">Agent Portal</span>
                </Link>
              ) : null}
              <button type="button" onClick={() => setIsSidebarOpen((value) => !value)} className="hidden rounded-lg p-2 hover:bg-white/10 lg:block" aria-label="Toggle sidebar">
                {isSidebarOpen ? <FiX /> : <FiMenu />}
              </button>
              <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="ml-auto rounded-lg p-2 hover:bg-white/10 lg:hidden" aria-label="Close menu">
                <FiX />
              </button>
            </div>
          </div>

          <div className="border-b border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#17A56B] font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
              {isSidebarOpen ? (
                <div className="min-w-0">
                  <p className="truncate font-semibold">{user?.name || "Agent"}</p>
                  <p className="truncate text-xs text-white/60">{user?.email}</p>
                  <span className="mt-2 inline-flex rounded-full bg-white/10 px-2 py-0.5 text-xs text-[#A8D8C1]">Agent account</span>
                </div>
              ) : null}
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`group relative flex items-center rounded-xl p-3 transition ${!isSidebarOpen ? "justify-center" : ""} ${
                    active ? "bg-white text-[#013E43]" : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className={`shrink-0 text-xl ${isSidebarOpen ? "mr-3" : ""}`} />
                  {isSidebarOpen ? (
                    <div className="min-w-0">
                      <span className="block truncate font-semibold">{item.name}</span>
                      <p className="truncate text-xs opacity-70">{item.description}</p>
                    </div>
                  ) : (
                    <span className="invisible absolute left-full z-50 ml-2 rounded bg-[#013E43] px-2 py-1 text-sm text-white opacity-0 group-hover:visible group-hover:opacity-100">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-4">
            <button type="button" onClick={handleLogout} className={`flex w-full items-center rounded-xl p-3 text-red-200 hover:bg-red-500/10 ${!isSidebarOpen ? "justify-center" : ""}`}>
              <FiLogOut className={`text-xl ${isSidebarOpen ? "mr-3" : ""}`} />
              {isSidebarOpen ? "Logout" : null}
            </button>
          </div>
        </div>
      </aside>

      <main className={`min-h-screen transition-all duration-300 ${isSidebarOpen ? "lg:ml-72" : "lg:ml-20"}`}>
        <header className="sticky top-0 z-10 border-b border-[#DDEAE3] bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <button type="button" onClick={() => setIsMobileMenuOpen(true)} className="rounded-lg p-2 hover:bg-[#F0F7F4] lg:hidden" aria-label="Open menu">
              <FiMenu />
            </button>
            <div className="ml-3 flex-1 lg:ml-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#17A56B]">RendaHomes Agent</p>
              <h1 className="text-xl font-bold">{currentPage.name}</h1>
            </div>
            <div className="relative">
              <button type="button" onClick={() => setShowUserMenu((value) => !value)} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-[#F0F7F4]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B2F32] font-bold text-white">{user?.name?.charAt(0)?.toUpperCase() || "A"}</div>
                <FiChevronDown className={`hidden text-[#647C75] transition md:block ${showUserMenu ? "rotate-180" : ""}`} />
              </button>
              {showUserMenu ? (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-[#DDEAE3] bg-white p-2 shadow-xl">
                  <button type="button" onClick={() => navigate("/agent/profile")} className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm hover:bg-[#F0F7F4]">
                    <FiUser />
                    Profile
                  </button>
                  <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm text-red-600 hover:bg-red-50">
                    <FiLogOut />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      <button type="button" onClick={() => setIsMobileMenuOpen(true)} className="fixed bottom-6 right-6 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[#17A56B] text-white shadow-xl lg:hidden" aria-label="Open menu">
        <FiMenu className="text-2xl" />
      </button>
    </div>
  );
}
