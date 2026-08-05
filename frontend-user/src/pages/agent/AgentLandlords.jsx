import { useEffect, useState } from "react";
import { FiRefreshCw, FiTrendingUp, FiUsers } from "react-icons/fi";
import { getAgentOnboardedLandlords } from "../../services/agent.service";

export default function AgentLandlords() {
  const [landlords, setLandlords] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAgentOnboardedLandlords();
      setLandlords(data.landlords || []);
      setStats(data.stats || {});
    } catch (error) {
      setError("Could not load landlords.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-[#DDEAE3] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#17A56B]">Onboarded Landlords</p>
          <h2 className="mt-2 text-2xl font-bold text-[#013E43]">{stats.totalOnboardedLandlords || landlords.length} landlord accounts</h2>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-[#DDEAE3] bg-white px-3 py-2 text-sm font-semibold text-[#013E43]">
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error ? <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

      <section className="grid gap-3 md:grid-cols-4">
        <Metric icon={FiUsers} label="Onboarded" value={stats.totalOnboardedLandlords || landlords.length} />
        <Metric icon={FiTrendingUp} label="Paid landlords" value={stats.totalPaidLandlords || 0} />
        <Metric icon={FiTrendingUp} label="Properties listed" value={stats.totalPropertiesListed || 0} />
        <Metric icon={FiTrendingUp} label="Commission estimate" value={formatCurrency(stats.commissionEarned)} />
      </section>

      <div className="overflow-hidden rounded-xl border border-[#DDEAE3] bg-white">
        <div className="hidden grid-cols-[1.2fr_100px_100px_110px_120px_120px] gap-4 border-b border-[#DDEAE3] bg-[#F4F8F5] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#647C75] md:grid">
          <span>Landlord</span>
          <span>Plan</span>
          <span>Status</span>
          <span>Listings</span>
          <span>Commission</span>
          <span>Joined</span>
        </div>
        <div className="divide-y divide-[#EEF4F0]">
          {landlords.map((landlord) => (
            <div key={landlord._id} className="grid gap-2 px-4 py-4 text-sm md:grid-cols-[1.2fr_100px_100px_110px_120px_120px] md:gap-4">
              <div>
                <p className="font-semibold text-[#013E43]">{landlord.name}</p>
                <p className="text-xs text-[#647C75]">{landlord.phone || landlord.email}</p>
              </div>
              <span className="capitalize text-[#647C75]">{landlord.subscription?.plan || "normal"}</span>
              <span className="capitalize text-[#647C75]">{landlord.subscription?.status || "free"}</span>
              <span className="text-[#647C75]">{landlord.listingsCount || 0}</span>
              <span className="font-semibold text-[#17A56B]">{formatCurrency(landlord.commission)}</span>
              <span className="text-[#647C75]">{landlord.createdAt ? new Date(landlord.createdAt).toLocaleDateString() : "Pending"}</span>
            </div>
          ))}
          {!landlords.length ? <p className="px-4 py-10 text-center text-sm text-[#647C75]">No onboarded landlords yet.</p> : null}
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-[#DDEAE3] bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#EAF6EF] text-[#17A56B]">
          <Icon />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8A9C96]">{label}</p>
          <p className="mt-1 font-bold text-[#013E43]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(value || 0);
}
