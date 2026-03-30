import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const DashboardAlert = () => {
  const navigate = useNavigate();
  const { subscription, usage } = useAuth();

  if (!subscription) return null;

  const isFree = subscription.status === "free" && subscription.plan === "normal";
  const atLimit = usage.used >= usage.limit;

  if (subscription.status === "pending_payment") {
    return (
      <AlertCard
        tone="amber"
        title="Complete payment to activate your plan"
        description={`Your ${subscription.plan?.toUpperCase()} plan is waiting for payment confirmation. You cannot create listings until payment is completed.`}
        actionText="Pay Now"
        onAction={() => navigate("/landlord/subscription")}
      />
    );
  }

  if (subscription.status === "grace") {
    return (
      <AlertCard
        tone="orange"
        title="Your account is in grace period"
        description={`Payment failed. Renew before ${
          subscription.gracePeriodEnd
            ? new Date(subscription.gracePeriodEnd).toLocaleDateString()
            : "the grace deadline"
        } to avoid listing removal.`}
        actionText="Renew Now"
        onAction={() => navigate("/landlord/subscription")}
      />
    );
  }

  if (subscription.status === "expired") {
    return (
      <AlertCard
        tone="red"
        title="Your subscription has expired"
        description="Your public listings may have been removed. Renew now to restore visibility based on your current plan."
        actionText="Renew Subscription"
        onAction={() => navigate("/landlord/subscription")}
      />
    );
  }

  if (subscription.status === "cancelled") {
    return (
      <AlertCard
        tone="slate"
        title="Your subscription is cancelled"
        description="Renew or upgrade to continue using paid plan benefits."
        actionText="View Subscription"
        onAction={() => navigate("/landlord/subscription")}
      />
    );
  }

  if (isFree && atLimit) {
    return (
      <AlertCard
        tone="amber"
        title="You’ve reached your free plan limit"
        description="Upgrade your plan to add more properties and keep growing your visibility."
        actionText="Upgrade Plan"
        onAction={() => navigate("/landlord/subscription")}
      />
    );
  }

  if (!isFree && atLimit) {
    return (
      <AlertCard
        tone="amber"
        title="You’ve reached your current plan limit"
        description={`You are using ${usage.used} of ${usage.limit} listing slots. Upgrade to publish more properties.`}
        actionText="Upgrade Plan"
        onAction={() => navigate("/landlord/subscription")}
      />
    );
  }

  return null;
};

const AlertCard = ({ tone, title, description, actionText, onAction }) => {
  const toneClasses = {
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    orange: "border-orange-200 bg-orange-50 text-orange-800",
    red: "border-red-200 bg-red-50 text-red-800",
    slate: "border-slate-200 bg-slate-50 text-slate-800"
  };

  return (
    <div className={`mb-6 rounded-2xl border p-4 ${toneClasses[tone] || toneClasses.slate}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-1 text-sm">{description}</p>
        </div>

        <button
          onClick={onAction}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
        >
          {actionText}
        </button>
      </div>
    </div>
  );
};

export default DashboardAlert;