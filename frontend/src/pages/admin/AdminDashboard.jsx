import { useEffect, useState } from "react";
import { getAdminSummary } from "../../services/admin.service";
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
  FiFileText
} from "react-icons/fi";
import { FaBuilding, FaKey, FaHandshake, FaBlog } from "react-icons/fa";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const [summary, setSummary] = useState({
    pendingListings: 0,
    landlords: 0,
    totalListings: 0,
    totalInquiries: 0,
    totalRevenue: 0,
    activeSubscriptions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getAdminSummary();
        setSummary(data.summary || {});
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load admin summary");
        toast.error("Failed to load dashboard data", {
          style: { background: "#013E43", color: "#fff" }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const statCards = [
    {
      title: "Pending Listings",
      value: summary.pendingListings || 0,
      icon: FiClock,
      color: "from-yellow-400 to-yellow-500",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-600",
      link: "/admin/listings/pending",
      linkText: "Review now",
      description: "Properties awaiting approval"
    },
    {
      title: "Total Landlords",
      value: summary.landlords || 0,
      icon: FiUsers,
      color: "from-[#013E43] to-[#005C57]",
      bgColor: "bg-[#013E43]/10",
      textColor: "text-[#013E43]",
      link: "/admin/landlords",
      linkText: "View all",
      description: "Registered landlords"
    },
    {
      title: "Total Listings",
      value: summary.totalListings || 0,
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
      value: summary.totalInquiries || 0,
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
      value: summary.activeSubscriptions || 0,
      icon: FiUserCheck,
      color: "from-emerald-400 to-emerald-500",
      bgColor: "bg-emerald-100",
      textColor: "text-emerald-600",
      link: "/admin/subscriptions",
      linkText: "Manage",
      description: "Active paying landlords"
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
      description: "Review KYC and manage accounts",
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
      title: "Manage Blog",
      description: "Create and publish articles",
      icon: FaBlog,
      link: "/admin/blogs",
      color: "bg-blue-50 hover:bg-blue-100",
      textColor: "text-blue-600",
      buttonColor: "bg-blue-600 hover:bg-blue-700"
    }
  ];

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
          onClick={() => window.location.reload()}
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
              onClick={() => window.location.reload()}
              className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className="text-lg" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              <div className={`h-1.5 bg-gradient-to-r ${card.color}`}></div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <h3 className={`font-semibold ${action.textColor} mb-1`}>{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
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
          <div className="flex items-center justify-between p-3 bg-[#F0F7F4] rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-[#02BB31] rounded-full"></div>
              <span className="text-sm">New landlord registration</span>
            </div>
            <span className="text-xs text-[#065A57]">5 min ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#F0F7F4] rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Listing pending approval</span>
            </div>
            <span className="text-xs text-[#065A57]">1 hour ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#F0F7F4] rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">Payment received KES 5,000</span>
            </div>
            <span className="text-xs text-[#065A57]">2 hours ago</span>
          </div>
        </div>
      </div>

      {/* Platform Health */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] p-6">
        <h2 className="text-lg font-bold text-[#013E43] mb-4 flex items-center">
          <FiCheckCircle className="mr-2 text-[#02BB31]" />
          Platform Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-[#F0F7F4] rounded-lg">
            <div className="w-2 h-2 bg-[#02BB31] rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-[#013E43]">API Status</p>
              <p className="text-xs text-[#065A57]">Operational</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-[#F0F7F4] rounded-lg">
            <div className="w-2 h-2 bg-[#02BB31] rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-[#013E43]">Database</p>
              <p className="text-xs text-[#065A57]">Connected</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-[#F0F7F4] rounded-lg">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-[#013E43]">Response Time</p>
              <p className="text-xs text-[#065A57]">120ms avg</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;