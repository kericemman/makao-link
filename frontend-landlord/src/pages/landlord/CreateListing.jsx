import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createListing, getAssistantListingDraft, getListingMeta, markAssistantListingDraftSubmitted } from "../../services/listings.service";
import { getMySubscription, getWhatsAppListingAddon } from "../../services/payment.service";
import { useAuth } from "../../context/AuthContext";
import imageCompression from "browser-image-compression";
import { FaWhatsapp } from "react-icons/fa";
import { buildWhatsAppUrl, listingDraftMessage } from "../../utils/whatsapp";
import { getTeamMembers } from "../../services/team.service";
import ListingSetupChecklist from "./ListingSetupChecklist";
import {
  FiMapPin,
  FiDollarSign,
  FiFileText,
  FiCheckCircle,
  FiGrid,
  FiCamera,
  FiUpload,
  FiTrash2,
  FiArrowLeft,
  FiInfo,
  FiVideo,
  FiTarget,
  FiHome,
  FiCrosshair,
  FiNavigation
} from "react-icons/fi";
import {
  FaBed,
  FaBath,
  FaBuilding,
  FaPhone,
  FaUtensils,
  FaRulerCombined,
  FaRuler
} from "react-icons/fa";
import toast from "react-hot-toast";

const prettifyLabel = (value = "") =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const MAX_LISTING_IMAGES = 10;
const IMAGE_COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1600,
  useWebWorker: true
};

const CreateListingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assistantDraftId = searchParams.get("draftId") || "";

  const { user, subscription: authSubscription, usage: authUsage } = useAuth();

  const [freshSubscription, setFreshSubscription] = useState(null);
  const [freshUsage, setFreshUsage] = useState({
    used: 0,
    limit: 0,
    remaining: 0
  });
  const [whatsappAddon, setWhatsappAddon] = useState(null);
  const [whatsappAddonLoading, setWhatsappAddonLoading] = useState(true);

  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState({});
  const [teamMembers, setTeamMembers] = useState([]);
  const [inventoryMode, setInventoryMode] = useState(false);
  const [inventory, setInventory] = useState({ building: "", category: "", totalUnits: "", availableUnits: "", assignedAgent: "" });
  const [setupComplete, setSetupComplete] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [assistantDraftLoading, setAssistantDraftLoading] = useState(Boolean(assistantDraftId));

  const [listingMeta, setListingMeta] = useState({
    counties: [],
    countyTowns: {},
    residentialTypes: [],
    listingTypes: [],
    listingPurposes: [],
    officeSizeUnits: []
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    purpose: "rent",
    maxGuests: "",
    minNights: "1",
    checkInTime: "15:00",
    checkOutTime: "10:00",
    price: "",
    county: "",
    town: "",
    area: "",
    latitude: "",
    longitude: "",
    type: "",
    bedrooms: "",
    bathrooms: "",
    kitchen: true,
    size: "",
    sizeUnit: "sqft",
    video: "",
    contactPhone: "",
    amenities: {
      garden: false,
      tarmacAccess: false,
      nearSchools: false,
      nearShoppingCentre: false,
      nearHospital: false,
      waterAvailable: true,
      electricityAvailable: true
    }
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchFreshSubscription = async () => {
      try {
        setSubscriptionLoading(true);

        const data = await getMySubscription();

        setFreshSubscription(data.subscription || null);
        setFreshUsage(
          data.usage || {
            used: 0,
            limit: 0,
            remaining: 0
          }
        );
        try {
          setWhatsappAddon(await getWhatsAppListingAddon());
        } catch {
          setWhatsappAddon(null);
        }
      } catch (error) {
        toast.error("Failed to load subscription status", {
          style: { background: "#0F172A", color: "#fff" }
        });
      } finally {
        setSubscriptionLoading(false);
        setWhatsappAddonLoading(false);
      }
    };

    fetchFreshSubscription();
  }, []);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        setMetaLoading(true);

        const data = await getListingMeta();

        const meta = data.meta || {
          counties: [],
          countyTowns: {},
          residentialTypes: [],
          listingTypes: [],
          listingPurposes: [],
          officeSizeUnits: []
        };

        setListingMeta(meta);

        setFormData((prev) => ({
          ...prev,
          type: prev.type || meta.listingTypes?.[0] || "apartment",
          purpose: prev.purpose || meta.listingPurposes?.[0] || "rent",
          sizeUnit: prev.sizeUnit || meta.officeSizeUnits?.[0] || "sqft"
        }));
      } catch (error) {
        toast.error("Failed to load listing options", {
          style: { background: "#0F172A", color: "#fff" }
        });
      } finally {
        setMetaLoading(false);
      }
    };

    fetchMeta();
  }, []);

  useEffect(() => {
    if (!assistantDraftId) return undefined;
    let active = true;
    getAssistantListingDraft(assistantDraftId)
      .then(({ draft }) => {
        if (!active || !draft?.fields) return;
        const draftFields = draft.fields;
        const suppliedFields = Object.fromEntries(Object.entries(draftFields).filter(([, value]) => value !== null && value !== undefined && value !== ""));
        setFormData((current) => ({
          ...current,
          ...suppliedFields,
          amenities: { ...current.amenities, ...(draftFields.amenities || {}) }
        }));
        if (draftFields.portfolioName || draftFields.portfolioCategory || Number(draftFields.totalUnits) > 1) {
          setInventoryMode(true);
          setInventory((current) => ({
            ...current,
            building: draftFields.portfolioName || "",
            category: draftFields.portfolioCategory || "",
            totalUnits: draftFields.totalUnits || "",
            availableUnits: draftFields.availableUnits ?? ""
          }));
        }
        setSetupComplete(true);
      })
      .catch(() => {
        if (active) toast.error("We could not load this property draft. You can continue with a new listing.");
      })
      .finally(() => {
        if (active) setAssistantDraftLoading(false);
      });
    return () => { active = false; };
  }, [assistantDraftId]);

  const activeSubscription = freshSubscription || authSubscription || null;

  const activeUsage = freshSubscription
    ? freshUsage
    : authUsage || {
        used: 0,
        limit: 0,
        remaining: 0
      };

  const activeStatus = activeSubscription?.status;

  const subscriptionInactive =
    !activeSubscription ||
    ["pending_payment", "grace", "expired", "cancelled"].includes(activeStatus);

  const hasValidLimit = Number(activeUsage?.limit) > 0;

  const listingLimitReached =
    hasValidLimit && Number(activeUsage.used) >= Number(activeUsage.limit);

  const blocked =
    subscriptionLoading || subscriptionInactive || listingLimitReached;

  const planHasWhatsAppAssistance =
    ["premium", "pro"].includes(activeSubscription?.plan) && activeStatus === "active";
  const advancedWorkspace = ["premium", "pro"].includes(activeSubscription?.plan) && activeStatus === "active";
  const whatsappAssistanceEnabled = planHasWhatsAppAssistance || Boolean(whatsappAddon?.active);
  const isPageLoading = metaLoading || subscriptionLoading || whatsappAddonLoading || assistantDraftLoading;
  const draftWhatsAppUrl = buildWhatsAppUrl(listingDraftMessage(user, formData));

  useEffect(() => {
    if (!advancedWorkspace || user?.role !== "landlord") return;
    getTeamMembers().then((result) => setTeamMembers(result.members || [])).catch(() => {});
  }, [advancedWorkspace, user?.role]);

  const amenitiesList = [
    { key: "garden", label: "Garden" },
    { key: "tarmacAccess", label: "Tarmac Access" },
    { key: "nearSchools", label: "Near Schools" },
    { key: "nearShoppingCentre", label: "Near Shopping Centre" },
    { key: "nearHospital", label: "Near Hospital" },
    { key: "waterAvailable", label: "Water Available" },
    { key: "electricityAvailable", label: "Electricity Available" }
  ];

  const countyOptions = useMemo(() => {
    return (listingMeta.counties || []).map((county) => ({
      value: county,
      label: prettifyLabel(county)
    }));
  }, [listingMeta.counties]);

  const townOptions = useMemo(() => {
    const towns = listingMeta.countyTowns?.[formData.county] || [];

    return towns.map((town) => ({
      value: town,
      label: prettifyLabel(town)
    }));
  }, [listingMeta.countyTowns, formData.county]);

  const propertyTypes = useMemo(() => {
    return (listingMeta.listingTypes || []).map((type) => ({
      value: type,
      label: type === "office" ? "Office Space" : prettifyLabel(type)
    }));
  }, [listingMeta.listingTypes]);

  const purposes = useMemo(() => {
    return (listingMeta.listingPurposes || []).map((purpose) => ({
      value: purpose,
      label: purpose === "rent" ? "For Rent" : purpose === "sale" ? "For Sale" : "Short-term stay"
    }));
  }, [listingMeta.listingPurposes]);

  const residentialTypes = listingMeta.residentialTypes || [];
  const isResidential = residentialTypes.includes(formData.type);
  const isOffice = formData.type === "office";
  const mapLatitude = formData.latitude || "-1.286389";
  const mapLongitude = formData.longitude || "36.817223";
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${Number(mapLongitude) - 0.012},${Number(mapLatitude) - 0.012},${Number(mapLongitude) + 0.012},${Number(mapLatitude) + 0.012}&layer=mapnik&marker=${mapLatitude},${mapLongitude}`;

  const handleBlockedRedirect = () => {
    navigate("/subscription", {
      state: {
        reason: listingLimitReached
          ? "limit_reached"
          : activeStatus === "pending_payment"
          ? "pending_payment"
          : activeStatus === "grace"
          ? "grace_block"
          : "expired"
      }
    });
  };

  const continueFromSetup = (setup) => {
    setInventoryMode(Boolean(setup.inventoryMode));
    setInventory((current) => ({ ...current, ...setup.inventory }));
    setSetupComplete(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "county") {
      setFormData((prev) => ({
        ...prev,
        county: value,
        town: "",
        area: ""
      }));
    } else if (name === "type") {
      const nextType = value;

      setFormData((prev) => ({
        ...prev,
        type: nextType,
        bedrooms: residentialTypes.includes(nextType) ? prev.bedrooms : "",
        bathrooms: residentialTypes.includes(nextType) ? prev.bathrooms : "",
        size: nextType === "office" ? prev.size : "",
        sizeUnit:
          nextType === "office"
            ? prev.sizeUnit || listingMeta.officeSizeUnits?.[0] || "sqft"
            : prev.sizeUnit
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleAmenityChange = (amenity) => {
    setFormData((prev) => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenity]: !prev.amenities[amenity]
      }
    }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Your browser does not support location access");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        toast.success("Map location added", {
          style: { background: "#126542", color: "#fff" }
        });
      },
      () => {
        toast.error("Could not get your current location");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  };

  const handleImages = async (e) => {
    const files = Array.from(e.target.files || []);
    const compressedFiles = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }

      try {
        const compressed = await imageCompression(file, {
          ...IMAGE_COMPRESSION_OPTIONS
        });

        compressedFiles.push(compressed);
      } catch (error) {
        toast.error(`Failed to process ${file.name}`);
      }
    }

    if (compressedFiles.length + images.length > MAX_LISTING_IMAGES) {
      toast.error(`Maximum ${MAX_LISTING_IMAGES} images allowed`);
      return;
    }

    setImages((prev) => [...prev, ...compressedFiles]);

    const newPreviews = compressedFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setPreview((prev) => [...prev, ...newPreviews]);

    if (errors.images) {
      setErrors((prev) => ({
        ...prev,
        images: ""
      }));
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));

    setPreview((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";

    if (!formData.price) newErrors.price = "Price is required";
    if (formData.price && Number(formData.price) < 0)
      newErrors.price = "Price must be positive";

    if (!formData.county) newErrors.county = "County is required";
    if (!formData.town) newErrors.town = "Town/Location is required";
    if (!formData.type) newErrors.type = "Property type is required";
    if (!formData.purpose) newErrors.purpose = "Purpose is required";
    if (formData.purpose === "short_stay") {
      if (!Number.isInteger(Number(formData.maxGuests)) || Number(formData.maxGuests) < 1) newErrors.maxGuests = "Enter the maximum number of guests";
      if (!Number.isInteger(Number(formData.minNights)) || Number(formData.minNights) < 1) newErrors.minNights = "Minimum stay must be at least one night";
    }

    if (!formData.contactPhone.trim())
      newErrors.contactPhone = "Contact phone is required";

    if (inventoryMode) {
      const total = Number(inventory.totalUnits);
      const available = Number(inventory.availableUnits || inventory.totalUnits);
      if (!inventory.building.trim()) newErrors.building = "Building name is required";
      if (!inventory.category.trim()) newErrors.category = "Unit category is required";
      if (!Number.isInteger(total) || total < 1 || total > 5000) newErrors.totalUnits = "Enter a whole number from 1 to 5,000";
      if (!Number.isInteger(available) || available < 0 || available > total) newErrors.availableUnits = "Available units must be between 0 and total units";
    }

    if (images.length === 0)
      newErrors.images = "At least one image is required";

    if (isResidential) {
      if (formData.bedrooms === "" || formData.bedrooms === null) {
        newErrors.bedrooms = "Number of bedrooms is required";
      }

      if (formData.bathrooms === "" || formData.bathrooms === null) {
        newErrors.bathrooms = "Number of bathrooms is required";
      }
    }

    if (isOffice && !formData.size) {
      newErrors.size = "Office size is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (blocked) {
      handleBlockedRedirect();
      return;
    }

    if (!validateForm()) {
      toast.error("Please fill in all required fields", {
        style: { background: "#0F172A", color: "#fff" }
      });
      return;
    }

    setConfirmSubmitOpen(true);
  };

  const confirmListingSubmission = async () => {
    setConfirmSubmitOpen(false);

    try {
      setLoading(true);

      const payload = new FormData();

      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("purpose", formData.purpose);
      if (formData.purpose === "short_stay") {
        payload.append("maxGuests", formData.maxGuests);
        payload.append("minNights", formData.minNights);
        payload.append("checkInTime", formData.checkInTime);
        payload.append("checkOutTime", formData.checkOutTime);
      }
      payload.append("price", formData.price);
      payload.append("county", formData.county);
      payload.append("town", formData.town);
      payload.append("type", formData.type);
      payload.append("kitchen", formData.kitchen);
      payload.append("amenities", JSON.stringify(formData.amenities));
      payload.append("contactPhone", formData.contactPhone);

      if (inventoryMode && advancedWorkspace) {
        payload.append("portfolioName", inventory.building.trim());
        payload.append("portfolioCategory", inventory.category.trim());
        payload.append("totalUnits", inventory.totalUnits);
        payload.append("availableUnits", inventory.availableUnits || inventory.totalUnits);
        if (inventory.assignedAgent) payload.append("assignedAgent", inventory.assignedAgent);
      }

      if (formData.area) payload.append("area", formData.area);
      if (formData.latitude) payload.append("latitude", formData.latitude);
      if (formData.longitude) payload.append("longitude", formData.longitude);

      if (isResidential) {
        payload.append("bedrooms", formData.bedrooms);
        payload.append("bathrooms", formData.bathrooms);
      }

      if (isOffice) {
        payload.append("size", formData.size);
        payload.append("sizeUnit", formData.sizeUnit);
      }

      if (formData.video) payload.append("video", formData.video);

      images.forEach((image) => {
        payload.append("images", image);
      });

      const created = await createListing(payload);
      if (assistantDraftId && created.listing?._id) {
        try {
          await markAssistantListingDraftSubmitted(assistantDraftId, created.listing._id);
        } catch {
          toast.error("Your listing was submitted, but the saved draft could not be closed. Contact support before resubmitting it.");
        }
      }

      toast.success("Property listed successfully! Pending approval.", {
        style: {
          background: "#126542",
          color: "#fff"
        },
        duration: 3000
      });

      preview.forEach((url) => URL.revokeObjectURL(url));

      setTimeout(() => {
        navigate("/listings");
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create listing", {
        style: { background: "#0F172A", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isPageLoading && !blocked && !setupComplete) {
    return <ListingSetupChecklist
      onContinue={continueFromSetup}
      onSkip={() => { setInventoryMode(false); setSetupComplete(true); }}
    />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-md shadow-sm p-6 border border-[#E2E8F0]">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/listings")}
            className="p-2 hover:bg-[#F8FAFC] rounded-lg transition-colors"
          >
            <FiArrowLeft className="text-xl text-[#475569]" />
          </button>

          <div>
            <h1 className="text-xl font-bold text-[#0F172A]">
              Add New Listing
            </h1>
            <p className="text-sm text-[#475569]">
              List your property for tenants to find
            </p>
          </div>
        </div>
      </div>

      {isPageLoading ? (
        <div className="bg-white rounded-md shadow-sm p-6 border border-[#E2E8F0] text-[#475569]">
          Loading listing and subscription options...
        </div>
      ) : null}

      {!isPageLoading && blocked ? (
        <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-700 border border-amber-200">
          <div className="flex items-start gap-3">
            <FiInfo className="text-amber-500 mt-0.5" />
            <div>
              You cannot create a new listing right now. Please review your
              subscription status first.
              <button
                type="button"
                onClick={handleBlockedRedirect}
                className="ml-2 font-semibold underline"
              >
                Go to subscription
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!isPageLoading && !blocked ? (
        <section className="rounded-md border border-[#DDEBE4] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0D915C]">WhatsApp listing</p>
              {whatsappAssistanceEnabled ? (
                <>
                  <h2 className="mt-2 text-lg font-bold text-[#0F172A]">List your property directly on WhatsApp</h2>
                  <p className="mt-1 text-sm leading-6 text-[#475569]">
                    Open WhatsApp, follow the listing prompts, and share your property details and photos. You can track submitted listings from your dashboard.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="mt-2 text-lg font-bold text-[#0F172A]">List your property directly on WhatsApp</h2>
                  <p className="mt-1 text-sm leading-6 text-[#475569]">
                    WhatsApp listing availability depends on your plan. Review your options from the landlord dashboard.
                  </p>
                </>
              )}
            </div>
            {whatsappAssistanceEnabled ? (
              <a
                href={draftWhatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#126542] px-4 py-3 text-sm font-bold text-white"
              >
                <FaWhatsapp />
                Continue on WhatsApp
              </a>
            ) : (
              <Link to="/dashboard" className="inline-flex items-center justify-center rounded-lg border border-[#E2E8F0] px-4 py-3 text-sm font-semibold text-[#0F172A] hover:bg-[#F8FAFC]">
                View WhatsApp options
              </Link>
            )}
          </div>
        </section>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        {advancedWorkspace && <section className="border border-emerald-200 bg-emerald-50/60 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Building inventory</p><h2 className="mt-1 text-lg font-bold text-slate-950">List by unit category</h2><p className="mt-1 max-w-2xl text-sm text-slate-600">For a larger building, create one public listing for each type of home and keep its available-unit count up to date. You do not need to enter every room separately.</p></div>
            <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 border border-emerald-800 bg-white px-3 text-sm font-semibold text-emerald-900"><input type="checkbox" checked={inventoryMode} onChange={(event) => setInventoryMode(event.target.checked)} className="h-4 w-4 accent-emerald-800" />Create a building category</label>
          </div>
          {inventoryMode && <div className="mt-5 grid gap-4 border-t border-emerald-200 pt-5 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-semibold text-slate-800">Building name<input value={inventory.building} onChange={(event) => setInventory({ ...inventory, building: event.target.value })} placeholder="e.g. River Park Apartments" className="mt-1 block h-10 w-full border border-slate-300 bg-white px-3 font-normal" />{errors.building && <span className="mt-1 block text-xs text-red-700">{errors.building}</span>}</label>
            <label className="text-sm font-semibold text-slate-800">Unit category<input value={inventory.category} onChange={(event) => setInventory({ ...inventory, category: event.target.value })} placeholder="e.g. 1-bedroom apartments" className="mt-1 block h-10 w-full border border-slate-300 bg-white px-3 font-normal" />{errors.category && <span className="mt-1 block text-xs text-red-700">{errors.category}</span>}</label>
            <label className="text-sm font-semibold text-slate-800">Total units<input type="number" min="1" max="5000" value={inventory.totalUnits} onChange={(event) => setInventory({ ...inventory, totalUnits: event.target.value, availableUnits: inventory.availableUnits || event.target.value })} placeholder="e.g. 24" className="mt-1 block h-10 w-full border border-slate-300 bg-white px-3 font-normal" />{errors.totalUnits && <span className="mt-1 block text-xs text-red-700">{errors.totalUnits}</span>}</label>
            <label className="text-sm font-semibold text-slate-800">Currently available<input type="number" min="0" max={inventory.totalUnits || 5000} value={inventory.availableUnits} onChange={(event) => setInventory({ ...inventory, availableUnits: event.target.value })} placeholder="Defaults to total units" className="mt-1 block h-10 w-full border border-slate-300 bg-white px-3 font-normal" />{errors.availableUnits && <span className="mt-1 block text-xs text-red-700">{errors.availableUnits}</span>}</label>
            {user?.role === "landlord" && <label className="text-sm font-semibold text-slate-800">Assign to agent<select value={inventory.assignedAgent} onChange={(event) => setInventory({ ...inventory, assignedAgent: event.target.value })} className="mt-1 block h-10 w-full border border-slate-300 bg-white px-3 font-normal"><option value="">Keep unassigned</option>{teamMembers.filter((member) => member.status === "active").map((member) => <option key={member._id} value={member._id}>{member.name} · {member.role}</option>)}</select></label>}
          </div>}
        </section>}
        {/* keep your existing form JSX from Basic Information downwards */}
        <div className="bg-white rounded-md shadow-sm p-6 border border-[#E2E8F0]">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4 flex items-center">
            <FiFileText className="mr-2 text-[#126542]" />
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiFileText className="h-5 w-5 text-[#0D915C]" />
                </div>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., 2 Bedroom Modern Apartment in Westlands"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all ${
                    errors.title
                      ? "border-red-400 focus:border-red-500 bg-red-50"
                      : "border-[#E2E8F0] focus:border-[#126542]"
                  }`}
                  disabled={loading || metaLoading}
                />
              </div>
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="5"
                placeholder="Describe your property in detail..."
                className={`w-full px-4 py-3 rounded-lg border-2 outline-none transition-all resize-none ${
                  errors.description
                    ? "border-red-400 focus:border-red-500 bg-red-50"
                    : "border-[#E2E8F0] focus:border-[#126542]"
                }`}
                disabled={loading || metaLoading}
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">{errors.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-md shadow-sm p-6 border border-[#E2E8F0]">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4 flex items-center">
            <FiMapPin className="mr-2 text-[#126542]" />
            Location & Price
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Purpose <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiTarget className="h-5 w-5 text-[#0D915C]" />
                </div>
                <select
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-[#E2E8F0] focus:border-[#126542] outline-none appearance-none bg-white"
                  disabled={loading || metaLoading}
                >
                  {purposes.map((purpose) => (
                    <option key={purpose.value} value={purpose.value}>
                      {purpose.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.purpose && <p className="text-sm text-red-500 mt-1">{errors.purpose}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                {formData.purpose === "short_stay" ? "Price per night (KES)" : "Price (KES)"} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiDollarSign className="h-5 w-5 text-[#0D915C]" />
                </div>
                <input
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder={formData.purpose === "short_stay" ? "e.g., 8500 per night" : "e.g., 25000"}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all ${
                    errors.price
                      ? "border-red-400 focus:border-red-500 bg-red-50"
                      : "border-[#E2E8F0] focus:border-[#126542]"
                  }`}
                  disabled={loading || metaLoading}
                />
              </div>
              {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price}</p>}
            </div>

            {formData.purpose === "short_stay" && (
              <div className="md:col-span-2 grid grid-cols-2 gap-4 rounded-xl bg-[#F3F8F5] p-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#0F172A]">Maximum guests</label>
                  <input name="maxGuests" type="number" min="1" value={formData.maxGuests} onChange={handleChange} className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2.5" />
                  {errors.maxGuests && <p className="mt-1 text-sm text-red-600">{errors.maxGuests}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#0F172A]">Minimum nights</label>
                  <input name="minNights" type="number" min="1" value={formData.minNights} onChange={handleChange} className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2.5" />
                  {errors.minNights && <p className="mt-1 text-sm text-red-600">{errors.minNights}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#0F172A]">Check-in from</label>
                  <input name="checkInTime" type="time" value={formData.checkInTime} onChange={handleChange} className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2.5" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#0F172A]">Check-out by</label>
                  <input name="checkOutTime" type="time" value={formData.checkOutTime} onChange={handleChange} className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2.5" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                County <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMapPin className="h-5 w-5 text-[#0D915C]" />
                </div>
                <select
                  name="county"
                  value={formData.county}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none appearance-none bg-white ${
                    errors.county
                      ? "border-red-400 focus:border-red-500 bg-red-50"
                      : "border-[#E2E8F0] focus:border-[#126542]"
                  }`}
                  disabled={loading || metaLoading}
                >
                  <option value="">Select County</option>
                  {countyOptions.map((county) => (
                    <option key={county.value} value={county.value}>
                      {county.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.county && <p className="text-sm text-red-500 mt-1">{errors.county}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Town / Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiHome className="h-5 w-5 text-[#0D915C]" />
                </div>
                <select
                  name="town"
                  value={formData.town}
                  onChange={handleChange}
                  disabled={!formData.county || loading || metaLoading}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none appearance-none bg-white ${
                    errors.town
                      ? "border-red-400 focus:border-red-500 bg-red-50"
                      : "border-[#E2E8F0] focus:border-[#126542]"
                  }`}
                >
                  <option value="">Select Town</option>
                  {townOptions.map((town) => (
                    <option key={town.value} value={town.value}>
                      {town.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.town && <p className="text-sm text-red-500 mt-1">{errors.town}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Specific Area / Landmark (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMapPin className="h-5 w-5 text-[#0D915C]" />
                </div>
                <input
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  placeholder="e.g., Next to Garden City Mall"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-[#E2E8F0] focus:border-[#126542] outline-none transition-colors"
                  disabled={loading || metaLoading}
                />
              </div>
              <p className="text-xs text-[#475569] mt-1">Optional: Add specific directions or landmark</p>
            </div>

            <div className="md:col-span-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <label className="block text-sm font-medium text-[#0F172A]">
                    Map Location (Optional)
                  </label>
                  <p className="mt-1 text-xs text-[#475569]">
                    Add coordinates so tenants can understand the property area better.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#164E3B]"
                >
                  <FiCrosshair />
                  Use my location
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Latitude
                  </label>
                  <input
                    name="latitude"
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="-1.286389"
                    className="mt-1 w-full rounded-lg border-2 border-[#E2E8F0] bg-white px-4 py-3 outline-none transition-colors focus:border-[#126542]"
                    disabled={loading || metaLoading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#475569]">
                    Longitude
                  </label>
                  <input
                    name="longitude"
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="36.817223"
                    className="mt-1 w-full rounded-lg border-2 border-[#E2E8F0] bg-white px-4 py-3 outline-none transition-colors focus:border-[#126542]"
                    disabled={loading || metaLoading}
                  />
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-md border border-[#E2E8F0] bg-white">
                <iframe
                  title="Property map preview"
                  src={mapSrc}
                  className="h-72 w-full"
                  loading="lazy"
                />
              </div>

              <a
                href={`https://www.openstreetmap.org/?mlat=${mapLatitude}&mlon=${mapLongitude}#map=16/${mapLatitude}/${mapLongitude}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#475569] hover:text-[#0F172A]"
              >
                <FiNavigation />
                Open map in new tab
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-md shadow-sm p-6 border border-[#E2E8F0]">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4 flex items-center">
            <FiGrid className="mr-2 text-[#126542]" />
            Property Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Property Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaBuilding className="h-5 w-5 text-[#0D915C]" />
                </div>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none appearance-none bg-white ${
                    errors.type
                      ? "border-red-400 focus:border-red-500 bg-red-50"
                      : "border-[#E2E8F0] focus:border-[#126542]"
                  }`}
                  disabled={loading || metaLoading}
                >
                  <option value="">Select Type</option>
                  {propertyTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type}</p>}
            </div>

            {isResidential ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">
                    Bedrooms <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaBed className="h-5 w-5 text-[#0D915C]" />
                    </div>
                    <input
                      name="bedrooms"
                      type="number"
                      value={formData.bedrooms}
                      onChange={handleChange}
                      placeholder="e.g., 2"
                      min="0"
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all ${
                        errors.bedrooms
                          ? "border-red-400 focus:border-red-500 bg-red-50"
                          : "border-[#E2E8F0] focus:border-[#126542]"
                      }`}
                      disabled={loading || metaLoading}
                    />
                  </div>
                  {errors.bedrooms && (
                    <p className="text-sm text-red-500 mt-1">{errors.bedrooms}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">
                    Bathrooms <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaBath className="h-5 w-5 text-[#0D915C]" />
                    </div>
                    <input
                      name="bathrooms"
                      type="number"
                      value={formData.bathrooms}
                      onChange={handleChange}
                      placeholder="e.g., 2"
                      min="0"
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all ${
                        errors.bathrooms
                          ? "border-red-400 focus:border-red-500 bg-red-50"
                          : "border-[#E2E8F0] focus:border-[#126542]"
                      }`}
                      disabled={loading || metaLoading}
                    />
                  </div>
                  {errors.bathrooms && (
                    <p className="text-sm text-red-500 mt-1">{errors.bathrooms}</p>
                  )}
                </div>
              </>
            ) : null}

            {isOffice ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">
                    Size <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaRuler className="h-5 w-5 text-[#0D915C]" />
                    </div>
                    <input
                      name="size"
                      type="number"
                      value={formData.size}
                      onChange={handleChange}
                      placeholder="e.g., 1200"
                      min="0"
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all ${
                        errors.size
                          ? "border-red-400 focus:border-red-500 bg-red-50"
                          : "border-[#E2E8F0] focus:border-[#126542]"
                      }`}
                      disabled={loading || metaLoading}
                    />
                  </div>
                  {errors.size && <p className="text-sm text-red-500 mt-1">{errors.size}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0F172A] mb-1">
                    Size Unit
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaRulerCombined className="h-5 w-5 text-[#0D915C]" />
                    </div>
                    <select
                      name="sizeUnit"
                      value={formData.sizeUnit}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-[#E2E8F0] focus:border-[#126542] outline-none appearance-none bg-white"
                      disabled={loading || metaLoading}
                    >
                      {(listingMeta.officeSizeUnits || []).map((unit) => (
                        <option key={unit} value={unit}>
                          {unit === "sqft" ? "Square Feet (sq ft)" : prettifyLabel(unit)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            ) : null}

            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-1">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="h-5 w-5 text-[#0D915C]" />
                </div>
                <input
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="e.g., 0712345678"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all ${
                    errors.contactPhone
                      ? "border-red-400 focus:border-red-500 bg-red-50"
                      : "border-[#E2E8F0] focus:border-[#126542]"
                  }`}
                  disabled={loading || metaLoading}
                />
              </div>
              {errors.contactPhone && (
                <p className="text-sm text-red-500 mt-1">{errors.contactPhone}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="kitchen"
                  checked={formData.kitchen}
                  onChange={handleChange}
                  className="w-5 h-5 text-[#126542] border-[#E2E8F0] rounded focus:ring-[#126542]"
                />
                <span className="text-sm text-[#475569] flex items-center">
                  <FaUtensils className="mr-2" />
                  Kitchen available
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-md shadow-sm p-6 border border-[#E2E8F0]">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4 flex items-center">
            <FiVideo className="mr-2 text-[#126542]" />
            Virtual Tour (Optional)
          </h2>

          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">
              Video URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiVideo className="h-5 w-5 text-[#0D915C]" />
              </div>
              <input
                name="video"
                value={formData.video}
                onChange={handleChange}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-[#E2E8F0] focus:border-[#126542] outline-none transition-colors"
                disabled={loading || metaLoading}
              />
            </div>
            <p className="text-xs text-[#475569] mt-1">
              Add a YouTube or Vimeo link for a virtual tour of your property
            </p>
          </div>
        </div>

        <div className="bg-white rounded-md shadow-sm p-6 border border-[#E2E8F0]">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4 flex items-center">
            <FiCheckCircle className="mr-2 text-[#126542]" />
            Amenities
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {amenitiesList.map((amenity) => (
              <label key={amenity.key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.amenities[amenity.key]}
                  onChange={() => handleAmenityChange(amenity.key)}
                  className="w-5 h-5 text-[#126542] border-[#E2E8F0] rounded focus:ring-[#126542]"
                />
                <span className="text-sm text-[#475569]">{amenity.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-md shadow-sm p-6 border border-[#E2E8F0]">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4 flex items-center">
            <FiCamera className="mr-2 text-[#126542]" />
            Property Images <span className="text-red-500 ml-1">*</span>
          </h2>

          <div className="mb-4">
            <div
              className={`border-2 border-dashed rounded-md p-6 text-center transition-all ${
                errors.images ? "border-red-300 bg-red-50" : "border-[#E2E8F0] hover:border-[#126542]"
              }`}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImages}
                className="hidden"
                id="image-upload"
                disabled={loading || metaLoading}
              />
              <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                <FiUpload className="text-3xl text-[#475569] mb-2" />
                <span className="text-sm text-[#475569]">Click to upload or drag and drop</span>
                <span className="text-xs text-[#475569] mt-1">
                  Select multiple images. Large files are compressed before upload. Max {MAX_LISTING_IMAGES} images.
                </span>
              </label>
            </div>
            {errors.images && <p className="text-sm text-red-500 mt-1">{errors.images}</p>}
            <p className="text-xs text-[#475569] mt-2">{images.length}/{MAX_LISTING_IMAGES} image(s) selected</p>
          </div>

          {preview.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {preview.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Preview ${index + 1}`}
                    className="h-24 w-full object-cover rounded-lg border border-[#E2E8F0]"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          {whatsappAssistanceEnabled ? (
            <a
              href={draftWhatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[#126542] px-6 py-3 text-sm font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              <FaWhatsapp />
              List on WhatsApp
            </a>
          ) : (
            <Link to="/dashboard" className="inline-flex items-center rounded-lg border border-[#E2E8F0] px-4 py-3 text-sm font-semibold text-[#0F172A] hover:bg-[#F8FAFC]">
              WhatsApp options
            </Link>
          )}
          <button
            type="button"
            onClick={() => navigate("/listings")}
            className="px-6 py-3 text-[#475569] border border-[#E2E8F0] rounded-lg hover:bg-[#F8FAFC] transition-colors"
            disabled={loading || metaLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || blocked || metaLoading}
            className="px-6 py-3 bg-[#126542] text-white rounded-lg font-semibold hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Submitting...
              </>
            ) : (
              "Submit Listing"
            )}
          </button>
        </div>
      </form>
      {confirmSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6" role="presentation">
          <section className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="listing-confirm-title">
            <h2 id="listing-confirm-title" className="text-xl font-bold text-[#0F172A]">Review before submission</h2>
            <p className="mt-1 text-sm text-[#475569]">Your listing will be sent for admin review. It will not be public until approved.</p>
            {preview[0] && <img src={preview[0]} alt="Property preview" className="mt-4 h-48 w-full rounded-md object-cover" />}
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div><dt className="text-[#64748B]">Property</dt><dd className="font-semibold text-[#0F172A]">{formData.title}</dd></div>
              <div><dt className="text-[#64748B]">Purpose</dt><dd className="font-semibold text-[#0F172A]">{formData.purpose === "short_stay" ? "Short-term stay" : formData.purpose}</dd></div>
              <div><dt className="text-[#64748B]">Price</dt><dd className="font-semibold text-[#0F172A]">KES {Number(formData.price || 0).toLocaleString()}{formData.purpose === "short_stay" ? " / night" : formData.purpose === "rent" ? " / month" : ""}</dd></div>
              <div><dt className="text-[#64748B]">Location</dt><dd className="font-semibold text-[#0F172A]">{formData.town}, {formData.county}</dd></div>
              <div><dt className="text-[#64748B]">Type</dt><dd className="font-semibold text-[#0F172A]">{prettifyLabel(formData.type)}</dd></div>
              {isResidential && <div><dt className="text-[#64748B]">Bedrooms / bathrooms</dt><dd className="font-semibold text-[#0F172A]">{formData.bedrooms} / {formData.bathrooms}</dd></div>}
              {formData.purpose === "short_stay" && <div><dt className="text-[#64748B]">Stay details</dt><dd className="font-semibold text-[#0F172A]">Up to {formData.maxGuests} guests, minimum {formData.minNights} night(s)</dd></div>}
              {inventoryMode && <div><dt className="text-[#64748B]">Unit inventory</dt><dd className="font-semibold text-[#0F172A]">{inventory.availableUnits || inventory.totalUnits} available of {inventory.totalUnits}</dd></div>}
              <div><dt className="text-[#64748B]">Photos</dt><dd className="font-semibold text-[#0F172A]">{images.length} attached</dd></div>
            </dl>
            <div className="mt-4 border-t border-[#E2E8F0] pt-4">
              <h3 className="text-sm font-semibold text-[#0F172A]">Description</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[#475569]">{formData.description}</p>
              <h3 className="mt-4 text-sm font-semibold text-[#0F172A]">Features</h3>
              <p className="mt-1 text-sm text-[#475569]">
                {[
                  formData.kitchen ? "Kitchen" : null,
                  ...amenitiesList.filter(({ key }) => formData.amenities[key]).map(({ label }) => label)
                ].filter(Boolean).join(", ") || "No optional features selected"}
              </p>
              <p className="mt-3 text-sm text-[#475569]">Contact: {formData.contactPhone}</p>
              {(formData.latitude || formData.longitude) && <p className="mt-1 text-sm text-[#475569]">Map coordinates: {formData.latitude || "-"}, {formData.longitude || "-"}</p>}
            </div>
            <div className="mt-5 flex flex-col-reverse justify-end gap-2 sm:flex-row">
              <button type="button" onClick={() => setConfirmSubmitOpen(false)} className="rounded-md border border-[#CBD5E1] px-4 py-2.5 text-sm font-semibold text-[#334155]">Continue editing</button>
              <button type="button" onClick={confirmListingSubmission} disabled={loading} className="rounded-md bg-[#126542] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Submitting..." : "Confirm and submit for review"}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default CreateListingPage;
