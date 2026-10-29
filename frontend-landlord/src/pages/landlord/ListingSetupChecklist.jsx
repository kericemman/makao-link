import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiBriefcase, FiCheck, FiHome, FiUsers } from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../services/user.service";
import { getTeamMembers, inviteTeamMember } from "../../services/team.service";

const emptyInvite = { name: "", email: "", phone: "", role: "agent" };

export default function ListingSetupChecklist({ onContinue, onSkip }) {
  const { user, subscription, refreshAuth } = useAuth();
  const advancedWorkspace = ["premium", "pro"].includes(subscription?.plan) && subscription?.status === "active";
  const [isCompany, setIsCompany] = useState(Boolean(user?.businessName));
  const [multiUnit, setMultiUnit] = useState(false);
  const [hasAgents, setHasAgents] = useState(false);
  const [company, setCompany] = useState({ businessName: user?.businessName || "", location: user?.location || "", phone: user?.phone || "" });
  const [companySaved, setCompanySaved] = useState(Boolean(user?.businessName && user?.location && user?.phone));
  const [inventory, setInventory] = useState({ building: "", category: "", totalUnits: "", availableUnits: "" });
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [invite, setInvite] = useState(emptyInvite);
  const [savingCompany, setSavingCompany] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [deferAgents, setDeferAgents] = useState(false);

  useEffect(() => {
    if (!advancedWorkspace || user?.role !== "landlord") return;
    setLoadingMembers(true);
    getTeamMembers().then((result) => setMembers(result.members || [])).catch(() => {}).finally(() => setLoadingMembers(false));
  }, [advancedWorkspace, user?.role]);

  const saveCompany = async (event) => {
    event.preventDefault();
    if (!company.businessName.trim() || !company.location.trim() || !company.phone.trim()) {
      toast.error("Add your company name, location, and phone number.");
      return;
    }
    setSavingCompany(true);
    try {
      const form = new FormData();
      form.append("businessName", company.businessName.trim());
      form.append("location", company.location.trim());
      form.append("phone", company.phone.trim());
      await updateProfile(form);
      await refreshAuth();
      setCompanySaved(true);
      toast.success("Company details saved to your profile.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save company details.");
    } finally {
      setSavingCompany(false);
    }
  };

  const addAgent = async (event) => {
    event.preventDefault();
    setInviting(true);
    try {
      const result = await inviteTeamMember(invite);
      setMembers((current) => [result.member, ...current]);
      setInvite(emptyInvite);
      setDeferAgents(false);
      toast.success("Invitation sent. Your agent can set a password from their email.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not invite this agent.");
    } finally {
      setInviting(false);
    }
  };

  const continueToForm = () => {
    if (isCompany && !companySaved) {
      toast.error("Save your company details, or choose Skip setup to continue without them.");
      return;
    }
    if (multiUnit && (!inventory.building.trim() || !inventory.category.trim() || !Number(inventory.totalUnits))) {
      toast.error("Add the building, unit category, and total number of units first.");
      return;
    }
    const activeMembers = members.filter((member) => member.status === "active");
    if (hasAgents && advancedWorkspace && user?.role === "landlord" && !loadingMembers && !activeMembers.length && !deferAgents) {
      toast.error("Invite an agent now, or choose to add agents later.");
      return;
    }
    onContinue({
      inventoryMode: multiUnit,
      inventory: {
        building: inventory.building,
        category: inventory.category,
        totalUnits: inventory.totalUnits,
        availableUnits: inventory.availableUnits || inventory.totalUnits
      }
    });
  };

  const activeMembers = members.filter((member) => member.status === "active");

  return <main className="mx-auto max-w-4xl space-y-5 pb-10 text-slate-900">
    <header className="border-b border-slate-200 pb-5">
      <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Listing setup</p>
      <h1 className="mt-1 text-2xl font-bold sm:text-3xl">A few details before you list</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Tell us what you manage so the listing form can include the right building and company details. You can skip setup and add a standard property now.</p>
    </header>

    <section className="grid gap-3 sm:grid-cols-2" aria-label="Property setup choices">
      <button type="button" onClick={() => setMultiUnit(false)} aria-pressed={!multiUnit} className={`min-h-28 border p-4 text-left transition ${!multiUnit ? "border-emerald-800 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-400"}`}>
        <FiHome className="text-xl text-emerald-800" /><span className="mt-3 block text-sm font-bold">One property</span><span className="mt-1 block text-xs leading-5 text-slate-600">A single home, apartment, office, or rental unit.</span>
      </button>
      {advancedWorkspace && <button type="button" onClick={() => setMultiUnit((value) => !value)} aria-pressed={multiUnit} className={`min-h-28 border p-4 text-left transition ${multiUnit ? "border-emerald-800 bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-400"}`}>
        <FiBriefcase className="text-xl text-emerald-800" /><span className="mt-3 block text-sm font-bold">A building with multiple unit types</span><span className="mt-1 block text-xs leading-5 text-slate-600">Create one listing for each category and track its available units.</span>
      </button>}
    </section>

    {multiUnit && <section className="border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center bg-emerald-50 text-emerald-800"><FiHome /></span><div><h2 className="font-bold">Building and unit category</h2><p className="mt-1 text-sm text-slate-600">For example, River Park Apartments · 1-bedroom homes · 24 total, 6 available.</p></div></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">Building name<input value={inventory.building} onChange={(event) => setInventory({ ...inventory, building: event.target.value })} placeholder="e.g. River Park Apartments" className="mt-1 block h-10 w-full border border-slate-300 px-3 font-normal" /></label>
        <label className="text-sm font-semibold">Unit category<input value={inventory.category} onChange={(event) => setInventory({ ...inventory, category: event.target.value })} placeholder="e.g. 1-bedroom homes" className="mt-1 block h-10 w-full border border-slate-300 px-3 font-normal" /></label>
        <label className="text-sm font-semibold">Total units<input type="number" min="1" max="5000" value={inventory.totalUnits} onChange={(event) => setInventory({ ...inventory, totalUnits: event.target.value, availableUnits: inventory.availableUnits || event.target.value })} placeholder="24" className="mt-1 block h-10 w-full border border-slate-300 px-3 font-normal" /></label>
        <label className="text-sm font-semibold">Available now<input type="number" min="0" max={inventory.totalUnits || 5000} value={inventory.availableUnits} onChange={(event) => setInventory({ ...inventory, availableUnits: event.target.value })} placeholder="Defaults to total units" className="mt-1 block h-10 w-full border border-slate-300 px-3 font-normal" /></label>
      </div>
    </section>}

    {user?.role === "landlord" && <section className="border border-slate-200 bg-white p-4 sm:p-5">
      <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={isCompany} onChange={(event) => setIsCompany(event.target.checked)} className="mt-1 h-4 w-4 accent-emerald-800" /><span><span className="block text-sm font-bold">I am listing on behalf of a company or property business</span><span className="mt-1 block text-xs leading-5 text-slate-600">Add the company name and contact details to your landlord profile.</span></span></label>
      {isCompany && <form onSubmit={saveCompany} className="mt-4 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">Company name<input value={company.businessName} onChange={(event) => { setCompany({ ...company, businessName: event.target.value }); setCompanySaved(false); }} placeholder="Registered or trading name" className="mt-1 block h-10 w-full border border-slate-300 px-3 font-normal" /></label>
        <label className="text-sm font-semibold">Business location<input value={company.location} onChange={(event) => { setCompany({ ...company, location: event.target.value }); setCompanySaved(false); }} placeholder="Town, county" className="mt-1 block h-10 w-full border border-slate-300 px-3 font-normal" /></label>
        <label className="text-sm font-semibold">Business phone<input value={company.phone} onChange={(event) => { setCompany({ ...company, phone: event.target.value }); setCompanySaved(false); }} placeholder="e.g. +254 700 000 000" className="mt-1 block h-10 w-full border border-slate-300 px-3 font-normal" /></label>
        <div className="flex items-end gap-3"><button type="submit" disabled={savingCompany} className="inline-flex min-h-10 items-center gap-2 bg-emerald-800 px-4 text-sm font-semibold text-white disabled:opacity-60">{companySaved ? <FiCheck /> : null}{savingCompany ? "Saving..." : companySaved ? "Company details saved" : "Save company details"}</button><Link to="/profile" className="text-sm font-semibold text-emerald-800 underline">Open full profile</Link></div>
      </form>}
    </section>}

    {advancedWorkspace && user?.role === "landlord" && <section className="border border-slate-200 bg-white p-4 sm:p-5">
      <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={hasAgents} onChange={(event) => { setHasAgents(event.target.checked); setDeferAgents(false); }} className="mt-1 h-4 w-4 accent-emerald-800" /><span><span className="block text-sm font-bold">I work with agents who manage properties or inquiries</span><span className="mt-1 block text-xs leading-5 text-slate-600">Set up your team so listings and tenant inquiries can be assigned to the right person.</span></span></label>
      {hasAgents && <div className="mt-4 border-t border-slate-200 pt-4">
        <>
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-bold">Company agents</h2><p className="mt-1 text-xs text-slate-600">{loadingMembers ? "Checking your team..." : `${activeMembers.length} active ${activeMembers.length === 1 ? "member" : "members"}`}</p></div><Link to="/team" className="text-xs font-semibold text-emerald-800 underline">Manage team</Link></div>
          {activeMembers.length === 0 && <form onSubmit={addAgent} className="mt-3 grid gap-3 sm:grid-cols-2">
            <input required value={invite.name} onChange={(event) => setInvite({ ...invite, name: event.target.value })} placeholder="Agent full name" className="h-10 border border-slate-300 px-3 text-sm" />
            <input required type="email" value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })} placeholder="Agent email" className="h-10 border border-slate-300 px-3 text-sm" />
            <input required value={invite.phone} onChange={(event) => setInvite({ ...invite, phone: event.target.value })} placeholder="Agent phone" className="h-10 border border-slate-300 px-3 text-sm" />
            <div className="flex gap-2"><select value={invite.role} onChange={(event) => setInvite({ ...invite, role: event.target.value })} className="h-10 min-w-0 flex-1 border border-slate-300 bg-white px-2 text-sm"><option value="agent">Agent</option><option value="manager">Manager</option><option value="viewer">Viewer</option></select><button disabled={inviting} className="inline-flex min-h-10 items-center gap-2 bg-emerald-800 px-3 text-sm font-semibold text-white disabled:opacity-60"><FiUsers />{inviting ? "Inviting..." : "Invite agent"}</button></div>
            <label className="flex items-center gap-2 text-xs text-slate-600 sm:col-span-2"><input type="checkbox" checked={deferAgents} onChange={(event) => setDeferAgents(event.target.checked)} className="h-4 w-4 accent-emerald-800" />I’ll invite my agents after creating this listing</label>
          </form>}
          {activeMembers.length > 0 && <p className="mt-3 text-xs text-slate-600">Your team is ready. You can assign this listing to an agent after the property is submitted.</p>}
        </>
      </div>}
    </section>}

    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
      <button type="button" onClick={onSkip} className="min-h-10 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100">Skip setup and continue</button>
      <button type="button" onClick={continueToForm} disabled={hasAgents && advancedWorkspace && loadingMembers} className="inline-flex min-h-11 items-center gap-2 bg-emerald-800 px-5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-60">{hasAgents && loadingMembers ? "Checking team..." : "Continue to listing"} <FiArrowRight /></button>
    </footer>
  </main>;
}
