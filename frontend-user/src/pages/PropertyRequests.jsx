import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { FiChevronDown, FiHome, FiMapPin, FiRefreshCw, FiSearch, FiX } from "react-icons/fi";
import { createPropertyRequest, getPropertyRequests, matchPropertyRequest, closePropertyRequest, respondToAgentProposal } from "../services/marketplace.service";
import { getApiErrorMessage } from "../utils/apiError";
import { useAuth } from "../context/AuthContext";

const emptyForm = { purpose: "rent", budgetMin: "", budgetMax: "", county: "", town: "", propertyType: "", bedrooms: "", bathrooms: "", stayStartDate: "", stayEndDate: "", guestCount: "", requirements: "", matchingConsent: false, agentSharingConsent: false };
const types = ["apartment", "bedsitter", "maisonette", "studio", "bungalow", "townhouse", "villa", "office", "other"];
const retainedSearchFields = ["purpose", "search", "county", "town", "type", "bedrooms", "bathrooms", "minPrice", "maxPrice", "guests"];
const dateInputValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const addDateDays = (value, days) => {
  const date = value ? new Date(`${value}T12:00:00`) : new Date();
  date.setDate(date.getDate() + days);
  return dateInputValue(date);
};

const readStored = (key) => {
  try { return JSON.parse(sessionStorage.getItem(key) || "null"); } catch { return null; }
};

const initialFormFromSearch = (params) => {
  const purpose = ["rent", "sale", "short_stay"].includes(params.get("purpose")) ? params.get("purpose") : "rent";
  const type = types.includes(params.get("type")) ? params.get("type") : "";
  const numberValue = (value, max = 1_000_000_000_000) => {
    if (value === null || value === "" || !/^\d+$/.test(value)) return "";
    const number = Number(value);
    return number <= max ? String(number) : "";
  };
  const search = params.get("search")?.trim();
  return {
    ...emptyForm,
    purpose,
    budgetMin: numberValue(params.get("minPrice")),
    budgetMax: numberValue(params.get("maxPrice")),
    county: (params.get("county") || "").slice(0, 100),
    town: (params.get("town") || "").slice(0, 100),
    propertyType: type,
    bedrooms: numberValue(params.get("bedrooms"), 100),
    bathrooms: numberValue(params.get("bathrooms"), 100),
    guestCount: numberValue(params.get("guests"), 100),
    requirements: search ? `Search keywords: ${search}`.slice(0, 1200) : ""
  };
};

const newSubmissionKey = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const getMatchNotice = (matches, prefix = "") => {
  const exactCount = matches.filter((match) => match.match?.classification === "exact").length;
  const alternativeCount = matches.filter((match) => match.match?.classification === "alternative").length;
  const lead = prefix ? `${prefix} ` : "";
  if (exactCount) return `${lead}${exactCount} matching ${exactCount === 1 ? "home is" : "homes are"} available.`;
  if (alternativeCount) return `${lead}No exact homes were found. ${alternativeCount} alternative ${alternativeCount === 1 ? "home is" : "homes are"} available in another town in your selected county.`;
  return `${lead}No eligible homes are available right now; you can refresh this request later.`;
};

