import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  changeSubscriptionPlan,
  getMySubscription,
  initializeSubscriptionPayment
} from "../../services/payment.service";
import { useAuth } from "../../context/AuthContext";
import {
  FiCreditCard,
  FiCheckCircle,
  FiCheck,
  FiAlertCircle,
  FiClock,
  FiTrendingUp,
  FiHome,
  FiArrowRight,
  FiInfo,
  FiAward,
  FiStar,
  FiXCircle
} from "react-icons/fi";
import toast from "react-hot-toast";

const allPlans = [
  {
    key: "normal",
    name: "Free",
    audience: "For an individual landlord starting out",
    price: 0,
    limit: 2,
    icon: FiHome,
    features: [
      "Publish up to 2 active listings",
      "Create and manage property listings",
      "Receive tenant inquiries",
      "Update listing details and availability",
      "Listings reviewed before going public",
      "Property pages discoverable on RendaHomes"
    ],
    whatsappAddon: true
  },
  {
    key: "basic",
    name: "Basic",
    audience: "For growing property owners",
    price: 500,
    limit: 7,
    icon: FiStar,
    features: [
      "Publish up to 7 active listings",
      "Create and manage property listings",
      "Receive tenant inquiries",
      "Update listing details and availability",
      "Listings reviewed before going public",
      "Property pages discoverable on RendaHomes"
    ],
    whatsappAddon: true
  },
  {
    key: "premium",
    name: "Premium",
    audience: "For active property owners managing up to 15 listings",
    price: 1500,
    limit: 15,
    icon: FiTrendingUp,
    featured: true,
    features: [
      "Publish up to 15 active listings",
      "Eligible listings appear in featured discovery",
      "Create and manage property listings",
      "Receive and manage tenant inquiries",
      "Update listing details and availability",
      "Listings reviewed before going public",
      "Portfolio performance view for listing views and inquiries"
    ],
    planned: ["Automated direct WhatsApp listing and notifications are not live yet"]
  },
  {
    key: "pro",
    name: "Pro",
    audience: "For real-estate companies and larger portfolios",
    price: 2500,
    limit: 50,
    icon: FiAward,
    features: [
      "Publish up to 50 active listings",
      "All Premium listing and inquiry features",
      "Pro listings rank ahead in featured discovery",
      "Create and manage property listings",
      "Update listing details and availability",
      "Group properties by building and unit category in the dashboard"
    ],
    planned: [
      "Automated WhatsApp intake for multiple properties is not live yet",
      "Combined public building pages and live remaining-unit totals are still in development"
    ]
  }
];

const planOrder = ["normal", "basic", "premium", "pro"];

const statusStyles = {
  free: "bg-gray-100 text-gray-700 border-gray-200",
  pending_payment: "bg-yellow-100 text-yellow-700 border-yellow-200",
  active: "bg-[#02BB31]/10 text-[#02BB31] border-[#02BB31]/20",
  grace: "bg-orange-100 text-orange-700 border-orange-200",
  expired: "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-gray-100 text-gray-700 border-gray-200"
};

const statusIcons = {
  free: <FiInfo />,
  pending_payment: <FiClock />,
  active: <FiCheckCircle />,
  grace: <FiAlertCircle />,
  expired: <FiAlertCircle />,
  cancelled: <FiXCircle />
};

