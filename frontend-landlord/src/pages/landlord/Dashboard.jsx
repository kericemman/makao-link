import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
import {
  FiAlertCircle,
  FiArrowRight,
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiEye,
  FiHome,
  FiHelpCircle,
  FiLayers,
  FiLock,
  FiMessageSquare,
  FiPlus,
  FiRefreshCw,
  FiShield,
  FiSend,
  FiUser,
  FiX
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { getMyInquiries } from "../../services/inquiry.service";
import { getMyListings, groupMyPortfolioListings } from "../../services/listings.service";
import {
  getWhatsAppUpdatePreference,
  updateWhatsAppUpdatePreference
} from "../../services/user.service";
import {
  cancelWhatsAppListingAddon,
  getMySubscription,
  getWhatsAppListingAddon,
  initializeWhatsAppListingAddon
} from "../../services/payment.service";
import {
  getLandlordAlerts,
  markLandlordAlertRead,
  replyToLandlordAlert
} from "../../services/alerts.service";
import { buildWhatsAppUrl, landlordOnboardingMessage } from "../../utils/whatsapp";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))
    : "Date unavailable";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(value || 0);

const inquiryKey = (inquiry, source) => {
  const listingId = inquiry.listing?._id || inquiry.listing || "";
  const email = (inquiry.email || inquiry.user?.email || "").toLowerCase();
  return `${source}:${listingId}:${email}:${(inquiry.message || "").trim().toLowerCase()}`;
};

