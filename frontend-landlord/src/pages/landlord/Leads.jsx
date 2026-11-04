import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { FiFilter, FiRefreshCw, FiUser } from "react-icons/fi";
import toast from "react-hot-toast";
import { assignLead, getLeads, updateLeadStage } from "../../services/marketplace.service";
import { getTeamMembers } from "../../services/team.service";
import { getMyOrganizations, getOrganizationMembers } from "../../services/organization.service";

const stages = ["new", "contacted", "viewing_requested", "viewing_confirmed", "viewed", "application_negotiation", "closed_successful", "closed_unsuccessful"];
const transitions = {
  new: ["contacted", "viewing_requested", "closed_unsuccessful"],
  contacted: ["viewing_requested", "application_negotiation", "closed_successful", "closed_unsuccessful"],
  viewing_requested: ["contacted", "viewing_confirmed", "closed_unsuccessful"],
  viewing_confirmed: ["viewed", "contacted", "closed_unsuccessful"],
  viewed: ["application_negotiation", "closed_successful", "closed_unsuccessful"],
  application_negotiation: ["closed_successful", "closed_unsuccessful"],
  closed_successful: [],
  closed_unsuccessful: []
};

export default function Leads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [members, setMembers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [organizationId, setOrganizationId] = useState("");
  const [organizationsLoaded, setOrganizationsLoaded] = useState(false);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const currentOrganization = organizations.find((organization) => String(organization._id) === String(organizationId));
  const canManageLeads = user?.role === "landlord"
    || currentOrganization?.membership?.permissions?.includes("inquiries:manage")
    || user?.teamPermissions?.includes("inquiries")
    || (!user?.teamPermissions?.length && ["manager", "agent"].includes(user?.teamRole));
  const canAssignLeads = user?.role === "landlord"
    || currentOrganization?.membership?.permissions?.includes("members:manage")
    || user?.teamPermissions?.includes("team")
    || (!user?.teamPermissions?.length && user?.teamRole === "manager");

  useEffect(() => {
    getMyOrganizations()
      .then((data) => {
        const items = data.organizations || [];
        setOrganizations(items);
        setOrganizationId(items[0]?._id || "");
      })
      .catch(() => setOrganizations([]))
      .finally(() => setOrganizationsLoaded(true));
  }, []);

  const load = async () => {
    if (!organizationsLoaded) return;
    setLoading(true);
    try {
      const params = {
        ...(filter === "all" ? {} : { stage: filter }),
        ...(organizationId ? { organizationId } : {})
      };
      const memberRequest = organizationId
        ? getOrganizationMembers(organizationId).catch(() => ({ members: [] }))
        : getTeamMembers().catch(() => ({ members: [] }));
      const [data, memberData] = await Promise.all([getLeads(params), memberRequest]);
      setLeads(data.leads || []);
      setMembers((memberData.members || []).map((member) => ({
        ...member,
        organizationId: organizationId || "",
        branchIds: (member.branchIds || []).map(String)
      })));
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load leads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter, organizationId, organizationsLoaded]);

  const changeStage = async (lead, stage) => {
    setBusy(lead._id);
    try {
      const data = await updateLeadStage(lead._id, { stage }, organizationId);
      setLeads((items) => items.map((item) => item._id === lead._id ? data.lead : item));
      toast.success("Lead updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update lead.");
    } finally {
      setBusy("");
    }
  };

  const changeAgent = async (lead, agentId) => {
    setBusy(lead._id);
    try {
      const data = await assignLead(lead._id, agentId || null, organizationId);
      setLeads((items) => items.map((item) => item._id === lead._id ? data.lead : item));
      toast.success("Lead assignment updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not assign this lead.");
    } finally {
      setBusy("");
    }
  };

  const eligibleMembers = (lead) => {
    const listing = lead.listing || {};
    return members.filter((member) => {
      if (member.status !== "active") return false;
      if (member.role && member.role !== "agent") return false;
      if (member.teamRole && member.teamRole !== "agent") return false;
      if (!listing.organization) return !member.organizationId;
      if (String(member.organizationId) !== String(listing.organization)) return false;
      return member.scope === "organization" || Boolean(listing.branch && member.branchIds.includes(String(listing.branch)));
    });
  };

  return <main className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-5">
      <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Customer pipeline</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Leads</h1><p className="mt-1 text-sm text-slate-600">Track customer interest from first inquiry through viewing and outcome.</p></div>
      <button onClick={load} title="Refresh leads" aria-label="Refresh leads" className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-white"><FiRefreshCw className={loading ? "animate-spin" : ""} /></button>
    </header>

    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-600">{leads.length} {filter === "all" ? "leads" : filter.replaceAll("_", " ")}</p>
      <div className="flex flex-wrap items-center gap-3">
        {organizations.length > 1 && <label className="inline-flex items-center gap-2 text-sm text-slate-600"><span>Organization</span><select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800">{organizations.map((organization) => <option key={organization._id} value={organization._id}>{organization.name}</option>)}</select></label>}
        <label className="inline-flex items-center gap-2 text-sm text-slate-600"><FiFilter /><select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"><option value="all">All stages</option>{stages.map((stage) => <option key={stage} value={stage}>{stage.replaceAll("_", " ")}</option>)}</select></label>
      </div>
    </div>

    {loading ? <p className="py-12 text-center text-sm text-slate-500">Loading leads…</p> : !leads.length ? <div className="border-y border-slate-200 py-12 text-center"><FiUser className="mx-auto text-2xl text-emerald-800" /><p className="mt-3 font-semibold text-slate-800">No leads in this view</p><p className="mt-1 text-sm text-slate-500">New inquiries and viewing requests for your properties appear here.</p></div> : <div className="divide-y divide-slate-200 border-y border-slate-200 bg-white">{leads.map((lead) => {
      const source = lead.sourceRecord || {};
      const contact = source.name || lead.customer?.name || "Customer";
      const email = source.email || lead.customer?.email;
      const phone = source.phone || lead.customer?.phone;
      const transitionsForStage = transitions[lead.stage] || [];
      const assignees = eligibleMembers(lead);
      return <article key={lead._id} className="grid gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-900">{contact}</h2><span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700">{lead.stage.replaceAll("_", " ")}</span><span className="text-xs capitalize text-slate-500">{lead.sourceChannel?.replaceAll("_", " ")}</span></div><a href={`${import.meta.env.VITE_MAIN_SITE_URL || "https://rendahomes.com"}/listings/${lead.listing?._id}`} className="mt-1 block text-sm font-semibold text-emerald-800 hover:underline">{lead.listing?.title || "Property"} · {lead.listing?.town}</a><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">{email && <a href={`mailto:${email}`} className="hover:underline">{email}</a>}{phone && <a href={`tel:${phone}`} className="hover:underline">{phone}</a>}</div>{source.message && <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-700">{source.message}</p>}{lead.nextFollowUpAt && <p className="mt-2 text-xs text-slate-500">Follow up: {new Date(lead.nextFollowUpAt).toLocaleString()}</p>}</div>
        <div className="flex flex-col gap-2 lg:items-end"><label className="w-full text-xs font-semibold text-slate-600 lg:max-w-[260px]">Progress stage<select value={lead.stage} disabled={!canManageLeads || busy === lead._id || !transitionsForStage.length} onChange={(event) => changeStage(lead, event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm capitalize text-slate-900"><option value={lead.stage}>{lead.stage.replaceAll("_", " ")}</option>{transitionsForStage.map((stage) => <option key={stage} value={stage}>{stage.replaceAll("_", " ")}</option>)}</select></label>
          {canAssignLeads && assignees.length > 0 && <label className="w-full text-xs font-semibold text-slate-600 lg:max-w-[260px]">Assigned agent<select disabled={busy === lead._id} value={lead.assignedAgent?._id || ""} onChange={(event) => changeAgent(lead, event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"><option value="">Unassigned</option>{assignees.map((member) => <option key={member._id} value={member._id}>{member.name}</option>)}</select></label>}
        </div>
      </article>;
    })}</div>}
  </main>;
}
