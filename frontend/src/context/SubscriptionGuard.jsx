import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { 
  FiAlertCircle, 
  FiClock, 
  FiCheckCircle, 
  FiCreditCard,
  FiHome,
  FiArrowRight,
  FiLoader
} from "react-icons/fi";
import { FaKey } from "react-icons/fa";

const SubscriptionGuard = ({ requireListingAccess = false }) => {
  const { user, subscription, usage, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F7F4]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Verifying your subscription...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "landlord") {
    return <Navigate to="/" replace />;
  }

  if (!subscription) {
    return (
      <Navigate 
        to="/landlord/subscription" 
        replace 
        state={{ 
          reason: "no_subscription", 
          from: location.pathname 
        }} 
      />
    );
  }

  if (requireListingAccess) {
    if (subscription.status === "pending_payment") {
      return (
        <Navigate
          to="/landlord/subscription"
          replace
          state={{
            reason: "pending_payment",
            from: location.pathname,
            message: "Your subscription payment is pending confirmation. Please complete payment to list properties."
          }}
        />
      );
    }

    if (subscription.status === "grace") {
      return (
        <Navigate
          to="/landlord/subscription"
          replace
          state={{
            reason: "grace_block",
            from: location.pathname,
            message: "Your subscription is in grace period. Please renew to continue adding listings."
          }}
        />
      );
    }

    if (subscription.status === "expired" || subscription.status === "cancelled") {
      return (
        <Navigate
          to="/landlord/subscription"
          replace
          state={{
            reason: "expired",
            from: location.pathname,
            message: "Your subscription has expired. Renew to continue listing properties."
          }}
        />
      );
    }

    if (usage.used >= usage.limit) {
      return (
        <Navigate
          to="/landlord/subscription"
          replace
          state={{
            reason: "limit_reached",
            from: location.pathname,
            message: `You've reached your listing limit of ${usage.limit} properties. Upgrade your plan to add more listings.`
          }}
        />
      );
    }
  }

  return <Outlet />;
};

export default SubscriptionGuard;

// Optional: Helper component for subscription status banners
export const SubscriptionStatusBanner = () => {
  const { subscription, usage } = useAuth();
  const location = useLocation();

  if (!subscription) return null;

  const getBannerStyle = () => {
    switch(subscription.status) {
      case "pending_payment":
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          text: "text-yellow-700",
          icon: <FiClock className="text-yellow-500" />
        };
      case "grace":
        return {
          bg: "bg-orange-50",
          border: "border-orange-200",
          text: "text-orange-700",
          icon: <FiAlertCircle className="text-orange-500" />
        };
      case "expired":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-700",
          icon: <FiAlertCircle className="text-red-500" />
        };
      case "active":
        if (usage.used >= usage.limit) {
          return {
            bg: "bg-blue-50",
            border: "border-blue-200",
            text: "text-blue-700",
            icon: <FiAlertCircle className="text-blue-500" />
          };
        }
        return null;
      default:
        return null;
    }
  };

  const bannerStyle = getBannerStyle();
  if (!bannerStyle) return null;

  const getMessage = () => {
    if (subscription.status === "pending_payment") {
      return "Your subscription payment is pending confirmation. Complete payment to unlock all features.";
    }
    if (subscription.status === "grace") {
      return `Your subscription is in grace period. You have ${subscription.graceDaysRemaining || 7} days to renew before listings are hidden.`;
    }
    if (subscription.status === "expired") {
      return "Your subscription has expired. Renew now to restore your listings.";
    }
    if (usage.used >= usage.limit) {
      return `You've reached your listing limit of ${usage.limit} properties. Upgrade to add more listings.`;
    }
    return "";
  };

  return (
    <div className={`${bannerStyle.bg} border ${bannerStyle.border} rounded-lg p-4 mb-6`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {bannerStyle.icon}
        </div>
        <div className="flex-1">
          <p className={`text-sm ${bannerStyle.text}`}>
            {getMessage()}
          </p>
          <div className="mt-3">
            <button
              onClick={() => window.location.href = "/landlord/subscription"}
              className={`inline-flex items-center text-sm font-medium ${bannerStyle.text} hover:underline`}
            >
              Manage Subscription
              <FiArrowRight className="ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Optional: Helper component for listing limit warning
export const ListingLimitWarning = () => {
  const { usage, subscription } = useAuth();
  
  if (!subscription || subscription.status !== "active") return null;
  
  const remaining = usage.limit - usage.used;
  const percentage = (usage.used / usage.limit) * 100;
  
  if (remaining > 2) return null;
  
  const getWarningStyle = () => {
    if (remaining === 0) {
      return {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-700",
        icon: <FiAlertCircle className="text-red-500" />
      };
    }
    if (remaining === 1) {
      return {
        bg: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-700",
        icon: <FiAlertCircle className="text-orange-500" />
      };
    }
    return {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-700",
      icon: <FiClock className="text-yellow-500" />
    };
  };
  
  const warningStyle = getWarningStyle();
  
  return (
    <div className={`${warningStyle.bg} border ${warningStyle.border} rounded-lg p-4 mb-6`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {warningStyle.icon}
        </div>
        <div className="flex-1">
          <p className={`text-sm ${warningStyle.text}`}>
            {remaining === 0 
              ? `You've reached your listing limit of ${usage.limit} properties. Upgrade your plan to add more.`
              : `You have ${remaining} listing slot${remaining !== 1 ? "s" : ""} remaining. Upgrade now to avoid reaching your limit.`}
          </p>
          <div className="mt-3">
            <button
              onClick={() => window.location.href = "/landlord/subscription"}
              className={`inline-flex items-center text-sm font-medium ${warningStyle.text} hover:underline`}
            >
              View Plans
              <FiArrowRight className="ml-1" />
            </button>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className={warningStyle.text}>Usage: {usage.used}/{usage.limit}</span>
          <span className={warningStyle.text}>{Math.round(percentage)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${percentage === 100 ? 'bg-red-500' : percentage > 85 ? 'bg-orange-500' : 'bg-yellow-500'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};