function StatusTag({ status }) {
  const styles = {
    approved: "bg-emerald-50 text-emerald-800",
    available: "bg-emerald-50 text-emerald-800",
    pending: "bg-amber-50 text-amber-800",
    rejected: "bg-rose-50 text-rose-800",
    taken: "bg-slate-100 text-slate-700",
    contacted: "bg-sky-50 text-sky-800",
    closed: "bg-slate-100 text-slate-700",
    new: "bg-emerald-50 text-emerald-800"
  };
  const label = (status || "unknown").replaceAll("_", " ");
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[status] || "bg-slate-100 text-slate-700"}`}>{label}</span>;
}

function LoadingDashboard() {
  return (
    <div className="space-y-6" aria-label="Loading landlord dashboard" role="status">
      <div className="h-28 animate-pulse rounded-md bg-white" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-md bg-white" />)}
      </div>
      <div className="h-64 animate-pulse rounded-md bg-white" />
    </div>
  );
}

function MobileInquiryDialog({ inquiry, onClose, onReply, sending }) {
  const [message, setMessage] = useState("");
  if (!inquiry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-5" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="mobile-inquiry-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-xl bg-white p-5 shadow-xl sm:rounded-xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-700">Mobile app inquiry</p>
            <h2 id="mobile-inquiry-title" className="mt-1 text-lg font-bold text-slate-900">{inquiry.user?.name || "Property seeker"}</h2>
            <p className="mt-1 text-sm text-slate-500">{inquiry.listing?.title || "Your property"} · {formatDate(inquiry.createdAt)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close inquiry" className="rounded p-2 text-slate-500 hover:bg-slate-100"><FiX /></button>
        </div>
        <div className="mt-5 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">{inquiry.message}</div>
        {inquiry.user?.phone && <a className="mt-3 inline-block text-sm font-semibold text-emerald-800" href={`tel:${inquiry.user.phone}`}>Call {inquiry.user.phone}</a>}
        {!!inquiry.replies?.length && (
          <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-800">Conversation</h3>
            {inquiry.replies.map((reply) => (
              <div key={reply._id} className="rounded-md border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-500">{reply.sender?.name || reply.senderRole} · {formatDate(reply.createdAt)}</p>
                <p className="mt-1 text-sm leading-5 text-slate-700">{reply.message}</p>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={(event) => { event.preventDefault(); if (message.trim()) onReply(message.trim()).then(() => setMessage("")).catch(() => {}); }} className="mt-5 border-t border-slate-200 pt-4">
          <label htmlFor="mobile-inquiry-reply" className="text-sm font-semibold text-slate-800">Reply to inquiry</label>
          <textarea id="mobile-inquiry-reply" value={message} onChange={(event) => setMessage(event.target.value)} rows={3} maxLength={2000} placeholder="Write a helpful reply..." className="mt-2 w-full resize-y rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
          <button disabled={sending || !message.trim()} type="submit" className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-md bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"><FiSend />{sending ? "Sending..." : "Send reply"}</button>
        </form>
      </section>
    </div>
  );
}

export default function DashboardHome() {
  const { user, subscription: authSubscription, syncSubscription } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState({ listings: [], webInquiries: [], appAlerts: [] });
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [usage, setUsage] = useState({ used: 0, limit: 0, remaining: 0 });
  const [whatsappData, setWhatsappData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [confirmCancelAddon, setConfirmCancelAddon] = useState(false);
  const [selectedAppAlert, setSelectedAppAlert] = useState(null);
  const [sendingReply, setSendingReply] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [whatsappPreference, setWhatsappPreference] = useState({ enabled: false, phone: "" });
  const [loadingWhatsAppPreference, setLoadingWhatsAppPreference] = useState(true);
  const [savingWhatsAppPreference, setSavingWhatsAppPreference] = useState(false);
  const [selectedPortfolioListings, setSelectedPortfolioListings] = useState([]);
  const [portfolioName, setPortfolioName] = useState("");
  const [portfolioCategory, setPortfolioCategory] = useState("");
  const [savingPortfolioGroup, setSavingPortfolioGroup] = useState(false);
  const [updatingPortfolioCategory, setUpdatingPortfolioCategory] = useState("");

  const fetchDashboardData = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setLoadError("");

    const isStaff = user?.role === "landlord_staff";
    const [listingsResult, inquiriesResult, alertsResult, subscriptionResult, addonResult] = await Promise.allSettled([
      getMyListings(),
      getMyInquiries(),
      isStaff ? Promise.resolve({ inquiries: [] }) : getLandlordAlerts(),
      getMySubscription(),
      isStaff ? Promise.resolve(null) : getWhatsAppListingAddon()
    ]);

    if (listingsResult.status === "fulfilled") {
      setDashboard((current) => ({ ...current, listings: listingsResult.value.listings || [] }));
    }
    if (inquiriesResult.status === "fulfilled") {
      setDashboard((current) => ({ ...current, webInquiries: inquiriesResult.value.inquiries || [] }));
    }
    if (alertsResult.status === "fulfilled") {
      setDashboard((current) => ({ ...current, appAlerts: alertsResult.value.inquiries || [] }));
    }
    if (subscriptionResult.status === "fulfilled") {
      setSubscriptionData(subscriptionResult.value.subscription || null);
      const nextUsage = subscriptionResult.value.usage || { used: 0, limit: 0, remaining: 0 };
      setUsage(nextUsage);
      syncSubscription(subscriptionResult.value.subscription || null, nextUsage);
    }
    if (addonResult.status === "fulfilled") setWhatsappData(addonResult.value);

    const requiredFailed = listingsResult.status === "rejected" && subscriptionResult.status === "rejected";
    const anyFailed = [listingsResult, inquiriesResult, alertsResult, subscriptionResult, addonResult]
      .some((result) => result.status === "rejected");
    if (requiredFailed) setLoadError("We couldn’t load your dashboard. Check your connection and try again.");
    else if (anyFailed) {
      setLoadError("Some dashboard information could not be refreshed. Try again shortly.");
    }

    setLoading(false);
    setRefreshing(false);
  }, [syncSubscription, user?.role]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (user?.role === "landlord_staff") {
      setLoadingWhatsAppPreference(false);
      return;
    }
    getWhatsAppUpdatePreference()
      .then((result) => setWhatsappPreference({
        enabled: Boolean(result.preference?.enabled),
        phone: result.preference?.phone || ""
      }))
      .catch(() => toast.error("Could not load your WhatsApp update preference."))
      .finally(() => setLoadingWhatsAppPreference(false));
  }, [user?.role]);

  const subscription = subscriptionData || authSubscription;
  const plan = String(subscription?.plan || "normal").trim().toLowerCase();
  const subscriptionStatus = String(subscription?.status || "").trim().toLowerCase();
  const planName = plan === "normal" ? "Free" : plan.charAt(0).toUpperCase() + plan.slice(1);
  const blocked = !subscription || ["pending_payment", "grace", "expired", "cancelled"].includes(subscriptionStatus);
  const listingLimitReached = usage.limit > 0 && usage.used >= usage.limit;
  const usagePercent = usage.limit ? Math.min((usage.used / usage.limit) * 100, 100) : 0;
  const isPremiumOrPro = ["premium", "pro"].includes(plan);
  const basePlanActive = ["free", "active"].includes(subscriptionStatus);
  const whatsappEligible = ["normal", "basic"].includes(plan) && basePlanActive;
  const addonNeedsCancellation = ["active", "past_due"].includes(whatsappData?.addon?.status);

  const inquiries = useMemo(() => {
    const web = dashboard.webInquiries.map((inquiry) => ({ ...inquiry, source: "website" }));
    const webKeys = new Set(web.map((inquiry) => inquiryKey(inquiry, "lead")));
    const app = dashboard.appAlerts
      .filter((alert) => !webKeys.has(inquiryKey(alert, "lead")))
      .map((inquiry) => ({ ...inquiry, source: "mobile_app" }));
    return [...web, ...app].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [dashboard]);

  const activeListings = dashboard.listings.filter((listing) =>
    listing.isActive && listing.availability === "available" && listing.status === "approved"
  );
  const pendingListings = dashboard.listings.filter((listing) => listing.status === "pending");
  const recentListings = [...dashboard.listings]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);
  const recentInquiries = inquiries.slice(0, 6);
  const unreadCount = inquiries.filter((inquiry) =>
    inquiry.source === "mobile_app" ? !inquiry.readByLandlord : inquiry.status === "new"
  ).length;

  const handleAddProperty = () => {
    if (blocked || listingLimitReached) {
      navigate("/subscription", { state: { reason: listingLimitReached ? "limit_reached" : "subscription_inactive" } });
      return;
    }
    navigate("/listings/new");
  };

  const handleStartWhatsappListing = async () => {
    setBusyAction("whatsapp");
    try {
      const message = `${landlordOnboardingMessage(user)}\n\nMy RendaHomes plan: ${planName}.`;
      window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
    } finally {
      setBusyAction("");
    }
  };

  const handleBuyAddon = async () => {
    setBusyAction("addon");
    try {
      const result = await initializeWhatsAppListingAddon();
      window.location.assign(result.authorization_url);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not start add-on checkout.");
      setBusyAction("");
    }
  };

  const handleCancelAddon = async () => {
    setBusyAction("cancel");
    try {
      const result = await cancelWhatsAppListingAddon();
      const remainsActive = result.addon?.currentPeriodEnd && new Date(result.addon.currentPeriodEnd) > new Date();
      setWhatsappData((current) => ({ ...current, addon: result.addon, active: Boolean(remainsActive) }));
      setConfirmCancelAddon(false);
      toast.success(result.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not cancel the add-on.");
    } finally {
      setBusyAction("");
    }
  };

  const handleWhatsAppPreferenceSubmit = async (event) => {
    event.preventDefault();
    setSavingWhatsAppPreference(true);
    try {
      const result = await updateWhatsAppUpdatePreference(whatsappPreference);
      setWhatsappPreference({
        enabled: Boolean(result.preference?.enabled),
        phone: result.preference?.phone || ""
      });
      toast.success(result.message || "WhatsApp update preference saved.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save your WhatsApp update preference.");
    } finally {
      setSavingWhatsAppPreference(false);
    }
  };

  const handlePortfolioGroupSubmit = async (event) => {
    event.preventDefault();
    if (!selectedPortfolioListings.length) {
      toast.error("Select at least one property first.");
      return;
    }
    if (!portfolioName.trim() && portfolioCategory.trim()) {
      toast.error("Enter a building or portfolio name, or leave both fields blank to remove the group.");
      return;
    }
    setSavingPortfolioGroup(true);
    try {
      const result = await groupMyPortfolioListings({
        listingIds: selectedPortfolioListings,
        portfolioName: portfolioName.trim(),
        portfolioCategory: portfolioCategory.trim()
      });
      setDashboard((current) => ({ ...current, listings: result.listings || current.listings }));
      setSelectedPortfolioListings([]);
      setPortfolioName("");
      setPortfolioCategory("");
      toast.success(portfolioName.trim() ? "Selected listings added to the portfolio group." : "Portfolio group removed from selected listings.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not group these listings.");
    } finally {
      setSavingPortfolioGroup(false);
    }
  };

  const handlePortfolioAvailability = async (listings, availability, groupKey) => {
    const eligibleListings = listings.filter((listing) => {
      if (listing.status !== "approved") return false;
      return availability === "available"
        ? listing.availability !== "available" || !listing.isActive
        : listing.availability !== "taken" || listing.isActive;
    });
    if (!eligibleListings.length) return;

    setUpdatingPortfolioCategory(groupKey);
    const updateListing = availability === "taken" ? markListingTaken : markListingAvailable;
    const results = await Promise.allSettled(eligibleListings.map((listing) => updateListing(listing._id)));
    const updatedCount = results.filter((result) => result.status === "fulfilled").length;

    if (updatedCount) {
      await fetchDashboardData(true);
      toast.success(`${updatedCount} ${updatedCount === 1 ? "listing" : "listings"} marked ${availability}.`);
    }
    if (updatedCount < eligibleListings.length) {
      const firstFailure = results.find((result) => result.status === "rejected");
      toast.error(firstFailure?.reason?.response?.data?.message || "Some listings could not be updated.");
    }
    setUpdatingPortfolioCategory("");
  };

  const openAppInquiry = async (inquiry) => {
    setSelectedAppAlert(inquiry);
    if (!inquiry.readByLandlord) {
      try {
        const result = await markLandlordAlertRead(inquiry._id);
        setSelectedAppAlert(result.inquiry || inquiry);
        setDashboard((current) => ({
          ...current,
          appAlerts: current.appAlerts.map((item) => item._id === inquiry._id ? { ...item, readByLandlord: true } : item)
        }));
      } catch {
        toast.error("Could not mark this inquiry as read.");
      }
    }
  };

  const sendAppReply = async (message) => {
    if (!selectedAppAlert) return;
    setSendingReply(true);
    try {
      const result = await replyToLandlordAlert(selectedAppAlert._id, message);
      setSelectedAppAlert(result.inquiry);
      setDashboard((current) => ({
        ...current,
        appAlerts: current.appAlerts.map((item) => item._id === selectedAppAlert._id ? result.inquiry : item)
      }));
      toast.success("Reply sent.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send your reply.");
      throw error;
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) return <LoadingDashboard />;

  const whatsappActive = Boolean(whatsappData?.active);
  const whatsappIncluded = Boolean(whatsappData?.included || (isPremiumOrPro && basePlanActive));
  const cancelAtPeriodEnd = whatsappData?.addon?.status === "non_renewing";
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "properties", label: `Properties (${dashboard.listings.length})` },
    { id: "inquiries", label: `Inquiries (${inquiries.length})` }
  ];
  const canViewPerformance = ["premium", "pro"].includes(plan) && subscriptionStatus === "active";
  const canManagePortfolio = ["premium", "pro"].includes(plan) && subscriptionStatus === "active";
  if (["premium", "pro"].includes(plan)) {
    tabs.push({
      id: "performance",
      label: canViewPerformance ? "Performance" : "Performance · Locked",
      locked: !canViewPerformance
    });
  }
  if (["premium", "pro"].includes(plan)) {
    tabs.push({
      id: "portfolio",
      label: canManagePortfolio ? "Buildings" : "Buildings · Unavailable",
      locked: !canManagePortfolio
    });
  }
  const portfolioGroups = dashboard.listings.reduce((groups, listing) => {
    if (!listing.portfolioName) return groups;
    const group = groups[listing.portfolioName] || { name: listing.portfolioName, listings: [] };
    group.listings.push(listing);
    groups[listing.portfolioName] = group;
    return groups;
  }, {});
  const totalListingViews = dashboard.listings.reduce((total, listing) => total + (Number(listing.views) || 0), 0);

  return (
    <div className="mx-auto w-full space-y-6 text-slate-900">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-slate-500">Landlord workspace · {formatDate(new Date())}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Welcome back, {user?.name?.split(" ")[0] || "Landlord"}</h1>
          <p className="mt-1 text-sm text-slate-600">Your properties, tenant leads, and plan in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => fetchDashboardData(true)} disabled={refreshing} title="Refresh dashboard" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-white disabled:opacity-50"><FiRefreshCw className={refreshing ? "animate-spin" : ""} /></button>
          <button type="button" onClick={handleAddProperty} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900"><FiPlus /> Add property</button>
        </div>
      </header>


      {loadError && (
        <div role="alert" className="flex items-center justify-between gap-4 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <span>{loadError}</span><button type="button" onClick={() => fetchDashboardData(true)} className="shrink-0 font-semibold underline">Retry</button>
        </div>
      )}

      <section className="flex flex-col justify-between gap-4 rounded-md bg-[#073F3B] px-5 py-5 text-white sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10"><FiCheckCircle /></div>
          <div>
            <p className="text-sm font-bold">{planName} plan <span className="font-medium text-white/70">· {subscription?.status?.replaceAll("_", " ") || "status unavailable"}</span></p>
            <p className="mt-1 text-sm text-white/80">{usage.used} of {usage.limit} listing slots used · {usage.remaining} remaining</p>
          </div>
        </div>
        <Link to="/subscription" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-white hover:text-emerald-200">Manage plan <FiArrowRight /></Link>
      </section>

      <nav aria-label="Dashboard sections" className="flex gap-5 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => tab.locked ? navigate("/subscription", { state: { reason: "subscription_inactive" } }) : setActiveTab(tab.id)} aria-current={activeTab === tab.id ? "page" : undefined} title={tab.locked ? "Complete payment to unlock this section" : undefined} className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-1 pb-3 text-sm font-semibold ${activeTab === tab.id ? "border-emerald-800 text-emerald-900" : tab.locked ? "border-transparent text-slate-400 hover:text-slate-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{tab.locked && <FiLock aria-hidden="true" size={13} />}{tab.label}</button>)}
      </nav>

      {activeTab === "overview" && <>
      <section aria-label="Account overview" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Active listings", value: activeListings.length, note: `${pendingListings.length} awaiting review`, icon: FiHome, tab: "properties" },
          { label: "Tenant inquiries", value: inquiries.length, note: `${unreadCount} need attention`, icon: FiMessageSquare, tab: "inquiries" },
          { label: "Listings in review", value: pendingListings.length, note: "RendaHomes moderation", icon: FiClock, tab: "properties" },
          { label: "Slots remaining", value: usage.remaining, note: `of ${usage.limit} on ${planName}`, icon: FiCheck, tab: "properties" }
        ].map(({ label, value, note, icon: Icon, tab }) => (
          <button key={label} type="button" onClick={() => setActiveTab(tab)} className="min-h-28 border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-700 hover:bg-emerald-50/40">
            <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span><Icon className="text-emerald-800" /></div>
            <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p>
          </button>
        ))}
      </section>

      <section aria-label="Listing capacity" className="border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="font-semibold text-slate-800">Listing capacity</p><p className="text-slate-600">{usage.used} / {usage.limit} slots used</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden bg-slate-100"><div className={`h-full transition-all ${usagePercent >= 100 ? "bg-amber-600" : "bg-emerald-700"}`} style={{ width: `${usagePercent}%` }} /></div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>{usagePercent >= 100 ? "You’ve reached your plan limit." : `${usage.remaining} listing slots available.`}</span>{(usagePercent >= 80 || listingLimitReached) && <Link to="/subscription" className="font-semibold text-emerald-800 hover:underline">Review plans</Link>}</div>
      </section>

      <section aria-labelledby="account-tools-heading" className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-5"><h2 id="account-tools-heading" className="font-bold text-slate-900">Account & support</h2><p className="mt-1 text-xs text-slate-500">Keep your landlord account and property records up to date.</p></div>
        <div className="grid divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { to: "/kyc", label: "Verification", detail: "Submit identity and ownership documents", icon: FiShield },
            { to: "/profile", label: "Profile", detail: "Update your contact and business details", icon: FiUser },
            { to: "/support", label: "Support tickets", detail: "Create and follow up on a support request", icon: FiHelpCircle }
          ].map(({ to, label, detail, icon: Icon }) => <Link key={to} to={to} className="flex min-h-20 items-center gap-3 px-4 py-4 hover:bg-slate-50 sm:px-5"><span className="grid h-9 w-9 shrink-0 place-items-center bg-emerald-50 text-emerald-800"><Icon /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-900">{label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{detail}</span></span><FiChevronRight className="shrink-0 text-slate-400" /></Link>)}
        </div>
      </section>

      {user?.role !== "landlord_staff" && <>
      {whatsappEligible ? (
        <section aria-labelledby="whatsapp-addon-heading" className="border border-emerald-200 bg-[#F0F8F3] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Optional monthly add-on</p>
              <h2 id="whatsapp-addon-heading" className="mt-1 text-xl font-bold text-slate-950">List your property directly on WhatsApp</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">Add WhatsApp listing to your Free or Basic plan for KES 300 per month. Start a WhatsApp chat, follow the listing prompts, and share your property details and photos there.</p>
              <ol className="mt-3 grid gap-2 text-xs leading-5 text-slate-600 sm:grid-cols-3">
                <li><span className="font-bold text-emerald-800">1.</span> Open WhatsApp from your dashboard.</li>
                <li><span className="font-bold text-emerald-800">2.</span> Follow the prompts and send property details and photos.</li>
                <li><span className="font-bold text-emerald-800">3.</span> Track your submitted listing in this dashboard.</li>
              </ol>
            </div>
            <div className="flex min-w-52 flex-col gap-2 lg:items-end">
              <p className="text-2xl font-bold text-slate-950">KES 300<span className="ml-1 text-sm font-medium text-slate-500">/ month</span></p>
              {whatsappActive ? (
                <>
                  <button type="button" onClick={handleStartWhatsappListing} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#128C4A] px-4 text-sm font-semibold text-white hover:bg-[#0C713A]"><FaWhatsapp /> Start listing on WhatsApp</button>
                  <p className="text-xs text-slate-600">{cancelAtPeriodEnd ? `Ends ${formatDate(whatsappData.addon.currentPeriodEnd)} · won’t renew` : `Active until ${formatDate(whatsappData?.addon?.currentPeriodEnd)}`}</p>
                  {!cancelAtPeriodEnd && (confirmCancelAddon ? (
                    <div className="flex items-center gap-3 text-xs"><span className="text-slate-600">Cancel auto-renewal?</span><button type="button" onClick={handleCancelAddon} disabled={busyAction === "cancel"} className="font-semibold text-rose-700 underline">{busyAction === "cancel" ? "Cancelling..." : "Confirm"}</button><button type="button" onClick={() => setConfirmCancelAddon(false)} className="text-slate-600 underline">Keep it</button></div>
                  ) : <button type="button" onClick={() => setConfirmCancelAddon(true)} className="self-center text-xs font-medium text-slate-600 underline lg:self-end">Cancel renewal</button>)}
                </>
              ) : whatsappIncluded ? (
                <button type="button" onClick={handleStartWhatsappListing} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#128C4A] px-4 text-sm font-semibold text-white hover:bg-[#0C713A]"><FaWhatsapp /> List on WhatsApp</button>
              ) : whatsappData?.configured ? (
                <button type="button" onClick={handleBuyAddon} disabled={busyAction === "addon"} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">{busyAction === "addon" ? "Opening checkout..." : "Add WhatsApp listing"}<FiArrowRight /></button>
              ) : (
                <div className="text-right"><p className="text-sm font-semibold text-amber-800">Billing setup pending</p><Link to="/support" className="mt-1 inline-block text-xs font-semibold text-emerald-800 underline">Contact support</Link></div>
              )}
            </div>
          </div>
        </section>
      ) : whatsappIncluded ? (
        <section className="flex flex-col justify-between gap-4 border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">
          <div><p className="text-sm font-bold text-slate-900">List your property directly on WhatsApp</p><p className="mt-1 text-sm text-slate-600">Open WhatsApp, follow the prompts, and send your property details and photos. Submitted listings appear in your landlord dashboard for tracking.</p>
            {whatsappActive && whatsappData?.addon?.status === "non_renewing" && <p className="mt-2 text-xs text-slate-600">Your previous KES 300 add-on will not renew and remains active until {formatDate(whatsappData.addon.currentPeriodEnd)}.</p>}
            {addonNeedsCancellation && <div className="mt-3 flex flex-wrap items-center gap-3 text-xs"><span className="text-amber-800">A separate KES 300 add-on is still renewing.</span>{confirmCancelAddon ? <><button type="button" onClick={handleCancelAddon} disabled={busyAction === "cancel"} className="font-semibold text-rose-700 underline">{busyAction === "cancel" ? "Cancelling..." : "Confirm cancel"}</button><button type="button" onClick={() => setConfirmCancelAddon(false)} className="text-slate-600 underline">Keep it</button></> : <button type="button" onClick={() => setConfirmCancelAddon(true)} className="font-semibold text-rose-700 underline">Cancel extra renewal</button>}</div>}
          </div>
          <button type="button" onClick={handleStartWhatsappListing} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-[#128C4A] px-4 text-sm font-semibold text-white hover:bg-[#0C713A]"><FaWhatsapp /> List on WhatsApp</button>
        </section>
      ) : (
        <section className="flex flex-col justify-between gap-3 border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center"><div><p className="text-sm font-bold text-amber-950">WhatsApp listing is not available on this account yet</p><p className="mt-1 text-sm text-amber-900">Activate your landlord plan to list through WhatsApp.</p></div><Link to="/subscription" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-950">Review plan <FiArrowRight /></Link></section>
      )}

      <section aria-labelledby="whatsapp-updates-heading" className="border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center bg-emerald-50 text-emerald-800"><FiBell /></span>
            <div><h2 id="whatsapp-updates-heading" className="font-bold text-slate-900">WhatsApp account updates</h2><p className="mt-1 text-xs text-slate-500">Choose whether RendaHomes may send you landlord account and property updates.</p></div>
          </div>
          <span className={`self-start border px-2.5 py-1 text-xs font-semibold sm:self-auto ${whatsappPreference.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-slate-50 text-slate-600"}`}>{whatsappPreference.enabled ? "Opted in" : "Not opted in"}</span>
        </div>
        <form onSubmit={handleWhatsAppPreferenceSubmit} className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-5">
          <div className="grid gap-4 md:grid-cols-[minmax(220px,0.8fr)_minmax(280px,1.2fr)] md:items-end">
            <label className="block text-sm font-semibold text-slate-800">WhatsApp number
              <input type="tel" autoComplete="tel" maxLength={30} value={whatsappPreference.phone} onChange={(event) => setWhatsappPreference((current) => ({ ...current, phone: event.target.value }))} placeholder="e.g. +254 712 345 678" disabled={loadingWhatsAppPreference} className="mt-1.5 min-h-11 w-full border border-slate-300 px-3 text-sm font-normal text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50" />
            </label>
            <label className="flex min-h-11 items-start gap-3 text-sm text-slate-700">
              <input type="checkbox" checked={whatsappPreference.enabled} onChange={(event) => setWhatsappPreference((current) => ({ ...current, enabled: event.target.checked }))} disabled={loadingWhatsAppPreference} className="mt-1 h-4 w-4 accent-emerald-800" />
              <span>I agree to receive landlord account and property updates on WhatsApp. I can opt out any time.</span>
            </label>
          </div>
          <button type="submit" disabled={loadingWhatsAppPreference || savingWhatsAppPreference} className="inline-flex min-h-11 items-center justify-center gap-2 bg-emerald-800 px-5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-60">{savingWhatsAppPreference ? "Saving..." : "Save preference"}</button>
          <p className="text-xs leading-5 text-slate-500 sm:col-span-2">Your consent preference is saved securely. WhatsApp message delivery is not active yet while RendaHomes connects its messaging provider.</p>
        </form>
      </section>
      </>}
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section aria-labelledby="recent-listings-title" className="border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5"><h2 id="recent-listings-title" className="font-bold text-slate-900">Your properties</h2><button type="button" onClick={() => setActiveTab("properties")} className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800">View all <FiChevronRight /></button></div>
            {recentListings.length ? <div className="divide-y divide-slate-100">{recentListings.slice(0, 4).map((listing) => <Link key={listing._id} to={`/listings/${listing._id}/edit`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 sm:px-5"><div className="h-12 w-16 shrink-0 overflow-hidden bg-slate-100">{listing.images?.[0] ? <img src={listing.images[0]} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-slate-400"><FiHome /></div>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{listing.title}</p><p className="mt-1 truncate text-xs text-slate-500">{[listing.area, listing.town, listing.county].filter(Boolean).join(", ")} · KES {formatCurrency(listing.price)}</p></div><StatusTag status={listing.status === "approved" ? listing.availability : listing.status} /><FiChevronRight className="shrink-0 text-slate-400" /></Link>)}</div> : <div className="px-5 py-10 text-center"><p className="text-sm font-semibold text-slate-800">Your first listing starts here</p><p className="mt-1 text-sm text-slate-500">Add a property to start receiving inquiries.</p><button type="button" onClick={handleAddProperty} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"><FiPlus /> Add a property</button></div>}
          </section>

          <section aria-labelledby="recent-inquiries-title" className="border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5"><div><h2 id="recent-inquiries-title" className="font-bold text-slate-900">Recent inquiries</h2><p className="mt-1 text-xs text-slate-500">Website and mobile app leads</p></div><Link to="/inquiries" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800">Inbox <FiChevronRight /></Link></div>
            {recentInquiries.length ? <div className="divide-y divide-slate-100">{recentInquiries.slice(0, 5).map((inquiry) => <button key={`${inquiry.source}-${inquiry._id}`} type="button" onClick={() => inquiry.source === "mobile_app" ? openAppInquiry(inquiry) : navigate("/inquiries")} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 sm:px-5"><div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${inquiry.source === "mobile_app" ? (inquiry.readByLandlord ? "bg-slate-300" : "bg-emerald-600") : inquiry.status === "new" ? "bg-emerald-600" : "bg-slate-300"}`} /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold text-slate-900">{inquiry.name || inquiry.user?.name || "Property seeker"}</p><span className="shrink-0 text-[10px] font-semibold uppercase text-slate-400">{inquiry.source === "mobile_app" ? "App" : "Web"}</span></div><p className="mt-1 truncate text-xs text-slate-600">{inquiry.listing?.title || "Property inquiry"}</p><p className="mt-1 line-clamp-1 text-xs text-slate-500">{inquiry.message}</p></div><span className="shrink-0 text-[10px] text-slate-400">{formatDate(inquiry.createdAt)}</span></button>)}</div> : <p className="px-5 py-10 text-center text-sm text-slate-500">New property inquiries will appear here.</p>}
          </section>
        </div>
      </>}

      {activeTab === "properties" && (
        <section className="border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5"><div><h2 className="font-bold text-slate-900">All properties</h2><p className="mt-1 text-xs text-slate-500">{dashboard.listings.length} properties in your account</p></div><button type="button" onClick={handleAddProperty} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"><FiPlus /> Add property</button></div>
          {dashboard.listings.length ? <div className="divide-y divide-slate-100">{[...dashboard.listings].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).map((listing) => <Link key={listing._id} to={`/listings/${listing._id}/edit`} className="flex items-center gap-3 px-4 py-4 hover:bg-slate-50 sm:px-5"><div className="h-14 w-20 shrink-0 overflow-hidden bg-slate-100">{listing.images?.[0] ? <img src={listing.images[0]} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-slate-400"><FiHome /></div>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{listing.title}</p><p className="mt-1 text-xs text-slate-500">{[listing.area, listing.town, listing.county].filter(Boolean).join(", ")} · KES {formatCurrency(listing.price)}</p></div><StatusTag status={listing.status === "approved" ? listing.availability : listing.status} /><FiChevronRight className="shrink-0 text-slate-400" /></Link>)}</div> : <p className="px-5 py-12 text-center text-sm text-slate-500">No properties have been added yet.</p>}
        </section>
      )}

      {activeTab === "inquiries" && (
        <section className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5"><h2 className="font-bold text-slate-900">Recent inquiries</h2><p className="mt-1 text-xs text-slate-500">Website inquiries open in your inbox. Mobile app inquiries can be replied to here.</p></div>
          {inquiries.length ? <div className="divide-y divide-slate-100">{inquiries.map((inquiry) => <button key={`${inquiry.source}-${inquiry._id}`} type="button" onClick={() => inquiry.source === "mobile_app" ? openAppInquiry(inquiry) : navigate("/inquiries")} className="flex w-full items-start gap-3 px-4 py-4 text-left hover:bg-slate-50 sm:px-5"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-slate-900">{inquiry.name || inquiry.user?.name || "Property seeker"}</p><StatusTag status={inquiry.source === "mobile_app" ? (inquiry.readByLandlord ? "contacted" : "new") : inquiry.status} /><span className="text-[10px] font-semibold uppercase text-slate-400">{inquiry.source === "mobile_app" ? "Mobile app" : "Website"}</span></div><p className="mt-1 text-xs text-slate-500">{inquiry.listing?.title || "Property inquiry"} · {formatDate(inquiry.createdAt)}</p><p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-700">{inquiry.message}</p></div><FiChevronRight className="mt-1 shrink-0 text-slate-400" /></button>)}</div> : <p className="px-5 py-12 text-center text-sm text-slate-500">No inquiries yet.</p>}
        </section>
      )}

      {activeTab === "performance" && canViewPerformance && (
        <section aria-labelledby="performance-heading" className="space-y-4">
          <div><p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Premium workspace</p><h2 id="performance-heading" className="mt-1 text-xl font-bold text-slate-950">Portfolio performance</h2><p className="mt-1 text-sm text-slate-600">A live snapshot from your listings and inquiry inbox.</p></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Listing views", value: totalListingViews, icon: FiEye },
              { label: "Inquiries", value: inquiries.length, icon: FiMessageSquare },
              { label: "Active properties", value: activeListings.length, icon: FiHome },
              { label: "Awaiting review", value: pendingListings.length, icon: FiClock }
            ].map(({ label, value, icon: Icon }) => <div key={label} className="border border-slate-200 bg-white p-4"><div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500"><span>{label}</span><Icon className="text-emerald-800" /></div><p className="mt-3 text-2xl font-bold text-slate-950">{value}</p></div>)}
          </div>
          <section className="border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-5"><h3 className="font-bold text-slate-900">Listing performance</h3><p className="mt-1 text-xs text-slate-500">Views shown where available; inquiry counts reflect the current inbox.</p></div>
            {dashboard.listings.length ? <div className="divide-y divide-slate-100">{dashboard.listings.map((listing) => {
              const listingId = String(listing._id);
              const listingInquiries = inquiries.filter((item) => String(item.listing?._id || item.listing || "") === listingId).length;
              return <div key={listingId} className="flex items-center gap-3 px-4 py-3 sm:px-5"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{listing.title}</p><p className="mt-1 truncate text-xs text-slate-500">{[listing.area, listing.town, listing.county].filter(Boolean).join(", ")}</p></div><span className="shrink-0 text-xs text-slate-600"><FiEye className="mr-1 inline" />{Number(listing.views) || 0}</span><span className="shrink-0 text-xs text-slate-600"><FiMessageSquare className="mr-1 inline" />{listingInquiries}</span></div>;
            })}</div> : <p className="px-5 py-10 text-sm text-slate-500">Add properties to start seeing portfolio performance.</p>}
          </section>
        </section>
      )}

      {activeTab === "portfolio" && canManagePortfolio && (
        <section className="space-y-5" aria-labelledby="portfolio-heading">
          <div><p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Buildings</p><h2 id="portfolio-heading" className="mt-1 text-xl font-bold text-slate-950">Manage building inventory</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Group existing listings by building, or add one listing per unit category to keep the public availability and remaining units clear.</p></div>
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <form onSubmit={handlePortfolioGroupSubmit} className="border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-center gap-2"><FiLayers className="text-emerald-800" /><h3 className="font-bold text-slate-900">Create or update a group</h3></div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-800">Building or portfolio<input value={portfolioName} onChange={(event) => setPortfolioName(event.target.value)} maxLength={80} placeholder="e.g. Riverside Apartments" className="mt-1.5 min-h-10 w-full border border-slate-300 px-3 text-sm font-normal outline-none focus:border-emerald-700" /></label>
                <label className="text-sm font-semibold text-slate-800">Unit category<input value={portfolioCategory} onChange={(event) => setPortfolioCategory(event.target.value)} maxLength={60} placeholder="e.g. 1-bedroom units" className="mt-1.5 min-h-10 w-full border border-slate-300 px-3 text-sm font-normal outline-none focus:border-emerald-700" /></label>
              </div>
              <p className="mt-4 text-xs font-semibold text-slate-600">Select properties to include</p>
              <div className="mt-2 max-h-72 divide-y divide-slate-100 overflow-y-auto border border-slate-200">
                {dashboard.listings.length ? dashboard.listings.map((listing) => {
                  const listingId = String(listing._id);
                  return <label key={listingId} className="flex cursor-pointer items-center gap-3 px-3 py-3 hover:bg-slate-50"><input type="checkbox" checked={selectedPortfolioListings.includes(listingId)} onChange={(event) => setSelectedPortfolioListings((current) => event.target.checked ? [...current, listingId] : current.filter((id) => id !== listingId))} className="h-4 w-4 accent-emerald-800" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-900">{listing.title}</span><span className="mt-0.5 block text-xs text-slate-500">{[listing.area, listing.town, listing.county].filter(Boolean).join(", ")}</span></span>{listing.portfolioName && <span className="max-w-32 truncate text-xs text-emerald-800">{listing.portfolioName}</span>}</label>;
                }) : <p className="p-4 text-sm text-slate-500">Add properties before creating portfolio groups.</p>}
              </div>
              <button type="submit" disabled={savingPortfolioGroup || selectedPortfolioListings.length === 0} className="mt-4 inline-flex min-h-10 items-center gap-2 bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50">{savingPortfolioGroup ? "Saving group..." : portfolioName.trim() ? "Save selected group" : "Remove group from selected"}<FiArrowRight /></button>
            </form>
            <section className="border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-4"><h3 className="font-bold text-slate-900">Current groups</h3><p className="mt-1 text-xs text-slate-500">Grouped listings and availability at a glance.</p></div>
              {Object.values(portfolioGroups).length ? <div className="divide-y divide-slate-100">{Object.values(portfolioGroups).map((group) => {
                const categories = group.listings.reduce((result, listing) => {
                  const categoryName = listing.portfolioCategory || "Uncategorized units";
                  result[categoryName] ||= [];
                  result[categoryName].push(listing);
                  return result;
                }, {});
                const availableCount = group.listings.filter((listing) => listing.status === "approved" && listing.availability === "available" && listing.isActive).length;
                const approvedCount = group.listings.filter((listing) => listing.status === "approved").length;
                return <div key={group.name} className="p-4">
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{group.name}</p><p className="mt-1 text-xs text-slate-500">{approvedCount} approved of {group.listings.length} listings</p></div><span className="shrink-0 text-xs font-semibold text-slate-600">{availableCount} available</span></div>
                  <div className="mt-3 h-1.5 bg-slate-100"><div className="h-full bg-emerald-700" style={{ width: `${approvedCount ? availableCount / approvedCount * 100 : 0}%` }} /></div>
                  <div className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
                    {Object.entries(categories).map(([categoryName, listings]) => {
                      const approved = listings.filter((listing) => listing.status === "approved");
                      const available = approved.filter((listing) => listing.availability === "available" && listing.isActive).length;
                      const actionKey = `${group.name}:${categoryName}`;
                      return <div key={categoryName} className="flex flex-wrap items-center gap-2 py-3">
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{categoryName}</p><p className="mt-0.5 text-xs text-slate-500">{available} available · {approved.length - available} unavailable{listings.length > approved.length ? ` · ${listings.length - approved.length} awaiting approval` : ""}</p></div>
                        <button type="button" onClick={() => handlePortfolioAvailability(approved, "available", actionKey)} disabled={!approved.some((listing) => listing.availability !== "available" || !listing.isActive) || updatingPortfolioCategory === actionKey} className="min-h-8 px-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-slate-400">{updatingPortfolioCategory === actionKey ? "Updating..." : "Set available"}</button>
                        <button type="button" onClick={() => handlePortfolioAvailability(approved, "taken", actionKey)} disabled={!approved.some((listing) => listing.availability !== "taken") || updatingPortfolioCategory === actionKey} className="min-h-8 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400">Set taken</button>
                      </div>;
                    })}
                  </div>
                </div>;
              })}</div> : <p className="p-5 text-sm text-slate-500">No groups yet. Select listings and assign them to a building or portfolio.</p>}
            </section>
          </div>
        </section>
      )}

      {blocked && subscription && (
        <div role="alert" className="flex flex-col justify-between gap-3 border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><FiAlertCircle className="mt-0.5 shrink-0 text-amber-700" /><div><p className="text-sm font-bold text-amber-950">Subscription needs attention</p><p className="mt-1 text-sm text-amber-900">Review your plan status to create or reactivate listings.</p></div></div><Link to="/subscription" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-950">Review plan <FiArrowRight /></Link></div>
      )}

      <MobileInquiryDialog
        inquiry={selectedAppAlert}
        onClose={() => setSelectedAppAlert(null)}
        onReply={sendAppReply}
        sending={sendingReply}
      />
    </div>
  );
}
