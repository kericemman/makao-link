import { useEffect, useMemo, useState } from "react";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";
import api from "../../api/api";
import ListingPropertyFields from "../../../../frontend-landlord/src/components/listings/ListingPropertyFields.jsx";
import ListingImagesField from "../../../../frontend-landlord/src/components/listings/ListingImagesField.jsx";
import { compressListingImage } from "../../../../frontend-landlord/src/utils/listingImages.js";

const initialForm = {
  title: "", description: "", purpose: "rent", maxGuests: "", minNights: "1", checkInTime: "15:00", checkOutTime: "10:00",
  price: "", county: "", town: "", area: "", latitude: "", longitude: "", googleMapsUrl: "", type: "", bedrooms: "", bathrooms: "",
  kitchen: true, size: "", sizeUnit: "sqft", video: "", contactPhone: "",
  amenities: { garden: false, tarmacAccess: false, nearSchools: false, nearShoppingCentre: false, nearHospital: false, waterAvailable: true, electricityAvailable: true }
};

const readable = (value = "") => value.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");

export default function AdminAssistedListingPage() {
  const [meta, setMeta] = useState({ counties: [], countyTowns: {}, listingTypes: [], listingPurposes: [], residentialTypes: [], officeSizeUnits: [] });
  const [form, setForm] = useState(initialForm);
  const [landlord, setLandlord] = useState({ name: "", email: "", phone: "", businessName: "" });
  const [packageName, setPackageName] = useState("normal");
  const [inventoryMode, setInventoryMode] = useState(false);
  const [inventory, setInventory] = useState({ building: "", category: "", totalUnits: "", availableUnits: "" });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([api.get("/listings/meta"), api.get("/admin/assisted-listing-drafts")])
      .then(([metaResponse, draftResponse]) => {
        if (!active) return;
        const listingMeta = metaResponse.data?.meta || metaResponse.data || {};
        setMeta({
          counties: Array.isArray(listingMeta.counties) ? listingMeta.counties : [],
          countyNames: listingMeta.countyNames || {},
          countyTowns: listingMeta.countyTowns || {},
          listingTypes: Array.isArray(listingMeta.listingTypes) ? listingMeta.listingTypes : [],
          listingPurposes: Array.isArray(listingMeta.listingPurposes) ? listingMeta.listingPurposes : [],
          residentialTypes: Array.isArray(listingMeta.residentialTypes) ? listingMeta.residentialTypes : [],
          officeSizeUnits: Array.isArray(listingMeta.officeSizeUnits) ? listingMeta.officeSizeUnits : []
        });
        setDrafts(draftResponse.data.drafts || []);
      })
      .catch(() => { if (active) toast.error("Could not load listing options and saved drafts."); })
      .finally(() => { if (active) setMetaLoading(false); });
    return () => { active = false; };
  }, []);

  const countyOptions = useMemo(() => (meta.counties || []).map((value) => ({ value, label: meta.countyNames?.[value] || readable(value) })), [meta.counties, meta.countyNames]);
  const townOptions = useMemo(() => (meta.countyTowns?.[form.county] || []).map((value) => ({ value, label: readable(value) })), [meta.countyTowns, form.county]);
  const propertyTypes = useMemo(() => (meta.listingTypes || []).map((value) => ({ value, label: value === "office" ? "Office Space" : readable(value) })), [meta.listingTypes]);
  const purposes = useMemo(() => (meta.listingPurposes || []).map((value) => ({ value, label: value === "rent" ? "For Rent" : value === "sale" ? "For Sale" : "BnB / Short Stay" })), [meta.listingPurposes]);
  const residentialTypes = meta.residentialTypes || [];
  const isResidential = residentialTypes.includes(form.type);
  const isOffice = form.type === "office";
  const imageLimit = packageName === "normal" ? 15 : 30;
  const latitude = form.latitude || "-1.286389";
  const longitude = form.longitude || "36.817223";
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${Number(longitude) - 0.012},${Number(latitude) - 0.012},${Number(longitude) + 0.012},${Number(latitude) + 0.012}&layer=mapnik&marker=${latitude},${longitude}`;
  const amenitiesList = [
    { key: "garden", label: "Garden" }, { key: "tarmacAccess", label: "Tarmac Access" }, { key: "nearSchools", label: "Near Schools" },
    { key: "nearShoppingCentre", label: "Near Shopping Centre" }, { key: "nearHospital", label: "Near Hospital" },
    { key: "waterAvailable", label: "Water Available" }, { key: "electricityAvailable", label: "Electricity Available" }
  ];

  const onChange = (event) => {
    const { name, value, checked, type } = event.target;
    if (name === "county") setForm((current) => ({ ...current, county: value, town: "", area: "" }));
    else if (name === "type") setForm((current) => ({ ...current, type: value, bedrooms: residentialTypes.includes(value) ? current.bedrooms : "", bathrooms: residentialTypes.includes(value) ? current.bathrooms : "", size: value === "office" ? current.size : "" }));
    else setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const onFilesChange = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length + images.length > imageLimit) return toast.error(`Selected package allows up to ${imageLimit} images.`);
    const compressed = [];
    for (const file of files) {
      try { compressed.push(await compressListingImage(imageCompression, file, { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: true })); }
      catch { toast.error(`Could not process ${file.name}.`); }
    }
    setImages((current) => [...current, ...compressed]);
    setPreviews((current) => [...current, ...compressed.map((file) => URL.createObjectURL(file))]);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(previews[index]);
    setImages((current) => current.filter((_, i) => i !== index));
    setPreviews((current) => current.filter((_, i) => i !== index));
  };

  const onAmenityChange = (key) => setForm((current) => ({ ...current, amenities: { ...current.amenities, [key]: !current.amenities[key] } }));

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const body = new FormData();
    Object.entries({ ...landlord, ...form, package: packageName, amenities: JSON.stringify(form.amenities), ...(inventoryMode ? { portfolioName: inventory.building, portfolioCategory: inventory.category, totalUnits: inventory.totalUnits, availableUnits: inventory.availableUnits || inventory.totalUnits } : {}) }).forEach(([key, value]) => body.append(key, String(value)));
    images.forEach((image) => body.append("images", image));
    try {
      const response = await api.post("/admin/assisted-listing-drafts", body, { headers: { "Content-Type": "multipart/form-data" } });
      setDrafts((current) => [response.data.draft, ...current]);
      toast.success("Draft saved for review. No landlord account or public listing was created.");
      setForm(initialForm);
      setLandlord({ name: "", email: "", phone: "", businessName: "" });
      setImages([]);
      setInventoryMode(false);
      setInventory({ building: "", category: "", totalUnits: "", availableUnits: "" });
      previews.forEach(URL.revokeObjectURL);
      setPreviews([]);
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Could not save the assisted listing draft.";
      setError(message);
      toast.error(message);
    } finally { setLoading(false); }
  };

  const reviewDraft = async (decision) => {
    if (!selectedDraft || reviewing) return;
    setReviewing(true);
    try {
      const response = await api.patch(`/admin/assisted-listing-drafts/${selectedDraft._id}/${decision}`, { reviewNote });
      if (decision === "approve") {
        const latest = await api.get("/admin/assisted-listing-drafts");
        setDrafts(latest.data.drafts || []);
        if (response.data.accountSetupEmailSent) toast.success(response.data.message || "Draft approved.");
        else toast.error(response.data.message || "Draft approved, but the setup email needs attention.");
      } else {
        setDrafts((current) => current.map((draft) => draft._id === selectedDraft._id ? response.data.draft : draft));
        toast.success(response.data.message || "Draft rejected.");
      }
      setSelectedDraft(null);
      setReviewNote("");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Could not update this draft.");
    } finally { setReviewing(false); }
  };

  const resendSetup = async () => {
    if (!selectedDraft || reviewing) return;
    setReviewing(true);
    try {
      await api.post(`/admin/assisted-listing-drafts/${selectedDraft._id}/resend-setup`);
      const sentAt = new Date().toISOString();
      const updated = { ...selectedDraft, accountSetupEmailSentAt: sentAt };
      setSelectedDraft(updated);
      setDrafts((current) => current.map((draft) => draft._id === updated._id ? updated : draft));
      toast.success("A new secure setup link has been emailed.");
    } catch (requestError) { toast.error(requestError.response?.data?.message || "Could not send the setup email."); }
    finally { setReviewing(false); }
  };

  return <main className="space-y-8">
    <header className="border-b border-[#DDEAE3] pb-5"><h1 className="text-xl font-bold text-[#013E43]">Assisted landlord listing</h1><p className="mt-1 max-w-3xl text-sm text-[#41635A]">Capture landlord details, package choice and property information for review. This saves a private draft only; it does not create an account, charge a package or publish a property.</p></header>
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-md border border-[#DDEAE3] bg-white p-6">
        <h2 className="text-lg font-semibold text-[#013E43]">Landlord details</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-[#263D35]">Full name *<input required maxLength={120} value={landlord.name} onChange={(e) => setLandlord({ ...landlord, name: e.target.value })} className="mt-1 w-full rounded border border-[#DDEAE3] px-3 py-2.5" /></label>
          <label className="text-sm font-medium text-[#263D35]">Email *<input required type="email" maxLength={254} value={landlord.email} onChange={(e) => setLandlord({ ...landlord, email: e.target.value })} className="mt-1 w-full rounded border border-[#DDEAE3] px-3 py-2.5" /></label>
          <label className="text-sm font-medium text-[#263D35]">Phone *<input required type="tel" value={landlord.phone} onChange={(e) => setLandlord({ ...landlord, phone: e.target.value })} className="mt-1 w-full rounded border border-[#DDEAE3] px-3 py-2.5" /></label>
          <label className="text-sm font-medium text-[#263D35]">Business name (optional)<input maxLength={120} value={landlord.businessName} onChange={(e) => setLandlord({ ...landlord, businessName: e.target.value })} className="mt-1 w-full rounded border border-[#DDEAE3] px-3 py-2.5" /></label>
        </div>
      </section>
      <section className="rounded-md border border-[#DDEAE3] bg-white p-6">
        <h2 className="text-lg font-semibold text-[#013E43]">Package selection</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["normal", "Free"], ["basic", "Basic"], ["premium", "Premium"], ["pro", "Pro"]].map(([value, label]) => <label key={value} className={`flex cursor-pointer items-center gap-3 border p-3 ${packageName === value ? "border-[#0D915C] bg-[#F1F7F3]" : "border-[#DDEAE3]"}`}><input type="radio" name="package" value={value} checked={packageName === value} onChange={() => { setPackageName(value); if (!["premium", "pro"].includes(value)) setInventoryMode(false); }} /><span className="font-semibold text-[#263D35]">{label}</span></label>)}</div>
      </section>
      {["premium", "pro"].includes(packageName) && <section className="rounded-md border border-[#DDEAE3] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-semibold text-[#013E43]">Building inventory</h2><p className="mt-1 max-w-2xl text-sm text-[#647C75]">For multi-unit buildings, group similar homes into one category and track how many remain available.</p></div><label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#263D35]"><input type="checkbox" checked={inventoryMode} onChange={(event) => setInventoryMode(event.target.checked)} />Create a building category</label></div>
        {inventoryMode && <div className="mt-4 grid gap-4 border-t border-[#DDEAE3] pt-4 sm:grid-cols-2"><label className="text-sm font-medium text-[#263D35]">Building name<input required value={inventory.building} onChange={(e) => setInventory({ ...inventory, building: e.target.value })} placeholder="e.g. River Park Apartments" className="mt-1 w-full rounded border border-[#DDEAE3] px-3 py-2.5" /></label><label className="text-sm font-medium text-[#263D35]">Unit category<input required value={inventory.category} onChange={(e) => setInventory({ ...inventory, category: e.target.value })} placeholder="e.g. 1-bedroom apartments" className="mt-1 w-full rounded border border-[#DDEAE3] px-3 py-2.5" /></label><label className="text-sm font-medium text-[#263D35]">Total units<input required type="number" min="1" max="5000" value={inventory.totalUnits} onChange={(e) => setInventory({ ...inventory, totalUnits: e.target.value, availableUnits: inventory.availableUnits || e.target.value })} className="mt-1 w-full rounded border border-[#DDEAE3] px-3 py-2.5" /></label><label className="text-sm font-medium text-[#263D35]">Available units<input required type="number" min="0" max={inventory.totalUnits || 5000} value={inventory.availableUnits} onChange={(e) => setInventory({ ...inventory, availableUnits: e.target.value })} className="mt-1 w-full rounded border border-[#DDEAE3] px-3 py-2.5" /></label></div>}
      </section>}
      <ListingPropertyFields formData={form} errors={{}} onChange={onChange} onAmenityChange={onAmenityChange} disabled={loading || metaLoading} loading={loading} metaLoading={metaLoading} purposes={purposes} propertyTypes={propertyTypes} residentialTypes={residentialTypes} isResidential={isResidential} isOffice={isOffice} countyOptions={countyOptions} townOptions={townOptions} listingMeta={meta} amenitiesList={amenitiesList} onUseCurrentLocation={() => navigator.geolocation?.getCurrentPosition(({ coords }) => setForm((current) => ({ ...current, latitude: coords.latitude.toFixed(6), longitude: coords.longitude.toFixed(6) })), () => toast.error("Could not access your location."))} mapSrc={mapSrc} mapLatitude={latitude} mapLongitude={longitude} />
      <ListingImagesField imagesCount={images.length} imageLimit={imageLimit} previews={previews} error="" disabled={loading || metaLoading} onFilesChange={onFilesChange} onRemove={removeImage} />
      {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
      <div className="flex justify-end"><button type="submit" disabled={loading || metaLoading} className="bg-[#0D915C] px-5 py-3 font-semibold text-white disabled:opacity-50">{loading ? "Saving draft..." : "Save draft for review"}</button></div>
    </form>
    <section className="border-t border-[#DDEAE3] pt-6">
      <h2 className="text-lg font-semibold text-[#013E43]">Recent drafts</h2>
      <div className="mt-3 divide-y divide-[#DDEAE3]">{drafts.length ? drafts.map((draft) => <article key={draft._id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="font-semibold text-[#263D35]">{draft.property?.title || "Untitled property"}</p><p className="text-sm text-[#647C75]">{draft.landlord?.name} · {draft.landlord?.email} · {draft.property?.town}, {draft.property?.county} · {draft.package}</p></div><span className={`text-xs font-semibold uppercase ${draft.status === "approved" ? "text-emerald-700" : draft.status === "rejected" ? "text-red-700" : "text-amber-700"}`}>{draft.status}</span><button type="button" onClick={() => { setSelectedDraft(draft); setReviewNote(draft.reviewNote || ""); }} className="text-sm font-semibold text-[#08764C] underline">Review</button></article>) : <p className="py-4 text-sm text-[#647C75]">No assisted drafts saved yet.</p>}</div>
    </section>
    {selectedDraft && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !reviewing) setSelectedDraft(null); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="assisted-draft-title" className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-md bg-white p-5 shadow-xl sm:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-[#DDEAE3] pb-4"><div><p className="text-xs font-bold uppercase tracking-wide text-[#0D915C]">{selectedDraft.status} · {selectedDraft.package}</p><h2 id="assisted-draft-title" className="mt-1 text-xl font-bold text-[#013E43]">{selectedDraft.property?.title}</h2></div><button type="button" onClick={() => setSelectedDraft(null)} disabled={reviewing} className="text-sm font-semibold text-[#41635A]">Close</button></div>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div><h3 className="font-semibold text-[#263D35]">Landlord</h3><dl className="mt-2 space-y-1 text-sm text-[#41635A]"><div>Name: {selectedDraft.landlord?.name}</div><div>Email: {selectedDraft.landlord?.email}</div><div>Phone: {selectedDraft.landlord?.phone}</div><div>Business: {selectedDraft.landlord?.businessName || "Not provided"}</div></dl></div>
          <div><h3 className="font-semibold text-[#263D35]">Property</h3><dl className="mt-2 space-y-1 text-sm text-[#41635A]"><div>Purpose: {selectedDraft.property?.purpose}</div><div>Type: {selectedDraft.property?.type}</div><div>Price: KES {Number(selectedDraft.property?.price || 0).toLocaleString()}</div><div>Location: {selectedDraft.property?.area ? `${selectedDraft.property.area}, ` : ""}{selectedDraft.property?.town}, {selectedDraft.property?.county}</div><div>Bedrooms: {selectedDraft.property?.bedrooms ?? "N/A"} · Bathrooms: {selectedDraft.property?.bathrooms ?? "N/A"}</div><div>Contact: {selectedDraft.property?.contactPhone}</div><div>Map: {selectedDraft.property?.googleMapsUrl ? <a className="text-[#08764C] underline" href={selectedDraft.property.googleMapsUrl} target="_blank" rel="noreferrer">Open Google Maps</a> : "Not provided"}</div></dl></div>
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#41635A]">{selectedDraft.property?.description}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{(selectedDraft.images || []).map((src, index) => <img key={`${selectedDraft._id}-${index}`} src={src} alt={`Draft property image ${index + 1}`} className="aspect-[4/3] w-full rounded border border-[#DDEAE3] object-cover" />)}</div>
        {selectedDraft.status === "draft" || selectedDraft.status === "submitted" ? <>
          <label className="mt-5 block text-sm font-medium text-[#263D35]">Review note (optional)<textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} maxLength={1000} rows={3} className="mt-1 w-full rounded border border-[#DDEAE3] px-3 py-2.5" placeholder="Record any decision notes" /></label>
          <div className="mt-5 flex flex-wrap justify-end gap-3"><button type="button" onClick={() => reviewDraft("reject")} disabled={reviewing} className="border border-red-300 px-4 py-2.5 font-semibold text-red-700 disabled:opacity-50">{reviewing ? "Working..." : "Reject draft"}</button><button type="button" onClick={() => reviewDraft("approve")} disabled={reviewing} className="bg-[#0D915C] px-4 py-2.5 font-semibold text-white disabled:opacity-50">{reviewing ? "Approving..." : "Approve & create landlord"}</button></div>
        </> : <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#DDEAE3] pt-4"><p className="text-sm text-[#647C75]">{selectedDraft.reviewNote || `This draft is ${selectedDraft.status}.`}</p>{selectedDraft.status === "approved" && !selectedDraft.accountSetupEmailSentAt && <button type="button" onClick={resendSetup} disabled={reviewing} className="bg-[#0D915C] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{reviewing ? "Sending..." : "Resend setup email"}</button>}</div>}
      </section>
    </div>}
  </main>;
}