export default function PropertyRequests() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryContext = JSON.stringify(Object.fromEntries(retainedSearchFields.filter((key) => searchParams.has(key)).map((key) => [key, searchParams.get(key)])));
  const draftStorageKey = `renda_property_request_draft:${user?._id || "unknown"}`;
  const pendingStorageKey = `renda_property_request_pending:${user?._id || "unknown"}`;
  const [requests, setRequests] = useState([]);
  const [matches, setMatches] = useState({});
  const [proposals, setProposals] = useState({});
  const [form, setForm] = useState(() => {
    const draft = readStored(draftStorageKey);
    return draft?.queryContext === queryContext && draft?.form ? { ...emptyForm, ...draft.form } : initialFormFromSearch(searchParams);
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState("");
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const today = dateInputValue(new Date());
  const minimumCheckOut = addDateDays(form.stayStartDate || today, 1);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPropertyRequests();
      const savedRequests = data.propertyRequests || [];
      setRequests(savedRequests);
      setMatches(Object.fromEntries(savedRequests.map((item) => [item._id, data.matchesByRequest?.[item._id] || []])));
      setProposals(data.proposalsByRequest || {});
      setError("");
    } catch (err) { setError(getApiErrorMessage(err, "Could not load your property requests.")); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    try { sessionStorage.setItem(draftStorageKey, JSON.stringify({ queryContext, form })); } catch { /* session storage can be unavailable */ }
  }, [draftStorageKey, form, queryContext]);

  const changeForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!form.matchingConsent) {
      setError("Please agree to property matching before saving this request.");
      return;
    }
    if (form.budgetMin !== "" && Number(form.budgetMin) > Number(form.budgetMax)) {
      setError("Minimum budget cannot exceed maximum budget.");
      return;
    }
    if (form.purpose === "short_stay" && (!form.stayStartDate || !form.stayEndDate || form.stayEndDate <= form.stayStartDate)) {
      setError("Choose check-out at least one night after check-in.");
      return;
    }
    setSubmitting(true);
    setSubmitPhase("saving");
    const purpose = form.purpose;
    const payload = {
      purpose,
      pricePeriod: purpose === "rent" ? "monthly" : purpose === "sale" ? "total" : "nightly",
      budgetMin: form.budgetMin === "" ? undefined : Number(form.budgetMin),
      budgetMax: Number(form.budgetMax),
      preferredLocations: form.county || form.town ? [{ ...(form.county ? { county: form.county } : {}), ...(form.town ? { town: form.town } : {}) }] : [],
      propertyTypes: form.propertyType ? [form.propertyType] : [],
      minBedrooms: form.bedrooms === "" ? undefined : Number(form.bedrooms),
      minBathrooms: form.bathrooms === "" ? undefined : Number(form.bathrooms),
      ...(purpose === "short_stay" ? { stayStartDate: new Date(form.stayStartDate).toISOString(), stayEndDate: new Date(form.stayEndDate).toISOString(), guestCount: Number(form.guestCount) } : {}),
      requirements: form.requirements.trim(),
      consent: { matching: true, agentSharing: form.agentSharingConsent }
    };
    const payloadFingerprint = JSON.stringify(payload);
    const pending = readStored(pendingStorageKey);
    const idempotencyKey = pending?.payloadFingerprint === payloadFingerprint ? pending.key : newSubmissionKey();
    try {
      sessionStorage.setItem(pendingStorageKey, JSON.stringify({ key: idempotencyKey, payloadFingerprint }));
    } catch { /* server idempotency still protects retries within this attempt */ }

    let request;
    try {
      const data = await createPropertyRequest(payload, idempotencyKey);
      request = data.propertyRequest;
    } catch (err) {
      setError(getApiErrorMessage(err, "We couldn't confirm whether your request saved. Retry this same submission safely."));
      setSubmitting(false);
      setSubmitPhase("");
      return;
    }

    try {
      sessionStorage.removeItem(pendingStorageKey);
      sessionStorage.removeItem(draftStorageKey);
    } catch { /* session storage can be unavailable */ }
    setRequests((current) => [request, ...current.filter((item) => item._id !== request._id)]);
    setForm(emptyForm);
    setSearchParams({}, { replace: true });
    setSubmitPhase("matching");

    try {
      const matched = await matchPropertyRequest(request._id);
      setMatches((current) => ({ ...current, [request._id]: matched.matches || [] }));
      const matchDate = new Date().toISOString();
      setRequests((current) => current.map((item) => item._id === request._id ? { ...item, status: matched.count ? "matched" : "active", lastMatchedAt: matchDate } : item));
      setNotice(getMatchNotice(matched.matches || [], "Request saved."));
    } catch {
      setNotice("Request saved. Matching is temporarily unavailable; use Refresh matches on this saved request to retry.");
    } finally {
      setSubmitting(false);
      setSubmitPhase("");
    }
  };

  const runMatch = async (id) => {
    setBusyId(id); setError(""); setNotice("");
    try {
      const data = await matchPropertyRequest(id);
      setMatches((current) => ({ ...current, [id]: data.matches || [] }));
      const matchDate = new Date().toISOString();
      setRequests((current) => current.map((item) => item._id === id ? { ...item, status: data.count ? "matched" : "active", lastMatchedAt: matchDate } : item));
      setNotice(getMatchNotice(data.matches || []));
    } catch (err) { setError(`${getApiErrorMessage(err, "Could not refresh matches.")} Your request remains saved; retry when your connection is available.`); }
    finally { setBusyId(""); }
  };

  const closeRequest = async (id) => {
    setBusyId(id);
    try {
      await closePropertyRequest(id);
      setRequests((current) => current.map((item) => item._id === id ? { ...item, status: "closed" } : item));
      setNotice("Property request closed.");
    } catch (err) { setError(getApiErrorMessage(err, "Could not close this request.")); }
    finally { setBusyId(""); }
  };

  const respondToProposal = async (requestId, proposalId, status) => {
    setBusyId(proposalId); setError(""); setNotice("");
    try {
      await respondToAgentProposal(requestId, proposalId, status);
      setProposals((current) => ({
        ...current,
        [requestId]: (current[requestId] || []).map((proposal) => proposal._id === proposalId ? { ...proposal, status } : proposal)
      }));
      setNotice(status === "accepted" ? "Proposal accepted. You can now request a viewing for this property." : "Proposal declined.");
    } catch (err) { setError(getApiErrorMessage(err, "Could not update this agent proposal.")); }
    finally { setBusyId(""); }
  };

  return <div className="space-y-7">
    <header className="border-b border-[#DDEAE3] pb-5">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#168557]">Find a property</p>
      <h1 className="mt-1 text-2xl font-bold text-[#123D38]">My property requests</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">We check approved available listings when you save or refresh. If no exact home is available, we may show clearly labeled options in another town in your selected county; your budget and property requirements stay fixed. This form does not send automatic alerts or assign an agent.</p>
    </header>

    {error && <p role="alert" className="rounded-md bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">{error}</p>}
    {notice && <p role="status" className="rounded-md bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">{notice}</p>}
    {searchParams.toString() && <p className="rounded-md bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900">Your public search filters have been carried over. Review and edit them before saving.</p>}

    <section className="grid gap-8 xl:grid-cols-[minmax(300px,0.8fr)_1.2fr]">
      <form onSubmit={submit} className="space-y-5 border-b border-slate-200 pb-7 xl:border-b-0 xl:border-r xl:pb-0 xl:pr-8">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">What are you looking for?</h2>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Property purpose">
            {["rent", "sale", "short_stay"].map((purpose) => <button key={purpose} type="button" onClick={() => setForm((current) => ({ ...current, purpose }))} aria-pressed={form.purpose === purpose} className={`rounded-md px-4 py-2 text-sm font-semibold capitalize ${form.purpose === purpose ? "bg-[#123D38] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{purpose === "short_stay" ? "Short stay" : purpose}</button>)}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Maximum budget (KES)" type="number" min="0" max="1000000000000" required value={form.budgetMax} onChange={(budgetMax) => changeForm("budgetMax", budgetMax)} placeholder="e.g. 45000" />
          <Field label="Minimum budget (optional)" type="number" min="0" max="1000000000000" value={form.budgetMin} onChange={(budgetMin) => changeForm("budgetMin", budgetMin)} placeholder="e.g. 20000" />
          <Field label="County" value={form.county} onChange={(county) => changeForm("county", county)} placeholder="e.g. Nairobi" />
          <Field label="Town or area" value={form.town} onChange={(town) => changeForm("town", town)} placeholder="e.g. Westlands" />
          <Select label="Property type" value={form.propertyType} onChange={(propertyType) => changeForm("propertyType", propertyType)} options={types} placeholder="Any type" />
          <Field label="Minimum bedrooms" type="number" min="0" max="100" value={form.bedrooms} onChange={(bedrooms) => changeForm("bedrooms", bedrooms)} placeholder="Any" />
          <Field label="Minimum bathrooms" type="number" min="0" max="100" value={form.bathrooms} onChange={(bathrooms) => changeForm("bathrooms", bathrooms)} placeholder="Any" />
        </div>

        {form.purpose === "short_stay" && <div className="grid gap-3 sm:grid-cols-2"><Field label="Check-in date" type="date" min={today} required value={form.stayStartDate} onChange={(stayStartDate) => setForm((current) => ({ ...current, stayStartDate, stayEndDate: current.stayEndDate <= stayStartDate ? "" : current.stayEndDate }))} /><Field label="Check-out date" type="date" min={minimumCheckOut} required value={form.stayEndDate} onChange={(stayEndDate) => changeForm("stayEndDate", stayEndDate)} /><div className="sm:col-span-2"><Field label="Guests" type="number" min="1" max="100" required value={form.guestCount} onChange={(guestCount) => changeForm("guestCount", guestCount)} placeholder="2" /></div></div>}

        <Field label="Other details or search keywords (optional)" value={form.requirements} onChange={(requirements) => changeForm("requirements", requirements)} placeholder="Anything else that matters to your search" />
        <label className="flex cursor-pointer gap-2.5 border-t border-slate-200 pt-4 text-sm text-slate-700"><input type="checkbox" required checked={form.matchingConsent} onChange={(event) => changeForm("matchingConsent", event.target.checked)} className="mt-0.5 accent-emerald-700" /><span>I agree to use these details to find matching available properties.</span></label>
        <label className="flex cursor-pointer gap-2.5 text-sm text-slate-700"><input type="checkbox" checked={form.agentSharingConsent} onChange={(event) => changeForm("agentSharingConsent", event.target.checked)} className="mt-0.5 accent-emerald-700" /><span>Allow approved agents in these areas to suggest a property if no exact match is available. Your contact details stay private unless you choose to proceed.</span></label>
        <button disabled={submitting} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#123D38] px-4 text-sm font-semibold text-white hover:bg-[#18574C] disabled:opacity-60"><FiSearch />{submitting ? submitPhase === "saving" ? "Saving request…" : "Checking available homes…" : "Save request and find homes"}</button>
      </form>

      <div>
        <div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900">Your saved requests</h2><p className="mt-1 text-sm text-slate-500">Matches always reflect current public availability.</p></div><button type="button" onClick={load} className="grid h-9 w-9 place-items-center rounded-md text-slate-600 hover:bg-slate-100" title="Refresh requests" aria-label="Refresh requests"><FiRefreshCw /></button></div>
        {loading ? <p className="py-10 text-center text-sm text-slate-500">Loading your requests…</p> : !requests.length ? <div className="border-y border-slate-200 py-10 text-center"><FiHome className="mx-auto text-2xl text-[#168557]" /><p className="mt-3 font-semibold text-slate-800">No property requests yet</p><p className="mt-1 text-sm text-slate-500">Create one to see suitable available listings here.</p></div> : <div className="divide-y divide-slate-200 border-y border-slate-200">
          {requests.map((request) => <article key={request._id} className="py-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold capitalize text-slate-900">{request.purpose === "short_stay" ? "Short stay" : request.purpose} · up to KES {Number(request.budgetMax).toLocaleString()}</h3><p className="mt-1 flex items-center gap-1 text-sm text-slate-600"><FiMapPin />{request.preferredLocations?.map((loc) => [loc.town, loc.county].filter(Boolean).join(", ")).join(" · ") || "Any location"}</p><p className="mt-1 text-xs capitalize text-slate-500">{request.status?.replaceAll("_", " ")} · {request.propertyTypes?.join(", ") || "Any property type"}</p></div>
              <div className="flex gap-2"><button type="button" disabled={busyId === request._id} onClick={() => runMatch(request._id)} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><FiRefreshCw />Refresh matches</button>{!(["closed", "cancelled", "expired"].includes(request.status)) && <button type="button" disabled={busyId === request._id} onClick={() => closeRequest(request._id)} title="Close request" aria-label="Close request" className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-700"><FiX /></button>}</div>
            </div>
            {(proposals[request._id] || []).length > 0 && <div className="mt-4 border-t border-slate-200 pt-3"><h4 className="text-sm font-semibold text-slate-800">Agent suggestions</h4><div className="mt-2 space-y-3">{proposals[request._id].map((proposal) => <div key={proposal._id} className="flex flex-wrap items-start justify-between gap-3 border-l-2 border-emerald-700 pl-3"><div className="min-w-0"><p className="text-sm font-semibold text-slate-900">{proposal.listing.title}</p><p className="mt-1 text-xs text-slate-600">KES {Number(proposal.listing.price).toLocaleString()} · {proposal.listing.town}, {proposal.listing.county} · Suggested by {proposal.agent?.name || "RendaHomes agent"}</p><span className={`mt-1 inline-block text-xs font-semibold ${proposal.classification === "alternative" ? "text-amber-800" : "text-emerald-800"}`}>{proposal.classification === "alternative" ? "Alternative listing" : "Matches your requirements"}</span>{proposal.message && <p className="mt-1 max-w-xl text-sm text-slate-600">{proposal.message}</p>}</div><div className="flex shrink-0 flex-wrap gap-2">{proposal.status === "proposed" && <><button type="button" disabled={busyId === proposal._id} onClick={() => respondToProposal(request._id, proposal._id, "accepted")} className="min-h-9 rounded-md bg-[#123D38] px-3 text-xs font-semibold text-white disabled:opacity-50">Proceed</button><button type="button" disabled={busyId === proposal._id} onClick={() => respondToProposal(request._id, proposal._id, "declined")} className="min-h-9 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 disabled:opacity-50">Decline</button></>}{proposal.status === "accepted" && <Link to={`/viewings?listingId=${encodeURIComponent(proposal.listing._id)}&propertyRequestId=${encodeURIComponent(request._id)}`} className="inline-flex min-h-9 items-center rounded-md bg-[#123D38] px-3 text-xs font-semibold text-white">Request viewing</Link>}{proposal.status === "declined" && <span className="self-center text-xs capitalize text-slate-500">{proposal.status}</span>}</div></div>)}</div></div>}
            {(matches[request._id] || []).length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {matches[request._id].slice(0, 4).map((listing) => <article key={listing._id} className="border-t border-slate-200 pt-3">
                <a href={`${import.meta.env.VITE_MAIN_SITE_URL || "https://rendahomes.com"}/listings/${listing._id}`} className="group flex gap-3">
                  <img src={listing.images?.[0] || ""} alt="" className="h-20 w-24 shrink-0 rounded object-cover bg-slate-100" />
                  <span className="min-w-0"><span className="block line-clamp-1 text-sm font-semibold text-slate-900 group-hover:text-emerald-800">{listing.title}</span><span className="mt-1 block text-sm font-bold text-[#126542]">KES {Number(listing.price).toLocaleString()}</span><span className="mt-1 block text-xs text-slate-500">{listing.town}, {listing.county} · {listing.bedrooms ?? "-"} beds</span>{listing.match?.classification === "alternative" && <span className="mt-2 inline-flex rounded bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-900">Alternative · different town</span>}{listing.match?.reasons?.some((reason) => reason.startsWith("Different town")) && <span className="mt-1 block text-xs text-slate-600">{listing.match.reasons.find((reason) => reason.startsWith("Different town"))}</span>}</span>
                </a>
                {!("closed" === request.status || ["cancelled", "expired"].includes(request.status)) && <Link to={`/viewings?listingId=${encodeURIComponent(listing._id)}&propertyRequestId=${encodeURIComponent(request._id)}`} className="mt-3 inline-flex items-center rounded-md border border-emerald-800 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-50">Request a viewing</Link>}
              </article>)}
            </div>}
            {matches[request._id]?.length === 0 && request.lastMatchedAt && <p className="mt-4 border-t border-slate-200 pt-3 text-sm text-slate-600">No eligible homes were available at the last check. Refresh this request later to check new approved listings.</p>}
          </article>)}
        </div>}
      </div>
    </section>
  </div>;
}

function Field({ label, value, onChange, ...props }) { return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span><input {...props} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" /></label>; }
function Select({ label, value, onChange, options, placeholder }) { return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span><span className="relative block"><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full appearance-none rounded-md border border-slate-300 bg-white px-3 pr-9 text-sm capitalize text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"><option value="">{placeholder}</option>{options.map((item) => <option key={item} value={item} className="capitalize">{item}</option>)}</select><FiChevronDown className="pointer-events-none absolute right-3 top-3 text-slate-500" /></span></label>; }
