import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiExternalLink,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiXCircle
} from "react-icons/fi";
import toast from "react-hot-toast";
import { getListingReports, updateListingReportStatus } from "../../services/admin.service";

const statusClasses = {
  new: "bg-red-50 text-red-700",
  reviewing: "bg-amber-50 text-amber-700",
  resolved: "bg-emerald-50 text-emerald-700",
  dismissed: "bg-slate-100 text-slate-600"
};

const reasonLabels = {
  unavailable: "Unavailable",
  wrong_price: "Wrong price",
  wrong_location: "Wrong location",
  fake_photos: "Fake photos",
  landlord_unreachable: "Landlord unreachable",
  agent_issue: "Agent issue",
  other: "Other"
};

export default function AdminListingReportsPage() {
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return reports;

    return reports.filter((report) =>
      [
        report.listing?.title,
        report.listing?.town,
        report.listing?.county,
        report.landlord?.name,
        report.landlord?.email,
        report.name,
        report.email,
        report.phone,
        report.message
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [reports, search]);

  const stats = useMemo(
    () => ({
      total: reports.length,
      new: reports.filter((item) => item.status === "new").length,
      reviewing: reports.filter((item) => item.status === "reviewing").length,
      resolved: reports.filter((item) => item.status === "resolved").length
    }),
    [reports]
  );

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (status) params.status = status;
      if (reason) params.reason = reason;
      const data = await getListingReports(params);
      setReports(data.reports || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load listing reports", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [status, reason]);

  const updateStatus = async (report, nextStatus) => {
    const adminNote =
      nextStatus === "dismissed" || nextStatus === "resolved"
        ? window.prompt("Add an internal admin note", report.adminNote || "")
        : report.adminNote || "";

    if ((nextStatus === "dismissed" || nextStatus === "resolved") && adminNote === null) {
      return;
    }

    try {
      setUpdatingId(report._id);
      await updateListingReportStatus(report._id, { status: nextStatus, adminNote: adminNote || "" });
      toast.success("Report updated", {
        style: { background: "#02BB31", color: "#fff" }
      });
      loadReports();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update report", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[#E4EEE8] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0D915C]">Trust operations</p>
            <h1 className="mt-1 text-xl font-bold text-[#013E43]">Listing Reports</h1>
            <p className="mt-1 text-sm text-[#647C75]">Review unavailable, misleading, or suspicious listing reports from users.</p>
          </div>

          <button
            onClick={loadReports}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#DDEAE3] px-4 py-2 text-sm font-semibold text-[#013E43] transition hover:bg-[#F8FAF8]"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total" value={stats.total} icon={FiShield} />
        <Stat label="New" value={stats.new} icon={FiAlertTriangle} tone="text-red-600" />
        <Stat label="Reviewing" value={stats.reviewing} icon={FiRefreshCw} tone="text-amber-600" />
        <Stat label="Resolved" value={stats.resolved} icon={FiCheckCircle} tone="text-emerald-600" />
      </section>

      <section className="rounded-lg border border-[#E4EEE8] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#E4EEE8] p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#647C75]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search listing, landlord, reporter, message..."
              className="w-full rounded-lg border border-[#DDEAE3] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#02BB31]"
            />
          </div>

          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-[#DDEAE3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#02BB31]">
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="reviewing">Reviewing</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>

          <select value={reason} onChange={(event) => setReason(event.target.value)} className="rounded-lg border border-[#DDEAE3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#02BB31]">
            <option value="">All reasons</option>
            {Object.entries(reasonLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E4EEE8] text-sm">
            <thead className="bg-[#F8FAF8] text-left text-xs font-bold uppercase tracking-[0.12em] text-[#647C75]">
              <tr>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Report</th>
                <th className="px-4 py-3">Reporter</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF4F0] bg-white">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center text-[#647C75]">Loading reports...</td>
                </tr>
              ) : filteredReports.length ? (
                filteredReports.map((report) => (
                  <tr key={report._id} className="hover:bg-[#FBFDFB]">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[#013E43]">{report.listing?.title || "Listing removed"}</p>
                      <p className="text-xs text-[#647C75]">{[report.listing?.town, report.listing?.county].filter(Boolean).join(", ") || "No location"}</p>
                      <p className="mt-1 text-xs text-[#647C75]">Landlord: {report.landlord?.businessName || report.landlord?.name || "N/A"}</p>
                      {report.listing?._id ? (
                        <Link to={`/admin/listings`} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#0D915C]">
                          Open listings <FiExternalLink />
                        </Link>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-[#013E43]">{reasonLabels[report.reason] || report.reason}</p>
                      <p className="mt-1 max-w-sm text-xs leading-5 text-[#647C75]">{report.message || "No details provided."}</p>
                      {report.adminNote ? <p className="mt-2 max-w-sm text-xs font-semibold text-[#0D915C]">Admin note: {report.adminNote}</p> : null}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[#013E43]">{report.name || "Anonymous"}</p>
                      <p className="text-xs text-[#647C75]">{report.email || "No email"}</p>
                      <p className="text-xs text-[#647C75]">{report.phone || "No phone"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusClasses[report.status] || statusClasses.new}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => updateStatus(report, "reviewing")}
                          disabled={updatingId === report._id || report.status === "reviewing"}
                          className="rounded-lg border border-[#DDEAE3] px-3 py-2 text-xs font-bold text-[#013E43] disabled:opacity-50"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => updateStatus(report, "resolved")}
                          disabled={updatingId === report._id || report.status === "resolved"}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#02BB31] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                        >
                          <FiCheckCircle />
                          Resolve
                        </button>
                        <button
                          onClick={() => updateStatus(report, "dismissed")}
                          disabled={updatingId === report._id || report.status === "dismissed"}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                        >
                          <FiXCircle />
                          Dismiss
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center text-[#647C75]">No listing reports found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone = "text-[#013E43]" }) {
  return (
    <div className="rounded-lg border border-[#E4EEE8] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#647C75]">{label}</p>
        <Icon className={tone} />
      </div>
      <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
