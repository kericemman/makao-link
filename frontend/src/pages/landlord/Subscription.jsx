import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  changeSubscriptionPlan,
  getMySubscription,
  initializeSubscriptionPayment
} from "../../services/payment.service";
import { 
  FiCreditCard, 
  FiCalendar, 
  FiCheckCircle, 
  FiAlertCircle,
  FiClock,
  FiShield,
  FiDollarSign,
  FiTrendingUp,
  FiHome,
  FiRefreshCw,
  FiArrowRight,
  FiInfo,
  FiBarChart2,
  FiAward,
  FiStar,
  FiZap,
  FiXCircle
} from "react-icons/fi";
import { FaKey, FaBuilding, FaHandshake } from "react-icons/fa";
import toast from "react-hot-toast";

const allPlans = [
  { key: "normal", name: "Normal", price: 0, limit: 2, icon: FiHome, color: "from-gray-400 to-gray-500", bgColor: "bg-gray-100", textColor: "text-gray-600", features: ["Basic property listing", "Direct tenant contact", "Dashboard access", "Email support"] },
  { key: "basic", name: "Basic", price: 500, limit: 5, icon: FiStar, color: "from-[#02BB31] to-[#0D915C]", bgColor: "bg-[#02BB31]/10", textColor: "text-[#02BB31]", features: ["Priority listing placement", "Email notifications", "Property analytics", "Inquiry management", "Standard support"] },
  { key: "premium", name: "Premium", price: 1500, limit: 15, icon: FiTrendingUp, color: "from-purple-400 to-purple-500", bgColor: "bg-purple-100", textColor: "text-purple-600", features: ["Featured listings", "Priority support", "Advanced analytics", "Social media promotion",] },
  { key: "pro", name: "Pro", price: 2500, limit: 50, icon: FiAward, color: "from-[#013E43] to-[#005C57]", bgColor: "bg-[#013E43]/10", textColor: "text-[#013E43]", features: ["Top marketplace visibility", "Dedicated dashboard", "Bulk property import",  "Custom branding", "24/7 priority support"] }
];

const statusStyles = {
  free: "bg-gray-100 text-gray-600 border-gray-200",
  pending_payment: "bg-yellow-100 text-yellow-600 border-yellow-200",
  active: "bg-[#02BB31]/10 text-[#02BB31] border-[#02BB31]/20",
  grace: "bg-orange-100 text-orange-600 border-orange-200",
  expired: "bg-red-100 text-red-600 border-red-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200"
};

