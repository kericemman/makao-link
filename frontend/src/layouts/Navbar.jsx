import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useState } from "react"
import { 
  FiHome, 
  FiGrid, 
  FiLogIn, 
  FiUserPlus, 
  FiUser, 
  FiChevronDown,
  FiMenu,
  FiX,
  FiBell,
  FiLogOut,
  FiSettings,
  FiHelpCircle
} from "react-icons/fi"
import { FaBuilding, FaDollarSign, FaFileInvoiceDollar } from "react-icons/fa"
import toast from "react-hot-toast"

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success("Logged out successfully", {
      style: { background: "#02BB31", color: "#fff" }
    })
    navigate("/")
  }

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50 border-b border-[#A8D8C1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            
            <img src="/assets/rend.jpeg" alt="MakaoLink Logo" className="h-10 w-full" />
            
            
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/"
              className="px-4 py-2 text-[#065A57] hover:text-[#013E43] hover:bg-[#F0F7F4] rounded-lg transition-all flex items-center space-x-2"
            >
              <FiHome className="text-lg" />
              <span>Home</span>
            </Link>

            <Link
              to="/properties"
              className="px-4 py-2 text-[#065A57] hover:text-[#013E43] hover:bg-[#F0F7F4] rounded-lg transition-all flex items-center space-x-2"
            >
              <FiGrid className="text-lg" />
              <span>Properties</span>
            </Link>

            <Link 
            to="/services"
            className="px-4 py-2 text-[#065A57] hover:text-[#013E43] hover:bg-[#F0F7F4] rounded-lg transition-all flex items-center space-x-2"
            >
              <FaBuilding className="text-lg" />
              <span>Services</span>
            </Link>



            <Link
              to="/pricing"
              className="px-4 py-2 text-[#065A57] hover:text-[#013E43] hover:bg-[#F0F7F4] rounded-lg transition-all flex items-center space-x-2"
            >
              <FaDollarSign className="text-lg" />
              <span>Pricing</span>
            </Link>

            {!user && (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-[#065A57] hover:text-[#013E43] hover:bg-[#F0F7F4] rounded-lg transition-all flex items-center space-x-2"
                >
                  <FiLogIn className="text-lg" />
                  <span>Login</span>
                </Link>

                <Link
                  to="/landlord/register"
                  className="ml-2 px-5 py-2 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105 flex items-center space-x-2"
                >
                  <FiUserPlus className="text-lg" />
                  <span>Register</span>
                </Link>
              </>
            )}

            {user && (
              <>
                {/* Notification Bell */}
                <button className="relative p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors">
                  <FiBell className="text-xl" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#02BB31] rounded-full"></span>
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 ml-2 px-3 py-2 bg-gradient-to-r from-[#013E43] to-[#005C57] text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-[#013E43]">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden lg:block text-sm font-medium">{user.name?.split(' ')[0]}</span>
                    <FiChevronDown className={`hidden lg:block transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#A8D8C1] z-50">
                        <div className="p-4 border-b border-[#A8D8C1] bg-gradient-to-r from-[#F0F7F4] to-white">
                          <p className="font-semibold text-[#013E43]">{user.name}</p>
                          <p className="text-xs text-[#065A57] truncate">{user.email}</p>
                          <div className="mt-2">
                            <span className="text-xs px-2 py-1 bg-[#02BB31]/10 text-[#02BB31] rounded-full">
                              {user.role}
                            </span>
                          </div>
                        </div>
                        <div className="p-2">
                          <Link
                            to={user.role === "admin" || user.role === "landlord" ? "/landlord/dashboard" : "/admin/dashboard"}
                            className="flex items-center space-x-3 px-4 py-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <FiUser />
                            <span>Dashboard</span>
                          </Link>
                         
                          <Link
                            to="/support"
                            className="flex items-center space-x-3 px-4 py-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <FiHelpCircle />
                            <span>Help & Support</span>
                          </Link>
                          <hr className="my-2 border-[#A8D8C1]" />
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FiLogOut />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-[#F0F7F4] transition-colors"
          >
            {isOpen ? (
              <FiX className="text-2xl text-[#013E43]" />
            ) : (
              <FiMenu className="text-2xl text-[#013E43]" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div 
          className={`md:hidden fixed inset-x-0 top-16 bg-white border-b border-[#A8D8C1] shadow-lg transition-all duration-300 ${
            isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
          style={{ maxHeight: isOpen ? 'calc(100vh - 64px)' : '0', overflow: 'hidden' }}
        >
          <div className="p-4 space-y-2">
            <Link
              to="/"
              className="flex items-center space-x-3 px-4 py-3 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <FiHome className="text-xl" />
              <span>Home</span>
            </Link>

            <Link
              to="/properties"
              className="flex items-center space-x-3 px-4 py-3 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <FiGrid className="text-xl" />
              <span>Properties</span>
            </Link>

              <Link
              to="/services"
              className="flex items-center space-x-3 px-4 py-3 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <FaBuilding className="text-xl" />
              <span>Services</span>
            </Link>

            <Link
              to="/pricing"
              className="flex items-center space-x-3 px-4 py-3 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <FaDollarSign className="text-xl" />
              <span>Pricing</span>
            </Link>

            {!user && (
              <>
                <Link
                  to="/login"
                  className="flex items-center space-x-3 px-4 py-3 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <FiLogIn className="text-xl" />
                  <span>Login</span>
                </Link>

                <Link
                  to="/pricing"
                  className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold"
                  onClick={() => setIsOpen(false)}
                >
                  <FiUserPlus className="text-xl" />
                  <span>Register</span>
                </Link>
              </>
            )}

            {user && (
              <>
                <div className="px-4 py-3 bg-[#F0F7F4] rounded-lg">
                  <p className="font-semibold text-[#013E43]">{user.name}</p>
                  <p className="text-xs text-[#065A57]">{user.email}</p>
                </div>

                <Link
                  to={user.role === "admin" ? "/admin" : "/admin/dashboard"}
                  className="flex items-center space-x-3 px-4 py-3 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <FiUser />
                  <span>Dashboard</span>
                </Link>

                

                <Link
                  to="/support"
                  className="flex items-center space-x-3 px-4 py-3 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <FiHelpCircle />
                  <span>Help & Support</span>
                </Link>

                <button
                  onClick={() => {
                    handleLogout()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiLogOut />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar