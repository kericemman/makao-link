import { useEffect, useState } from "react";
import { getAdminSummary, getRecentActivity } from "../../services/admin.service";
import { Link } from "react-router-dom";
import { 
  FiHome, 
  FiUsers, 
  FiClock, 
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiDollarSign,
  FiMessageSquare,
  FiEye,
  FiRefreshCw,
  FiArrowRight,
  FiGrid,
  FiUserCheck,
  FiFileText,
  FiShoppingBag,
  FiBriefcase,
  FiShield,
  FiThumbsUp,
  FiThumbsDown,
  FiActivity
} from "react-icons/fi";
import { FaBuilding, FaKey, FaHandshake, FaBlog } from "react-icons/fa";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const [summary, setSummary] = useState({
    pendingListings: 0,
    approvedListings: 0,
    rejectedListings: 0,
    landlords: 0,
    tenants: 0,
    totalListings: 0,
    totalInquiries: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    pendingPayments: 0,
    totalSupportTickets: 0,
    openSupportTickets: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [platformHealth, setPlatformHealth] = useState({
    apiStatus: "operational",
    databaseStatus: "connected",
    responseTime: 0,
    storageUsed: 0,
    uptime: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
      fetchDashboardData();

      const interval = setInterval(() => {
        fetchDashboardData(false);
      }, 20000); // every 20 seconds

      return () => clearInterval(interval);
    }, []);

  const fetchDashboardData = async (showLoader = true) => {
      try {
        if (showLoader) setLoading(true);
        setError("");

        const data = await getAdminSummary();

        setSummary({
          pendingListings: data.summary?.pendingListings || 0,
          approvedListings: data.summary?.approvedListings || 0,
          rejectedListings: data.summary?.rejectedListings || 0,
          landlords: data.summary?.landlords || 0,
          tenants: data.summary?.tenants || 0,
          totalListings: data.summary?.totalListings || 0,
          totalInquiries: data.summary?.totalInquiries || 0,
          totalRevenue: data.summary?.totalRevenue || 0,
          activeSubscriptions: data.summary?.activeSubscriptions || 0,
          pendingPayments: data.summary?.pendingPayments || 0,
          totalSupportTickets: data.summary?.totalSupportTickets || 0,
          openSupportTickets: data.summary?.openSupportTickets || 0
        });

        try {
          const activityData = await getRecentActivity();
          setRecentActivity(activityData.activities || []);
        } catch (err) {
          setRecentActivity([]);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load admin summary");
      } finally {
        if (showLoader) setLoading(false);
      }
    };

      // Fetch platform health
      // try {
      //   const healthData = await getPlatformHealth();
      //   setPlatformHealth(healthData);
      // } catch (err) {
      //   console.log("Health endpoint not available");
      //   setPlatformHealth({
      //     apiStatus: "operational",
      //     databaseStatus: "connected",
      //     responseTime: 120,
      //     storageUsed: 45,
      //     uptime: 99.9
      //   });
      // }



  const statCards = [
    {
      title: "Pending Listings",
      value: summary.pendingListings,
      icon: FiClock,
      color: "from-yellow-400 to-yellow-500",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-600",
      link: "/admin/listings/pending",
      linkText: "Review now",
      description: "Properties awaiting approval"
    },
    {
      title: "Approved Listings",
      value: summary.approvedListings,
      icon: FiCheckCircle,
      color: "from-[#02BB31] to-[#0D915C]",
      bgColor: "bg-[#02BB31]/10",
      textColor: "text-[#02BB31]",
      link: "/admin/listings",
      linkText: "View all",
      description: "Active properties"
    },
    {
      title: "Total Landlords",
      value: summary.landlords,
      icon: FiUsers,
      color: "from-[#013E43] to-[#005C57]",
      bgColor: "bg-[#013E43]/10",
      textColor: "text-[#013E43]",
      link: "/admin/landlords",
      linkText: "View all",
      description: "Registered landlords"
    },
    {
      title: "Total Tenants",
      value: summary.tenants,
      icon: FiUsers,
      color: "from-blue-400 to-blue-500",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
      link: "/admin/tenants",
      linkText: "View all",
      description: "Registered tenants"
    },
    {
      title: "Total Listings",
      value: summary.totalListings,
      icon: FaBuilding,
      color: "from-[#02BB31] to-[#0D915C]",
      bgColor: "bg-[#02BB31]/10",
      textColor: "text-[#02BB31]",
      link: "/admin/listings",
      linkText: "View all",
      description: "All properties"
    },
    {
      title: "Total Inquiries",
      value: summary.totalInquiries,
      icon: FiMessageSquare,
      color: "from-blue-400 to-blue-500",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
      link: "/admin/inquiries",
      linkText: "View all",
      description: "Tenant messages"
    },
    {
      title: "Total Revenue",
      value: `KES ${(summary.totalRevenue || 0).toLocaleString()}`,
      icon: FiDollarSign,
      color: "from-purple-400 to-purple-500",
      bgColor: "bg-purple-100",
      textColor: "text-purple-600",
      link: "/admin/payments",
      linkText: "View details",
      description: "Lifetime earnings"
    },
    {
      title: "Active Subscriptions",
      value: summary.activeSubscriptions,
      icon: FiUserCheck,
      color: "from-emerald-400 to-emerald-500",
      bgColor: "bg-emerald-100",
      textColor: "text-emerald-600",
      link: "/admin/subscriptions",
      linkText: "Manage",
      description: "Active paying landlords"
    },
    {
      title: "Pending Payments",
      value: summary.pendingPayments,
      icon: FiClock,
      color: "from-orange-400 to-orange-500",
      bgColor: "bg-orange-100",
      textColor: "text-orange-600",
      link: "/admin/payments/pending",
      linkText: "View pending",
      description: "Awaiting confirmation"
    },
    {
      title: "Open Support Tickets",
      value: summary.openSupportTickets,
      icon: FiMessageSquare,
      color: "from-red-400 to-red-500",
      bgColor: "bg-red-100",
      textColor: "text-red-600",
      link: "/admin/support",
      linkText: "View tickets",
      description: "Need response"
    }
  ];

  const quickActions = [
    {
      title: "Review Pending Listings",
      description: `${summary.pendingListings} properties waiting for approval`,
      icon: FiEye,
      link: "/admin/listings/pending",
      color: "bg-yellow-50 hover:bg-yellow-100",
      textColor: "text-yellow-600",
      buttonColor: "bg-yellow-600 hover:bg-yellow-700"
    },
  
    {
      title: "Manage Landlords",
      description: "Review accounts and subscriptions",
      icon: FiUsers,
      link: "/admin/landlords",
      color: "bg-[#013E43]/5 hover:bg-[#013E43]/10",
      textColor: "text-[#013E43]",
      buttonColor: "bg-[#013E43] hover:bg-[#005C57]"
    },
    {
      title: "View Payments",
      description: "Track subscription payments",
      icon: FiDollarSign,
      link: "/admin/payments",
      color: "bg-purple-50 hover:bg-purple-100",
      textColor: "text-purple-600",
      buttonColor: "bg-purple-600 hover:bg-purple-700"
    },
    {
      title: "Respond to Support",
      description: `${summary.openSupportTickets} open tickets`,
      icon: FiMessageSquare,
      link: "/admin/support",
      color: "bg-red-50 hover:bg-red-100",
      textColor: "text-red-600",
      buttonColor: "bg-red-600 hover:bg-red-700"
    },
    {
      title: "Manage Blog",
      description: "Create and publish articles",
      icon: FaBlog,
      link: "/admin/blogs",
      color: "bg-blue-50 hover:bg-blue-100",
      textColor: "text-blue-600",
      buttonColor: "bg-blue-600 hover:bg-blue-700"
    }
  ];

  const formatActivityTime = (date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInSeconds = Math.floor((now - activityDate) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case "landlord_registration":
        return <FiUserCheck className="text-[#02BB31]" />;
      case "listing_submission":
        return <FaBuilding className="text-yellow-500" />;
      case "payment_received":
        return <FiDollarSign className="text-purple-500" />;
      case "inquiry_sent":
        return <FiMessageSquare className="text-blue-500" />;
      case "kyc_submission":
        return <FiShield className="text-[#013E43]" />;
      default:
        return <FiActivity className="text-[#065A57]" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-[#A8D8C1]">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="text-3xl text-red-500" />
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-[#02BB31] text-white rounded-lg hover:bg-[#0D915C] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl">
              <FiHome className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">Admin Dashboard</h1>
              <p className="text-sm text-[#065A57]">
                Monitor platform activity and manage content
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchDashboardData}
              className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className="text-lg" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid - 10 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 ${card.bgColor} rounded-lg`}>
                    <Icon className={`text-xl ${card.textColor}`} />
                  </div>
                  <span className="text-xs text-[#065A57]">{card.description}</span>
                </div>
                <p className="text-sm text-[#065A57]">{card.title}</p>
                <p className="text-2xl font-bold text-[#013E43] mt-1">{card.value}</p>
                {card.link && (
                  <Link
                    to={card.link}
                    className="inline-flex items-center text-sm font-medium text-[#02BB31] hover:text-[#0D915C] mt-4 group"
                  >
                    {card.linkText}
                    <FiArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-[#013E43] flex items-center">
              <FiTrendingUp className="mr-2 text-[#02BB31]" />
              Quick Actions
            </h2>
            <p className="text-sm text-[#065A57] mt-1">
              Commonly used admin tasks
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.link}
                className={`group p-4 rounded-xl transition-all ${action.color} border border-transparent hover:border-[#A8D8C1] hover:shadow-md`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 bg-white rounded-lg shadow-sm ${action.textColor}`}>
                    <Icon className="text-xl" />
                  </div>
                  <FiArrowRight className={`text-gray-400 group-hover:translate-x-1 transition-transform ${action.textColor}`} />
                </div>
                <h3 className={`font-semibold ${action.textColor} mb-1 text-sm`}>{action.title}</h3>
                <p className="text-xs text-gray-600">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Preview */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-[#013E43] flex items-center">
              <FiClock className="mr-2 text-[#02BB31]" />
              Recent Activity
            </h2>
            <p className="text-sm text-[#065A57] mt-1">
              Latest platform events
            </p>
          </div>
          <Link
            to="/admin/audit"
            className="text-sm text-[#02BB31] hover:text-[#0D915C] flex items-center"
          >
            View All
            <FiArrowRight className="ml-1" />
          </Link>
        </div>

        <div className="space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[#F0F7F4] rounded-lg hover:bg-[#E8F3EF] transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#013E43]">{activity.description}</p>
                    <p className="text-xs text-[#065A57]">{activity.details}</p>
                  </div>
                </div>
                <span className="text-xs text-[#065A57]">{formatActivityTime(activity.createdAt)}</span>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <FiActivity className="text-3xl text-[#A8D8C1] mx-auto mb-2" />
              <p className="text-sm text-[#065A57]">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Platform Health */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
        <h2 className="text-lg font-bold text-[#013E43] mb-4 flex items-center">
          <FiCheckCircle className="mr-2 text-[#02BB31]" />
          Platform Health
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-[#F0F7F4] rounded-lg">
            <div className={`w-2 h-2 rounded-full ${platformHealth.apiStatus === "operational" ? "bg-[#02BB31]" : "bg-red-500"}`}></div>
            <div>
              <p className="text-sm font-medium text-[#013E43]">API Status</p>
              <p className="text-xs text-[#065A57] capitalize">{platformHealth.apiStatus}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-[#F0F7F4] rounded-lg">
            <div className={`w-2 h-2 rounded-full ${platformHealth.databaseStatus === "connected" ? "bg-[#02BB31]" : "bg-red-500"}`}></div>
            <div>
              <p className="text-sm font-medium text-[#013E43]">Database</p>
              <p className="text-xs text-[#065A57] capitalize">{platformHealth.databaseStatus}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-[#F0F7F4] rounded-lg">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-[#013E43]">Response Time</p>
              <p className="text-xs text-[#065A57]">{platformHealth.responseTime}ms avg</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-[#F0F7F4] rounded-lg">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-[#013E43]">Storage Used</p>
              <p className="text-xs text-[#065A57]">{platformHealth.storageUsed}%</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-[#F0F7F4] rounded-lg">
            <div className="w-2 h-2 bg-[#02BB31] rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-[#013E43]">Uptime</p>
              <p className="text-xs text-[#065A57]">{platformHealth.uptime}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;