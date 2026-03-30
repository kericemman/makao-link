import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  changeSubscriptionPlan,
  getMySubscription,
  initializeSubscriptionPayment
} from "../../services/payment.service";

const allPlans = [
  { key: "normal", name: "Normal", price: 0, limit: 1 },
  { key: "basic", name: "Basic", price: 500, limit: 5 },
  { key: "premium", name: "Premium", price: 1500, limit: 15 },
  { key: "pro", name: "Pro", price: 2500, limit: 100 }
];

const statusStyles = {
  free: "bg-slate-100 text-slate-700",
  pending_payment: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  grace: "bg-orange-100 text-orange-700",
  expired: "bg-red-100 text-red-700",
  cancelled: "bg-slate-200 text-slate-700"
};

const planOrder = ["normal", "basic", "premium", "pro"];

const LandlordSubscription = () => {
  const location = useLocation();
  const guardReason = location.state?.reason;

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
      setSubscription(data.subscription);
      setUsage(data.usage || { used: 0, limit: 0, remaining: 0 });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load subscription");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const usagePercentage = useMemo(() => {
    if (!usage.limit) return 0;
    return Math.min((usage.used / usage.limit) * 100, 100);
  }, [usage]);

  const showPaymentAction = subscription &&
    ["pending_payment", "grace", "expired"].includes(subscription.status);

  const handlePayNow = async () => {
    try {
      setPayLoading(true);
      setError("");
      const data = await initializeSubscriptionPayment();
      window.location.href = data.authorization_url;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to initialize payment");
    } finally {
      setPayLoading(false);
    }
  };

  const handleUpgrade = async (plan) => {
    try {
      setUpgradeLoadingPlan(plan);
      setError("");
      await changeSubscriptionPlan(plan);
      const data = await initializeSubscriptionPayment();
      window.location.href = data.authorization_url;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upgrade plan");
    } finally {
      setUpgradeLoadingPlan("");
    }
  };

  const renderGuardReason = () => {
    if (!guardReason) return null;

    const messages = {
      pending_payment: "You need to complete payment before you can create listings.",
      grace_block: "You cannot add new listings while your account is in grace period. Renew first.",
      expired: "Your subscription must be renewed before you can continue creating listings.",
      limit_reached: "You've reached your current listing limit. Upgrade your plan to add more properties."
    };

    return (
      <div className="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
        {messages[guardReason] || "Your subscription needs attention before you continue."}
      </div>
    );
  };

  const renderStatusMessage = () => {
    if (!subscription) return null;

    const statusMessages = {
      free: `You are currently on the free plan. You can publish up to <strong>1 active listing</strong>. Upgrade when you need more visibility and more listing slots.`,
      pending_payment: `Your <strong>${subscription.plan?.toUpperCase()}</strong> plan is waiting for payment confirmation. Complete payment to activate your subscription and begin listing properties under this plan.`,
      active: `Your subscription is active. You can currently publish up to <strong>${usage.limit} active listings</strong> on this plan.`,
      grace: `Your payment could not be processed. You are currently in a <strong>7-day grace period</strong>. Your existing listings remain visible for now, but you cannot add new ones until you renew.`,
      expired: `Your subscription has expired. Your public listings may have been temporarily removed. Renew now to restore visibility based on your current plan limit.`,
      cancelled: `Your subscription has been cancelled. Renew or upgrade to continue using paid plan benefits.`
    };

    const status = subscription.status === "free" && subscription.plan === "normal" ? "free" : subscription.status;
    const message = statusMessages[status];

    if (!message) return null;

    const bgColors = {
      free: "bg-slate-50",
      pending_payment: "bg-amber-50",
      active: "bg-emerald-50",
      grace: "bg-orange-50",
      expired: "bg-red-50",
      cancelled: "bg-slate-100"
    };

    const textColors = {
      free: "text-slate-700",
      pending_payment: "text-amber-700",
      active: "text-emerald-700",
      grace: "text-orange-700",
      expired: "text-red-700",
      cancelled: "text-slate-700"
    };

    return (
      <div className={`rounded-xl ${bgColors[status]} p-4 text-sm ${textColors[status]}`}>
        <div dangerouslySetInnerHTML={{ __html: message }} />
      </div>
    );
  };

  if (loading) {
    return <div className="p-6">Loading subscription...</div>;
  }

  if (error && !subscription) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  const currentPlanIndex = planOrder.indexOf(subscription?.plan);

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Subscription</h1>
        <p className="mt-1 text-slate-600">
          Manage your plan, billing status, and listing capacity.
        </p>
      </div>

      {renderGuardReason()}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Current Plan</p>
                <h2 className="mt-1 text-3xl font-bold text-slate-900">
                  {subscription?.plan?.toUpperCase()}
                </h2>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${
                  statusStyles[subscription?.status] || "bg-slate-100 text-slate-700"
                }`}
              >
                {subscription?.status?.replace("_", " ")}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Used Listings</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {usage.used} / {usage.limit}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {usage.remaining} slot{usage.remaining !== 1 ? "s" : ""} remaining
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Billing Date</p>
                <h3 className="mt-2 text-base font-semibold text-slate-900">
                  {subscription?.currentPeriodEnd
                    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                    : "Not available"}
                </h3>

                {subscription?.gracePeriodEnd ? (
                  <p className="mt-2 text-sm text-amber-600">
                    Grace ends on {new Date(subscription.gracePeriodEnd).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No grace period active</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                <span>Listing usage</span>
                <span>{Math.round(usagePercentage)}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all"
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
            </div>

            <div className="mt-6">{renderStatusMessage()}</div>

            {usage.used >= usage.limit && (
              <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
                You have reached your current listing limit. Upgrade your plan to publish more properties.
              </div>
            )}

            {showPaymentAction && (
              <button
                onClick={handlePayNow}
                disabled={payLoading}
                className="mt-6 rounded-lg bg-slate-900 px-5 py-3 text-white disabled:opacity-60"
              >
                {payLoading ? "Redirecting..." : "Pay / Renew Subscription"}
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Available Plans</h2>
          <p className="mt-1 text-sm text-slate-600">
            Upgrade when you need more active listing slots.
          </p>

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
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {plan.price === 0 ? "Free" : `KES ${plan.price}/month`}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Up to {plan.limit} active listing{plan.limit !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {isCurrent ? (
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                        Current Plan
                      </span>
                    ) : isUpgrade ? (
                      <button
                        onClick={() => handleUpgrade(plan.key)}
                        disabled={upgradeLoadingPlan === plan.key}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
                      >
                        {upgradeLoadingPlan === plan.key ? "Processing..." : "Upgrade"}
                      </button>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        Lower Plan
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default LandlordSubscription;