import { useEffect, useMemo, useState } from "react";
import {
  activateAgent,
  createAgent,
  createAgentInstruction,
  getAgentOnboarded,
  getAgents,
  suspendAgent
} from "../../services/admin.service";
import { FiCopy, FiMail, FiRefreshCw, FiSend, FiUsers } from "react-icons/fi";
import toast from "react-hot-toast";

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  commissionRate: 10
};

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [instruction, setInstruction] = useState({ title: "", content: "", emailAgents: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(
    () =>
      agents.reduce(
        (acc, agent) => ({
          landlords: acc.landlords + (agent.stats?.totalOnboardedLandlords || 0),
          revenue: acc.revenue + (agent.stats?.totalRevenueGenerated || 0),
          commission: acc.commission + (agent.stats?.commissionEarned || 0)
        }),
        { landlords: 0, revenue: 0, commission: 0 }
      ),
    [agents]
  );

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0
    }).format(value || 0);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const data = await getAgents();
      setAgents(data.agents || []);
    } catch (error) {
      toast.error("Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCreateAgent = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await createAgent(form);
      setForm(emptyForm);
      toast.success("Agent created and invited");
      fetchAgents();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create agent");
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (agent) => {
    try {
      setSaving(true);
      if (agent.status === "suspended") {
        await activateAgent(agent._id);
        toast.success("Agent activated");
      } else {
        await suspendAgent(agent._id);
        toast.success("Agent suspended");
      }
      fetchAgents();
    } catch (error) {
      toast.error("Failed to update agent");
    } finally {
      setSaving(false);
    }
  };

  const openReport = async (agent) => {
    try {
      setSelectedAgent(agent);
      const data = await getAgentOnboarded(agent._id);
      setSelectedReport(data);
    } catch (error) {
      toast.error("Failed to load agent report");
    }
  };

  const copy = async (value) => {
    await navigator.clipboard.writeText(value);
    toast.success("Copied");
  };

  const handleSendInstruction = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await createAgentInstruction(instruction);
      setInstruction({ title: "", content: "", emailAgents: true });
      toast.success("Instruction sent to agents");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send instruction");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-[#DDEAE3] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0D915C]">Agent Network</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#013E43]">Agent Management</h2>
          <p className="mt-1 text-sm text-[#647C75]">Create agents, share referral links, and track landlord onboarding revenue.</p>
        </div>
        <button onClick={fetchAgents} className="inline-flex items-center gap-2 rounded-lg border border-[#DDEAE3] bg-white px-3 py-2 text-sm font-semibold text-[#013E43]">
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </section>

      <section className="grid gap-3 border-y border-[#DDEAE3] py-4 md:grid-cols-4">
        <Metric label="Agents" value={agents.length} />
        <Metric label="Landlords onboarded" value={totals.landlords} />
        <Metric label="Revenue tracked" value={formatCurrency(totals.revenue)} />
        <Metric label="Commission estimate" value={formatCurrency(totals.commission)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <form onSubmit={handleCreateAgent} className="rounded-lg border border-[#DDEAE3] bg-white p-5">
          <h3 className="font-semibold text-[#013E43]">Create agent</h3>
          <div className="mt-4 grid gap-3">
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Full name" className="rounded-lg border border-[#DDEAE3] px-3 py-2.5 text-sm outline-none" />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" className="rounded-lg border border-[#DDEAE3] px-3 py-2.5 text-sm outline-none" />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="rounded-lg border border-[#DDEAE3] px-3 py-2.5 text-sm outline-none" />
            <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Temporary password" type="password" className="rounded-lg border border-[#DDEAE3] px-3 py-2.5 text-sm outline-none" />
            <input value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) })} placeholder="Commission rate %" type="number" min="0" max="100" className="rounded-lg border border-[#DDEAE3] px-3 py-2.5 text-sm outline-none" />
            <button disabled={saving} className="rounded-lg bg-[#0D915C] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Create and email agent</button>
          </div>
        </form>

        <form onSubmit={handleSendInstruction} className="rounded-lg border border-[#DDEAE3] bg-white p-5">
          <h3 className="font-semibold text-[#013E43]">Send agent instructions</h3>
          <p className="mt-1 text-sm text-[#647C75]">Explain how RendaHomes works, what agents get, and how to onboard landlords.</p>
          <div className="mt-4 grid gap-3">
            <input value={instruction.title} onChange={(e) => setInstruction({ ...instruction, title: e.target.value })} placeholder="Instruction title" className="rounded-lg border border-[#DDEAE3] px-3 py-2.5 text-sm outline-none" />
            <textarea value={instruction.content} onChange={(e) => setInstruction({ ...instruction, content: e.target.value })} rows="7" placeholder="Write the instruction or update..." className="rounded-lg border border-[#DDEAE3] px-3 py-2.5 text-sm outline-none" />
            <label className="flex items-center gap-2 text-sm text-[#647C75]">
              <input type="checkbox" checked={instruction.emailAgents} onChange={(e) => setInstruction({ ...instruction, emailAgents: e.target.checked })} />
              Email this to active agents
            </label>
            <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#013E43] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
              <FiSend />
              Publish instruction
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-[#DDEAE3] bg-white">
        <div className="grid grid-cols-[1.2fr_120px_140px_150px_120px] gap-4 border-b border-[#DDEAE3] bg-[#F4F8F5] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#647C75]">
          <span>Agent</span>
          <span>Status</span>
          <span>Landlords</span>
          <span>Revenue</span>
          <span className="text-right">Action</span>
        </div>
        <div className="divide-y divide-[#EEF4F0]">
          {agents.map((agent) => (
            <div key={agent._id} className="grid grid-cols-[1.2fr_120px_140px_150px_120px] gap-4 px-4 py-4 text-sm">
              <div>
                <p className="font-semibold text-[#013E43]">{agent.fullName}</p>
                <p className="text-xs text-[#647C75]">{agent.email} • {agent.agentCode}</p>
              </div>
              <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${agent.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{agent.status}</span>
              <span>{agent.stats?.totalOnboardedLandlords || 0}</span>
              <span>{formatCurrency(agent.stats?.totalRevenueGenerated || 0)}</span>
              <div className="flex justify-end gap-2">
                <button onClick={() => openReport(agent)} className="text-sm font-semibold text-[#0D915C]">View</button>
                <button onClick={() => handleStatus(agent)} className="text-sm font-semibold text-red-600">{agent.status === "active" ? "Suspend" : "Activate"}</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedAgent && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white">
            <div className="flex items-center justify-between border-b border-[#DDEAE3] p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0D915C]">{selectedAgent.agentCode}</p>
                <h3 className="text-xl font-semibold text-[#013E43]">{selectedAgent.fullName}</h3>
              </div>
              <button onClick={() => { setSelectedAgent(null); setSelectedReport(null); }} className="text-[#647C75]">Close</button>
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="space-y-3">
                <p className="text-sm text-[#647C75]">Referral links</p>
                <CopyLink label="Landlord" value={selectedAgent.referralLinks?.landlord} onCopy={copy} />
                <CopyLink label="Service Provider" value={selectedAgent.referralLinks?.serviceProvider} onCopy={copy} />
              </div>
              <div>
                <p className="mb-3 text-sm text-[#647C75]">Onboarded landlords</p>
                <div className="divide-y divide-[#EEF4F0] border-y border-[#DDEAE3]">
                  {(selectedReport.landlords || []).map((landlord) => (
                    <div key={landlord._id} className="grid gap-2 py-3 text-sm md:grid-cols-[1fr_120px_120px]">
                      <div>
                        <p className="font-semibold text-[#013E43]">{landlord.name}</p>
                        <p className="text-xs text-[#647C75]">{landlord.email}</p>
                      </div>
                      <span className="capitalize">{landlord.subscription?.plan || "normal"}</span>
                      <span className="capitalize">{landlord.subscription?.status || "free"}</span>
                    </div>
                  ))}
                  {!selectedReport.landlords?.length && <p className="py-8 text-center text-sm text-[#647C75]">No onboarded landlords yet.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8A9C96]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#013E43]">{value}</p>
    </div>
  );
}

function CopyLink({ label, value, onCopy }) {
  return (
    <div className="rounded-lg border border-[#DDEAE3] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8A9C96]">{label}</p>
      <div className="mt-2 flex gap-2">
        <input readOnly value={value || ""} className="min-w-0 flex-1 rounded-md border border-[#DDEAE3] px-3 py-2 text-xs" />
        <button type="button" onClick={() => onCopy(value)} className="rounded-md bg-[#013E43] px-3 text-white">
          <FiCopy />
        </button>
      </div>
    </div>
  );
}