const LandlordSubscription = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshSubscription } = useAuth();

  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState({ used: 0, limit: 0, remaining: 0 });
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [upgradeLoadingPlan, setUpgradeLoadingPlan] = useState("");
  const [expandedPlans, setExpandedPlans] = useState({});
  const [error, setError] = useState("");

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMySubscription();

      setSubscription(data.subscription || null);
      setUsage(data.usage || { used: 0, limit: 0, remaining: 0 });

      if (refreshSubscription) {
        await refreshSubscription();
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load subscription";
      setError(message);

      toast.error(message, {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  useEffect(() => {
    if (
      subscription &&
      ["active", "free"].includes(subscription.status) &&
      location.state?.reason
    ) {
      navigate(location.pathname, {
        replace: true,
        state: null
      });
    }
  }, [subscription, location.pathname, location.state, navigate]);

  const guardReason =
    subscription && ["active", "free"].includes(subscription.status)
      ? null
      : location.state?.reason;

  const currentPlanDetails =
    allPlans.find((plan) => plan.key === subscription?.plan) || allPlans[0];

  const currentPlanIndex = planOrder.indexOf(subscription?.plan || "normal");

  const usagePercentage = useMemo(() => {
    if (!Number(usage.limit)) return 0;
    return Math.min((Number(usage.used) / Number(usage.limit)) * 100, 100);
  }, [usage]);

  const showPaymentAction =
    subscription &&
    subscription.plan !== "normal" &&
    ["pending_payment", "grace", "expired"].includes(subscription.status);

  const formatCurrency = (price) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0
    }).format(price);

  const handlePayNow = async () => {
    try {
      setPayLoading(true);
      setError("");

      const data = await initializeSubscriptionPayment();

      if (!data.authorization_url) {
        throw new Error("Payment URL not returned");
      }

      window.location.href = data.authorization_url;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to initialize payment";

      setError(message);

      toast.error(message, {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setPayLoading(false);
    }
  };

  const handlePlanChange = async (planKey) => {
    try {
      setUpgradeLoadingPlan(planKey);
      setError("");

      const result = await changeSubscriptionPlan({ plan: planKey });

      if (refreshSubscription) {
        await refreshSubscription();
      }

      if (!result.requiresPayment) {
        toast.success(result.message || "Plan changed", {
          style: { background: "#02BB31", color: "#fff" }
        });

        await fetchSubscription();
        return;
      }

      const data = await initializeSubscriptionPayment();

      if (!data.authorization_url) {
        throw new Error("Payment URL not returned");
      }

      window.location.href = data.authorization_url;
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Failed to change plan";

      setError(message);

      toast.error(message, {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setUpgradeLoadingPlan("");
    }
  };

  const renderGuardReason = () => {
    if (!guardReason) return null;

    const messages = {
      pending_payment: "Complete payment before creating listings.",
      grace_block: "Renew your subscription before adding new listings.",
      expired: "Your subscription has expired. Renew to continue.",
      limit_reached: "You reached your listing limit. Upgrade to add more properties."
    };

    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
        <div className="flex gap-3">
          <FiAlertCircle className="mt-0.5" />
          <p>{messages[guardReason] || "Please review your subscription."}</p>
        </div>
      </div>
    );
  };

  const renderStatusMessage = () => {
    if (!subscription) return null;
    const messages = {
      free: `You are on the Free plan. You can publish up to ${usage.limit} active listings.`,
      pending_payment: `Your ${subscription.plan?.toUpperCase()} plan is waiting for payment.`,
      active: `Your subscription is active. You can publish up to ${usage.limit} active listings.`,
      grace: "Your account is in grace period. Renew to continue adding listings.",
      expired: "Your subscription has expired. Renew to restore listing access.",
      cancelled: "Your subscription has been cancelled."
    };
    return messages[subscription.status] || "Subscription status unavailable.";
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#A8D8C1] border-t-[#02BB31]" />
          <p className="text-[#065A57]">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (error && !subscription) {
    return (
      <div className="rounded-2xl border border-[#A8D8C1] bg-white p-8 text-center shadow-lg">
        <FiAlertCircle className="mx-auto mb-4 text-4xl text-red-500" />
        <p className="mb-4 text-red-600">{error}</p>

        <button
          onClick={fetchSubscription}
          className="rounded-lg bg-[#02BB31] px-4 py-2 text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-8rem)] w-full max-w-[1600px] space-y-6 text-slate-900">
      {renderGuardReason()}

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Your current plan</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">{currentPlanDetails.name}</h2>
              <p className="mt-1 text-sm text-slate-600">{currentPlanDetails.price === 0 ? "Free" : `${formatCurrency(currentPlanDetails.price)} per month`}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-sm font-semibold capitalize ${statusStyles[subscription?.status] || statusStyles.free}`}>
              {statusIcons[subscription?.status] || statusIcons.free}
              {subscription?.status?.replaceAll("_", " ") || "unknown"}
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active listings</p>
              <p className="mt-2 text-xl font-bold text-slate-950">{usage.used} <span className="text-sm font-medium text-slate-500">/ {usage.limit}</span></p>
              <p className="mt-1 text-xs text-slate-600">{usage.remaining} slots remaining</p>
            </div>
            <div className="border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Billing date</p>
              <p className="mt-2 text-base font-bold text-slate-950">{subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "Not available"}</p>
              <p className="mt-1 text-xs text-slate-600">Next renewal or plan expiry</p>
            </div>
            <div className="border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Plan price</p>
              <p className="mt-2 text-base font-bold text-slate-950">{currentPlanDetails.price === 0 ? "KES 0" : `${formatCurrency(currentPlanDetails.price)} / mo`}</p>
              <p className="mt-1 text-xs text-slate-600">Billed monthly in KES</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex justify-between text-sm"><span className="font-semibold text-slate-700">Listing capacity</span><span className="text-slate-600">{Math.round(usagePercentage)}%</span></div>
            <div className="h-2 overflow-hidden bg-slate-100"><div className="h-full bg-emerald-700 transition-[width]" style={{ width: `${usagePercentage}%` }} /></div>
            <p className="mt-2 text-xs text-slate-500">{renderStatusMessage()}</p>
          </div>

          {showPaymentAction && <button onClick={handlePayNow} disabled={payLoading} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 bg-emerald-800 px-5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50">{payLoading ? "Redirecting..." : <><FiCreditCard /> Pay / renew subscription</>}</button>}
        </div>

        <aside className="border border-emerald-200 bg-[#F0F8F3] p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">WhatsApp listing</p>
          <h2 className="mt-2 text-xl font-bold text-slate-950">List your property directly on WhatsApp</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">Free and Basic landlords can add WhatsApp listing for KES 300 per month. Premium and Pro include the listing entitlement. Your plan and add-on controls are available here in the signed-in dashboard.</p>
          <p className="mt-3 text-xs leading-5 text-slate-600">WhatsApp plan eligibility is shown here. Automated WhatChimp intake and notification workflows are not live yet.</p>
        </aside>
      </section>

      <section aria-labelledby="plan-comparison-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Plans & limits</p><h2 id="plan-comparison-heading" className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">Choose the right listing capacity</h2></div>
          <p className="text-sm text-slate-600">Paid plan changes take effect after payment. Free downgrades take effect at period end.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {allPlans.map((plan) => {
            const isCurrent = plan.key === subscription?.plan;
            const planIndex = planOrder.indexOf(plan.key);
            const isUpgrade = planIndex > currentPlanIndex;
            const isDowngrade = planIndex < currentPlanIndex;
            const visibleFeatures = expandedPlans[plan.key] ? plan.features : plan.features.slice(0, 5);
            const PlanIcon = plan.icon;

            return (
              <article key={plan.key} className={`flex min-w-0 flex-col border bg-white ${plan.featured ? "border-emerald-700 ring-1 ring-emerald-700" : "border-slate-200"}`}>
                <div className={`border-b p-5 ${plan.featured ? "bg-emerald-50" : "bg-white"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div><span className="inline-flex h-9 w-9 items-center justify-center bg-emerald-100 text-emerald-900"><PlanIcon /></span><h3 className="mt-3 text-lg font-bold text-slate-950">{plan.name}</h3></div>
                    {isCurrent ? <span className="border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800">Current plan</span> : plan.featured ? <span className="bg-emerald-800 px-2.5 py-1 text-xs font-semibold text-white">Popular</span> : null}
                  </div>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-slate-600">{plan.audience}</p>
                  <p className="mt-4 text-2xl font-bold text-slate-950">{plan.price === 0 ? "Free" : formatCurrency(plan.price)}<span className="ml-1 text-xs font-medium text-slate-500">{plan.price ? "/ month" : "forever"}</span></p>
                  <p className="mt-1 text-sm font-semibold text-emerald-900">Up to {plan.limit} active listings</p>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <ul className="space-y-3" aria-label={`${plan.name} plan features`}>
                    {visibleFeatures.map((feature) => <li key={feature} className="flex items-start gap-2 text-sm leading-5 text-slate-700"><FiCheck className="mt-0.5 shrink-0 text-emerald-700" />{feature}</li>)}
                  </ul>
                  {plan.features.length > 5 && <button type="button" aria-expanded={Boolean(expandedPlans[plan.key])} onClick={() => setExpandedPlans((current) => ({ ...current, [plan.key]: !current[plan.key] }))} className="mt-3 self-start text-xs font-semibold text-emerald-800 underline underline-offset-2">{expandedPlans[plan.key] ? "Show less" : `View all ${plan.features.length} features`}</button>}

                  {plan.whatsappAddon && <div className="mt-4 border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-950"><span className="font-bold">Optional:</span> WhatsApp listing is KES 300/month, managed from your signed-in dashboard.</div>}
                  {plan.key === "premium" && <div className="mt-4 border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">WhatsApp listing is included in the plan. Automated WhatChimp listing and notifications are not live yet.</div>}
                  {plan.key === "pro" && <div className="mt-4 border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">WhatsApp listing is included. Portfolio grouping is available in this dashboard; automated multi-property intake and combined public building/unit pages are still in development.</div>}

                  <div className="mt-auto pt-5">
                    {isCurrent ? <div className="flex min-h-11 items-center justify-center border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-900">You are on this plan</div> : <button type="button" onClick={() => handlePlanChange(plan.key)} disabled={Boolean(upgradeLoadingPlan)} className={`inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60 ${isDowngrade ? "bg-slate-800 hover:bg-slate-900" : "bg-emerald-800 hover:bg-emerald-900"}`}>{upgradeLoadingPlan === plan.key ? "Processing..." : <>{isUpgrade ? "Upgrade" : "Downgrade"}<FiArrowRight /></>}</button>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {error && subscription && <div role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
    </div>
  );
};

export default LandlordSubscription;
