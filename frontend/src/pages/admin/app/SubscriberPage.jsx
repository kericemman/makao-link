import { useEffect, useMemo, useState } from "react";
import {
  getSubscribers,
  updateSubscriber
} from "../../../services/app/adminContent.service";
import { 
  FiUsers, 
  FiMail, 
  FiSearch, 
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiUserCheck,
  FiUserX,
  FiCalendar,
  FiSmartphone,
  FiGlobe,
  FiDownload,
  FiFilter
} from "react-icons/fi";
import { FaEnvelope, FaMobileAlt } from "react-icons/fa";
import toast from "react-hot-toast";

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingId, setLoadingId] = useState(null);
  const [fetching, setFetching] = useState(true);

  const loadSubscribers = async () => {
    try {
      setFetching(true);
      const { data } = await getSubscribers();
      setSubscribers(data.subscribers || []);
    } catch (err) {
      toast.error("Failed to load subscribers", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadSubscribers();
  }, []);

  const filteredSubscribers = useMemo(() => {
    let filtered = [...subscribers];

    const query = search.toLowerCase().trim();
    if (query) {
      filtered = filtered.filter((subscriber) =>
        subscriber.email?.toLowerCase().includes(query) ||
        subscriber.source?.toLowerCase().includes(query)
      );
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter((subscriber) => subscriber.source === sourceFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((subscriber) => 
        statusFilter === "active" ? subscriber.isActive : !subscriber.isActive
      );
    }

    return filtered;
  }, [subscribers, search, sourceFilter, statusFilter]);

  const toggleSubscriber = async (subscriber) => {
    try {
      setLoadingId(subscriber._id);

      await updateSubscriber(subscriber._id, {
        isActive: !subscriber.isActive
      });

      toast.success(
        subscriber.isActive ? "Subscriber deactivated" : "Subscriber activated",
        {
          style: { background: "#02BB31", color: "#fff" }
        }
      );

      loadSubscribers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update subscriber", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoadingId(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSourceIcon = (source) => {
    switch(source) {
      case "mobile_app":
        return <FaMobileAlt className="text-[#02BB31]" />;
      case "web":
        return <FiGlobe className="text-blue-500" />;
      default:
        return <FiMail className="text-purple-500" />;
    }
  };

  const getSourceLabel = (source) => {
    switch(source) {
      case "mobile_app":
        return "Mobile App";
      case "web":
        return "Website";
      default:
        return source || "Email";
    }
  };

  const activeCount = subscribers.filter((item) => item.isActive).length;
  const inactiveCount = subscribers.length - activeCount;

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading subscribers...</p>
        </div>
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
              <FiUsers className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">Subscribers</h1>
              <p className="text-sm text-[#065A57]">
                Manage people who subscribed to app updates and announcements
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={loadSubscribers}
              className="p-2 text-[#065A57] hover:bg-[#F0F7F4] rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw className={`text-lg ${fetching ? 'animate-spin' : ''}`} />
            </button>
            <button
              className="px-4 py-2 bg-[#013E43] text-white rounded-lg hover:bg-[#005C57] transition-colors flex items-center space-x-2"
            >
              <FiDownload />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#013E43]">
          <p className="text-sm text-[#065A57]">Total Subscribers</p>
          <p className="text-2xl font-bold text-[#013E43]">{subscribers.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-[#02BB31]">
          <p className="text-sm text-[#065A57]">Active</p>
          <p className="text-2xl font-bold text-[#02BB31]">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-gray-400">
          <p className="text-sm text-[#065A57]">Inactive</p>
          <p className="text-2xl font-bold text-gray-600">{inactiveCount}</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-4 border border-[#A8D8C1]">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#065A57]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] focus:border-transparent"
              placeholder="Search by email or source..."
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
            >
              <option value="all">All Sources</option>
              <option value="mobile_app">Mobile App</option>
              <option value="web">Website</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-[#A8D8C1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02BB31] text-[#065A57]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-[#065A57]">
          Showing {filteredSubscribers.length} of {subscribers.length} subscribers
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#A8D8C1] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#013E43] to-[#005C57] text-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Source</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#A8D8C1]">
              {filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-[#065A57]">
                    <div className="flex flex-col items-center justify-center">
                      <FiUsers className="text-3xl text-[#A8D8C1] mb-2" />
                      <p>No subscribers found</p>
                      {(search || sourceFilter !== "all" || statusFilter !== "all") && (
                        <p className="text-xs mt-1">Try adjusting your filters</p>
                      )}
                    </div>
                   </td>
                </tr>
              ) : (
                filteredSubscribers.map((subscriber) => (
                  <tr key={subscriber._id} className="hover:bg-[#F0F7F4] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-full flex items-center justify-center text-white font-bold">
                          <FiMail className="text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-[#013E43]">{subscriber.email}</p>
                          {subscriber.name && (
                            <p className="text-xs text-[#065A57]">{subscriber.name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getSourceIcon(subscriber.source)}
                        <span className="text-sm text-[#013E43] capitalize">
                          {getSourceLabel(subscriber.source)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        subscriber.isActive
                          ? "bg-[#02BB31]/10 text-[#02BB31]"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {subscriber.isActive ? (
                          <>
                            <FiUserCheck className="mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <FiUserX className="mr-1" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-sm text-[#065A57]">
                        <FiCalendar className="text-[#02BB31]" />
                        <span>{formatDate(subscriber.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        disabled={loadingId === subscriber._id}
                        onClick={() => toggleSubscriber(subscriber)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          subscriber.isActive
                            ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                            : "bg-[#02BB31]/10 text-[#02BB31] hover:bg-[#02BB31]/20 border border-[#02BB31]/20"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {loadingId === subscriber._id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                        ) : subscriber.isActive ? (
                          "Deactivate"
                        ) : (
                          "Activate"
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredSubscribers.length > 0 && (
          <div className="px-6 py-4 border-t border-[#A8D8C1] flex items-center justify-between">
            <p className="text-sm text-[#065A57]">
              Showing 1-{filteredSubscribers.length} of {filteredSubscribers.length} subscribers
            </p>
            <div className="flex space-x-2">
              <button className="px-3 py-1 border border-[#A8D8C1] rounded text-[#065A57] hover:bg-[#F0F7F4]">
                Previous
              </button>
              <button className="px-3 py-1 bg-[#02BB31] text-white rounded hover:bg-[#0D915C]">
                1
              </button>
              <button className="px-3 py-1 border border-[#A8D8C1] rounded text-[#065A57] hover:bg-[#F0F7F4]">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}