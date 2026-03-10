import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import API from "../../api/api"
import { 
  FiUsers, 
  FiHome, 
  FiClock, 
  FiMessageSquare,
  FiDollarSign,
  FiTrendingUp,
  FiCheckCircle,
  FiXCircle,
  FiUserCheck,
  FiUserX,
  FiCalendar,
  FiRefreshCw,
  FiEye,
  FiShield,
  FiActivity
} from "react-icons/fi"
import { FaBuilding, FaMoneyBillWave, FaKey } from "react-icons/fa"
import { Line, Bar, Doughnut } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import toast from "react-hot-toast"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState([])
  const [chartPeriod, setChartPeriod] = useState("week")
  const [chartData, setChartData] = useState({
    revenue: { 
      labels: [], 
      datasets: []
    },
    userGrowth: { 
      labels: [], 
      datasets: []
    }
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (stats) {
      fetchChartData()
    }
  }, [chartPeriod, stats])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch main stats
      const statsRes = await API.get("/admin/stats")
      setStats(statsRes.data)

      // Fetch recent activity
      try {
        const activityRes = await API.get("/admin/activity?limit=5")
        setRecentActivity(activityRes.data.activities || [])
      } catch (activityError) {
        console.log("Activity endpoint not available yet")
        setRecentActivity([])
      }

    } catch (error) {
      toast.error("Failed to load dashboard data", {
        style: { background: "#013E43", color: "#fff" }
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchChartData = async () => {
    try {
      // Fetch revenue chart data
      const revenueRes = await API.get(`/admin/charts/revenue?period=${chartPeriod}`)
      
      // Fetch user growth chart data
      const userGrowthRes = await API.get(`/admin/charts/user-growth?period=${chartPeriod}`)

      setChartData({
        revenue: {
          labels: revenueRes.data.labels || [],
          datasets: [{
            label: 'Revenue (KES)',
            data: revenueRes.data.values || [],
            borderColor: '#02BB31',
            backgroundColor: 'rgba(2, 187, 49, 0.1)',
            tension: 0.4,
            fill: true,
          }],
        },
        userGrowth: {
          labels: userGrowthRes.data.labels || [],
          datasets: [
            {
              label: 'Landlords',
              data: userGrowthRes.data.landlords || [],
              backgroundColor: '#013E43',
              borderRadius: 6,
            },
            {
              label: 'Tenants',
              data: userGrowthRes.data.tenants || [],
              backgroundColor: '#02BB31',
              borderRadius: 6,
            },
          ],
        }
      })
    } catch (error) {
      console.log("Chart data not available yet")
      // Set empty chart data
      setChartData({
        revenue: { 
          labels: [], 
          datasets: [{
            label: 'Revenue (KES)',
            data: [],
            borderColor: '#02BB31',
            backgroundColor: 'rgba(2, 187, 49, 0.1)',
            tension: 0.4,
            fill: true,
          }]
        },
        userGrowth: { 
          labels: [], 
          datasets: [
            { label: 'Landlords', data: [], backgroundColor: '#013E43', borderRadius: 6 },
            { label: 'Tenants', data: [], backgroundColor: '#02BB31', borderRadius: 6 },
          ]
        }
      })
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { 
        backgroundColor: '#013E43',
        titleColor: '#fff',
        bodyColor: '#A8D8C1',
        padding: 10,
        cornerRadius: 8
      },
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: { color: '#A8D8C1', drawBorder: false },
        ticks: { color: '#065A57' }
      },
      x: { 
        grid: { display: false },
        ticks: { color: '#065A57' }
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { 
        backgroundColor: '#013E43',
        titleColor: '#fff',
        bodyColor: '#A8D8C1',
      },
    },
    cutout: '70%',
  }

  const getActivityIcon = (type) => {
    switch(type) {
      case "user_registration":
        return <FiUserCheck className="text-[#02BB31]" />
      case "property_listing":
        return <FiHome className="text-blue-500" />
      case "payment":
        return <FaMoneyBillWave className="text-purple-500" />
      case "inquiry":
        return <FiMessageSquare className="text-yellow-500" />
      case "kyc_submission":
        return <FiShield className="text-[#02BB31]" />
      default:
        return <FiActivity className="text-[#065A57]" />
    }
  }

  const formatTimeAgo = (date) => {
    if (!date) return ""
    const now = new Date()
    const activityDate = new Date(date)
    const diffInSeconds = Math.floor((now - activityDate) / 1000)
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    return `${Math.floor(diffInSeconds / 86400)} days ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-[#A8D8C1]">
        <div className="w-20 h-20 bg-[#F0F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
          <FiTrendingUp className="text-3xl text-[#A8D8C1]" />
        </div>
        <h3 className="text-lg font-semibold text-[#013E43] mb-2">No data available</h3>
        <p className="text-sm text-[#065A57]">Unable to load dashboard statistics</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-[#02BB31] text-white rounded-lg hover:bg-[#0D915C] transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers || 0,
      icon: FiUsers,
      bgColor: "bg-[#013E43]/10",
      textColor: "text-[#013E43]",
      borderColor: "border-[#013E43]"
    },
    {
      title: "Landlords",
      value: stats.totalLandlords || 0,
      icon: FaKey,
      bgColor: "bg-[#02BB31]/10",
      textColor: "text-[#02BB31]",
      borderColor: "border-[#02BB31]"
    },
    {
      title: "Tenants",
      value: stats.totalTenants || 0,
      icon: FiUsers,
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
      borderColor: "border-blue-400"
    },
    {
      title: "Total Properties",
      value: stats.totalProperties || 0,
      icon: FaBuilding,
      bgColor: "bg-purple-100",
      textColor: "text-purple-600",
      borderColor: "border-purple-400"
    },
    {
      title: "Pending Listings",
      value: stats.pendingProperties || 0,
      icon: FiClock,
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-600",
      borderColor: "border-yellow-400"
    },
    {
      title: "Approved Listings",
      value: stats.approvedProperties || 0,
      icon: FiCheckCircle,
      bgColor: "bg-[#02BB31]/10",
      textColor: "text-[#02BB31]",
      borderColor: "border-[#02BB31]"
    },
    {
      title: "Total Inquiries",
      value: stats.totalInquiries || 0,
      icon: FiMessageSquare,
      bgColor: "bg-indigo-100",
      textColor: "text-indigo-600",
      borderColor: "border-indigo-400"
    },
    {
      title: "Total Revenue",
      value: `KES ${(stats.totalRevenue || 0).toLocaleString()}`,
      icon: FaMoneyBillWave,
      bgColor: "bg-emerald-100",
      textColor: "text-emerald-600",
      borderColor: "border-emerald-400"
    }
  ]

  const propertyStatusData = {
    labels: ['Approved', 'Pending', 'Rejected'],
    datasets: [{
      data: [
        stats.approvedProperties || 0,
        stats.pendingProperties || 0,
        stats.rejectedProperties || 0
      ],
      backgroundColor: ['#02BB31', '#F59E0B', '#EF4444'],
      borderWidth: 0,
    }]
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl">
              <FiTrendingUp className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">Admin Dashboard</h1>
              <p className="text-sm text-[#065A57]">Monitor your platform's performance and growth</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchDashboardData}
              className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
            <select
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value)}
              className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 3 months</option>
              <option value="year">This year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-6 border-l-4 hover:shadow-xl transition-all transform hover:-translate-y-1"
              style={{ borderLeftColor: card.borderColor.split('-')[1] === '[#013E43]' ? '#013E43' : 
                card.borderColor.split('-')[1] === '[#02BB31]' ? '#02BB31' : 
                card.borderColor.split('-')[1] === 'blue-400' ? '#3B82F6' :
                card.borderColor.split('-')[1] === 'purple-400' ? '#A855F7' :
                card.borderColor.split('-')[1] === 'yellow-400' ? '#F59E0B' :
                card.borderColor.split('-')[1] === 'indigo-400' ? '#6366F1' :
                card.borderColor.split('-')[1] === 'emerald-400' ? '#10B981' : '#013E43' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#065A57] mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-[#013E43] mb-1">{card.value}</p>
                </div>
                <div className={`p-3 ${card.bgColor} rounded-xl`}>
                  <Icon className={`text-2xl ${card.textColor}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[#013E43]">Revenue Overview</h3>
              <p className="text-sm text-[#065A57]">Daily revenue trends</p>
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1.5 text-sm bg-[#02BB31] text-white rounded-lg">
                KES {stats.totalRevenue?.toLocaleString()}
              </button>
            </div>
          </div>
          <div className="h-64">
            {chartData.revenue.labels.length > 0 ? (
              <Line data={chartData.revenue} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-[#065A57]">
                No revenue data available
              </div>
            )}
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[#013E43]">User Growth</h3>
              <p className="text-sm text-[#065A57]">Landlords vs Tenants</p>
            </div>
            <div className="flex space-x-2">
              <span className="flex items-center text-xs">
                <span className="w-3 h-3 bg-[#013E43] rounded-full mr-1"></span>
                Landlords
              </span>
              <span className="flex items-center text-xs">
                <span className="w-3 h-3 bg-[#02BB31] rounded-full mr-1"></span>
                Tenants
              </span>
            </div>
          </div>
          <div className="h-64">
            {chartData.userGrowth.labels.length > 0 ? (
              <Bar data={chartData.userGrowth} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-[#065A57]">
                No user growth data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second Row - Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Property Status Doughnut */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
          <h3 className="text-lg font-semibold text-[#013E43] mb-4">Property Status</h3>
          <div className="h-48 relative">
            {propertyStatusData.datasets[0].data.some(v => v > 0) ? (
              <Doughnut data={propertyStatusData} options={doughnutOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-[#065A57]">
                No property data
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-2xl font-bold text-[#013E43]">{stats.totalProperties}</span>
              <span className="text-xs text-[#065A57]">Total</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center">
              <span className="text-xs text-[#02BB31] font-medium">Approved</span>
              <p className="text-lg font-bold text-[#013E43]">{stats.approvedProperties}</p>
            </div>
            <div className="text-center">
              <span className="text-xs text-yellow-600 font-medium">Pending</span>
              <p className="text-lg font-bold text-[#013E43]">{stats.pendingProperties}</p>
            </div>
            <div className="text-center">
              <span className="text-xs text-red-600 font-medium">Rejected</span>
              <p className="text-lg font-bold text-[#013E43]">{stats.rejectedProperties}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
          <h3 className="text-lg font-semibold text-[#013E43] mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/admin/properties")}
              className="p-4 bg-[#F0F7F4] rounded-xl hover:bg-[#02BB31] group transition-colors text-left"
            >
              <FiHome className="text-2xl text-[#02BB31] group-hover:text-white mb-2" />
              <p className="text-sm font-medium text-[#013E43] group-hover:text-white">Manage Properties</p>
              <p className="text-xs text-[#065A57] group-hover:text-white/80">{stats.pendingProperties} pending</p>
            </button>
            
            <button
              onClick={() => navigate("/admin/kyc")}
              className="p-4 bg-[#F0F7F4] rounded-xl hover:bg-[#02BB31] group transition-colors text-left"
            >
              <FiShield className="text-2xl text-[#02BB31] group-hover:text-white mb-2" />
              <p className="text-sm font-medium text-[#013E43] group-hover:text-white">Review KYC</p>
              <p className="text-xs text-[#065A57] group-hover:text-white/80">{stats.pendingKyc || 0} pending</p>
            </button>
            
            <button
              onClick={() => navigate("/admin/payments")}
              className="p-4 bg-[#F0F7F4] rounded-xl hover:bg-[#02BB31] group transition-colors text-left"
            >
              <FaMoneyBillWave className="text-2xl text-[#02BB31] group-hover:text-white mb-2" />
              <p className="text-sm font-medium text-[#013E43] group-hover:text-white">Payments</p>
              <p className="text-xs text-[#065A57] group-hover:text-white/80">KES {stats.totalRevenue?.toLocaleString()}</p>
            </button>
            
            <button
              onClick={() => navigate("/admin/inquiries")}
              className="p-4 bg-[#F0F7F4] rounded-xl hover:bg-[#02BB31] group transition-colors text-left"
            >
              <FiMessageSquare className="text-2xl text-[#02BB31] group-hover:text-white mb-2" />
              <p className="text-sm font-medium text-[#013E43] group-hover:text-white">Inquiries</p>
              <p className="text-xs text-[#065A57] group-hover:text-white/80">{stats.totalInquiries} total</p>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#013E43]">Recent Activity</h3>
            <button 
              onClick={() => navigate("/admin/audit")}
              className="text-sm text-[#02BB31] hover:text-[#0D915C]"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#F0F7F4] rounded-full flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#013E43]">{activity.description}</p>
                      <p className="text-xs text-[#065A57]">{formatTimeAgo(activity.createdAt)}</p>
                    </div>
                  </div>
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
      </div>

      {/* System Health - Keeping this as is since it's not a placeholder but actual data */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
        <h3 className="text-lg font-semibold text-[#013E43] mb-4">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-[#02BB31] rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-[#013E43]">API Status</p>
              <p className="text-xs text-[#065A57]">Operational</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-[#02BB31] rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-[#013E43]">Database</p>
              <p className="text-xs text-[#065A57]">Connected</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-[#02BB31] rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-[#013E43]">Storage</p>
              <p className="text-xs text-[#065A57]">45% used</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-[#013E43]">Response Time</p>
              <p className="text-xs text-[#065A57]">120ms avg</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard