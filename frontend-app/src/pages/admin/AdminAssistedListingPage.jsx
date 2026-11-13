import { useEffect, useMemo, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";
import api from "../../api/api";
import ListingPropertyFields from "../../../../frontend-landlord/src/components/listings/ListingPropertyFields.jsx";
import ListingImagesField from "../../../../frontend-landlord/src/components/listings/ListingImagesField.jsx";
import { compressListingImage, MAX_LISTING_UPLOAD_BYTES } from "../../../../frontend-landlord/src/utils/listingImages.js";

const initialForm = {
  title: "", description: "", purpose: "rent", maxGuests: "", minNights: "1", checkInTime: "15:00", checkOutTime: "10:00",
  price: "", county: "", town: "", area: "", latitude: "", longitude: "", googleMapsUrl: "", type: "", bedrooms: "", bathrooms: "",
  kitchen: true, size: "", sizeUnit: "sqft", video: "", contactPhone: "",
  amenities: { garden: false, tarmacAccess: false, nearSchools: false, nearShoppingCentre: false, nearHospital: false, waterAvailable: true, electricityAvailable: true }
};

const readable = (value = "") => value.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
const normalizeListingMeta = (data) => {
  const source = data?.meta || data || {};
  const meta = {
    counties: Array.isArray(source.counties) ? source.counties : [],
    countyNames: source.countyNames && typeof source.countyNames === "object" ? source.countyNames : {},
    countyTowns: source.countyTowns && typeof source.countyTowns === "object" ? source.countyTowns : {},
    listingTypes: Array.isArray(source.listingTypes) ? source.listingTypes : [],
    listingPurposes: Array.isArray(source.listingPurposes) ? source.listingPurposes : [],
    residentialTypes: Array.isArray(source.residentialTypes) ? source.residentialTypes : [],
    officeSizeUnits: Array.isArray(source.officeSizeUnits) ? source.officeSizeUnits : []
  };
  return { meta, valid: meta.counties.length > 0 && meta.listingTypes.length > 0 && meta.listingPurposes.length > 0 };
};

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
  const [editingApprovedListing, setEditingApprovedListing] = useState(false);
  const [editForm, setEditForm] = useState(initialForm);
  const [editUpdatedAt, setEditUpdatedAt] = useState("");
  const [editExistingImages, setEditExistingImages] = useState([]);
  const [editImages, setEditImages] = useState([]);
  const [editPreviews, setEditPreviews] = useState([]);
  const [editInventoryMode, setEditInventoryMode] = useState(false);
  const [editInventory, setEditInventory] = useState({ building: "", category: "", totalUnits: "1", availableUnits: "1" });
  const [savingApprovedListing, setSavingApprovedListing] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState("");
  const [draftsError, setDraftsError] = useState("");
  const [processingImages, setProcessingImages] = useState(false);
  const [error, setError] = useState("");
  const processingImagesRef = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.allSettled([api.get("/listings/meta"), api.get("/admin/assisted-listing-drafts")])
      .then(([metaResult, draftsResult]) => {
        if (!active) return;
        if (metaResult.status === "fulfilled") {
          const normalized = normalizeListingMeta(metaResult.value.data);
          setMeta(normalized.meta);
          setMetaError(normalized.valid ? "" : "Listing options returned incomplete data. Retry before creating a draft.");
        } else {
          setMetaError("Listing options could not be loaded. Retry before creating a draft.");
        }
        if (draftsResult.status === "fulfilled" && Array.isArray(draftsResult.value.data?.drafts)) {
          setDrafts(draftsResult.value.data.drafts);
          setDraftsError("");
        } else {
          setDraftsError("Saved drafts could not be loaded. Retry the page to refresh them.");
        }
      })
      .catch(() => { if (active) setMetaError("Listing options could not be loaded. Retry before creating a draft."); })
      .finally(() => { if (active) setMetaLoading(false); });
    return () => { active = false; };
  }, []);

  const retryInitialData = async () => {
    setMetaLoading(true);
    const [metaResult, draftsResult] = await Promise.allSettled([api.get("/listings/meta"), api.get("/admin/assisted-listing-drafts")]);
    if (metaResult.status === "fulfilled") {
      const normalized = normalizeListingMeta(metaResult.value.data);
      setMeta(normalized.meta);
      setMetaError(normalized.valid ? "" : "Listing options returned incomplete data. Retry before creating a draft.");
    } else setMetaError("Listing options could not be loaded. Retry before creating a draft.");
    if (draftsResult.status === "fulfilled" && Array.isArray(draftsResult.value.data?.drafts)) {
      setDrafts(draftsResult.value.data.drafts);
      setDraftsError("");
    } else setDraftsError("Saved drafts could not be loaded. Retry the page to refresh them.");
    setMetaLoading(false);
  };

  const countyOptions = useMemo(() => (meta.counties || []).map((value) => ({ value, label: meta.countyNames?.[value] || readable(value) })), [meta.counties, meta.countyNames]);
  const townOptions = useMemo(() => (Array.isArray(meta.countyTowns?.[form.county]) ? meta.countyTowns[form.county] : []).map((value) => ({ value, label: readable(value) })), [meta.countyTowns, form.county]);
  const propertyTypes = useMemo(() => (meta.listingTypes || []).map((value) => ({ value, label: value === "office" ? "Office Space" : readable(value) })), [meta.listingTypes]);
  const purposes = useMemo(() => (meta.listingPurposes || []).map((value) => ({ value, label: value === "rent" ? "For Rent" : value === "sale" ? "For Sale" : "BnB / Short Stay" })), [meta.listingPurposes]);
  const residentialTypes = meta.residentialTypes || [];
  const isResidential = residentialTypes.includes(form.type);
  const isOffice = form.type === "office";
  const imageLimit = packageName === "normal" ? 15 : 30;
  const latitude = form.latitude || "-1.286389";
  const longitude = form.longitude || "36.817223";
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${Number(longitude) - 0.012},${Number(latitude) - 0.012},${Number(longitude) + 0.012},${Number(latitude) + 0.012}&layer=mapnik&marker=${latitude},${longitude}`;
  const editLatitude = editForm.latitude || "-1.286389";
  const editLongitude = editForm.longitude || "36.817223";
  const editMapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${Number(editLongitude) - 0.012},${Number(editLatitude) - 0.012},${Number(editLongitude) + 0.012},${Number(editLatitude) + 0.012}&layer=mapnik&marker=${editLatitude},${editLongitude}`;
  const editImageLimit = selectedDraft?.package === "normal" ? 15 : 30;
  const editIsResidential = residentialTypes.includes(editForm.type);
  const editIsOffice = editForm.type === "office";
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

  const onEditChange = (event) => {
    const { name, value, checked, type } = event.target;
    if (name === "county") setEditForm((current) => ({ ...current, county: value, town: "", area: "" }));
    else if (name === "type") setEditForm((current) => ({ ...current, type: value, bedrooms: residentialTypes.includes(value) ? current.bedrooms : "", bathrooms: residentialTypes.includes(value) ? current.bathrooms : "", size: value === "office" ? current.size : "" }));
    else setEditForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const onEditAmenityChange = (key) => setEditForm((current) => ({ ...current, amenities: { ...current.amenities, [key]: !current.amenities[key] } }));

  const editTownOptions = useMemo(() => (Array.isArray(meta.countyTowns?.[editForm.county]) ? meta.countyTowns[editForm.county] : []).map((value) => ({ value, label: readable(value) })), [meta.countyTowns, editForm.county]);

  const onFilesChange = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length || processingImagesRef.current) return;
    if (files.length + images.length > imageLimit) return toast.error(`Selected package allows up to ${imageLimit} images.`);
    processingImagesRef.current = true;
    setProcessingImages(true);
    try {
      const compressed = [];
      for (const file of files) {
        try { compressed.push(await compressListingImage(imageCompression, file, { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: true })); }
        catch { toast.error(`Could not process ${file.name}.`); }
      }
      if (compressed.length) {
        setImages((current) => [...current, ...compressed].slice(0, imageLimit));
        setPreviews((current) => [...current, ...compressed.map((file) => URL.createObjectURL(file))].slice(0, imageLimit));
      }
    } finally {
      processingImagesRef.current = false;
      setProcessingImages(false);
    }
  };

  const onEditFilesChange = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length || processingImagesRef.current) return;
    if (files.length > editImageLimit) return toast.error(`This package allows up to ${editImageLimit} replacement images.`);
    processingImagesRef.current = true;
    setProcessingImages(true);
    try {
      const compressed = [];
      for (const file of files) {
        try { compressed.push(await compressListingImage(imageCompression, file, { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: true })); }
        catch { toast.error(`Could not process ${file.name}.`); }
      }
      if (compressed.reduce((sum, file) => sum + file.size, 0) > MAX_LISTING_UPLOAD_BYTES) return toast.error("Replacement images exceed the 38 MB upload limit.");
      editPreviews.forEach(URL.revokeObjectURL);
      setEditImages(compressed);
      setEditPreviews(compressed.map((file) => URL.createObjectURL(file)));
    } finally {
      processingImagesRef.current = false;
      setProcessingImages(false);
    }
  };

  const removeEditImage = (index) => {
    URL.revokeObjectURL(editPreviews[index]);
    setEditImages((current) => current.filter((_, i) => i !== index));
    setEditPreviews((current) => current.filter((_, i) => i !== index));
  };

  const beginApprovedListingEdit = async () => {
    if (!selectedDraft || reviewing) return;
    setReviewing(true);
    try {
      const response = await api.get(`/admin/assisted-listing-drafts/${selectedDraft._id}/listing`);
      const listing = response.data.listing;
      const countyAliases = { eldoret: "uasin-gishu", naivasha: "nakuru" };
      const county = countyAliases[listing.county] || listing.county;
      setEditForm({
        ...initialForm,
        ...Object.fromEntries(["title", "description", "purpose", "maxGuests", "minNights", "checkInTime", "checkOutTime", "price", "town", "area", "latitude", "longitude", "googleMapsUrl", "type", "bedrooms", "bathrooms", "kitchen", "size", "sizeUnit", "video", "contactPhone"].map((key) => [key, listing[key] ?? initialForm[key]])),
        county,
        amenities: { ...initialForm.amenities, ...(listing.amenities || {}) }
      });
      setEditInventory({ building: listing.portfolioName || "", category: listing.portfolioCategory || "", totalUnits: String(listing.totalUnits || 1), availableUnits: String(listing.availableUnits ?? listing.totalUnits ?? 1) });
      setEditInventoryMode(Boolean(listing.portfolioName || listing.portfolioCategory));
      setEditExistingImages(listing.images || []);
      setEditUpdatedAt(listing.updatedAt || "");
      setEditImages([]);
      setEditPreviews([]);
      setEditingApprovedListing(true);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Could not load the approved property for editing.");
    } finally { setReviewing(false); }
  };

  const closeDraftModal = () => {
    if (reviewing || savingApprovedListing) return;
    editPreviews.forEach(URL.revokeObjectURL);
    setEditPreviews([]);
    setEditingApprovedListing(false);
    setSelectedDraft(null);
  };

  const saveApprovedListingEdit = async (event) => {
    event.preventDefault();
    if (!selectedDraft || savingApprovedListing || processingImages) return;
    setSavingApprovedListing(true);
    const body = new FormData();
    const property = {
      ...editForm,
      amenities: JSON.stringify(editForm.amenities),
      expectedUpdatedAt: editUpdatedAt,
      ...(editInventoryMode ? {
        portfolioName: editInventory.building,
        portfolioCategory: editInventory.category,
        totalUnits: editInventory.totalUnits,
        availableUnits: editInventory.availableUnits || editInventory.totalUnits
      } : { portfolioName: "", portfolioCategory: "", totalUnits: "1", availableUnits: "1" })
    };
    Object.entries(property).forEach(([key, value]) => body.append(key, String(value ?? "")));
    editImages.forEach((image) => body.append("images", image));
    try {
      const response = await api.put(`/admin/assisted-listing-drafts/${selectedDraft._id}/listing`, body, { headers: { "Content-Type": "multipart/form-data" } });
      editPreviews.forEach(URL.revokeObjectURL);
      setEditPreviews([]);
      setEditingApprovedListing(false);
      setSelectedDraft(null);
      const latest = await api.get("/admin/assisted-listing-drafts");
      if (Array.isArray(latest.data?.drafts)) setDrafts(latest.data.drafts);
      toast.success(response.data.message || "Property updated and returned to review.");
      if (!response.data.activityRecorded) toast.error("The property was updated, but its admin activity log needs checking.");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Could not update the approved property.");
    } finally { setSavingApprovedListing(false); }
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(previews[index]);
    setImages((current) => current.filter((_, i) => i !== index));
    setPreviews((current) => current.filter((_, i) => i !== index));
  };

  const onAmenityChange = (key) => setForm((current) => ({ ...current, amenities: { ...current.amenities, [key]: !current.amenities[key] } }));

  const submit = async (event) => {
    event.preventDefault();
    if (metaError || metaLoading || processingImages) return;
    setLoading(true);
    setError("");
    const body = new FormData();
    Object.entries({ ...landlord, ...form, package: packageName, amenities: JSON.stringify(form.amenities), ...(inventoryMode ? { portfolioName: inventory.building, portfolioCategory: inventory.category, totalUnits: inventory.totalUnits, availableUnits: inventory.availableUnits || inventory.totalUnits } : {}) }).forEach(([key, value]) => body.append(key, String(value)));
    images.forEach((image) => body.append("images", image));
    try {
      const response = await api.post("/admin/assisted-listing-drafts", body, { headers: { "Content-Type": "multipart/form-data" } });
      if (!response.data?.draft?._id) throw new Error("The server did not return the saved draft. Refresh the drafts list before retrying.");
      setDrafts((current) => [response.data.draft, ...current]);
      setDraftsError("");
      toast.success("Draft saved for review. No landlord account or public listing was created.");
      setForm(initialForm);
      setLandlord({ name: "", email: "", phone: "", businessName: "" });
      setImages([]);
      setInventoryMode(false);
      setInventory({ building: "", category: "", totalUnits: "", availableUnits: "" });
      previews.forEach(URL.revokeObjectURL);
      setPreviews([]);
    } catch (requestError) {
      const message = requestError.response?.data?.message || requestError.message || "Could not save the assisted listing draft.";
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
        if (Array.isArray(latest.data?.drafts)) setDrafts(latest.data.drafts);
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
      {metaError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border border-red-200 bg-red-50 p-3 text-sm text-red-800"><span>{metaError}</span><button type="button" onClick={retryInitialData} disabled={metaLoading} className="font-semibold underline">Retry</button></div>}
      <ListingPropertyFields formData={form} errors={{}} onChange={onChange} onAmenityChange={onAmenityChange} disabled={loading || metaLoading || Boolean(metaError)} loading={loading} metaLoading={metaLoading} purposes={purposes} propertyTypes={propertyTypes} residentialTypes={residentialTypes} isResidential={isResidential} isOffice={isOffice} countyOptions={countyOptions} townOptions={townOptions} listingMeta={meta} amenitiesList={amenitiesList} onUseCurrentLocation={() => navigator.geolocation?.getCurrentPosition(({ coords }) => setForm((current) => ({ ...current, latitude: coords.latitude.toFixed(6), longitude: coords.longitude.toFixed(6) })), () => toast.error("Could not access your location."))} mapSrc={mapSrc} mapLatitude={latitude} mapLongitude={longitude} />
      <ListingImagesField imagesCount={images.length} imageLimit={imageLimit} previews={previews} error="" disabled={loading || metaLoading || Boolean(metaError) || processingImages} onFilesChange={onFilesChange} onRemove={removeImage} />
      {processingImages && <p role="status" className="text-sm text-[#41635A]">Preparing selected images…</p>}
      {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
      <div className="flex justify-end"><button type="submit" disabled={loading || metaLoading || Boolean(metaError) || processingImages} className="bg-[#0D915C] px-5 py-3 font-semibold text-white disabled:opacity-50">{loading ? "Saving draft..." : "Save draft for review"}</button></div>
    </form>
    <section className="border-t border-[#DDEAE3] pt-6">
      <h2 className="text-lg font-semibold text-[#013E43]">Recent drafts</h2>
      <div className="mt-3 divide-y divide-[#DDEAE3]">{draftsError ? <p role="alert" className="py-4 text-sm text-red-700">{draftsError} <button type="button" onClick={retryInitialData} className="font-semibold underline">Retry</button></p> : drafts.length ? drafts.filter((draft) => draft?._id).map((draft) => <article key={draft._id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="font-semibold text-[#263D35]">{draft.property?.title || "Untitled property"}</p><p className="text-sm text-[#647C75]">{draft.landlord?.name} · {draft.landlord?.email} · {draft.property?.town}, {draft.property?.county} · {draft.package}</p></div><span className={`text-xs font-semibold uppercase ${draft.status === "approved" ? "text-emerald-700" : draft.status === "rejected" ? "text-red-700" : "text-amber-700"}`}>{draft.status}</span><button type="button" onClick={() => { setSelectedDraft(draft); setReviewNote(draft.reviewNote || ""); }} className="text-sm font-semibold text-[#08764C] underline">Review</button></article>) : <p className="py-4 text-sm text-[#647C75]">No assisted drafts saved yet.</p>}</div>
    </section>
    {selectedDraft && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDraftModal(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="assisted-draft-title" className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-md bg-white p-5 shadow-xl sm:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-[#DDEAE3] pb-4"><div><p className="text-xs font-bold uppercase tracking-wide text-[#0D915C]">{selectedDraft.status} · {selectedDraft.package}</p><h2 id="assisted-draft-title" className="mt-1 text-xl font-bold text-[#013E43]">{selectedDraft.property?.title}</h2></div><button type="button" onClick={closeDraftModal} disabled={reviewing || savingApprovedListing} className="text-sm font-semibold text-[#41635A]">Close</button></div>
        {editingApprovedListing ? <form onSubmit={saveApprovedListingEdit} className="mt-5 space-y-5">
          <div className="border-l-4 border-amber-400 bg-amber-50 p-3 text-sm leading-5 text-amber-900">Saving changes returns this property to review. It will not be publicly visible until approved again.</div>
          <ListingPropertyFields formData={editForm} errors={{}} onChange={onEditChange} onAmenityChange={onEditAmenityChange} disabled={savingApprovedListing || processingImages || metaLoading || Boolean(metaError)} loading={savingApprovedListing} metaLoading={metaLoading} purposes={purposes} propertyTypes={propertyTypes} residentialTypes={residentialTypes} isResidential={editIsResidential} isOffice={editIsOffice} countyOptions={countyOptions} townOptions={editTownOptions} listingMeta={meta} amenitiesList={amenitiesList} onUseCurrentLocation={() => navigator.geolocation?.getCurrentPosition(({ coords }) => setEditForm((current) => ({ ...current, latitude: coords.latitude.toFixed(6), longitude: coords.longitude.toFixed(6) })), () => toast.error("Could not access your location."))} mapSrc={editMapSrc} mapLatitude={editLatitude} mapLongitude={editLongitude} />
          {["premium", "pro"].includes(selectedDraft.package) && <section className="rounded-md border border-[#DDEAE3] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-[#013E43]">Building inventory</h3><p className="mt-1 text-sm text-[#647C75]">Group similar units and update availability.</p></div><label className="flex items-center gap-2 text-sm font-medium text-[#263D35]"><input type="checkbox" checked={editInventoryMode} onChange={(event) => setEditInventoryMode(event.target.checked)} />Use building category</label></div>
            {editInventoryMode && <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-[#263D35]">Building name<input required value={editInventory.building} onChange={(event) => setEditInventory((current) => ({ ...current, building: event.target.value }))} className="mt-1 w-full rounded border border-[#DDEAE3] px-3 py-2.5" /></label><label className="text-sm font-medium text-[#263D35]">Unit category<input required value={editInventory.category} onChange={(event) => setEditInventory((current) => ({ ...current, category: event.target.value }))} className="mt-1 w-full rounded border border-[#DDEAE3] px-3 py-2.5" /></label><label className="text-sm font-medium text-[#263D35]">Total units<input required type="number" min="1" max="5000" value={editInventory.totalUnits} onChange={(event) => setEditInventory((current) => ({ ...current, totalUnits: event.target.value }))} className="mt-1 w-full rounded border border-[#DDEAE3] px-3 py-2.5" /></label><label className="text-sm font-medium text-[#263D35]">Available units<input required type="number" min="0" max={editInventory.totalUnits || 5000} value={editInventory.availableUnits} onChange={(event) => setEditInventory((current) => ({ ...current, availableUnits: event.target.value }))} className="mt-1 w-full rounded border border-[#DDEAE3] px-3 py-2.5" /></label></div>}
          </section>}
          <section className="rounded-md border border-[#DDEAE3] p-5">
            <h3 className="font-semibold text-[#013E43]">Current property photos</h3>
            <p className="mt-1 text-sm text-[#647C75]">Leave replacements empty to keep these photos. Selecting photos replaces the full gallery.</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{editExistingImages.map((src, index) => <img key={`existing-${index}`} src={src} alt={`Current property image ${index + 1}`} className="aspect-[4/3] w-full rounded border border-[#DDEAE3] object-cover" />)}</div>
          </section>
          <ListingImagesField imagesCount={editImages.length || editExistingImages.length} imageLimit={editImageLimit} previews={editPreviews} error="" disabled={savingApprovedListing || processingImages} processing={processingImages} onFilesChange={onEditFilesChange} onRemove={removeEditImage} inputId="assisted-approved-listing-image-upload" required={false} />
          {processingImages && <p role="status" className="text-sm text-[#41635A]">Preparing replacement images...</p>}
          <div className="flex flex-wrap justify-end gap-3"><button type="button" onClick={() => { editPreviews.forEach(URL.revokeObjectURL); setEditPreviews([]); setEditingApprovedListing(false); }} disabled={savingApprovedListing} className="rounded border border-[#C8D8D0] px-4 py-2.5 font-semibold text-[#263D35]">Cancel</button><button type="submit" disabled={savingApprovedListing || processingImages || Boolean(metaError)} className="rounded bg-[#0D915C] px-4 py-2.5 font-semibold text-white disabled:opacity-50">{savingApprovedListing ? "Saving changes..." : "Save changes for review"}</button></div>
        </form> : <>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div><h3 className="font-semibold text-[#263D35]">Landlord</h3><dl className="mt-2 space-y-1 text-sm text-[#41635A]"><div>Name: {selectedDraft.landlord?.name}</div><div>Email: {selectedDraft.landlord?.email}</div><div>Phone: {selectedDraft.landlord?.phone}</div><div>Business: {selectedDraft.landlord?.businessName || "Not provided"}</div></dl></div>
          <div><h3 className="font-semibold text-[#263D35]">Property</h3><dl className="mt-2 space-y-1 text-sm text-[#41635A]"><div>Purpose: {selectedDraft.property?.purpose}</div><div>Type: {selectedDraft.property?.type}</div><div>Price: KES {Number(selectedDraft.property?.price || 0).toLocaleString()}</div><div>Location: {selectedDraft.property?.area ? `${selectedDraft.property.area}, ` : ""}{selectedDraft.property?.town}, {selectedDraft.property?.county}</div><div>Bedrooms: {selectedDraft.property?.bedrooms ?? "N/A"} · Bathrooms: {selectedDraft.property?.bathrooms ?? "N/A"}</div><div>Contact: {selectedDraft.property?.contactPhone}</div><div>Map: {selectedDraft.property?.googleMapsUrl ? <a className="text-[#08764C] underline" href={selectedDraft.property.googleMapsUrl} target="_blank" rel="noreferrer">Open Google Maps</a> : "Not provided"}</div></dl></div>
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#41635A]">{selectedDraft.property?.description}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{(selectedDraft.images || []).map((src, index) => <img key={`${selectedDraft._id}-${index}`} src={src} alt={`Draft property image ${index + 1}`} className="aspect-[4/3] w-full rounded border border-[#DDEAE3] object-cover" />)}</div>
        {selectedDraft.status === "draft" || selectedDraft.status === "submitted" ? <>
          <label className="mt-5 block text-sm font-medium text-[#263D35]">Review note (optional)<textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} maxLength={1000} rows={3} className="mt-1 w-full rounded border border-[#DDEAE3] px-3 py-2.5" placeholder="Record any decision notes" /></label>
          <div className="mt-5 flex flex-wrap justify-end gap-3"><button type="button" onClick={() => reviewDraft("reject")} disabled={reviewing} className="border border-red-300 px-4 py-2.5 font-semibold text-red-700 disabled:opacity-50">{reviewing ? "Working..." : "Reject draft"}</button><button type="button" onClick={() => reviewDraft("approve")} disabled={reviewing} className="bg-[#0D915C] px-4 py-2.5 font-semibold text-white disabled:opacity-50">{reviewing ? "Approving..." : "Approve & create landlord"}</button></div>
        </> : <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#DDEAE3] pt-4"><p className="text-sm text-[#647C75]">{selectedDraft.reviewNote || `This draft is ${selectedDraft.status}.`}</p><div className="flex flex-wrap gap-2">{selectedDraft.status === "approved" && selectedDraft.createdListing?.status === "approved" && <button type="button" onClick={beginApprovedListingEdit} disabled={reviewing} className="rounded border border-[#0D915C] px-4 py-2.5 text-sm font-semibold text-[#0D915C] disabled:opacity-50">{reviewing ? "Loading..." : "Edit approved property"}</button>}{selectedDraft.status === "approved" && selectedDraft.createdListing && selectedDraft.createdListing.status !== "approved" && <span className="text-sm text-[#647C75]">Property editing opens after listing approval. Current listing status: {selectedDraft.createdListing.status}.</span>}{selectedDraft.status === "approved" && !selectedDraft.accountSetupEmailSentAt && <button type="button" onClick={resendSetup} disabled={reviewing} className="rounded bg-[#0D915C] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{reviewing ? "Sending..." : "Resend setup email"}</button>}</div></div>}
        </>}
      </section>
    </div>}
  </main>;
}
