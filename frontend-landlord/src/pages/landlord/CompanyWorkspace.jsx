import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";
import { FiDownload, FiCheck, FiLoader, FiPlus, FiUpload, FiUsers } from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { getMyInquiries } from "../../services/inquiry.service";
import { getMyListings, importListingsCsv } from "../../services/listings.service";
import { assignInquiry, assignListing, getTeamMembers, getTeamReports, inviteTeamMember, recordDeal, updateTeamMember } from "../../services/team.service";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

const currency = (value) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(Number(value) || 0);
const csvTemplate = "title,description,purpose,price,county,town,area,type,bedrooms,bathrooms,contactPhone,building,category,totalUnits,availableUnits,images,agentEmail\nBedsitter category,Modern units near transit,rent,8500,Nairobi,Nairobi,Pipeline,Bedsitter,0,1,+254700000000,River Park,Single rooms,24,6,https://example.com/photo.jpg,\n";

function Panel({ title, detail, action, children }) {
  return <section className="border border-slate-200 bg-white"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5"><div><h2 className="font-bold text-slate-900">{title}</h2>{detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}</div>{action}</div>{children}</section>;
}

export default function CompanyWorkspace() {
  const { user, subscription } = useAuth();
  const isOwner = user?.role === "landlord";
  const isManager = isOwner || user?.teamRole === "manager";
  const permissions = user?.teamPermissions || [];
  const [members, setMembers] = useState([]);
  const [listings, setListings] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [report, setReport] = useState({ summary: {}, monthly: [], byAgent: [], recentDeals: [] });
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvName, setCsvName] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState({ name: "", email: "", phone: "", role: "agent" });
  const [dealTarget, setDealTarget] = useState(null);
  const [dealForm, setDealForm] = useState({ outcome: "rented", amount: "", units: "1", agentId: "", notes: "" });
  const [savingDeal, setSavingDeal] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const jobs = [getMyListings(), getMyInquiries(), getTeamReports()];
      if (isOwner || permissions.includes("team")) jobs.push(getTeamMembers());
      const results = await Promise.all(jobs);
      setListings(results[0].listings || []);
      setInquiries(results[1].inquiries || []);
      setReport(results[2]);
      setMembers(results[3]?.members || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load your company workspace.");
    } finally {
      setLoading(false);
    }
  }, [isOwner, permissions]);

  useEffect(() => { refresh(); }, [refresh]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } }
  }), []);
  const monthly = report.monthly || [];
  const trendData = {
    labels: monthly.map((item) => item.label),
    datasets: [
      { label: "Inquiries", data: monthly.map((item) => item.inquiries), backgroundColor: "#0F766E", borderRadius: 3 },
      { label: "Deals closed", data: monthly.map((item) => item.deals), backgroundColor: "#F59E0B", borderRadius: 3 }
    ]
  };
  const revenueData = {
    labels: monthly.map((item) => item.label),
    datasets: [{ label: "Deal value (KES)", data: monthly.map((item) => item.value), borderColor: "#0F766E", backgroundColor: "rgba(15,118,110,.12)", fill: true, tension: .32, pointRadius: 3 }]
  };
  const agentPerformance = {
    labels: (report.byAgent || []).map((agent) => agent.name),
    datasets: [{ label: "Deals closed", data: (report.byAgent || []).map((agent) => agent.deals), backgroundColor: "#0F766E", borderRadius: 3 }]
  };
  const activeListings = listings.filter((listing) => listing.isActive && listing.availability === "available");

  const handleInvite = async (event) => {
    event.preventDefault();
    setInviting(true);
    try {
      const result = await inviteTeamMember(invite);
      setMembers((items) => [result.member, ...items]);
      setInvite({ name: "", email: "", phone: "", role: "agent" });
      setShowInvite(false);
      toast.success("Workspace invitation sent by email.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not invite this team member.");
    } finally {
      setInviting(false);
    }
  };

  const changeMemberRole = async (memberId, role) => {
    try {
      const result = await updateTeamMember(memberId, { role });
      setMembers((items) => items.map((item) => item._id === memberId ? result.member : item));
      toast.success("Team role updated.");
    } catch (error) { toast.error(error.response?.data?.message || "Could not update role."); }
  };

  const toggleMember = async (member) => {
    const status = member.status === "active" ? "suspended" : "active";
    try {
      const result = await updateTeamMember(member._id, { status });
      setMembers((items) => items.map((item) => item._id === member._id ? result.member : item));
      toast.success(status === "active" ? "Access restored." : "Team member suspended.");
    } catch (error) { toast.error(error.response?.data?.message || "Could not update access."); }
  };

  const handleAssignListing = async (listingId, agentId) => {
    try {
      const result = await assignListing(listingId, agentId);
      setListings((items) => items.map((item) => item._id === listingId ? { ...item, assignedAgent: result.listing.assignedAgent } : item));
      toast.success("Property assignment updated.");
    } catch (error) { toast.error(error.response?.data?.message || "Could not assign property."); }
  };

  const handleAssignInquiry = async (inquiryId, agentId) => {
    try {
      const result = await assignInquiry(inquiryId, agentId);
      setInquiries((items) => items.map((item) => item._id === inquiryId ? { ...item, assignedAgent: result.inquiry.assignedAgent } : item));
      toast.success("Inquiry assignment updated.");
    } catch (error) { toast.error(error.response?.data?.message || "Could not assign inquiry."); }
  };

  const handleCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv") || file.size > 180000) {
      toast.error("Choose a CSV file smaller than 180 KB.");
      event.target.value = "";
      return;
    }
    setCsvName(file.name);
    setCsvText(await file.text());
  };

  const handleImport = async () => {
    if (!csvText) return;
    setImporting(true);
    try {
      const result = await importListingsCsv(csvText);
      setListings((items) => [...result.listings, ...items]);
      setCsvText(""); setCsvName("");
      toast.success(`${result.imported} property categories imported for review.`);
      refresh();
    } catch (error) {
      const rowErrors = error.response?.data?.errors;
      const message = rowErrors?.slice(0, 3).map((row) => `Row ${row.row}: ${row.errors.join(", ")}`).join(" · ");
      toast.error(message || error.response?.data?.message || "Could not import CSV.", { duration: 6500 });
    } finally { setImporting(false); }
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([csvTemplate], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "rendahomes-inventory-template.csv"; link.click();
    URL.revokeObjectURL(url);
  };

  const openDeal = (listing) => {
    setDealTarget(listing);
    setDealForm({ outcome: listing.purpose === "sale" ? "sold" : "rented", amount: String(listing.price || ""), units: "1", agentId: listing.assignedAgent?._id || "", notes: "" });
  };

  const submitDeal = async (event) => {
    event.preventDefault();
    setSavingDeal(true);
    try {
      await recordDeal({ listingId: dealTarget._id, ...dealForm });
      setDealTarget(null);
      toast.success("Deal recorded and available inventory updated.");
      await refresh();
    } catch (error) { toast.error(error.response?.data?.message || "Could not record the deal."); }
    finally { setSavingDeal(false); }
  };

  if (loading) return <div className="mx-auto max-w-7xl space-y-4 p-4"><div className="h-24 animate-pulse bg-white" /><div className="h-72 animate-pulse bg-white" /></div>;
  if (!subscription || !["premium", "pro"].includes(subscription.plan) || subscription.status !== "active") {
    return <div className="border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">Company tools require an active Premium or Pro subscription.</div>;
  }

  return <div className="mx-auto max-w-[1600px] space-y-6 pb-10 text-slate-900">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-800">{subscription.plan} company workspace</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">People, properties & performance</h1><p className="mt-2 max-w-2xl text-sm text-slate-600">Assign each building and inquiry to your team, track rental and sale outcomes, and review portfolio activity.</p></div><button type="button" onClick={refresh} className="inline-flex min-h-10 items-center gap-2 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><FiLoader /> Refresh</button></header>

    <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
      {[
        ["Available categories", activeListings.length],
        ["Available units", report.summary?.availableUnits || 0],
        ["Listing views", report.summary?.listingViews || 0],
        ["Inquiries", report.summary?.inquiries || 0],
        ["Closed deal value", currency(report.summary?.dealValue)]
      ].map(([label, value]) => <div key={label} className="border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-xl font-bold text-slate-950">{value}</p></div>)}
    </section>

    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="Leasing & sales activity" detail="Inquiries and completed deals by month, last six months"><div className="h-72 p-4"><Bar data={trendData} options={chartOptions} /></div></Panel>
      <Panel title="Recorded deal value" detail="Value of rentals and sales marked complete"><div className="h-72 p-4"><Line data={revenueData} options={chartOptions} /></div></Panel>
    </div>
    <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
      <Panel title="Team performance" detail="Closed deals and attributed value by team member"><div className="h-64 p-4"><Bar data={agentPerformance} options={chartOptions} /></div></Panel>
      <Panel title="Agent report" detail="Use attribution to review follow-up and completed transactions"><div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Team member</th><th className="px-4 py-3">Inquiries</th><th className="px-4 py-3">Deals</th><th className="px-4 py-3">Value</th></tr></thead><tbody className="divide-y divide-slate-100">{(report.byAgent || []).map((agent) => <tr key={agent.id}><td className="px-4 py-3"><p className="font-semibold text-slate-900">{agent.name}</p><p className="text-xs capitalize text-slate-500">{agent.role}</p></td><td className="px-4 py-3">{agent.inquiries}</td><td className="px-4 py-3">{agent.deals}</td><td className="px-4 py-3 font-semibold">{currency(agent.value)}</td></tr>)}{!report.byAgent?.length && <tr><td colSpan="4" className="px-4 py-10 text-center text-slate-500">Invite agents to start comparing team results.</td></tr>}</tbody></table></div></Panel>
    </div>

    <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
      <Panel title="Company agents" detail="Invite staff and control their workspace access" action={isOwner && <button type="button" onClick={() => setShowInvite((value) => !value)} className="inline-flex min-h-9 items-center gap-2 bg-emerald-800 px-3 text-sm font-semibold text-white hover:bg-emerald-900"><FiPlus /> Invite agent</button>}>
        {showInvite && isOwner && <form onSubmit={handleInvite} className="grid gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <input required value={invite.name} onChange={(event) => setInvite({ ...invite, name: event.target.value })} placeholder="Full name" className="h-10 border border-slate-300 bg-white px-3 text-sm" />
          <input required type="email" value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })} placeholder="Work email" className="h-10 border border-slate-300 bg-white px-3 text-sm" />
          <input required value={invite.phone} onChange={(event) => setInvite({ ...invite, phone: event.target.value })} placeholder="Phone number" className="h-10 border border-slate-300 bg-white px-3 text-sm" />
          <div className="flex gap-2"><select value={invite.role} onChange={(event) => setInvite({ ...invite, role: event.target.value })} className="h-10 min-w-0 flex-1 border border-slate-300 bg-white px-3 text-sm"><option value="agent">Leasing agent</option><option value="manager">Manager</option><option value="viewer">Viewer</option></select><button disabled={inviting} className="h-10 bg-emerald-800 px-4 text-sm font-semibold text-white disabled:opacity-50">{inviting ? "Sending..." : "Send invite"}</button></div>
          <p className="text-xs leading-5 text-slate-500 sm:col-span-2">Agents manage assigned properties and inquiries. Managers can assign company records. Viewers can review inventory and reports. Each person receives a secure password setup link.</p>
        </form>}
        <div className="divide-y divide-slate-100">
          {members.length ? members.map((member) => <div key={member._id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5"><div className="grid h-9 w-9 shrink-0 place-items-center bg-emerald-50 text-emerald-800"><FiUsers /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{member.name}</p><p className="truncate text-xs text-slate-500">{member.email} · {member.phone}</p></div>{isOwner ? <select aria-label={`Role for ${member.name}`} value={member.role} onChange={(event) => changeMemberRole(member._id, event.target.value)} className="h-9 border border-slate-300 bg-white px-2 text-xs capitalize"><option value="agent">Agent</option><option value="manager">Manager</option><option value="viewer">Viewer</option></select> : <span className="text-xs capitalize text-slate-600">{member.role}</span>}<button type="button" onClick={() => toggleMember(member)} disabled={!isOwner} className={`min-h-8 px-2 text-xs font-semibold ${member.status === "active" ? "text-rose-700 hover:bg-rose-50" : "text-emerald-800 hover:bg-emerald-50"} disabled:opacity-60`}>{member.status === "active" ? "Suspend" : "Reactivate"}</button></div>) : <p className="px-5 py-10 text-center text-sm text-slate-500">No company agents yet. Invite your first team member.</p>}
        </div>
      </Panel>

      <Panel title="Import property categories" detail="One CSV row per property type/category, not one row per room" action={<button type="button" onClick={downloadTemplate} className="inline-flex min-h-9 items-center gap-2 border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"><FiDownload /> CSV template</button>}>
        <div className="space-y-3 p-4 sm:p-5"><label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-slate-300 bg-slate-50 text-center hover:border-emerald-700"><FiUpload className="text-xl text-emerald-800" /><span className="text-sm font-semibold text-slate-800">{csvName || "Select a CSV inventory file"}</span><span className="text-xs text-slate-500">Up to 100 categories per file · max 180 KB</span><input type="file" accept=".csv,text/csv" onChange={handleCsv} className="sr-only" /></label>
          <p className="text-xs leading-5 text-slate-500">Include building, category, total units, available units, and optional HTTPS image URLs separated with |. Imported records enter the normal listing review queue.</p>
          {csvText && <div className="flex items-center justify-between gap-3 border border-emerald-200 bg-emerald-50 p-3"><span className="text-sm font-medium text-emerald-950">{Math.max(csvText.trim().split(/\r?\n/).length - 1, 0)} data rows ready</span><button type="button" onClick={handleImport} disabled={importing} className="inline-flex min-h-9 items-center gap-2 bg-emerald-800 px-3 text-sm font-semibold text-white disabled:opacity-50"><FiUpload />{importing ? "Importing..." : "Import inventory"}</button></div>}
        </div>
      </Panel>
    </div>

    <Panel title="Property categories & assignments" detail="A building/category is one listing record with a live available-unit count">
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Property / category</th><th className="px-4 py-3">Building</th><th className="px-4 py-3">Units</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Assigned agent</th><th className="px-4 py-3">Deal</th></tr></thead><tbody className="divide-y divide-slate-100">{listings.map((listing) => <tr key={listing._id}><td className="max-w-56 px-4 py-3"><p className="truncate font-semibold text-slate-900">{listing.title}</p><p className="mt-0.5 text-xs text-slate-500">{listing.portfolioCategory || "Single property"}</p></td><td className="px-4 py-3 text-slate-600">{listing.portfolioName || "—"}</td><td className="px-4 py-3"><span className="font-semibold">{listing.availableUnits ?? 1}</span><span className="text-slate-500"> / {listing.totalUnits ?? 1}</span></td><td className="px-4 py-3"><span className="capitalize text-slate-600">{listing.status === "pending" ? "In review" : listing.availability}</span></td><td className="px-4 py-3">{isManager ? <select aria-label={`Assign ${listing.title}`} value={listing.assignedAgent?._id || ""} onChange={(event) => handleAssignListing(listing._id, event.target.value)} className="h-9 max-w-40 border border-slate-300 bg-white px-2 text-xs"><option value="">Unassigned</option>{members.filter((member) => member.status === "active").map((member) => <option key={member._id} value={member._id}>{member.name}</option>)}</select> : <span className="text-slate-600">{listing.assignedAgent?.name || "Unassigned"}</span>}</td><td className="px-4 py-3">{permissions.includes("deals") || isOwner ? <button type="button" onClick={() => openDeal(listing)} disabled={listing.status !== "approved" || (listing.availableUnits ?? 1) < 1} className="min-h-8 whitespace-nowrap border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 hover:border-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-40">Record {listing.purpose === "sale" ? "sale" : "rental"}</button> : "—"}</td></tr>)}{!listings.length && <tr><td colSpan="6" className="px-4 py-12 text-center text-slate-500">No property categories in this workspace yet.</td></tr>}</tbody></table></div>
    </Panel>

    <Panel title="Inquiry ownership" detail="Assign new leads to a company agent so follow-up has a clear owner">
      <div className="divide-y divide-slate-100">{inquiries.slice(0, 30).map((inquiry) => <div key={inquiry._id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{inquiry.name || "Property seeker"}</p><p className="mt-1 truncate text-xs text-slate-500">{inquiry.listing?.title || "Property inquiry"} · {inquiry.status}</p></div>{isManager ? <select aria-label={`Assign inquiry from ${inquiry.name}`} value={inquiry.assignedAgent?._id || ""} onChange={(event) => handleAssignInquiry(inquiry._id, event.target.value)} className="h-9 max-w-44 border border-slate-300 bg-white px-2 text-xs"><option value="">Unassigned</option>{members.filter((member) => member.status === "active").map((member) => <option key={member._id} value={member._id}>{member.name}</option>)}</select> : <span className="text-xs text-slate-600">{inquiry.assignedAgent?.name || "Unassigned"}</span>}</div>)}{!inquiries.length && <p className="px-5 py-10 text-center text-sm text-slate-500">Company inquiries will appear here.</p>}</div>
    </Panel>

    <Panel title="Closed deals" detail="Latest rentals and sales recorded by the company team"><div className="divide-y divide-slate-100">{report.recentDeals?.length ? report.recentDeals.map((deal) => <div key={deal._id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{deal.listing?.title || "Property"} · {deal.outcome}</p><p className="mt-1 text-xs text-slate-500">{deal.agent?.name || "Company owner"} · {new Date(deal.closedAt).toLocaleDateString("en-KE")}</p></div><p className="text-sm font-bold text-slate-900">{currency(deal.amount)}</p></div>) : <p className="px-5 py-10 text-center text-sm text-slate-500">Recorded deals will build your team performance report.</p>}</div></Panel>

    {dealTarget && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" onMouseDown={(event) => event.target === event.currentTarget && setDealTarget(null)}><form onSubmit={submitDeal} className="w-full max-w-lg space-y-4 bg-white p-5 shadow-xl sm:p-6"><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Close transaction</p><h2 className="mt-1 text-lg font-bold text-slate-950">{dealTarget.title}</h2><p className="mt-1 text-sm text-slate-600">Record who completed the rental or sale. Available inventory will update.</p></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Outcome<select value={dealForm.outcome} onChange={(event) => setDealForm({ ...dealForm, outcome: event.target.value })} className="mt-1 block h-10 w-full border border-slate-300 bg-white px-3"><option value="rented">Rented</option><option value="sold">Sold</option></select></label><label className="text-sm font-semibold text-slate-700">Deal amount (KES)<input required min="0" type="number" value={dealForm.amount} onChange={(event) => setDealForm({ ...dealForm, amount: event.target.value })} className="mt-1 block h-10 w-full border border-slate-300 px-3" /></label><label className="text-sm font-semibold text-slate-700">Units closed<input required min="1" max={dealTarget.availableUnits ?? 1} type="number" value={dealForm.units} onChange={(event) => setDealForm({ ...dealForm, units: event.target.value })} className="mt-1 block h-10 w-full border border-slate-300 px-3" /></label>{isOwner || isManager ? <label className="text-sm font-semibold text-slate-700">Credited agent<select value={dealForm.agentId} onChange={(event) => setDealForm({ ...dealForm, agentId: event.target.value })} className="mt-1 block h-10 w-full border border-slate-300 bg-white px-3"><option value="">{dealTarget.assignedAgent?.name || "Company owner"}</option>{members.map((member) => <option key={member._id} value={member._id}>{member.name}</option>)}</select></label> : null}</div><label className="block text-sm font-semibold text-slate-700">Notes<textarea rows="3" value={dealForm.notes} onChange={(event) => setDealForm({ ...dealForm, notes: event.target.value })} className="mt-1 w-full border border-slate-300 p-3 font-normal" placeholder="Optional closing note" /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setDealTarget(null)} className="min-h-10 border border-slate-300 px-4 text-sm font-semibold">Cancel</button><button disabled={savingDeal} className="inline-flex min-h-10 items-center gap-2 bg-emerald-800 px-4 text-sm font-semibold text-white disabled:opacity-50"><FiCheck />{savingDeal ? "Saving..." : "Record deal"}</button></div></form></div>}
  </div>;
}
