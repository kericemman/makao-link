import { useEffect, useMemo, useState } from "react";
import { getDashboardStats } from "../../services/dashboard.service";
import { getMySubscription } from "../../services/payment.service";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

import {
  FiHome,
  FiMessageSquare,
  FiEye,
  FiDollarSign,
  FiTrendingUp,
  FiCalendar,
  FiStar,
  FiAlertCircle
} from "react-icons/fi";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [usage, setUsage] = useState({ used: 0, limit: 0, remaining: 0 });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, subRes] = await Promise.all([
        getDashboardStats(),
        getMySubscription()
      ]);

      setStats(statsRes.data);
      setSubscriptionData(subRes.subscription);
      setUsage(subRes.usage || { used: 0, limit: 0, remaining: 0 });
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);
  }, []);

  const subscription = subscriptionData || stats?.subscription;

  const isBlocked =
    subscription &&
    ["pending_payment", "grace", "expired", "cancelled"].includes(
      subscription.status
    );

  const listingLimitReached = usage.used >= usage.limit;

  const usagePercentage = useMemo(() => {
    if (!usage.limit) return 0;
    return Math.min((usage.used / usage.limit) * 100, 100);
  }, [usage]);

  const getLocationText = (property) => {
    return [property.area, property.town, property.county]
      .filter(Boolean)
      .join(", ");
  };

  const handleAddProperty = () => {
    if (isBlocked || listingLimitReached) {
      navigate("/landlord/subscription", {
        state: {
          reason: listingLimitReached
            ? "limit_reached"
            : subscription?.status === "pending_payment"
            ? "pending_payment"
            : subscription?.status === "grace"
            ? "grace_block"
            : "expired"
        }
      });

      return;
    }

    navigate("/landlord/listings/new");
  };

  const chartData = {
    labels: stats?.recentViews?.length
      ? stats.recentViews.map((v) => v.date)
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],

    datasets: [
      {
        label: "Profile Views",
        data: stats?.recentViews?.length
          ? stats.recentViews.map((v) => v.count)
          : [0, 0, 0, 0, 0, 0, 0],

        borderColor: "#02BB31",
        backgroundColor: "rgba(2,187,49,0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#02BB31",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-10 w-10 border-4 border-[#A8D8C1] border-t-[#02BB31] rounded-full" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-10">
        <p>Unable to load dashboard stats</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Properties",
      value: stats.totalProperties || 0,
      icon: FiHome
    },
    {
      title: "Total Inquiries",
      value: stats.totalInquiries || 0,
      icon: FiMessageSquare
    },
    {
      title: "Profile Views",
      value: stats.totalViews || 0,
      icon: FiEye
    },
    {
      title: "Current Plan",
      value: subscription?.plan || "normal",
      icon: FiStar
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-[#013E43] text-white rounded-full flex items-center justify-center text-xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "L"}
            </div>

            <div>
              <h1 className="text-sm md:text-lg font-bold">
                Welcome back, {user?.name || "Landlord"}
              </h1>

              <p className="text-sm text-gray-500 flex items-center">
                <FiCalendar className="mr-1" />
                {new Date().toDateString()}
              </p>
            </div>
          </div>

          {subscription && (
            <div className="px-4 py-2  rounded-lg text-green-600 font-semibold text-sm md:text-lg capitalize">
              {subscription.plan} • {subscription.status?.replace("_", " ")}
            </div>
          )}
        </div>
      </div>

      {(isBlocked || listingLimitReached) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="mt-0.5" />

            <div>
              <p className="font-semibold">
                {listingLimitReached
                  ? "Listing limit reached"
                  : "Subscription attention required"}
              </p>

              <p className="text-sm mt-1">
                {listingLimitReached
                  ? "You have used all your active listing slots. Upgrade your plan to add more properties."
                  : "Your subscription needs attention before you can add more properties."}
              </p>

              <button
                onClick={() =>
                  navigate("/landlord/subscription", {
                    state: {
                      reason: listingLimitReached
                        ? "limit_reached"
                        : subscription?.status === "pending_payment"
                        ? "pending_payment"
                        : subscription?.status === "grace"
                        ? "grace_block"
                        : "expired"
                    }
                  })
                }
                className="mt-3 px-4 py-2 bg-[#02BB31] text-white rounded-lg text-sm"
              >
                Review Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold mb-4">Quick Actions</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={handleAddProperty}
            className="p-4 bg-gray-50 rounded hover:bg-green-500 hover:text-white text-center transition"
          >
            <FiHome className="mx-auto text-xl mb-1" />
            Add Property
          </button>

          <Link
            to="/landlord/inquiries"
            className="p-4 bg-gray-50 rounded hover:bg-green-500 hover:text-white text-center transition"
          >
            <FiMessageSquare className="mx-auto text-xl mb-1" />
            Inquiries
          </Link>

          <Link
            to="/landlord/subscription"
            className="p-4 bg-gray-50 rounded hover:bg-green-500 hover:text-white text-center transition"
          >
            <FiStar className="mx-auto text-xl mb-1" />
            Upgrade Plan
          </Link>

          <Link
            to="/landlord/support"
            className="p-4 bg-gray-50 rounded hover:bg-green-500 hover:text-white text-center transition"
          >
            <FiDollarSign className="mx-auto text-xl mb-1" />
            Support
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;

          return (
            <div
              key={i}
              className="bg-white rounded-xl shadow p-5 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-xl font-bold capitalize">{card.value}</p>
                </div>

                <Icon className="text-xl mt-8 text-[#02BB31]" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4 flex justify-between text-sm text-[#065A57]">
          <span>
            Listing usage: {usage.used} / {usage.limit}
          </span>
          <span>{Math.round(usagePercentage)}%</span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-[#F0F7F4]">
          <div
            className="h-full bg-gradient-to-r from-[#02BB31] to-[#0D915C]"
            style={{ width: `${usagePercentage}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold mb-4 flex items-center">
          <FiTrendingUp className="mr-2 text-[#02BB31]" />
          Views Overview
        </h3>

        <div className="h-64">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">Recent Properties</h3>

            <Link to="/landlord/listings" className="text-green-600 text-sm">
              View All
            </Link>
          </div>

          {stats.recentProperties?.length ? (
            stats.recentProperties.map((p) => (
              <Link
                key={p._id}
                to={`/landlord/listings/${p._id}`}
                className="block p-3 border rounded mb-2 hover:bg-gray-50"
              >
                <h4 className="font-medium">{p.title}</h4>
                <p className="text-sm text-gray-500">
                  {getLocationText(p) || p.location || "Location not set"}
                </p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-gray-500">No properties yet</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">Recent Inquiries</h3>

            <Link to="/landlord/inquiries" className="text-green-600 text-sm">
              View All
            </Link>
          </div>

          {stats.recentInquiries?.length ? (
            stats.recentInquiries.map((inq) => (
              <div
                key={inq._id}
                onClick={() => navigate(`/landlord/inquiries/${inq._id}`)}
                className="p-3 border rounded mb-2 hover:bg-gray-50 cursor-pointer"
              >
                <p className="font-medium">
                  {inq.tenantName || inq.name || "Tenant"}
                </p>
                <p className="text-sm text-gray-500">{inq.message}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No inquiries yet</p>
          )}
        </div>
      </div>

      
    </div>
  );
}

export default DashboardHome;