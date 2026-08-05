import { useEffect, useMemo, useState } from "react";
import {
  deleteHelpRequest,
  deleteSupportTicket,
  getHelpRequests,
  getSupportTickets,
  updateHelpRequest,
  updateSupportTicket
} from "../../../services/app/adminContent.service";
import {
  FiAlertCircle,
  FiBriefcase,
  FiCheckCircle,
  FiHelpCircle,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUser
} from "react-icons/fi";
import toast from "react-hot-toast";

const ticketStatuses = ["open", "reviewing", "resolved"];
const requestStatuses = ["new", "in_progress", "resolved"];

const statusClasses = {
  open: "bg-amber-100 text-amber-700 border-amber-200",
  reviewing: "bg-blue-100 text-blue-700 border-blue-200",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  new: "bg-amber-100 text-amber-700 border-amber-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200"
};

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : "";

export default function SupportHelpPage() {
  const [tickets, setTickets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("tickets");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ticketResponse, requestResponse] = await Promise.all([
        getSupportTickets(),
        getHelpRequests()
      ]);

      setTickets(ticketResponse.data.tickets || []);
      setRequests(requestResponse.data.requests || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load support data", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const haystack = [
        ticket.subject,
        ticket.message,
        ticket.category?.title,
        ticket.user?.name,
        ticket.user?.email
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (statusFilter === "all" || ticket.status === statusFilter) &&
        haystack.includes(search.toLowerCase())
      );
    });
  }, [tickets, search, statusFilter]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const haystack = [
        request.name,
        request.phone,
        request.email,
        request.location,
        request.purpose,
        request.propertyType,
        request.businessType,
        request.message
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (statusFilter === "all" || request.status === statusFilter) &&
        haystack.includes(search.toLowerCase())
      );
    });
  }, [requests, search, statusFilter]);

  const updateTicketStatus = async (id, status) => {
    try {
      await updateSupportTicket(id, { status });
      toast.success("Ticket updated", {
        style: { background: "#02BB31", color: "#fff" }
      });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update ticket", {
        style: { background: "#013E43", color: "#fff" }
      });
    }
  };

  const updateRequestStatus = async (id, status) => {
    try {
      await updateHelpRequest(id, { status });
      toast.success("Help request updated", {
        style: { background: "#02BB31", color: "#fff" }
      });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update request", {
        style: { background: "#013E43", color: "#fff" }
      });
    }
  };

  const removeTicket = async (id) => {
    if (!window.confirm("Delete this support ticket?")) return;

    try {
      await deleteSupportTicket(id);
      toast.success("Ticket deleted", {
        style: { background: "#02BB31", color: "#fff" }
      });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete ticket", {
        style: { background: "#013E43", color: "#fff" }
      });
    }
  };

  const removeRequest = async (id) => {
    if (!window.confirm("Delete this help request?")) return;

    try {
      await deleteHelpRequest(id);
      toast.success("Help request deleted", {
        style: { background: "#02BB31", color: "#fff" }
      });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete request", {
        style: { background: "#013E43", color: "#fff" }
      });
    }
  };

  const statuses = activeTab === "tickets" ? ticketStatuses : requestStatuses;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#E4EEE8] border-t-[#02BB31]" />
          <p className="text-[#065A57]">Loading support and help...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[#E4EEE8] bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="rounded-md bg-[#013E43] p-3">
              <FiHelpCircle className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#013E43]">Support & Help</h1>
              <p className="text-sm text-[#065A57]">
                Manage mobile app support tickets and property help requests
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-lg border border-[#E4EEE8] px-4 py-2 text-[#065A57] transition-colors hover:bg-[#F0F7F4]"
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-md border-l-4 border-[#013E43] bg-white p-4 shadow-sm">
          <p className="text-sm text-[#065A57]">Support Tickets</p>
          <p className="text-2xl font-bold text-[#013E43]">{tickets.length}</p>
        </div>
        <div className="rounded-md border-l-4 border-[#02BB31] bg-white p-4 shadow-sm">
          <p className="text-sm text-[#065A57]">Help Requests</p>
          <p className="text-2xl font-bold text-[#02BB31]">{requests.length}</p>
        </div>
        <div className="rounded-md border-l-4 border-amber-400 bg-white p-4 shadow-sm">
          <p className="text-sm text-[#065A57]">Open Items</p>
          <p className="text-2xl font-bold text-amber-600">
            {tickets.filter((item) => item.status !== "resolved").length +
              requests.filter((item) => item.status !== "resolved").length}
          </p>
        </div>
        <div className="rounded-md border-l-4 border-blue-400 bg-white p-4 shadow-sm">
          <p className="text-sm text-[#065A57]">Resolved</p>
          <p className="text-2xl font-bold text-blue-600">
            {tickets.filter((item) => item.status === "resolved").length +
              requests.filter((item) => item.status === "resolved").length}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-[#E4EEE8] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex rounded-md bg-[#F0F7F4] p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("tickets");
                setStatusFilter("all");
              }}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === "tickets"
                  ? "bg-white text-[#013E43] shadow"
                  : "text-[#065A57]"
              }`}
            >
              Support Tickets
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("requests");
                setStatusFilter("all");
              }}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === "requests"
                  ? "bg-white text-[#013E43] shadow"
                  : "text-[#065A57]"
              }`}
            >
              Help Requests
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D915C]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                className="w-full rounded-lg border-2 border-[#E4EEE8] py-2 pl-10 pr-3 outline-none focus:border-[#02BB31] sm:w-72"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border-2 border-[#E4EEE8] px-3 py-2 outline-none focus:border-[#02BB31]"
            >
              <option value="all">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {activeTab === "tickets" ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredTickets.length === 0 ? (
            <EmptyState label="No support tickets found" />
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket._id}
                className="rounded-lg border border-[#E4EEE8] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          statusClasses[ticket.status] || statusClasses.open
                        }`}
                      >
                        {ticket.status}
                      </span>
                      <span className="text-xs text-[#065A57]">
                        {formatDate(ticket.createdAt)}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-[#013E43]">
                        {ticket.subject}
                      </h2>
                      <p className="mt-1 text-sm text-[#065A57]">
                        {ticket.message}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-[#065A57]">
                      <span className="inline-flex items-center gap-1">
                        <FiHelpCircle />
                        {ticket.category?.title || "Uncategorized"}
                      </span>
                      {ticket.user ? (
                        <span className="inline-flex items-center gap-1">
                          <FiUser />
                          {ticket.user.name || ticket.user.email}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      value={ticket.status}
                      onChange={(event) =>
                        updateTicketStatus(ticket._id, event.target.value)
                      }
                      className="rounded-lg border-2 border-[#E4EEE8] px-3 py-2 text-sm outline-none focus:border-[#02BB31]"
                    >
                      {ticketStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeTicket(ticket._id)}
                      className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-red-600 transition-colors hover:bg-red-50"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.length === 0 ? (
            <EmptyState label="No help requests found" />
          ) : (
            filteredRequests.map((request) => (
              <div
                key={request._id}
                className="rounded-lg border border-[#E4EEE8] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          statusClasses[request.status] || statusClasses.new
                        }`}
                      >
                        {request.status.replace("_", " ")}
                      </span>
                      <span className="rounded-full border border-[#E4EEE8] bg-[#F0F7F4] px-3 py-1 text-xs font-semibold text-[#013E43]">
                        {request.purpose}
                      </span>
                      <span className="text-xs text-[#065A57]">
                        {formatDate(request.createdAt)}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-[#013E43]">
                        {request.name}
                      </h2>
                      <p className="mt-1 text-sm text-[#065A57]">
                        {request.message || "No message provided"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm text-[#065A57] md:grid-cols-2 xl:grid-cols-3">
                      <span className="inline-flex items-center gap-1">
                        <FiPhone />
                        {request.phone}
                      </span>
                      {request.email ? (
                        <span className="inline-flex items-center gap-1">
                          <FiMail />
                          {request.email}
                        </span>
                      ) : null}
                      {request.location ? (
                        <span className="inline-flex items-center gap-1">
                          <FiAlertCircle />
                          {request.location}
                        </span>
                      ) : null}
                      {request.propertyType ? (
                        <span className="inline-flex items-center gap-1">
                          <FiBriefcase />
                          {request.propertyType}
                        </span>
                      ) : null}
                      {request.monthlyBudget || request.purchaseBudget ? (
                        <span className="inline-flex items-center gap-1">
                          <FiCheckCircle />
                          {request.monthlyBudget || request.purchaseBudget}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      value={request.status}
                      onChange={(event) =>
                        updateRequestStatus(request._id, event.target.value)
                      }
                      className="rounded-lg border-2 border-[#E4EEE8] px-3 py-2 text-sm outline-none focus:border-[#02BB31]"
                    >
                      {requestStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeRequest(request._id)}
                      className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-red-600 transition-colors hover:bg-red-50"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="rounded-lg border border-dashed border-[#E4EEE8] bg-white p-10 text-center">
      <FiHelpCircle className="mx-auto mb-3 text-3xl text-[#A8D8C1]" />
      <p className="font-semibold text-[#013E43]">{label}</p>
    </div>
  );
}
