import { useEffect, useState } from "react"
import { getDashboardStats } from "../../services/dashboard.service"
import { useAuth } from "../../context/AuthContext"
import { Link, useNavigate } from "react-router-dom"

import {
  FiHome,
  FiMessageSquare,
  FiEye,
  FiDollarSign,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiStar,
  FiCalendar,
  FiArrowUp
} from "react-icons/fi"

import { FaKey } from "react-icons/fa"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from "chart.js"

import { Line } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
)

function DashboardHome() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()

    const interval = setInterval(fetchStats, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const res = await getDashboardStats()
      setStats(res.data)
    } catch (error) {
      console.error("Failed to load stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const chartData = {
    labels:
      stats?.recentViews?.length
        ? stats.recentViews.map((v) => v.date)
        : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],

    datasets: [
      {
        label: "Profile Views",
        data:
          stats?.recentViews?.length
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
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-10 w-10 border-4 border-[#A8D8C1] border-t-[#02BB31] rounded-full"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-10">
        <p>Unable to load dashboard stats</p>
      </div>
    )
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
      value: stats.subscription?.plan || "Free",
      icon: FiStar
    }
  ]

  return (
    <div className="space-y-6">

      {/* Welcome Section */}

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between">

          <div className="flex items-center space-x-4">

            <div className="w-14 h-14 bg-[#013E43] text-white rounded-full flex items-center justify-center text-xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>

            <div>
              <h1 className="text-xl font-bold">
                Welcome back, {user?.name || "Landlord"}
              </h1>

              <p className="text-sm text-gray-500 flex items-center">
                <FiCalendar className="mr-1" />
                {new Date().toDateString()}
              </p>
            </div>
          </div>

          {stats.subscription && (
            <div className="px-4 py-2 bg-green-50 rounded-lg text-green-600 font-semibold">
              {stats.subscription.plan}
            </div>
          )}

        </div>
      </div>

      {/* Stats Cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {statCards.map((card, i) => {

          const Icon = card.icon

          return (
            <div
              key={i}
              className="bg-white rounded-xl shadow p-5 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>

                <Icon className="text-2xl text-[#02BB31]" />

              </div>
            </div>
          )
        })}

      </div>

      {/* Chart */}

      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold mb-4 flex items-center">
          <FiTrendingUp className="mr-2 text-[#02BB31]" />
          Views Overview
        </h3>

        <div className="h-64">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Recent Properties & Inquiries */}

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Properties */}

        <div className="bg-white rounded-xl shadow p-6">

          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">Recent Properties</h3>

            <Link
              to="/dashboard/properties"
              className="text-green-600 text-sm"
            >
              View All
            </Link>
          </div>

          {stats.recentProperties?.length ? (
            stats.recentProperties.map((p) => (

              <Link
                key={p._id}
                to={`/dashboard/properties/${p._id}`}
                className="block p-3 border rounded mb-2 hover:bg-gray-50"
              >
                <h4 className="font-medium">{p.title}</h4>
                <p className="text-sm text-gray-500">{p.location}</p>
              </Link>

            ))
          ) : (
            <p className="text-sm text-gray-500">
              No properties yet
            </p>
          )}

        </div>

        {/* Inquiries */}

        <div className="bg-white rounded-xl shadow p-6">

          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">Recent Inquiries</h3>

            <Link
              to="/dashboard/inquiries"
              className="text-green-600 text-sm"
            >
              View All
            </Link>
          </div>

          {stats.recentInquiries?.length ? (

            stats.recentInquiries.map((inq) => (

              <div
                key={inq._id}
                onClick={() => navigate(`/dashboard/inquiries/${inq._id}`)}
                className="p-3 border rounded mb-2 hover:bg-gray-50 cursor-pointer"
              >
                <p className="font-medium">{inq.tenantName}</p>
                <p className="text-sm text-gray-500">
                  {inq.message}
                </p>
              </div>

            ))

          ) : (

            <p className="text-sm text-gray-500">
              No inquiries yet
            </p>

          )}

        </div>

      </div>

      {/* Quick Actions */}

      <div className="bg-white rounded-xl shadow p-6">

        <h3 className="font-semibold mb-4">Quick Actions</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <Link
            to="/landlord/listings/new"
            className="p-4 bg-gray-50 rounded hover:bg-green-500 hover:text-white text-center transition"
          >
            <FiHome className="mx-auto text-xl mb-1" />
            Add Property
          </Link>

          <Link
            to="/dashboard/inquiries"
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
            to="/dashboard/settings"
            className="p-4 bg-gray-50 rounded hover:bg-green-500 hover:text-white text-center transition"
          >
            <FiDollarSign className="mx-auto text-xl mb-1" />
            Billing
          </Link>

        </div>

      </div>

    </div>
  )
}

export default DashboardHome