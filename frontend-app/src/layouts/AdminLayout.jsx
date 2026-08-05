import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  FiBarChart2,
  FiAlertTriangle,
  FiBell,
  FiBookOpen,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiCreditCard,
  FiEye,
  FiFeather,
  FiFileText,
  FiGrid,
  FiHelpCircle,
  FiHome,
  FiLogOut,
  FiMail,
  FiMenu,
  FiMessageSquare,
  FiPhoneCall,
  FiShield,
  FiSmartphone,
  FiUsers,
  FiX
} from "react-icons/fi";
import { FaBlog, FaBuilding, FaHandshake } from "react-icons/fa";
import toast from "react-hot-toast";
import { getRecentActivity } from "../services/admin.service";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [notificationsSeen, setNotificationsSeen] = useState(false);

  const navigationSections = useMemo(
    () => [
      {
        title: "Overview",
        items: [
          {
            label: "Dashboard",
            path: "/admin/dashboard",
            icon: FiHome,
            description: "Platform snapshot"
          }
        ]
      },
      {
        title: "Listings",
        items: [
          {
            label: "All Listings",
            path: "/admin/listings",
            icon: FiGrid,
            description: "Manage properties"
          },
          {
            label: "Pending Review",
            path: "/admin/listings/pending",
            icon: FiEye,
            description: "Approve submissions"
          },
          {
            label: "Listing Reports",
            path: "/admin/listings/reports",
            icon: FiAlertTriangle,
            description: "User flags"
          }
        ]
      },
      {
        title: "People & Revenue",
        items: [
          {
            label: "Landlords",
            path: "/admin/landlords",
            icon: FiUsers,
            description: "Owner accounts"
          },
          {
            label: "KYC Reviews",
            path: "/admin/kyc",
            icon: FiShield,
            description: "Verify landlords"
          },
          {
            label: "Agents",
            path: "/admin/agents",
            icon: FaHandshake,
            description: "Referral network"
          },
          {
            label: "Payments",
            path: "/admin/payments",
            icon: FiCreditCard,
            description: "Transactions"
          },
          {
            label: "Subscriptions",
            path: "/admin/subscriptions",
            icon: FiBarChart2,
            description: "Plans and billing"
          },
          {
            label: "Subscribers",
            path: "/admin/subscribers",
            icon: FiMail,
            description: "Newsletter list"
          }
        ]
      },
      {
        title: "Communication",
        items: [
          {
            label: "Inquiries",
            path: "/admin/inquiries",
            icon: FiMessageSquare,
            description: "Tenant messages"
          },
          {
            label: "Contact Messages",
            path: "/admin/contact",
            icon: FiPhoneCall,
            description: "Website queries"
          },
          {
            label: "Support Tickets",
            path: "/admin/support",
            icon: FiHelpCircle,
            description: "Help requests"
          }
        ]
      },
      {
        title: "App Management",
        items: [
          {
            label: "Support & Help",
            path: "/admin/app/support-help",
            icon: FiMessageSquare,
            description: "Mobile requests"
          },
          {
            label: "Support Categories",
            path: "/admin/app/categories",
            icon: FiHelpCircle,
            description: "Help topics"
          },
          {
            label: "App Updates",
            path: "/admin/app/updates",
            icon: FiFeather,
            description: "Release notes"
          },
          {
            label: "App Subscribers",
            path: "/admin/app/subscribers",
            icon: FiMail,
            description: "Mobile audience"
          },
          {
            label: "Contact Info",
            path: "/admin/contact-info",
            icon: FiPhoneCall,
            description: "Public contacts"
          },
          {
            label: "Policies",
            path: "/admin/app/policies",
            icon: FiShield,
            description: "Privacy and terms"
          }
        ]
      },
      {
        title: "Content",
        items: [
          {
            label: "Blog Posts",
            path: "/admin/blogs",
            icon: FaBlog,
            description: "Published content"
          },
          {
            label: "Create Post",
            path: "/admin/blog/new",
            icon: FiBookOpen,
            description: "Write article"
          }
        ]
      },
      {
        title: "Services",
        items: [
          {
            label: "Applications",
            path: "/admin/services/applications",
            icon: FiFileText,
            description: "Review partners"
          },
          {
            label: "Approved Partners",
            path: "/admin/services/partners",
            icon: FaHandshake,
            description: "Service network"
          }
        ]
      }
    ],
    []
  );

  const flatItems = navigationSections.flatMap((section) => section.items);
  const currentItem =
    [...flatItems]
      .sort((a, b) => b.path.length - a.path.length)
      .find((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)) ||
    flatItems[0];

  const unreadCount = notificationsSeen ? 0 : notifications.length;

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowUserMenu(false);
    setShowNotifications(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setNotificationsLoading(true);
        setNotificationsError("");
        const data = await getRecentActivity();
        setNotifications(data.activities || []);
      } catch (error) {
        setNotificationsError("Could not load notifications");
      } finally {
        setNotificationsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully", {
      style: { background: "#02BB31", color: "#fff" }
    });
    navigate("/login");
  };

  const isActivePath = (path) => {
    if (path === "/admin/dashboard") return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const formatNotificationTime = (date) => {
    const value = new Date(date);
    const diffInSeconds = Math.floor((Date.now() - value.getTime()) / 1000);

    if (Number.isNaN(value.getTime())) return "";
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
    return value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "listing_submission":
        return FiGrid;
      case "payment_received":
        return FiCreditCard;
      case "inquiry_sent":
        return FiMessageSquare;
      case "support_ticket":
        return FiHelpCircle;
      case "listing_report":
        return FiAlertTriangle;
      default:
        return FiBell;
    }
  };

  const openNotifications = () => {
    setShowNotifications((value) => !value);
    setNotificationsSeen(true);
  };

  const getNotificationPath = (type) => {
    switch (type) {
      case "listing_submission":
        return "/admin/listings/pending";
      case "payment_received":
        return "/admin/payments";
      case "inquiry_sent":
        return "/admin/inquiries";
      case "support_ticket":
        return "/admin/support";
      case "listing_report":
        return "/admin/listings/reports";
      default:
        return "/admin/dashboard";
    }
  };

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = isActivePath(item.path);

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 transition-all ${
          isActive
            ? "bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white shadow-lg shadow-[#02BB31]/20"
            : "text-[#A8D8C1] hover:bg-white/10 hover:text-white"
        } ${!isSidebarOpen ? "lg:justify-center" : ""}`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            isActive ? "bg-white/15 text-white" : "text-[#A8D8C1] group-hover:text-white"
          }`}
        >
          <Icon className="text-lg" />
        </span>
        {isSidebarOpen && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{item.label}</span>
            <span className={`block truncate text-xs ${isActive ? "text-white/80" : "text-[#A8D8C1]/75"}`}>
              {item.description}
            </span>
          </span>
        )}
        {!isSidebarOpen && (
          <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#013E43] px-3 py-2 text-sm text-white opacity-0 shadow-xl transition group-hover:opacity-100">
            {item.label}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="admin-sleek min-h-screen bg-[#F8FAF8] text-[#013E43]">
      {isMobileMenuOpen && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-20 bg-[#001A1C]/55 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-30 h-full overflow-hidden border-r border-[#065A57] bg-gradient-to-b from-[#013E43] to-[#001A1C] text-white shadow-2xl transition-all duration-300 ${
          isSidebarOpen ? "w-72" : "w-20"
        } ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="border-b border-[#065A57] bg-gradient-to-r from-[#02BB31]/10 to-transparent px-4 py-4 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <Link to="/admin/dashboard" className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
                  <FaBuilding className="text-lg text-[#02BB31]" />
                </span>
                {isSidebarOpen && (
                  <span className="min-w-0">
                    <span className="block truncate text-base font-bold text-white">RendaHomes</span>
                    <span className="block truncate text-xs text-[#A8D8C1]">Admin Console</span>
                  </span>
                )}
              </Link>
              <button
                onClick={() => setIsSidebarOpen((value) => !value)}
                className="hidden rounded-lg p-2 text-white transition hover:bg-white/10 lg:block"
                aria-label="Toggle sidebar"
              >
                {isSidebarOpen ? <FiX size={18} /> : <FiMenu size={18} />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg p-2 text-white transition hover:bg-white/10 lg:hidden"
                aria-label="Close menu"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          <div className={`border-b border-[#065A57] bg-white/5 px-4 py-3 backdrop-blur-sm ${!isSidebarOpen ? "lg:px-3" : ""}`}>
            <div className={`flex items-center gap-3 ${!isSidebarOpen ? "lg:justify-center" : ""}`}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-sm font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </span>
              {isSidebarOpen && (
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white">{user?.name || "Admin"}</span>
                  <span className="block truncate text-xs text-[#A8D8C1]">{user?.email || "admin@rendahomes.com"}</span>
                </span>
              )}
            </div>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
            {navigationSections.map((section) => (
              <section key={section.title} className="space-y-2">
                {isSidebarOpen && (
                  <p className="px-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#A8D8C1]/70">{section.title}</p>
                )}
                <div className="space-y-1.5">{section.items.map(renderNavItem)}</div>
              </section>
            ))}
          </nav>

          <div className="border-t border-[#065A57] bg-gradient-to-t from-[#013E43] to-transparent p-3">
            <button
              onClick={handleLogout}
              className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-red-500 transition hover:bg-red-50 ${
                !isSidebarOpen ? "lg:justify-center" : ""
              }`}
            >
              <FiLogOut className="text-xl" />
              {isSidebarOpen && <span className="text-sm font-semibold">Logout</span>}
              {!isSidebarOpen && (
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-red-600 px-3 py-2 text-sm text-white opacity-0 shadow-xl transition group-hover:opacity-100">
                  Logout
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      <main className={`min-h-screen transition-all duration-300 ${isSidebarOpen ? "lg:ml-72" : "lg:ml-20"}`}>
        <header className="sticky top-0 z-20 border-b border-[#DDEAE3] bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="rounded-lg p-2 text-[#013E43] transition hover:bg-[#F0F7F4] lg:hidden"
                aria-label="Open menu"
              >
                <FiMenu className="text-xl" />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0D915C]">Admin Portal</p>
                <h1 className="truncate text-lg font-semibold text-[#013E43] sm:text-2xl">{currentItem?.label || "Dashboard"}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={openNotifications}
                className="relative rounded-lg p-2.5 text-[#065A57] transition hover:bg-[#F0F7F4]"
                aria-label="Notifications"
              >
                <FiBell className="text-lg" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#02BB31] px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu((value) => !value)}
                  className="flex items-center gap-3 rounded-lg py-1.5 pl-1.5 pr-2 text-left transition hover:bg-[#F0F7F4]"
                  aria-label="User menu"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#013E43] text-sm font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase() || "A"}
                  </span>
                  <span className="hidden min-w-0 md:block">
                    <span className="block max-w-36 truncate text-sm font-semibold text-[#013E43]">{user?.name || "Admin"}</span>
                    <span className="block text-xs text-[#647C75]">Administrator</span>
                  </span>
                  <FiChevronDown className={`hidden text-[#647C75] transition md:block ${showUserMenu ? "rotate-180" : ""}`} />
                </button>

                {showUserMenu && (
                  <>
                    <button className="fixed inset-0 z-30 cursor-default" onClick={() => setShowUserMenu(false)} aria-label="Close menu" />
                    <div className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-xl border border-[#E8F0EB] bg-white shadow-xl">
                      <div className="border-b border-[#E8F0EB] p-4">
                        <p className="truncate font-semibold text-[#013E43]">{user?.name || "Admin"}</p>
                        <p className="truncate text-xs text-[#647C75]">{user?.email || "admin@rendahomes.com"}</p>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <FiLogOut />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {showNotifications && (
            <>
              <button className="fixed inset-0 z-30 cursor-default" onClick={() => setShowNotifications(false)} aria-label="Close notifications" />
              <div className="absolute right-4 top-16 z-40 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-xl border border-[#E8F0EB] bg-white shadow-xl sm:right-6 lg:right-8">
                <div className="border-b border-[#E8F0EB] px-4 py-3">
                  <p className="font-semibold text-[#013E43]">Notifications</p>
                  <p className="text-xs text-[#647C75]">Recent platform activity</p>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="px-4 py-8 text-center">
                      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#A8D8C1] border-t-[#02BB31]" />
                      <p className="text-sm text-[#647C75]">Loading notifications...</p>
                    </div>
                  ) : notificationsError ? (
                    <div className="px-4 py-8 text-center">
                      <FiBell className="mx-auto mb-2 text-2xl text-[#A8D8C1]" />
                      <p className="text-sm font-semibold text-[#013E43]">{notificationsError}</p>
                      <p className="mt-1 text-xs text-[#647C75]">Check your backend connection and admin session.</p>
                    </div>
                  ) : notifications.length ? (
                    notifications.map((notification, index) => {
                      const NotificationIcon = getNotificationIcon(notification.type);

                      return (
                        <Link
                          key={`${notification.type}-${notification.createdAt}-${index}`}
                          to={getNotificationPath(notification.type)}
                          onClick={() => setShowNotifications(false)}
                          className="border-b border-[#ECF3EF] bg-white px-4 py-3 transition hover:bg-[#F8FAF8]"
                        >
                          <div className="flex gap-3">
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#0D915C]">
                              <NotificationIcon className="text-base" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-[#013E43]">{notification.description}</p>
                              <p className="mt-0.5 line-clamp-2 text-xs text-[#647C75]">{notification.details}</p>
                              <p className="mt-1 text-[11px] font-medium text-[#0D915C]">
                                {formatNotificationTime(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <FiCheckCircle className="mx-auto mb-2 text-2xl text-[#02BB31]" />
                      <p className="text-sm font-semibold text-[#013E43]">No recent notifications</p>
                      <p className="mt-1 text-xs text-[#647C75]">New listings, payments, inquiries, and tickets will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </header>

        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed bottom-5 right-5 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[#013E43] text-white shadow-xl transition hover:scale-105 lg:hidden"
        aria-label="Open menu"
      >
        <FiMenu className="text-2xl" />
      </button>
    </div>
  );
};

export default AdminLayout;
