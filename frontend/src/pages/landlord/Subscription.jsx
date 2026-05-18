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
  FiCalendar,
  FiCheckCircle,
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
    name: "Normal",
    price: 0,
    limit: 2,
    icon: FiHome,
    features: ["Basic property listing", "Direct tenant contact", "Dashboard access"]
  },
  {
    key: "basic",
    name: "Basic",
    price: 500,
    limit: 7,
    icon: FiStar,
    features: ["5 More listing slots", "Inquiry management", "Email notifications"]
  },
  {
    key: "premium",
    name: "Premium",
    price: 1500,
    limit: 15,
    icon: FiTrendingUp,
    features: ["Featured listings", "Priority support", "Advanced analytics"]
  },
  {
    key: "pro",
    name: "Pro",
    price: 2500,
    limit: 50,
    icon: FiAward,
    features: ["Top visibility", "Bulk property support", "Priority support"]
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

  const handleUpgrade = async (planKey) => {
    try {
      setUpgradeLoadingPlan(planKey);
      setError("");

      await changeSubscriptionPlan({ plan: planKey });

      if (refreshSubscription) {
        await refreshSubscription();
      }

      if (planKey === "normal") {
        toast.success("Changed to free plan", {
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
        err.response?.data?.message || err.message || "Failed to upgrade plan";

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

    return (
      <div className="rounded-xl border border-[#A8D8C1] bg-[#F0F7F4] p-4 text-sm text-[#065A57]">
        {messages[subscription.status] || "Subscription status unavailable."}
      </div>
    );
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
    <div className="space-y-6">
      {renderGuardReason()}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-[#A8D8C1] bg-white p-6 shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[#065A57]">Current Plan</p>

              <h2 className="mt-1 text-2xl font-bold text-[#013E43]">
                {subscription?.plan?.toUpperCase()}
              </h2>

              <p className="mt-2 text-sm text-[#065A57]">
                {currentPlanDetails.price === 0
                  ? "Free plan"
                  : `${formatCurrency(currentPlanDetails.price)} / month`}
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium capitalize ${
                statusStyles[subscription?.status] || statusStyles.free
              }`}
            >
              {statusIcons[subscription?.status] || statusIcons.free}
              {subscription?.status?.replace("_", " ") || "unknown"}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#A8D8C1] bg-[#F0F7F4] p-4">
              <p className="text-xs uppercase text-[#065A57]">Used Listings</p>

              <h3 className="mt-2 text-xl font-bold text-[#013E43]">
                {usage.used} / {usage.limit}
              </h3>

              <p className="mt-1 text-xs text-[#065A57]">
                {usage.remaining} slots remaining
              </p>
            </div>

            <div className="rounded-xl border border-[#A8D8C1] bg-[#F0F7F4] p-4">
              <p className="flex items-center text-xs uppercase text-[#065A57]">
                <FiCalendar className="mr-1" />
                Billing Date
              </p>

              <h3 className="mt-2 text-sm font-semibold text-[#013E43] md:text-lg">
                {subscription?.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                  : "Not available"}
              </h3>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm text-[#065A57]">
              <span>Listing usage</span>
              <span>{Math.round(usagePercentage)}%</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-[#F0F7F4]">
              <div
                className="h-full bg-gradient-to-r from-[#02BB31] to-[#0D915C]"
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
          </div>

          <div className="mt-6">{renderStatusMessage()}</div>

          {showPaymentAction && (
            <button
              onClick={handlePayNow}
              disabled={payLoading}
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#02BB31] to-[#0D915C] py-4 font-semibold text-white disabled:opacity-50"
            >
              {payLoading ? (
                "Redirecting..."
              ) : (
                <>
                  <FiCreditCard className="mr-2" />
                  Pay / Renew Subscription
                </>
              )}
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-[#A8D8C1] bg-white p-6 shadow-lg">
          <h2 className="flex items-center text-xl font-bold text-[#013E43]">
            <FiTrendingUp className="mr-2 text-[#02BB31]" />
            Available Plans
          </h2>

          <div className="mt-6 space-y-4">
            {allPlans.map((plan) => {
              const isCurrent = plan.key === subscription?.plan;
              const planIndex = planOrder.indexOf(plan.key);
              const isUpgrade = planIndex > currentPlanIndex;

              return (
                <div
                  key={plan.key}
                  className={`rounded-xl border p-4 ${
                    isCurrent
                      ? "border-[#02BB31] bg-[#02BB31]/5"
                      : "border-[#A8D8C1] bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-[#013E43]">
                        {plan.name}
                      </h3>

                      <p className="mt-1 text-sm font-medium text-[#02BB31]">
                        {plan.price === 0
                          ? "Free"
                          : `${formatCurrency(plan.price)}/month`}
                      </p>

                      <p className="mt-1 text-xs text-[#065A57]">
                        Up to {plan.limit} active listings
                      </p>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {plan.features.map((feature) => (
                          <span
                            key={feature}
                            className="rounded-full bg-[#F0F7F4] px-2 py-0.5 text-xs text-[#065A57]"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    {isCurrent ? (
                      <span className="rounded-full bg-[#02BB31] px-3 py-1 text-xs text-white">
                        Current
                      </span>
                    ) : isUpgrade ? (
                      <button
                        onClick={() => handleUpgrade(plan.key)}
                        disabled={upgradeLoadingPlan === plan.key}
                        className="inline-flex items-center rounded-lg bg-[#02BB31] px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
                      >
                        {upgradeLoadingPlan === plan.key ? (
                          "Processing..."
                        ) : (
                          <>
                            Upgrade
                            <FiArrowRight className="ml-1" />
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                        Lower Plan
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl border border-[#A8D8C1] bg-[#F0F7F4] p-4 text-sm text-[#065A57]">
            <FiInfo className="mb-2 text-[#02BB31]" />
            Upgrade to increase your active listing limit.
          </div>
        </div>
      </div>

      {error && subscription && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

export default LandlordSubscription;