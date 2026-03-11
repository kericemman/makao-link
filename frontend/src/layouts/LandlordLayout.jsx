import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { 
  FiHome, 
  FiList, 
  FiPlusCircle, 
  FiMessageSquare,
  FiLogOut,
  FiMenu,
  FiX,
  FiBell,
  FiUser,
  FiSettings,
  FiChevronDown
} from "react-icons/fi"
import { useAuth } from "../context/AuthContext"
import toast from "react-hot-toast"

function LandloardLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setShowUserMenu(false)
  }, [location])

  const handleLogout = () => {
    logout()
    toast.success("Logged out successfully", {
      style: { background: "#02BB31", color: "#fff" }
    })
    navigate("/login")
  }

  const navigationItems = [
    { 
      path: "/dashboard", 
      name: "Dashboard", 
      icon: FiHome,
      description: "Overview & stats"
    },
    { 
      path: "/dashboard/properties", 
      name: "My Properties", 
      icon: FiList,
      description: "Manage your listings"
    },
    { 
      path: "/dashboard/add-property", 
      name: "Add Property", 
      icon: FiPlusCircle,
      description: "Create new listing"
    },
    { 
      path: "/dashboard/support", 
      name: "Support", 
      icon: FiMessageSquare,
      description: "Get intant MakaoLink support"
    },
  ]

  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + "/")
  }

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
              
              
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors text-white ml-auto"
              >
                <FiX size={20} />
              </button>
              
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden lg:block p-2 hover:bg-white/10 rounded-lg transition-colors text-white flex-shrink-0"
              >
                {isSidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
            </div>
          </div>

          {/* User Profile Card */}
         

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
              <button
                onClick={() => navigate("/dashboard/settings")}
                className={`flex items-center ${!isSidebarOpen && 'justify-center'} w-full p-3 rounded-xl text-[#A8D8C1] hover:bg-white/10 hover:text-white transition-colors group relative`}
              >
                <FiSettings className={`text-xl ${!isSidebarOpen ? 'mr-0' : 'mr-3'} flex-shrink-0`} />
                {isSidebarOpen && <span className="truncate">Settings</span>}
                {!isSidebarOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-[#013E43] text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
                    Settings
                  </div>
                )}
              </button>

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
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors"
              >
                <FiMenu className="text-[#013E43] text-xl" />
              </button>

              <div className="flex-1 ml-4 lg:ml-0">
                <h1 className="text-2xl font-bold text-[#013E43]">
                  {navigationItems.find(item => isActivePath(item.path))?.name || 'Dashboard'}
                </h1>
                <p className="text-sm text-[#065A57]">
                  {navigationItems.find(item => isActivePath(item.path))?.description}
                </p>
              </div>

              <div className="flex items-center space-x-4">
                {user && (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-3 p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors"
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="hidden md:block text-left">
                        <p className="text-sm font-semibold text-[#013E43]">{user.name}</p>
                        <p className="text-xs text-[#065A57]">Landlord</p>
                      </div>
                      <FiChevronDown className={`hidden md:block text-[#065A57] transition-transform ${showUserMenu && 'rotate-180'}`} />
                    </button>

                    {showUserMenu && (
                      <>
                        <div 
                          className="fixed inset-0 z-30"
                          onClick={() => setShowUserMenu(false)}
                        />
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#A8D8C1] z-40">
                          <div className="p-3 border-b border-[#A8D8C1] bg-gradient-to-r from-[#F0F7F4] to-white">
                            <p className="font-semibold text-[#013E43] truncate">{user.name}</p>
                            <p className="text-xs text-[#065A57] truncate">{user.email}</p>
                          </div>
                          <div className="p-2">
                            <button
                              onClick={() => {
                                navigate("/dashboard/profile");
                                setShowUserMenu(false);
                              }}
                              className="w-full text-left p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
                            >
                              Profile
                            </button>
                            <button
                              onClick={() => {
                                navigate("/dashboard/settings");
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
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-[#02BB31] to-[#0D915C] rounded-full shadow-2xl flex items-center justify-center text-white z-10 hover:scale-110 transition-transform"
      >
        <FiMenu className="text-2xl" />
      </button>
    </div>
  )
}

export default LandloardLayout