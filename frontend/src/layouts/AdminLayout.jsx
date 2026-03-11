import { Link, Outlet } from "react-router-dom"
import { useState } from "react"
import { 
  FiHome, 
  FiGrid, 
  FiUsers, 
  FiUserCheck,
  FiLogOut,
  FiMenu,
  FiX,
  FiChevronDown,
  FiBell,
  FiSettings,
  FiBook,
  FiHelpCircle
} from "react-icons/fi"
import { FaMicroblog, FaPhoneAlt } from "react-icons/fa"

function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const navigationItems = [
    { path: "/admin", name: "Dashboard", icon: FiHome },
    { path: "/admin/properties", name: "Properties", icon: FiGrid },
    { path: "/admin/users", name: "Users", icon: FiUsers },
    { path: "/admin/kyc", name: "KYC", icon: FiUserCheck },
    { path: "/admin/partners", name: "Partners", icon: FiBook},
    { path: "/admin/blogs", name: "Blogs", icon: FaMicroblog },
    { path: "/admin/contacts", name: "Contacts", icon: FaPhoneAlt },
    { path: "/admin/tickets", name: "Support", icon: FiHelpCircle },
    { path: "/admin/settings", name: "Settings", icon: FiSettings },
  ]

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
          ${isSidebarOpen ? 'w-64' : 'w-20'} 
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          border-r border-[#065A57] shadow-2xl overflow-hidden`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className={`p-4 border-b border-[#065A57] ${!isSidebarOpen && 'lg:p-3'}`}>
          <div className="flex items-center justify-between">
              
              
              {/* Mobile Close Button */}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                <FiX size={20} />
              </button>
              
              {/* Toggle Button - Desktop */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden lg:block p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                {isSidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
            </div>
          </div>

          {/* Admin Profile Card */}
          <div className={`p-4 border-b border-[#065A57] bg-white/5`}>
            <div className="flex items-center space-x-3">
              
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">Admin User</p>
                  <p className="text-xs text-[#A8D8C1] truncate">admin@makaolink.com</p>
                  <div className="flex items-center mt-1">
                    <span className="text-xs bg-[#02BB31]/20 text-[#02BB31] px-2 py-0.5 rounded-full">
                      Super Admin
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center ${!isSidebarOpen && 'justify-center'} p-3 rounded-xl transition-all group relative hover:bg-white/10 hover:text-white text-[#A8D8C1]`}
                >
                  <Icon className={`text-xl ${!isSidebarOpen ? 'mr-0' : 'mr-3'} flex-shrink-0`} />
                  {isSidebarOpen && (
                    <span className="font-medium block truncate">{item.name}</span>
                  )}
                  
                  {/* Tooltip for collapsed sidebar */}
                  {!isSidebarOpen && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-[#013E43] text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl">
                      {item.name}
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-[#065A57] bg-gradient-to-t from-[#013E43] to-transparent">
            <div className="space-y-2">
              

              <button
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
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} ml-0 min-h-screen`}>
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-20 bg-white shadow-sm border-b border-[#A8D8C1]">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors"
              >
                <FiMenu className="text-[#013E43] text-xl" />
              </button>

              {/* Page Title */}
              <div className="flex-1 ml-4 lg:ml-0">
                <h1 className="text-xl font-bold text-[#013E43]">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-[#065A57]">
                  Manage your platform
                </p>
              </div>

              {/* Right Side Icons */}
              <div className="flex items-center space-x-4">
                {/* Notification Bell */}
                <button className="relative p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors">
                  <FiBell className="text-[#065A57] text-xl" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#02BB31] rounded-full"></span>
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                      A
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-semibold text-[#013E43]">Admin User</p>
                      <p className="text-xs text-[#065A57]">Administrator</p>
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
                          <p className="font-semibold text-[#013E43] truncate">Admin User</p>
                          <p className="text-xs text-[#065A57] truncate">admin@makaolink.com</p>
                        </div>
                        <div className="p-2">
                          <button className="w-full text-left p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors">
                            Profile
                          </button>
                          <button className="w-full text-left p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors">
                            Settings
                          </button>
                          <hr className="my-2 border-[#A8D8C1]" />
                          <button className="w-full text-left p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
          <Outlet />
        </div>
      </main>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-[#02BB31] to-[#0D915C] rounded-full shadow-2xl flex items-center justify-center text-white z-10 hover:scale-110 transition-transform"
      >
        <FiMenu className="text-2xl" />
      </button>
    </div>
  )
}

export default AdminLayout