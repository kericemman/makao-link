import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  FiBell,
  FiChevronDown,
  FiHeart,
  FiHelpCircle,
  FiHome,
  FiLogOut,
  FiMenu,
  FiMessageSquare,
  FiSearch,
  FiUser,
  FiX
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { portalLinks } from "../config/portals";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navigationItems = useMemo(
    () => [
      { path: "/", name: "Overview", icon: FiHome, description: "User dashboard" },
      { path: "/inquiries", name: "Inquiries", icon: FiMessageSquare, description: "Landlord messages" },
      { path: "/saved", name: "Saved Homes", icon: FiHeart, description: "Your shortlist" },
      { path: "/profile", name: "Profile", icon: FiUser, description: "Account details" },
      { path: "/support", name: "Support", icon: FiHelpCircle, description: "Get help" }
    ],
    []
  );

  const isActivePath = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const currentPage = navigationItems.find((item) => isActivePath(item.path));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#F0F7F4] text-[#013E43]">
      {isMobileMenuOpen ? (
        <button
          type="button"
          aria-label="Close menu overlay"
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-30 h-full overflow-hidden border-r border-[#065A57] bg-gradient-to-b from-[#013E43] to-[#001A1C] text-white shadow-2xl transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "w-72" : "w-20"
        } ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          <div className={`sticky top-0 z-10 border-b border-[#065A57] bg-gradient-to-r from-[#02BB31]/10 to-transparent p-4 backdrop-blur-sm ${!isSidebarOpen ? "lg:p-3" : ""}`}>
            <div className="flex items-center justify-between">
              {isSidebarOpen ? (
                <Link to="/" className="inline-flex items-center">
                  <img src="/assets/rend.jpeg" alt="RendaHomes" className="h-10 w-auto rounded bg-white" />
                </Link>
              ) : null}

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="ml-auto rounded-lg p-2 text-white transition-colors hover:bg-white/10 lg:hidden"
                aria-label="Close menu"
              >
                <FiX size={20} />
              </button>

              <button
                type="button"
                onClick={() => setIsSidebarOpen((value) => !value)}
                className="hidden shrink-0 rounded-lg p-2 text-white transition-colors hover:bg-white/10 lg:block"
                aria-label="Toggle sidebar"
              >
                {isSidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
            </div>
          </div>

          <div className="border-b border-[#065A57] bg-white/5 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#02BB31] to-[#0D915C] font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              {isSidebarOpen ? (
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{user?.name || "RendaHomes user"}</p>
                  <p className="truncate text-xs text-[#A8D8C1]">{user?.email || "user@example.com"}</p>
                  <div className="mt-2 inline-flex rounded-full bg-[#02BB31]/20 px-2 py-0.5 text-xs font-semibold text-[#02BB31]">
                    User portal
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`group relative flex items-center rounded-xl p-3 transition-all ${
                    !isSidebarOpen ? "justify-center" : ""
                  } ${
                    isActive
                      ? "bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white shadow-lg shadow-[#02BB31]/20"
                      : "text-[#A8D8C1] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className={`shrink-0 text-xl ${isSidebarOpen ? "mr-3" : ""}`} />
                  {isSidebarOpen ? (
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{item.name}</span>
                      <p className="truncate text-xs opacity-75">{item.description}</p>
                    </div>
                  ) : (
                    <div className="invisible absolute left-full z-50 ml-2 whitespace-nowrap rounded bg-[#013E43] px-2 py-1 text-sm text-white opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="sticky bottom-0 border-t border-[#065A57] bg-gradient-to-t from-[#013E43] to-transparent p-4 backdrop-blur-sm">
            <button
              type="button"
              onClick={handleLogout}
              className={`group relative flex w-full items-center rounded-xl p-3 text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-500 ${
                !isSidebarOpen ? "justify-center" : ""
              }`}
            >
              <FiLogOut className={`shrink-0 text-xl ${isSidebarOpen ? "mr-3" : ""}`} />
              {isSidebarOpen ? <span className="truncate">Logout</span> : null}
            </button>
          </div>
        </div>
      </aside>

      <main className={`min-h-screen transition-all duration-300 ${isSidebarOpen ? "lg:ml-72" : "lg:ml-20"} ml-0`}>
        <header className="sticky top-0 z-20 border-b border-[#A8D8C1] bg-white shadow-sm">
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="rounded-lg p-2 transition-colors hover:bg-[#F0F7F4] lg:hidden"
                aria-label="Open menu"
              >
                <FiMenu className="text-xl text-[#013E43]" />
              </button>

              <div className="ml-4 flex-1 lg:ml-0">
                <h1 className="text-xl font-bold text-[#013E43]">{currentPage?.name || "Dashboard"}</h1>
                <p className="text-sm text-[#065A57]">{currentPage?.description || "User dashboard"}</p>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <a href={portalLinks.main.href} className="hidden items-center gap-2 rounded-lg bg-[#F0F7F4] px-3 py-2 text-sm font-medium text-[#013E43] md:flex">
                  <FiSearch className="text-[#02BB31]" />
                  Browse homes
                </a>

                <button type="button" className="relative rounded-lg p-2 transition-colors hover:bg-[#F0F7F4]" aria-label="Notifications">
                  <FiBell className="text-xl text-[#065A57]" />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowUserMenu((value) => !value)}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-[#F0F7F4]"
                    aria-label="User menu"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#013E43] to-[#005C57] font-bold text-white shadow-lg">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="hidden text-left md:block">
                      <p className="text-sm font-semibold text-[#013E43]">{user?.name || "User"}</p>
                      <p className="text-xs text-[#065A57]">User portal</p>
                    </div>
                    <FiChevronDown className={`hidden text-[#065A57] transition-transform md:block ${showUserMenu ? "rotate-180" : ""}`} />
                  </button>

                  {showUserMenu ? (
                    <>
                      <button type="button" aria-label="Close user menu" className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-[#A8D8C1] bg-white shadow-xl">
                        <div className="border-b border-[#A8D8C1] bg-gradient-to-r from-[#F0F7F4] to-white p-3">
                          <p className="truncate font-semibold text-[#013E43]">{user?.name || "User"}</p>
                          <p className="truncate text-xs text-[#065A57]">{user?.email || "user@example.com"}</p>
                        </div>
                        <div className="p-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigate("/profile");
                              setShowUserMenu(false);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-[#065A57] transition-colors hover:bg-[#F0F7F4]"
                          >
                            <FiUser />
                            Profile
                          </button>
                          <hr className="my-2 border-[#A8D8C1]" />
                          <button type="button" onClick={handleLogout} className="w-full rounded-lg p-2 text-left text-red-600 transition-colors hover:bg-red-50">
                            Logout
                          </button>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed bottom-6 right-6 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white shadow-2xl transition-transform hover:scale-110 lg:hidden"
        aria-label="Open menu"
      >
        <FiMenu className="text-2xl" />
      </button>
    </div>
  );
}
