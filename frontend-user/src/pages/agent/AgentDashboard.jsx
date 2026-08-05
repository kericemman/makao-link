import { useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiCopy,
  FiExternalLink,
  FiLink,
  FiRefreshCw,
  FiTrendingUp,
  FiUsers
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { getAgentDashboard } from "../../services/agent.service";

export default function AgentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      setData(await getAgentDashboard());
    } catch (error) {
      setError("Could not load agent dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const agent = data?.agent;
  const stats = agent?.stats || {};
  const pitchKit = agent?.pitchKit || {};
  const landlordLink = agent?.referralLinks?.landlord || "";

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-[#DDEAE3] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#17A56B]">Agent Overview</p>
          <h2 className="mt-2 text-2xl font-bold text-[#013E43]">Welcome back, {agent?.name || "agent"}</h2>
          <p className="mt-1 text-sm text-[#647C75]">
            Use your referral link and pitch kit to onboard landlords into RendaHomes.
          </p>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-[#DDEAE3] bg-white px-3 py-2 text-sm font-semibold text-[#013E43]">
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </section>

      {error ? <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

      <section className="grid gap-3 md:grid-cols-4">
        <Metric icon={FiUsers} label="Landlords onboarded" value={stats.totalOnboardedLandlords || 0} />
        <Metric icon={FiCheckCircle} label="Paid landlords" value={stats.totalPaidLandlords || 0} />
        <Metric icon={FiTrendingUp} label="Revenue tracked" value={formatCurrency(stats.totalRevenueGenerated)} />
        <Metric icon={FiLink} label="Commission estimate" value={formatCurrency(stats.commissionEarned)} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-[#DDEAE3] bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[#013E43]">Landlord referral link</p>
              <p className="mt-1 text-xs font-medium text-[#647C75]">Share this link so new landlords are attached to your agent account.</p>
            </div>
            <span className="rounded-full bg-[#EAF6EF] px-3 py-1 text-xs font-bold text-[#17A56B]">
              {agent?.agentCode || "AGENT"}
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-2 rounded-lg border border-[#DDEAE3] bg-[#F8FAF8] p-3 sm:flex-row">
            <input readOnly value={landlordLink} className="min-w-0 flex-1 bg-transparent text-sm text-[#647C75] outline-none" />
            <CopyButton label="link" value={landlordLink} copied={copied} setCopied={setCopied} />
            <a href={landlordLink || "#"} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#DDEAE3] bg-white px-4 py-2 text-sm font-semibold text-[#013E43]">
              <FiExternalLink />
              Open
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-[#DDEAE3] bg-[#013E43] p-5 text-white">
          <p className="text-sm font-bold text-white">Agent pitch</p>
          <p className="mt-2 text-sm leading-6 text-[#CFE7DC]">{pitchKit.landlordPitch}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <CopyButton label="pitch" value={pitchKit.landlordPitch} copied={copied} setCopied={setCopied} dark />
            <a href={pitchKit.whatsappLandlordPitch || "#"} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#02BB31] px-4 py-2 text-sm font-semibold text-white">
              <FaWhatsapp />
              Share WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <article className="rounded-xl border border-[#DDEAE3] bg-white p-5">
          <p className="text-sm font-bold text-[#013E43]">Onboarding checklist</p>
          <div className="mt-4 space-y-3">
            {(pitchKit.quickChecklist || []).map((item) => (
              <div key={item} className="flex gap-3">
                <FiCheckCircle className="mt-0.5 shrink-0 text-[#17A56B]" />
                <p className="text-sm font-medium leading-6 text-[#647C75]">{item}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-[#DDEAE3] bg-white p-5">
          <p className="text-sm font-bold text-[#013E43]">Commission breakdown</p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-[#DDEAE3] text-left text-xs font-bold uppercase tracking-[0.12em] text-[#8A9C96]">
                <tr>
                  <th className="py-2 pr-4">Landlord</th>
                  <th className="py-2 pr-4">Plan</th>
                  <th className="py-2 pr-4">Revenue</th>
                  <th className="py-2">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF4F0]">
                {(agent?.commissionBreakdown || []).slice(0, 5).map((item) => (
                  <tr key={item.landlord._id}>
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-[#013E43]">{item.landlord.name}</p>
                      <p className="text-xs text-[#647C75]">{item.landlord.phone || item.landlord.email}</p>
                    </td>
                    <td className="py-3 pr-4 capitalize text-[#647C75]">{item.subscription?.plan || "free"}</td>
                    <td className="py-3 pr-4 font-semibold text-[#013E43]">{formatCurrency(item.revenue)}</td>
                    <td className="py-3 font-semibold text-[#17A56B]">{formatCurrency(item.commission)}</td>
                  </tr>
                ))}
                {!agent?.commissionBreakdown?.length ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-sm text-[#647C75]">No commission activity yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-[#DDEAE3] bg-white p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EAF6EF] text-[#17A56B]">
          <Icon />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A9C96]">{label}</p>
          <p className="mt-1 text-xl font-bold text-[#013E43]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function CopyButton({ label, value, copied, setCopied, dark = false }) {
  return (
    <button
      type="button"
      onClick={() => copy(label, value, setCopied)}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
        dark ? "bg-white text-[#013E43]" : "bg-[#013E43] text-white"
      }`}
    >
      <FiCopy />
      {copied === label ? "Copied" : "Copy"}
    </button>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(value || 0);
}

async function copy(label, value, setCopied) {
  if (!value) return;
  await navigator.clipboard.writeText(value);
  setCopied(label);
  window.setTimeout(() => setCopied(""), 1500);
}
