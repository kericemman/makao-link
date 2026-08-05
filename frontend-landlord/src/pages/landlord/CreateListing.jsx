import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createListing, getListingMeta } from "../../services/listings.service";
import { getMySubscription } from "../../services/payment.service";
import { useAuth } from "../../context/AuthContext";
import imageCompression from "browser-image-compression";
import { FaWhatsapp } from "react-icons/fa";
import { buildWhatsAppUrl, listingDraftMessage } from "../../utils/whatsapp";
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

  const { user, subscription: authSubscription, usage: authUsage } = useAuth();

  const [freshSubscription, setFreshSubscription] = useState(null);
  const [freshUsage, setFreshUsage] = useState({
    used: 0,
    limit: 0,
    remaining: 0
  });

  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState({});

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
      } catch (error) {
        toast.error("Failed to load subscription status", {
          style: { background: "#013E43", color: "#fff" }
        });
      } finally {
        setSubscriptionLoading(false);
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
          type: meta.listingTypes?.[0] || "apartment",
          purpose: meta.listingPurposes?.[0] || "rent",
          sizeUnit: meta.officeSizeUnits?.[0] || "sqft"
        }));
      } catch (error) {
        toast.error("Failed to load listing options", {
          style: { background: "#013E43", color: "#fff" }
        });
      } finally {
        setMetaLoading(false);
      }
    };

    fetchMeta();
  }, []);

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

  const isPageLoading = metaLoading || subscriptionLoading;
  const draftWhatsAppUrl = buildWhatsAppUrl(listingDraftMessage(user, formData));

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
      label: purpose === "rent" ? "For Rent" : "For Sale"
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
          style: { background: "#02BB31", color: "#fff" }
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

    if (!formData.contactPhone.trim())
      newErrors.contactPhone = "Contact phone is required";

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (blocked) {
      handleBlockedRedirect();
      return;
    }

    if (!validateForm()) {
      toast.error("Please fill in all required fields", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    try {
      setLoading(true);

      const payload = new FormData();

      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("purpose", formData.purpose);
      payload.append("price", formData.price);
      payload.append("county", formData.county);
      payload.append("town", formData.town);
      payload.append("type", formData.type);
      payload.append("kitchen", formData.kitchen);
      payload.append("amenities", JSON.stringify(formData.amenities));
      payload.append("contactPhone", formData.contactPhone);

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

      await createListing(payload);

      toast.success("Property listed successfully! Pending approval.", {
        style: {
          background: "#02BB31",
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
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/listings")}
            className="p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors"
          >
            <FiArrowLeft className="text-xl text-[#065A57]" />
          </button>

          <div>
            <h1 className="text-xl font-bold text-[#013E43]">
              Add New Listing
            </h1>
            <p className="text-sm text-[#065A57]">
              List your property for tenants to find
            </p>
          </div>
        </div>
      </div>

      {isPageLoading ? (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1] text-[#065A57]">
          Loading listing and subscription options...
        </div>
      ) : null}

      {!isPageLoading && blocked ? (
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700 border border-amber-200">
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
        <section className="rounded-2xl border border-[#DDEBE4] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0D915C]">Assisted listing</p>
              <h2 className="mt-2 text-lg font-bold text-[#013E43]">Want RendaHomes to review your details first?</h2>
              <p className="mt-1 text-sm leading-6 text-[#065A57]">
                Send your draft on WhatsApp before submitting. We can guide you on price, photos, location details, and missing information.
              </p>
            </div>
            <a
              href={draftWhatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#02BB31] px-4 py-3 text-sm font-bold text-white"
            >
              <FaWhatsapp />
              Review on WhatsApp
            </a>
          </div>
        </section>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* keep your existing form JSX from Basic Information downwards */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
          <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
            <FiFileText className="mr-2 text-[#02BB31]" />
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
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
                      : "border-[#A8D8C1] focus:border-[#02BB31]"
                  }`}
                  disabled={loading || metaLoading}
                />
              </div>
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
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
                    : "border-[#A8D8C1] focus:border-[#02BB31]"
                }`}
                disabled={loading || metaLoading}
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">{errors.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
          <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
            <FiMapPin className="mr-2 text-[#02BB31]" />
            Location & Price
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
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
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-[#A8D8C1] focus:border-[#02BB31] outline-none appearance-none bg-white"
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
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Price (KES) <span className="text-red-500">*</span>
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
                  placeholder="e.g., 25000"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all ${
                    errors.price
                      ? "border-red-400 focus:border-red-500 bg-red-50"
                      : "border-[#A8D8C1] focus:border-[#02BB31]"
                  }`}
                  disabled={loading || metaLoading}
                />
              </div>
              {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
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
                      : "border-[#A8D8C1] focus:border-[#02BB31]"
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
              <label className="block text-sm font-medium text-[#013E43] mb-1">
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
                      : "border-[#A8D8C1] focus:border-[#02BB31]"
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
              <label className="block text-sm font-medium text-[#013E43] mb-1">
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
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-[#A8D8C1] focus:border-[#02BB31] outline-none transition-colors"
                  disabled={loading || metaLoading}
                />
              </div>
              <p className="text-xs text-[#065A57] mt-1">Optional: Add specific directions or landmark</p>
            </div>

            <div className="md:col-span-2 rounded-xl border border-[#A8D8C1] bg-[#F0F7F4] p-4">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <label className="block text-sm font-medium text-[#013E43]">
                    Map Location (Optional)
                  </label>
                  <p className="mt-1 text-xs text-[#065A57]">
                    Add coordinates so tenants can understand the property area better.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#013E43] px-4 py-2 text-sm font-semibold text-white hover:bg-[#005C57]"
                >
                  <FiCrosshair />
                  Use my location
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#065A57]">
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
                    className="mt-1 w-full rounded-lg border-2 border-[#A8D8C1] bg-white px-4 py-3 outline-none transition-colors focus:border-[#02BB31]"
                    disabled={loading || metaLoading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#065A57]">
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
                    className="mt-1 w-full rounded-lg border-2 border-[#A8D8C1] bg-white px-4 py-3 outline-none transition-colors focus:border-[#02BB31]"
                    disabled={loading || metaLoading}
                  />
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-[#A8D8C1] bg-white">
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
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#065A57] hover:text-[#013E43]"
              >
                <FiNavigation />
                Open map in new tab
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
          <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
            <FiGrid className="mr-2 text-[#02BB31]" />
            Property Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
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
                      : "border-[#A8D8C1] focus:border-[#02BB31]"
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
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
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
                          : "border-[#A8D8C1] focus:border-[#02BB31]"
                      }`}
                      disabled={loading || metaLoading}
                    />
                  </div>
                  {errors.bedrooms && (
                    <p className="text-sm text-red-500 mt-1">{errors.bedrooms}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
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
                          : "border-[#A8D8C1] focus:border-[#02BB31]"
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
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
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
                          : "border-[#A8D8C1] focus:border-[#02BB31]"
                      }`}
                      disabled={loading || metaLoading}
                    />
                  </div>
                  {errors.size && <p className="text-sm text-red-500 mt-1">{errors.size}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-1">
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
                      className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-[#A8D8C1] focus:border-[#02BB31] outline-none appearance-none bg-white"
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
              <label className="block text-sm font-medium text-[#013E43] mb-1">
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
                      : "border-[#A8D8C1] focus:border-[#02BB31]"
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
                  className="w-5 h-5 text-[#02BB31] border-[#A8D8C1] rounded focus:ring-[#02BB31]"
                />
                <span className="text-sm text-[#065A57] flex items-center">
                  <FaUtensils className="mr-2" />
                  Kitchen available
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
          <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
            <FiVideo className="mr-2 text-[#02BB31]" />
            Virtual Tour (Optional)
          </h2>

          <div>
            <label className="block text-sm font-medium text-[#013E43] mb-1">
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
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-[#A8D8C1] focus:border-[#02BB31] outline-none transition-colors"
                disabled={loading || metaLoading}
              />
            </div>
            <p className="text-xs text-[#065A57] mt-1">
              Add a YouTube or Vimeo link for a virtual tour of your property
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
          <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
            <FiCheckCircle className="mr-2 text-[#02BB31]" />
            Amenities
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {amenitiesList.map((amenity) => (
              <label key={amenity.key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.amenities[amenity.key]}
                  onChange={() => handleAmenityChange(amenity.key)}
                  className="w-5 h-5 text-[#02BB31] border-[#A8D8C1] rounded focus:ring-[#02BB31]"
                />
                <span className="text-sm text-[#065A57]">{amenity.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
          <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
            <FiCamera className="mr-2 text-[#02BB31]" />
            Property Images <span className="text-red-500 ml-1">*</span>
          </h2>

          <div className="mb-4">
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                errors.images ? "border-red-300 bg-red-50" : "border-[#A8D8C1] hover:border-[#02BB31]"
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
                <FiUpload className="text-3xl text-[#065A57] mb-2" />
                <span className="text-sm text-[#065A57]">Click to upload or drag and drop</span>
                <span className="text-xs text-[#065A57] mt-1">
                  Select multiple images. Large files are compressed before upload. Max {MAX_LISTING_IMAGES} images.
                </span>
              </label>
            </div>
            {errors.images && <p className="text-sm text-red-500 mt-1">{errors.images}</p>}
            <p className="text-xs text-[#065A57] mt-2">{images.length}/{MAX_LISTING_IMAGES} image(s) selected</p>
          </div>

          {preview.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {preview.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Preview ${index + 1}`}
                    className="h-24 w-full object-cover rounded-lg border border-[#A8D8C1]"
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
          <a
            href={draftWhatsAppUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-[#02BB31] px-6 py-3 text-sm font-semibold text-[#013E43] hover:bg-[#F0F7F4]"
          >
            <FaWhatsapp />
            WhatsApp help
          </a>
          <button
            type="button"
            onClick={() => navigate("/listings")}
            className="px-6 py-3 text-[#065A57] border border-[#A8D8C1] rounded-lg hover:bg-[#F0F7F4] transition-colors"
            disabled={loading || metaLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || blocked || metaLoading}
            className="px-6 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
    </div>
  );
};

export default CreateListingPage;