const statusIcons = {
  free: <FiInfo className="text-gray-500" />,
  pending_payment: <FiClock className="text-yellow-500" />,
  active: <FiCheckCircle className="text-[#02BB31]" />,
  grace: <FiAlertCircle className="text-orange-500" />,
  expired: <FiAlertCircle className="text-red-500" />,
  cancelled: <FiXCircle className="text-gray-500" />
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
      toast.error("Failed to load subscription", {
        style: { background: "#013E43", color: "#fff" }
      });
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
      toast.error("Failed to initialize payment", {
        style: { background: "#013E43", color: "#fff" }
      });
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
      toast.error("Failed to upgrade plan", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setUpgradeLoadingPlan("");
    }
  };

  const renderGuardReason = () => {
    if (!guardReason) return null;

    const messages = {
      pending_payment: {
        title: "Payment Required",
        message: "You need to complete payment before you can create listings.",
        variant: "warning"
      },
      grace_block: {
        title: "Grace Period Active",
        message: "You cannot add new listings while your account is in grace period. Renew first.",
        variant: "warning"
      },
      expired: {
        title: "Subscription Expired",
        message: "Your subscription must be renewed before you can continue creating listings.",
        variant: "danger"
      },
      limit_reached: {
        title: "Listing Limit Reached",
        message: "You've reached your current listing limit. Upgrade your plan to add more properties.",
        variant: "info"
      }
    };

    const info = messages[guardReason];
    if (!info) return null;

    const variantStyles = {
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      danger: "bg-red-50 border-red-200 text-red-800",
      info: "bg-blue-50 border-blue-200 text-blue-800"
    };

    return (
      <div className={`mb-6 rounded-xl border p-4 ${variantStyles[info.variant]}`}>
        <div className="flex items-start space-x-3">
          {info.variant === "warning" && <FiAlertCircle className="text-yellow-500 mt-0.5" />}
          {info.variant === "danger" && <FiAlertCircle className="text-red-500 mt-0.5" />}
          {info.variant === "info" && <FiInfo className="text-blue-500 mt-0.5" />}
          <div>
            <h4 className="font-semibold">{info.title}</h4>
            <p className="text-sm">{info.message}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderStatusMessage = () => {
    if (!subscription) return null;

    const statusMessages = {
      free: `You are currently on the <strong>Free plan</strong>. You can publish up to <strong>${usage.limit} active listings</strong>. Upgrade when you need more visibility and more listing slots.`,
      pending_payment: `Your <strong>${subscription.plan?.toUpperCase()}</strong> plan is waiting for payment confirmation. Complete payment to activate your subscription and begin listing properties under this plan.`,
      active: `Your subscription is <strong>active</strong>. You can currently publish up to <strong>${usage.limit} active listings</strong> on this plan.`,
      grace: `Your payment could not be processed. You are currently in a <strong>7-day grace period</strong>. Your existing listings remain visible for now, but you cannot add new ones until you renew.`,
      expired: `Your subscription has <strong>expired</strong>. Your public listings may have been temporarily removed. Renew now to restore visibility based on your current plan limit.`,
      cancelled: `Your subscription has been <strong>cancelled</strong>. Renew or upgrade to continue using paid plan benefits.`
    };

    const status = subscription.status === "free" && subscription.plan === "normal" ? "free" : subscription.status;
    const message = statusMessages[status];

    if (!message) return null;

    const bgColors = {
      free: "bg-gray-50",
      pending_payment: "bg-yellow-50",
      active: "bg-[#02BB31]/10",
      grace: "bg-orange-50",
      expired: "bg-red-50",
      cancelled: "bg-gray-100"
    };

    const textColors = {
      free: "text-gray-700",
      pending_payment: "text-yellow-700",
      active: "text-[#02BB31]",
      grace: "text-orange-700",
      expired: "text-red-700",
      cancelled: "text-gray-700"
    };

    return (
      <div className={`rounded-xl ${bgColors[status]} p-4 text-sm ${textColors[status]} border border-current/10`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">{statusIcons[status]}</div>
          <div dangerouslySetInnerHTML={{ __html: message }} />
        </div>
      </div>
    );
  };

  const formatCurrency = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (error && !subscription) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-[#A8D8C1]">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="text-3xl text-red-500" />
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchSubscription}
          className="px-4 py-2 bg-[#02BB31] text-white rounded-lg hover:bg-[#0D915C] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const currentPlanIndex = planOrder.indexOf(subscription?.plan);
  const currentPlanDetails = allPlans.find(p => p.key === subscription?.plan) || allPlans[0];
  const PlanIcon = currentPlanDetails.icon;

  return (
    <div className="space-y-6">
      

      {renderGuardReason()}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Current Plan Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden">
            <div className={`h-1.5 bg-gradient-to-r ${currentPlanDetails.color}`}></div>
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start space-x-4">
                  
                  <div>
                    <p className="text-sm text-[#065A57]">Current Plan</p>
                    <h2 className="mt-1 text-xl font-bold text-[#013E43]">
                      {subscription?.plan?.toUpperCase()}
                    </h2>
                    <p className="mt-2 text-sm text-[#065A57]">
                      {currentPlanDetails.price === 0
                        ? "Free plan"
                        : `${formatCurrency(currentPlanDetails.price)} / month`}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize border ${statusStyles[subscription?.status]}`}
                >
                  {statusIcons[subscription?.status]}
                  <span className="ml-1">{subscription?.status?.replace("_", " ")}</span>
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 grid-cols-2">
                <div className="rounded-xl bg-[#F0F7F4] p-4 border border-[#A8D8C1]">
                  <p className="text-xs uppercase tracking-wide text-[#065A57] flex items-center">
                    
                    Used Listings
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-[#013E43]">
                    {usage.used} / {usage.limit}
                  </h3>
                  <p className="mt-1 text-xs md:text-lg text-[#065A57]">
                    {usage.remaining} slot{usage.remaining !== 1 ? "s" : ""} remaining
                  </p>
                </div>

                <div className="rounded-xl bg-[#F0F7F4] p-4 border border-[#A8D8C1]">
                  <p className="text-xs uppercase tracking-wide text-[#065A57] flex items-center">
                    <FiCalendar className="mr-1" />
                    Billing Date
                  </p>
                  <h3 className="mt-2 text-sm md:text-lg font-semibold text-[#013E43]">
                    {subscription?.currentPeriodEnd
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                      : "Not available"}
                  </h3>

                  {subscription?.gracePeriodEnd ? (
                    <p className="mt-2 text-sm text-lg text-orange-600 text-sm">
                      Grace ends on {new Date(subscription.gracePeriodEnd).toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs md:text-lg text-[#065A57]">No grace period active</p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-sm text-[#065A57]">
                  <span>Listing usage</span>
                  <span>{Math.round(usagePercentage)}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-[#F0F7F4]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#02BB31] to-[#0D915C] transition-all"
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
              </div>

              <div className="mt-6">{renderStatusMessage()}</div>

              {usage.used >= usage.limit && (
                <div className="mt-4 rounded-xl bg-yellow-50 p-4 text-sm text-yellow-700 border border-yellow-200">
                  <div className="flex items-start space-x-3">
                    <FiAlertCircle className="text-yellow-500 mt-0.5" />
                    <div>
                      You have reached your current listing limit. Upgrade your plan to publish more properties.
                    </div>
                  </div>
                </div>
              )}

              {showPaymentAction && (
                <button
                  onClick={handlePayNow}
                  disabled={payLoading}
                  className="mt-6 w-full py-4 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-xl font-light hover:shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {payLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <FiCreditCard className="mr-2" />
                      Pay / Renew Subscription
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Available Plans Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-[#013E43] flex items-center">
              <FiTrendingUp className="mr-2 text-[#02BB31]" />
              Available Plans
            </h2>
            <p className="mt-1 text-sm text-[#065A57]">
              Upgrade when you need more active listing slots.
            </p>

            <div className="mt-6 space-y-4">
              {allPlans.map((plan) => {
                const isCurrent = plan.key === subscription?.plan;
                const planIndex = planOrder.indexOf(plan.key);
                const isUpgrade = planIndex > currentPlanIndex;
                const PlanIconComponent = plan.icon;

                return (
                  <div
                    key={plan.key}
                    className={`rounded-xl border p-4 transition-all ${
                      isCurrent
                        ? "border-[#02BB31] bg-[#02BB31]/5"
                        : "border-[#A8D8C1] bg-white hover:border-[#02BB31] hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start space-x-3">
                        {/* <div className={`p-2 ${plan.bgColor} rounded-lg`}>
                          <PlanIconComponent className={`text-lg ${plan.textColor}`} />
                        </div> */}
                        <div>
                          <h3 className="text-lg font-semibold text-[#013E43]">{plan.name}</h3>
                          <p className="mt-1 text-sm text-[#02BB31] font-medium">
                            {plan.price === 0 ? "Free" : `${formatCurrency(plan.price)}/month`}
                          </p>
                          <p className="mt-1 text-xs text-[#065A57]">
                            Up to {plan.limit} active listing{plan.limit !== 1 ? "s" : ""}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {plan.features.slice(0, 2).map((feature, idx) => (
                              <span key={idx} className="text-xs text-[#065A57] bg-[#F0F7F4] px-2 py-0.5 rounded-full">
                                {feature}
                              </span>
                            ))}
                            {plan.features.length > 2 && (
                              <span className="text-xs text-[#065A57] bg-[#F0F7F4] px-2 py-0.5 rounded-full">
                                +{plan.features.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#02BB31] text-white">
                          <FiCheckCircle className="mr-1 text-xs" />
                          Current
                        </span>
                      ) : isUpgrade ? (
                        <button
                          onClick={() => handleUpgrade(plan.key)}
                          disabled={upgradeLoadingPlan === plan.key}
                          className="inline-flex items-center px-4 py-2 rounded-lg text-xs md:text-sm font-light bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {upgradeLoadingPlan === plan.key ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              Upgrade
                              <FiArrowRight className="ml-1 text-xs" />
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="inline-flex items-center px-5 py-1 rounded-xl text-xs font-light bg-gray-200 text-black">
                          Lower Plan
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-xl bg-[#F0F7F4] p-4 text-sm text-[#065A57] border border-[#A8D8C1]">
              <div className="flex items-start space-x-3">
                <FiInfo className="text-[#02BB31] mt-0.5" />
                <div>
                  <strong className="text-[#013E43]">Need help choosing? </strong> 
                  Upgrade or downgrade anytime with prorated billing.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && subscription && (
        <div className="bg-red-50 rounded-xl p-4 text-sm text-red-600 border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
};

export default LandlordSubscription;