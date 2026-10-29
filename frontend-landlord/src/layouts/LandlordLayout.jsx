import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import DashboardAlert from "../context/DashboardAlert";
import { getMySubscription } from "../services/payment.service";
import {
  FiHome,
  FiList,
  FiPlusCircle,
  FiMessageSquare,
  FiLogOut,
  FiMenu,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiCreditCard,
  FiUser,
  FiHelpCircle,
  FiShield,
  FiUsers,
  FiCalendar
} from "react-icons/fi";
import toast from "react-hot-toast";

const LandlordLayout = () => {
  const { user, subscription: authSubscription, usage: authUsage, logout } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [freshSubscription, setFreshSubscription] = useState(null);
  const [freshUsage, setFreshUsage] = useState({
    used: 0,
    limit: 0,
    remaining: 0
  });

  const fetchFreshSubscription = async () => {
    try {
      const data = await getMySubscription();

      setFreshSubscription(data.subscription);
      setFreshUsage(
        data.usage || {
          used: 0,
          limit: 0,
          remaining: 0
        }
      );
    } catch (error) {
      console.error("Failed to refresh subscription:", error);
    }
  };

  useEffect(() => {
    fetchFreshSubscription();
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowUserMenu(false);

    fetchFreshSubscription();
  }, [location.pathname]);

  const subscription = freshSubscription || authSubscription;

  const usage =
    freshSubscription
      ? freshUsage
      : authUsage || {
          used: 0,
          limit: 0,
          remaining: 0
        };

  const isSubscriptionActive =
    subscription?.status === "active" || subscription?.status === "free";

  const planName = subscription?.plan === "normal"
    ? "Free"
    : subscription?.plan
      ? `${subscription.plan.charAt(0).toUpperCase()}${subscription.plan.slice(1)}`
      : "Free";

  const usagePercentage =
    usage?.limit > 0 ? Math.min((usage.used / usage.limit) * 100, 100) : 0;

  const isUsageHigh = usagePercentage >= 80 && usage?.limit > 0;

  const isAtListingLimit = Number(usage?.limit) > 0 && Number(usage.used) >= Number(usage.limit);

  const isBlocked =
    !subscription ||
    ["pending_payment", "grace", "expired", "cancelled"].includes(
      subscription.status
    ) ||
    isAtListingLimit;

  const getBlockReason = () => {
    if (isAtListingLimit) return "limit_reached";
    if (subscription?.status === "pending_payment") return "pending_payment";
    if (subscription?.status === "grace") return "grace_block";
    if (subscription?.status === "expired") return "expired";
    if (subscription?.status === "cancelled") return "expired";
    return "expired";
  };

  const handleAddListingClick = (e) => {
    if (!isBlocked) return;

    e.preventDefault();

    navigate("/subscription", {
      state: {
        reason: getBlockReason()
      }
    });
  };

  const handleLogout = () => {
    logout();

    toast.success("Logged out successfully", {
      style: { background: "#02BB31", color: "#fff" }
    });

    navigate("/login");
  };

  const navigationGroups = useMemo(() => {
    const groups = [
    {
      label: "Workspace",
      items: [
        { path: "/dashboard", name: "Overview", icon: FiHome, description: "Your account at a glance" },
        { path: "/listings", name: "Properties", icon: FiList, description: "Manage your listings" },
        { path: "/inquiries", name: "Inquiries", icon: FiMessageSquare, description: "Respond to property leads" },
        { path: "/stay-requests", name: "Stay requests", icon: FiCalendar, description: "Review short-stay date requests" }
      ]
    },
    {
      label: "Account",
      items: [
        { path: "/subscription", name: "Plan & billing", icon: FiCreditCard, description: "Plan, limits, and payments" },
        { path: "/kyc", name: "Verification", icon: FiShield, description: "Identity and ownership checks" },
        { path: "/profile", name: "Profile", icon: FiUser, description: "Personal and business details" }
      ]
    },
    {
      label: "Help",
      items: [
        { path: "/support", name: "Support tickets", icon: FiHelpCircle, description: "Contact and track support" }
      ]
    }
    ];
    const advanced = ["premium", "pro"].includes(subscription?.plan) && subscription?.status === "active";
    if (advanced && (user?.role === "landlord" || user?.teamPermissions?.includes("reports"))) {
      groups[0].items.push({ path: "/team", name: "Company workspace", icon: FiUsers, description: "Agents, assignments, and reports" });
    }
    if (user?.role === "landlord_staff") return groups.filter((group) => group.label === "Workspace");
    return groups;
  }, [subscription?.plan, subscription?.status, user?.role, user?.teamPermissions]);

  const navigationItems = navigationGroups.flatMap((group) => group.items);

  const isActivePath = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    return location.pathname.startsWith(path);
  };

  const currentPage = navigationItems.find((item) => isActivePath(item.path));

  return (
    <div className="min-h-screen bg-[#F5F8F6]">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 text-white transition-[width,transform] duration-200 ease-out
          ${isSidebarOpen ? "w-[17rem]" : "w-[17rem] lg:w-20"}
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          border-r border-[#24534D] bg-[#123D38] shadow-xl lg:shadow-none`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-[4.5rem] shrink-0 items-center justify-between border-b border-white/10 px-4">
            <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} aria-label={!isSidebarOpen ? "RendaHomes landlord overview" : undefined} className="flex min-w-0 items-center gap-3 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-[#123D38]"><FiHome className="text-lg" /></span>
              {isSidebarOpen && <span className="min-w-0"><span className="block truncate text-sm font-bold text-white">RendaHomes</span><span className="block text-[11px] text-emerald-100/75">LANDLORD PORTAL</span></span>}
            </Link>
            <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="grid h-10 w-10 place-items-center rounded text-emerald-50 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300 lg:hidden" aria-label="Close navigation"><FiX size={20} /></button>
            <button type="button" onClick={() => setIsSidebarOpen((open) => !open)} className="hidden h-9 w-9 place-items-center rounded text-emerald-50 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300 lg:grid" aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"} aria-expanded={isSidebarOpen}>
              {isSidebarOpen ? <FiChevronLeft size={18} /> : <FiChevronRight size={18} />}
            </button>
          </div>

          <div className={`border-b border-white/10 px-4 py-4 ${!isSidebarOpen ? "lg:px-3" : ""}`}>
            <div className={`flex items-center gap-3 ${!isSidebarOpen ? "lg:justify-center" : ""}`}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#D7F0E1] text-sm font-bold text-[#164D3C]">{user?.name?.trim()?.charAt(0)?.toUpperCase() || "L"}</span>
              {isSidebarOpen && <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{user?.name || "Landlord"}</p><p className="truncate text-xs text-emerald-100/70">{user?.email || ""}</p></div>}
            </div>
            {isSidebarOpen && <div className="mt-4"><div className="flex items-center justify-between gap-2 text-xs"><span className="font-semibold text-white">{planName} plan</span><span className={`capitalize ${isSubscriptionActive ? "text-emerald-200" : "text-amber-200"}`}>{subscription?.status?.replaceAll("_", " ") || "Inactive"}</span></div>{usage?.limit > 0 && <><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15"><div className={`h-full rounded-full transition-all ${isUsageHigh ? "bg-amber-300" : "bg-emerald-300"}`} style={{ width: `${usagePercentage}%` }} /></div><div className="mt-1.5 flex justify-between text-[11px] text-emerald-50/70"><span>{usage.used} of {usage.limit} listing slots</span><span>{usage.remaining} left</span></div></>}</div>}
          </div>

          <button type="button" aria-label="Add property" onClick={(event) => { if (isBlocked) handleAddListingClick(event); else navigate("/listings/new"); setIsMobileMenuOpen(false); }} className={`mx-3 mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#D7F0E1] px-3 text-sm font-semibold text-[#164D3C] transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 ${!isSidebarOpen ? "lg:mx-2 lg:px-0" : ""}`} title={!isSidebarOpen ? "Add property" : undefined}>
            <FiPlusCircle className="shrink-0 text-lg" />{isSidebarOpen && <span>Add property</span>}
          </button>

          <nav aria-label="Landlord navigation" className="mt-4 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
            {navigationGroups.map((group) => (
              <div key={group.label}>
                {isSidebarOpen && <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-100/55">{group.label}</p>}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActivePath(item.path);
                    return (
                      <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)} aria-label={!isSidebarOpen ? item.name : undefined} aria-current={active ? "page" : undefined} title={!isSidebarOpen ? item.name : undefined} className={`group flex min-h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 ${!isSidebarOpen ? "lg:justify-center lg:px-0" : ""} ${active ? "bg-[#D7F0E1] font-semibold text-[#164D3C]" : "text-emerald-50/80 hover:bg-white/10 hover:text-white"}`}>
                        <Icon className={`shrink-0 text-[18px] ${active ? "text-[#126542]" : "text-emerald-100/75"}`} />
                        {isSidebarOpen && <span className="min-w-0"><span className="block truncate">{item.name}</span><span className={`mt-0.5 block truncate text-[11px] font-normal ${active ? "text-[#3E6756]" : "text-emerald-50/55"}`}>{item.description}</span></span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/10 p-3">
            <button type="button" onClick={handleLogout} aria-label="Log out" title={!isSidebarOpen ? "Log out" : undefined} className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-rose-100/85 transition-colors hover:bg-rose-300/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300 ${!isSidebarOpen ? "lg:justify-center lg:px-0" : ""}`}>
              <FiLogOut className="shrink-0 text-lg" />{isSidebarOpen && <span>Log out</span>}
            </button>
          </div>
        </div>
      </aside>

      <main
        className={`transition-all duration-200 ${
          isSidebarOpen ? "lg:ml-[17rem]" : "lg:ml-20"
        } ml-0 min-h-screen`}
      >
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="px-4 py-3.5 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="grid h-10 w-10 place-items-center rounded-md text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 lg:hidden"
                aria-label="Open menu"
              >
                <FiMenu className="text-xl" />
              </button>

              <div className="flex-1 ml-4 lg:ml-0">
                <h1 className="text-lg font-bold text-slate-950">
                  {currentPage?.name || "Dashboard"}
                </h1>

                <p className="text-xs text-slate-500">{currentPage?.description || "Landlord workspace"}</p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <Link to="/subscription" className="hidden min-h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:inline-flex"><FiCreditCard className="text-emerald-800" />{planName} plan</Link>

                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex min-h-10 items-center gap-2 rounded-md px-2 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700"
                    aria-label="User menu"
                    aria-expanded={showUserMenu}
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#D7F0E1] text-sm font-bold text-[#164D3C]">
                      {user?.name?.charAt(0).toUpperCase() || "L"}
                    </div>

                    <div className="hidden md:block text-left">
                      <p className="text-sm font-semibold text-slate-800">
                        {user?.name || "Landlord"}
                      </p>
                      <p className="text-xs text-slate-500">Landlord account</p>
                    </div>

                    <FiChevronDown className={`hidden text-slate-500 transition-transform md:block ${showUserMenu ? "rotate-180" : ""}`} />
                  </button>

                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setShowUserMenu(false)}
                      />

                      <div className="absolute right-0 z-40 mt-2 w-56 border border-slate-200 bg-white shadow-lg">
                        <div className="border-b border-slate-200 p-3">
                          <p className="truncate font-semibold text-slate-900">
                            {user?.name || "Landlord"}
                          </p>

                          <p className="truncate text-xs text-slate-500">
                            {user?.email || "user@example.com"}
                          </p>
                        </div>

                        <div className="p-1.5">
                          <button
                            onClick={() => {
                              navigate("/profile");
                              setShowUserMenu(false);
                            }}
                            className="flex min-h-10 w-full items-center gap-2 px-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                          >
                            <FiUser />
                            Profile
                          </button>

                          <button
                            onClick={() => {
                              handleLogout();
                              setShowUserMenu(false);
                            }}
                            className="flex min-h-10 w-full items-center gap-2 px-2 text-left text-sm text-rose-700 hover:bg-rose-50"
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

        <div className="p-4 sm:p-6 lg:p-8">
          <DashboardAlert />
          <Outlet />
        </div>
      </main>

    </div>
  );
};

export default LandlordLayout;
