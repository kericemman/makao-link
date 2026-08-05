import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiArrowUpRight,
  FiCalendar,
  FiHeart,
  FiHelpCircle,
  FiHome,
  FiMessageSquare,
  FiSearch,
  FiUser
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { portalLinks } from "../config/portals";
import { getMyInquiries } from "../services/alerts.service";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyInquiries()
      .then((data) => setInquiries(data.inquiries || []))
      .catch(() => setInquiries([]))
      .finally(() => setLoading(false));
  }, []);

  const savedCount = getSavedCount();
  const unread = inquiries.filter((item) => !item.readByUser).length;
  const replied = inquiries.filter((item) => (item.replies || []).length > 0).length;

  const statCards = [
    { title: "Inquiry Threads", value: inquiries.length, icon: FiMessageSquare },
    { title: "Unread Replies", value: unread, icon: FiAlertCircle },
    { title: "Saved Homes", value: savedCount, icon: FiHeart },
    { title: "Profile", value: user?.location ? "Ready" : "Update", icon: FiUser }
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#A8D8C1] border-t-[#02BB31]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#013E43] text-xl font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-sm font-bold md:text-lg">Welcome back, {user?.name || "RendaHomes user"}</h1>
              <p className="flex items-center text-sm text-gray-500">
                <FiCalendar className="mr-1" />
                {new Date().toDateString()}
              </p>
            </div>
          </div>

          <div className="rounded-lg px-4 py-2 text-sm font-semibold capitalize text-green-600 md:text-lg">
            User portal
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="mb-4 font-semibold">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <a href={portalLinks.main.href} className="rounded bg-gray-50 p-4 text-center transition hover:bg-green-500 hover:text-white">
            <FiSearch className="mx-auto mb-1 text-xl" />
            Browse Homes
          </a>
          <Link to="/inquiries" className="rounded bg-gray-50 p-4 text-center transition hover:bg-green-500 hover:text-white">
            <FiMessageSquare className="mx-auto mb-1 text-xl" />
            Inquiries
          </Link>
          <Link to="/saved" className="rounded bg-gray-50 p-4 text-center transition hover:bg-green-500 hover:text-white">
            <FiHeart className="mx-auto mb-1 text-xl" />
            Saved Homes
          </Link>
          <Link to="/support" className="rounded bg-gray-50 p-4 text-center transition hover:bg-green-500 hover:text-white">
            <FiHelpCircle className="mx-auto mb-1 text-xl" />
            Support
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-xl bg-white p-5 shadow transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-xl font-bold capitalize">{card.value}</p>
                </div>
                <Icon className="mt-8 text-xl text-[#02BB31]" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <div className="mb-4 flex justify-between text-sm text-[#065A57]">
          <span>Conversation progress: {replied} / {Math.max(inquiries.length, 1)} replied</span>
          <span>{Math.round((replied / Math.max(inquiries.length, 1)) * 100)}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[#F0F7F4]">
          <div className="h-full bg-gradient-to-r from-[#02BB31] to-[#0D915C]" style={{ width: `${(replied / Math.max(inquiries.length, 1)) * 100}%` }} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="mb-4 flex justify-between">
            <h3 className="font-semibold">Recent Inquiries</h3>
            <Link to="/inquiries" className="text-sm text-green-600">View All</Link>
          </div>

          {inquiries.length ? (
            inquiries.slice(0, 5).map((inq) => (
              <button
                key={inq._id}
                type="button"
                onClick={() => navigate("/inquiries")}
                className="mb-2 block w-full rounded border p-3 text-left transition hover:bg-gray-50"
              >
                <h4 className="font-medium">{inq.listing?.title || "Listing inquiry"}</h4>
                <p className="line-clamp-1 text-sm text-gray-500">{inq.message}</p>
              </button>
            ))
          ) : (
            <p className="text-sm text-gray-500">No inquiries yet</p>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <div className="mb-4 flex justify-between">
            <h3 className="font-semibold">Account Shortcuts</h3>
            <Link to="/profile" className="text-sm text-green-600">Profile</Link>
          </div>

          <Link to="/profile" className="mb-2 flex items-center gap-3 rounded border p-3 transition hover:bg-gray-50">
            <FiUser className="text-[#02BB31]" />
            <div>
              <h4 className="font-medium">Update contact details</h4>
              <p className="text-sm text-gray-500">Keep phone and location ready for landlords.</p>
            </div>
          </Link>

          <a href={portalLinks.main.href} className="mb-2 flex items-center gap-3 rounded border p-3 transition hover:bg-gray-50">
            <FiHome className="text-[#02BB31]" />
            <div>
              <h4 className="font-medium">Continue home search</h4>
              <p className="text-sm text-gray-500">Return to public listings and categories.</p>
            </div>
          </a>

          <Link to="/support" className="flex items-center gap-3 rounded border p-3 transition hover:bg-gray-50">
            <FiArrowUpRight className="text-[#02BB31]" />
            <div>
              <h4 className="font-medium">Open a support ticket</h4>
              <p className="text-sm text-gray-500">Ask for account or inquiry help.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function getSavedCount() {
  try {
    return JSON.parse(localStorage.getItem("renda_saved_listings") || "[]").length;
  } catch {
    return 0;
  }
}
