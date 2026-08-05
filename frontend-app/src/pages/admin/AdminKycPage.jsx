import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiExternalLink,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiXCircle
} from "react-icons/fi";
import toast from "react-hot-toast";
import { getAdminKycs, reviewAdminKyc } from "../../services/admin.service";

const statusClasses = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  not_submitted: "bg-slate-50 text-slate-700"
};

export default function AdminKycPage() {
  const [kycs, setKycs] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState("");

  const filteredKycs = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return kycs;

    return kycs.filter((item) => {
      const landlord = item.landlord || {};
      return [item.fullName, item.idNumber, landlord.name, landlord.email, landlord.phone, landlord.businessName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [kycs, search]);

  const stats = useMemo(
    () => ({
      total: kycs.length,
      pending: kycs.filter((item) => item.status === "pending").length,
      approved: kycs.filter((item) => item.status === "approved").length,
      rejected: kycs.filter((item) => item.status === "rejected").length
    }),
    [kycs]
  );

  const loadKycs = async () => {
    try {
      setLoading(true);
      const data = await getAdminKycs(status ? { status } : {});
      setKycs(data.kycs || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load KYC records", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKycs();
  }, [status]);

  const review = async (item, nextStatus) => {
    const rejectionReason =
      nextStatus === "rejected"
        ? window.prompt("Why is this KYC being rejected?")
        : "";

    if (nextStatus === "rejected" && !rejectionReason?.trim()) {
      return;
    }

    try {
      setReviewingId(item._id);
      await reviewAdminKyc(item._id, { status: nextStatus, rejectionReason });
      toast.success(`KYC ${nextStatus}`, {
        style: { background: "#02BB31", color: "#fff" }
      });
      loadKycs();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to review KYC", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setReviewingId("");
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[#E4EEE8] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0D915C]">Trust review</p>
            <h1 className="mt-1 text-xl font-bold text-[#013E43]">KYC Verification</h1>
            <p className="mt-1 text-sm text-[#647C75]">Review paid landlord identity documents before approving account trust.</p>
          </div>

          <button
            onClick={loadKycs}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#DDEAE3] px-4 py-2 text-sm font-semibold text-[#013E43] transition hover:bg-[#F8FAF8]"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total" value={stats.total} icon={FiShield} />
        <Stat label="Pending" value={stats.pending} icon={FiClock} tone="text-amber-600" />
        <Stat label="Approved" value={stats.approved} icon={FiCheckCircle} tone="text-emerald-600" />
        <Stat label="Rejected" value={stats.rejected} icon={FiAlertCircle} tone="text-red-600" />
      </section>

      <section className="rounded-lg border border-[#E4EEE8] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#E4EEE8] p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#647C75]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search landlord, email, phone, ID..."
              className="w-full rounded-lg border border-[#DDEAE3] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#02BB31]"
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-lg border border-[#DDEAE3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#02BB31]"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E4EEE8] text-sm">
            <thead className="bg-[#F8FAF8] text-left text-xs font-bold uppercase tracking-[0.12em] text-[#647C75]">
              <tr>
                <th className="px-4 py-3">Landlord</th>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Files</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF4F0] bg-white">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center text-[#647C75]">Loading KYC records...</td>
                </tr>
              ) : filteredKycs.length ? (
                filteredKycs.map((item) => (
                  <tr key={item._id} className="hover:bg-[#FBFDFB]">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[#013E43]">{item.landlord?.businessName || item.landlord?.name || item.fullName}</p>
                      <p className="text-xs text-[#647C75]">{item.landlord?.email || "No email"}</p>
                      <p className="text-xs text-[#647C75]">{item.landlord?.phone || "No phone"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold capitalize text-[#013E43]">{item.idType?.replace("_", " ")}</p>
                      <p className="text-xs text-[#647C75]">{item.idNumber}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusClasses[item.status] || statusClasses.not_submitted}`}>
                        {item.status?.replace("_", " ")}
                      </span>
                      {item.rejectionReason && <p className="mt-1 max-w-xs text-xs text-red-600">{item.rejectionReason}</p>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <FileLink href={item.documentFront} label="ID front" />
                        <FileLink href={item.documentBack} label="ID back" />
                        <FileLink href={item.selfiePhoto} label="Selfie" />
                        <FileLink href={item.proofOfOwnership} label="Ownership" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => review(item, "approved")}
                          disabled={reviewingId === item._id || item.status === "approved"}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#02BB31] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                        >
                          <FiCheckCircle />
                          Approve
                        </button>
                        <button
                          onClick={() => review(item, "rejected")}
                          disabled={reviewingId === item._id || item.status === "rejected"}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                        >
                          <FiXCircle />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center text-[#647C75]">No KYC records found.</td>
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

function FileLink({ href, label }) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-md bg-[#F0F7F4] px-2.5 py-1.5 text-xs font-bold text-[#065A57] hover:text-[#013E43]"
    >
      {label}
      <FiExternalLink />
    </a>
  );
}
