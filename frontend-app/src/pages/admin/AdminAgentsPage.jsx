import { useEffect, useMemo, useState } from "react";
import {
  activateAgent,
  createAgent,
  createAgentInstruction,
  getAgentApplications,
  getAgentApplicationDocument,
  getAgentOnboarded,
  getAgents,
  resendAgentApplicationInvite,
  resendAgentInvite,
  reviewAgentApplication,
  suspendAgent,
  updateAgent
} from "../../services/admin.service";
import { FiCopy, FiMail, FiRefreshCw, FiSend, FiUsers } from "react-icons/fi";
import toast from "react-hot-toast";

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  commissionRate: 10
};

const formatServiceAreas = (areas = []) => areas.map((area) => `${area.county}${area.towns?.length ? `: ${area.towns.join(", ")}` : ""}`).join("\n");
const parseServiceAreas = (value) => value.split("\n").map((line) => {
  const [countyRaw, ...townParts] = line.split(":");
  const county = countyRaw.trim().toLowerCase().replaceAll(" ", "-");
  const towns = townParts.join(":").split(",").map((town) => town.trim().toLowerCase().replaceAll(" ", "-")).filter(Boolean);
  return county ? { county, towns } : null;
}).filter(Boolean);

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [applicationDrafts, setApplicationDrafts] = useState({});
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [instruction, setInstruction] = useState({ title: "", content: "", emailAgents: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [marketplaceDrafts, setMarketplaceDrafts] = useState({});

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
      const [data, applicationData] = await Promise.all([getAgents(), getAgentApplications()]);
      setAgents(data.agents || []);
      setApplications(applicationData.applications || []);
      setApplicationDrafts(Object.fromEntries((applicationData.applications || []).map((application) => [application._id, { commissionRate: 10, reviewNote: "" }])));
      setMarketplaceDrafts(Object.fromEntries((data.agents || []).map((agent) => [agent._id, {
        status: agent.marketplaceStatus || "not_enabled",
        areasText: formatServiceAreas(agent.serviceAreas || [])
      }])));
    } catch {
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
      const result = await createAgent(form);
      setForm(emptyForm);
      toast[result.invitationSent === false ? "error" : "success"](result.message || "Agent created and invited");
      fetchAgents();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create agent");
    } finally {
      setSaving(false);
    }
  };

  const handleApplicationReview = async (application, decision) => {
    const draft = applicationDrafts[application._id] || {};
    try {
      setSaving(true);
      const result = await reviewAgentApplication(application._id, {
        decision,
        commissionRate: Number(draft.commissionRate || 10),
        reviewNote: draft.reviewNote || ""
      });
      toast[result.invitationSent === false && decision === "approve" ? "error" : "success"](result.message || `Application ${decision}d.`);
      await fetchAgents();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not review this application");
    } finally { setSaving(false); }
  };

  const resendApplicationInvite = async (application) => {
    try {
      setSaving(true);
      await resendAgentApplicationInvite(application._id);
      toast.success("Agent invitation sent");
      await fetchAgents();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not resend this invitation");
    } finally { setSaving(false); }
  };

  const openApplicationDocument = async (application, document) => {
    const reviewWindow = window.open("about:blank", "_blank");
    if (reviewWindow) reviewWindow.opener = null;
    try {
      const result = await getAgentApplicationDocument(application._id, document);
      if (!reviewWindow) {
        toast.error("Allow pop-ups to view application documents.");
        return;
      }
      reviewWindow.location.replace(result.url);
    } catch (error) {
      reviewWindow?.close();
      toast.error(error.response?.data?.message || "Could not open this document");
    }
  };

  const resendInvite = async (agent) => {
    try {
      setSaving(true);
      await resendAgentInvite(agent._id);
      toast.success("Agent invitation sent");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not resend this invitation");
    } finally { setSaving(false); }
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
    } catch {
      toast.error("Failed to update agent");
    } finally {
      setSaving(false);
    }
  };

  const saveMarketplaceSettings = async (agent) => {
    const draft = marketplaceDrafts[agent._id] || {};
    try {
      setSaving(true);
      await updateAgent(agent._id, {
        agentMarketplaceStatus: draft.status,
        agentServiceAreas: parseServiceAreas(draft.areasText || "")
      });
      toast.success("Marketplace eligibility updated");
      await fetchAgents();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update marketplace eligibility");
    } finally { setSaving(false); }
  };

  const openReport = async (agent) => {
    try {
      setSelectedAgent(agent);
      const data = await getAgentOnboarded(agent._id);
      setSelectedReport(data);
    } catch {
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
          <p className="mt-1 text-sm text-[#647C75]">Review agent applications, create accounts, and track landlord onboarding revenue.</p>
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

      <section className="border-y border-[#DDEAE3] py-4">
        <div className="mb-4 flex items-end justify-between gap-3"><div><h3 className="font-semibold text-[#013E43]">Agent applications</h3><p className="mt-1 text-sm text-[#647C75]">Admin approval creates agent access. Property request marketplace eligibility is configured separately for each agent.</p></div><span className="text-sm font-semibold text-[#647C75]">{applications.length} needing action</span></div>
        {!applications.length ? <p className="py-6 text-center text-sm text-[#647C75]">No pending applications or failed invitations.</p> : <div className="divide-y divide-[#E7EFEB]">{applications.map((application) => <article key={application._id} className="grid gap-3 py-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold text-[#013E43]">{application.name}</h4><span className={`rounded px-2 py-1 text-xs font-semibold ${application.status === "pending" ? "bg-amber-50 text-amber-900" : "bg-rose-50 text-rose-900"}`}>{application.status === "pending" ? "Pending review" : "Invitation failed"}</span></div><p className="mt-1 text-sm text-[#647C75]">{application.email} · {application.phone}</p><p className="mt-1 text-xs text-[#647C75]">{[application.town, application.county].filter(Boolean).join(", ") || "No area specified"} · Applied {new Date(application.createdAt).toLocaleDateString()}</p>{application.experience && <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-5 text-slate-700">{application.experience}</p>}
            {application.documents && <div className="mt-3 flex flex-wrap gap-2">{[
              ["identityFront", application.identityType === "passport" ? "View passport" : "View ID front"],
              ["identityBack", "View ID back"],
              ["professionalCredential", "View agent credential"]
            ].filter(([field]) => application.documents[field]).map(([field, label]) => <button key={field} type="button" onClick={() => openApplicationDocument(application, field)} className="inline-flex min-h-9 items-center rounded-md border border-[#DDEAE3] bg-white px-3 text-xs font-semibold text-[#013E43] hover:border-[#0D915C]">{label}</button>)}</div>}
            {application.reviewNote && <p className="mt-2 text-xs text-rose-800">Review note: {application.reviewNote}</p>}</div>
          {application.status === "pending" ? <div className="grid gap-2 sm:grid-cols-[110px_minmax(180px,1fr)_auto_auto] lg:w-[530px]">
            <label className="text-xs font-semibold text-[#647C75]">Commission %<input type="number" min="0" max="100" value={applicationDrafts[application._id]?.commissionRate ?? 10} onChange={(event) => setApplicationDrafts((current) => ({ ...current, [application._id]: { ...current[application._id], commissionRate: event.target.value } }))} className="mt-1 h-10 w-full rounded-md border border-[#DDEAE3] px-2 text-sm text-[#013E43]" /></label>
            <label className="text-xs font-semibold text-[#647C75]">Review note<input value={applicationDrafts[application._id]?.reviewNote || ""} onChange={(event) => setApplicationDrafts((current) => ({ ...current, [application._id]: { ...current[application._id], reviewNote: event.target.value } }))} maxLength={1000} placeholder="Optional" className="mt-1 h-10 w-full rounded-md border border-[#DDEAE3] px-2 text-sm text-[#013E43]" /></label>
            <button type="button" disabled={saving} onClick={() => handleApplicationReview(application, "approve")} className="mt-auto min-h-10 rounded-md bg-[#0D915C] px-3 text-sm font-semibold text-white disabled:opacity-50">Approve</button>
            <button type="button" disabled={saving} onClick={() => handleApplicationReview(application, "reject")} className="mt-auto min-h-10 rounded-md border border-rose-200 px-3 text-sm font-semibold text-rose-800 disabled:opacity-50">Reject</button>
          </div> : <button type="button" disabled={saving} onClick={() => resendApplicationInvite(application)} className="min-h-10 rounded-md border border-[#DDEAE3] px-3 text-sm font-semibold text-[#013E43] disabled:opacity-50">Resend invitation</button>}
        </article>)}</div>}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <form onSubmit={handleCreateAgent} className="rounded-lg border border-[#DDEAE3] bg-white p-5">
          <h3 className="font-semibold text-[#013E43]">Create agent</h3>
          <p className="mt-1 text-xs text-[#647C75]">A secure one-time password setup link is emailed to new agents.</p>
          <div className="mt-4 grid gap-3">
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Full name" className="rounded-lg border border-[#DDEAE3] px-3 py-2.5 text-sm outline-none" />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" className="rounded-lg border border-[#DDEAE3] px-3 py-2.5 text-sm outline-none" />
            <input type="tel" autoComplete="tel" maxLength={16} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+254 712 345 678" className="rounded-lg border border-[#DDEAE3] px-3 py-2.5 text-sm outline-none" />
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

      <section className="divide-y divide-[#E7EFEB] border-y border-[#DDEAE3]">
        <div className="hidden grid-cols-[1.2fr_120px_140px_150px_120px] gap-4 bg-[#F4F8F5] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#647C75] sm:grid">
          <span>Agent</span>
          <span>Status</span>
          <span>Landlords</span>
          <span>Revenue</span>
          <span className="text-right">Action</span>
        </div>
        <div className="divide-y divide-[#E7EFEB]">
          {agents.map((agent) => (
            <div key={agent._id} className="grid grid-cols-2 gap-3 px-4 py-4 text-sm sm:grid-cols-[1.2fr_120px_140px_150px_120px] sm:items-center sm:gap-4">
              <div className="col-span-2 min-w-0 sm:col-span-1">
                <p className="font-semibold text-[#013E43]">{agent.fullName}</p>
                <p className="truncate text-xs text-[#647C75]">{agent.email} · {agent.agentCode}</p>
              </div>
              <div><span className="mb-1 block text-[10px] font-semibold uppercase text-[#647C75] sm:hidden">Status</span><span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${agent.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{agent.status}</span></div>
              <div><span className="mb-1 block text-[10px] font-semibold uppercase text-[#647C75] sm:hidden">Landlords</span><span>{agent.stats?.totalOnboardedLandlords || 0}</span></div>
              <div><span className="mb-1 block text-[10px] font-semibold uppercase text-[#647C75] sm:hidden">Revenue</span><span>{formatCurrency(agent.stats?.totalRevenueGenerated || 0)}</span></div>
              <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-2 sm:col-span-1 sm:justify-end">
                <button onClick={() => openReport(agent)} className="text-sm font-semibold text-[#0D915C]">View</button>
                <button onClick={() => resendInvite(agent)} className="text-sm font-semibold text-[#0D915C]">Resend invite</button>
                <button onClick={() => handleStatus(agent)} className="text-sm font-semibold text-red-600">{agent.status === "active" ? "Suspend" : "Activate"}</button>
              </div>
              <details className="col-span-2 border-t border-[#E7EFEB] pt-3 sm:col-span-full">
                <summary className="cursor-pointer text-xs font-semibold text-[#0D915C]">Property request marketplace · {agent.marketplaceStatus || "not enabled"}</summary>
                <div className="mt-3 grid gap-3 md:grid-cols-[220px_1fr_auto] md:items-end">
                  <label className="block text-xs font-semibold text-[#647C75]">Eligibility status<select value={marketplaceDrafts[agent._id]?.status || "not_enabled"} onChange={(event) => setMarketplaceDrafts((current) => ({ ...current, [agent._id]: { ...current[agent._id], status: event.target.value } }))} className="mt-1 h-10 w-full rounded-md border border-[#DDEAE3] bg-white px-3 text-sm text-[#013E43]"><option value="not_enabled">Not enabled</option><option value="pending">Pending review</option><option value="approved">Approved</option><option value="suspended">Suspended</option></select></label>
                  <label className="block text-xs font-semibold text-[#647C75]">Service areas <span className="font-normal">one county per line; optional comma-separated town slugs after a colon. Leave towns empty for the whole county.</span><textarea rows="2" value={marketplaceDrafts[agent._id]?.areasText || ""} onChange={(event) => setMarketplaceDrafts((current) => ({ ...current, [agent._id]: { ...current[agent._id], areasText: event.target.value } }))} placeholder={'nairobi: westlands, kilimani\nkiambu: ruaka'} className="mt-1 w-full resize-y rounded-md border border-[#DDEAE3] px-3 py-2 text-sm text-[#013E43]" /></label>
                  <button type="button" disabled={saving} onClick={() => saveMarketplaceSettings(agent)} className="min-h-10 rounded-md bg-[#013E43] px-4 text-xs font-semibold text-white disabled:opacity-50">Save access</button>
                </div>
              </details>
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
