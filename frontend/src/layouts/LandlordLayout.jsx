


import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import DashboardAlert from "../context/DashboardAlert";
import { 
  FiHome, 
  FiList, 
  FiPlusCircle, 
  FiMessageSquare, 
  FiLogOut,
  FiMenu,
  FiX,
  FiBell,
  FiSettings,
  FiChevronDown,
  FiCreditCard,
  FiTrendingUp,
  FiUser,
  FiShield,
  FiCalendar,
  FiBarChart2,
  FiHelpCircle
} from "react-icons/fi";
import { FaBuilding, FaKey, FaHandshake } from "react-icons/fa";
import toast from "react-hot-toast";

const LandlordLayout = () => {
  const { user, subscription, usage, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowUserMenu(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully", {
      style: { background: "#02BB31", color: "#fff" }
    });
    navigate("/login");
  };

  const isSubscriptionActive = subscription?.status === "active";
  const planName = subscription?.plan?.toUpperCase() || "FREE";
  const usagePercentage = usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0;
  const isUsageHigh = usagePercentage >= 80 && usage.limit > 0;

  const navigationItems = [
    { 
      path: "/landlord/dashboard", 
      name: "Overview", 
      icon: FiHome,
      description: "Dashboard stats"
    },
    { 
      path: "/landlord/listings", 
      name: "My Listings", 
      icon: FiList,
      description: "Manage properties"
    },
    { 
      path: "/landlord/listings/new", 
      name: "Add Listing", 
      icon: FiPlusCircle,
      description: "Create new listing"
    },
    { 
      path: "/landlord/inquiries", 
      name: "Inquiries", 
      icon: FiMessageSquare,
      description: "Tenant messages"
    },
    { 
      path: "/landlord/subscription", 
      name: "Subscription", 
      icon: FiCreditCard,
      description: "Manage plan"
    },

    {
      path: "/landlord/support",
      name: "Support",
      icon: FiHelpCircle,
      description: "Get help"
    }
  ];

  const isActivePath = (path) => {
    if (path === "/landlord/dashboard") {
      return location.pathname === "/landlord/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#F0F7F4]">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-30 h-full bg-gradient-to-b from-[#013E43] to-[#001A1C] text-white transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-72' : 'w-20'} 
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          border-r border-[#065A57] shadow-2xl overflow-hidden`}
      >
        <div className="h-full flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-[#065A57] scrollbar-track-transparent hover:scrollbar-thumb-[#02BB31]">
          
          {/* Sidebar Header */}
          <div className={`sticky top-0 z-10 p-4 border-b border-[#065A57] bg-gradient-to-r from-[#02BB31]/10 to-transparent backdrop-blur-sm ${!isSidebarOpen && 'lg:p-3'}`}>
            <div className="flex items-center justify-between">
              
                
              
              {/* Mobile Close Button */}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors text-white ml-auto"
                aria-label="Close menu"
              >
                <FiX size={20} />
              </button>
              
              {/* Toggle Button - Desktop */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden lg:block p-2 hover:bg-white/10 rounded-lg transition-colors text-white flex-shrink-0"
                aria-label="Toggle sidebar"
              >
                {isSidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
            </div>
          </div>

          {/* User Profile Card */}
          <div className={`p-4 border-b border-[#065A57] bg-white/5 backdrop-blur-sm`}>
            <div className="flex items-center space-x-3">
              
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{user?.name || 'Landlord'}</p>
                  <p className="text-xs text-[#A8D8C1] truncate">{user?.email || 'user@example.com'}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isSubscriptionActive 
                        ? "bg-[#02BB31]/20 text-[#02BB31]" 
                        : "bg-yellow-100/20 text-yellow-400"
                    }`}>
                      {planName}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isSubscriptionActive
                        ? "bg-[#02BB31]/20 text-[#02BB31]"
                        : "bg-red-100/20 text-red-400"
                    }`}>
                      {subscription?.status?.replace("_", " ") || "Inactive"}
                    </span>
                  </div>
                  {/* Usage Progress */}
                  {usage.limit > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-[#A8D8C1] mb-1">
                        <span>Listings Used</span>
                        <span>{usage.used}/{usage.limit}</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#065A57] rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            isUsageHigh ? 'bg-orange-500' : 'bg-[#02BB31]'
                          }`}
                          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center ${!isSidebarOpen && 'justify-center'} p-3 rounded-xl transition-all group relative
                    ${isActive 
                      ? 'bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white shadow-lg shadow-[#02BB31]/20' 
                      : 'text-[#A8D8C1] hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <Icon className={`text-xl ${!isSidebarOpen ? 'mr-0' : 'mr-3'} flex-shrink-0`} />
                  {isSidebarOpen && (
                    <>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium block truncate">{item.name}</span>
                        <p className="text-xs opacity-75 truncate">{item.description}</p>
                      </div>
                    </>
                  )}
                  
                  {/* Tooltip for collapsed sidebar */}
                  {!isSidebarOpen && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-[#013E43] text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="sticky bottom-0 p-4 border-t border-[#065A57] bg-gradient-to-t from-[#013E43] to-transparent backdrop-blur-sm">
            <div className="space-y-2">
              {/* <button
                onClick={() => navigate("/landlord/settings")}
                className={`flex items-center ${!isSidebarOpen && 'justify-center'} w-full p-3 rounded-xl text-[#A8D8C1] hover:bg-white/10 hover:text-white transition-colors group relative`}
              >
                <FiSettings className={`text-xl ${!isSidebarOpen ? 'mr-0' : 'mr-3'} flex-shrink-0`} />
                {isSidebarOpen && <span className="truncate">Settings</span>}
                {!isSidebarOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-[#013E43] text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
                    Settings
                  </div>
                )}
              </button> */}

              <button
                onClick={handleLogout}
                className={`flex items-center ${!isSidebarOpen && 'justify-center'} w-full p-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors group relative`}
              >
                <FiLogOut className={`text-xl ${!isSidebarOpen ? 'mr-0' : 'mr-3'} flex-shrink-0`} />
                {isSidebarOpen && <span className="truncate">Logout</span>}
                {!isSidebarOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-red-600 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
                    Logout
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-72' : 'lg:ml-20'} ml-0 min-h-screen`}>
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-20 bg-white shadow-sm border-b border-[#A8D8C1]">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <FiMenu className="text-[#013E43] text-xl" />
              </button>

              {/* Page Title */}
              <div className="flex-1 ml-4 lg:ml-0">
                <h1 className="text-xl font-bold text-[#013E43]">
                  {navigationItems.find(item => isActivePath(item.path))?.name || 'Dashboard'}
                </h1>
                <p className="text-sm text-[#065A57]">
                  {navigationItems.find(item => isActivePath(item.path))?.description}
                </p>
              </div>

              {/* Right Side Icons */}
              <div className="flex items-center space-x-4">
                {/* Subscription Status Badge */}
                <div className="hidden md:flex items-center space-x-2 px-3 py-2 bg-[#F0F7F4] rounded-lg">
                  <FiCreditCard className="text-[#02BB31]" />
                  <span className="text-sm font-medium text-[#013E43]">{planName}</span>
                </div>

                {/* Notification Bell */}
                <button className="relative p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors">
                  <FiBell className="text-[#065A57] text-xl" />
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors"
                    aria-label="User menu"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                      {user?.name?.charAt(0).toUpperCase() || 'L'}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-semibold text-[#013E43]">{user?.name || 'Landlord'}</p>
                      <p className="text-xs text-[#065A57]">Landlord</p>
                    </div>
                    <FiChevronDown className={`hidden md:block text-[#065A57] transition-transform ${showUserMenu && 'rotate-180'}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-30"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#A8D8C1] z-40">
                        <div className="p-3 border-b border-[#A8D8C1] bg-gradient-to-r from-[#F0F7F4] to-white">
                          <p className="font-semibold text-[#013E43] truncate">{user?.name || 'Landlord'}</p>
                          <p className="text-xs text-[#065A57] truncate">{user?.email || 'user@example.com'}</p>
                        </div>
                        <div className="p-2">
                          <button
                            onClick={() => {
                              navigate("/landlord/profile");
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
                          >
                            Profile
                          </button>
                          <button
                            onClick={() => {
                              navigate("/landlord/settings");
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
                          >
                            Settings
                          </button>
                          <hr className="my-2 border-[#A8D8C1]" />
                          <button
                            onClick={() => {
                              handleLogout();
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <DashboardAlert />
          <Outlet />
        </div>
      </main>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-[#02BB31] to-[#0D915C] rounded-full shadow-2xl flex items-center justify-center text-white z-10 hover:scale-110 transition-transform"
        aria-label="Open menu"
      >
        <FiMenu className="text-2xl" />
      </button>
    </div>
  );
};

export default LandlordLayout;