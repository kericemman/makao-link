import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createListing, getListingMeta } from "../../services/listings.service";
import { useAuth } from "../../context/AuthContext";
import imageCompression from "browser-image-compression";
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
  FiHome
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

const prettifyLabel = (value) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const CreateListingPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const navigate = useNavigate();
  const { subscription, usage } = useAuth();

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

  const blocked =
    !subscription ||
    ["pending_payment", "grace", "expired", "cancelled"].includes(subscription.status) ||
    usage.used >= usage.limit;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    purpose: "rent",
    price: "",
    county: "",
    town: "",
    area: "",
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

  const amenitiesList = [
    { key: "garden", label: "Garden" },
    { key: "tarmacAccess", label: "Tarmac Access" },
    { key: "nearSchools", label: "Near Schools" },
    { key: "nearShoppingCentre", label: "Near Shopping Centre" },
    { key: "nearHospital", label: "Near Hospital" },
    { key: "waterAvailable", label: "Water Available" },
    { key: "electricityAvailable", label: "Electricity Available" }
  ];

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
        sizeUnit: nextType === "office" ? prev.sizeUnit || (listingMeta.officeSizeUnits?.[0] || "sqft") : prev.sizeUnit
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
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
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1600,
        useWebWorker: true
      });

      compressedFiles.push(compressed);
    } catch (error) {
      toast.error(`Failed to process ${file.name}`);
    }
  }

  if (compressedFiles.length + images.length > 5) {
    toast.error("Maximum 5 images allowed");
    return;
  }

  setImages((prev) => [...prev, ...compressedFiles]);

  const newPreviews = compressedFiles.map((file) => URL.createObjectURL(file));
  setPreview((prev) => [...prev, ...newPreviews]);

  if (errors.images) {
    setErrors((prev) => ({ ...prev, images: "" }));
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
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.price) newErrors.price = "Price is required";
    if (formData.price && Number(formData.price) < 0) newErrors.price = "Price must be positive";

    if (!formData.county) newErrors.county = "County is required";
    if (!formData.town) newErrors.town = "Town/Location is required";
    if (!formData.type) newErrors.type = "Property type is required";
    if (!formData.purpose) newErrors.purpose = "Purpose is required";
    if (!formData.contactPhone.trim()) newErrors.contactPhone = "Contact phone is required";
    if (images.length === 0) newErrors.images = "At least one image is required";

    if (isResidential) {
      if (formData.bedrooms === "" || formData.bedrooms === null) {
        newErrors.bedrooms = "Number of bedrooms is required";
      }
      if (formData.bathrooms === "" || formData.bathrooms === null) {
        newErrors.bathrooms = "Number of bathrooms is required";
      }
    }

    if (isOffice) {
      if (!formData.size) {
        newErrors.size = "Office size is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (blocked) {
      navigate("/landlord/subscription", {
        state: {
          reason:
            usage.used >= usage.limit
              ? "limit_reached"
              : subscription?.status === "pending_payment"
              ? "pending_payment"
              : subscription?.status === "grace"
              ? "grace_block"
              : "expired"
        }
      });
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
      if (formData.area) payload.append("area", formData.area);
      payload.append("type", formData.type);

      if (isResidential) {
        payload.append("bedrooms", formData.bedrooms);
        payload.append("bathrooms", formData.bathrooms);
      }

      payload.append("kitchen", formData.kitchen);

      if (isOffice && formData.size) {
        payload.append("size", formData.size);
        payload.append("sizeUnit", formData.sizeUnit);
      }

      if (formData.video) payload.append("video", formData.video);

      payload.append("amenities", JSON.stringify(formData.amenities));
      payload.append("contactPhone", formData.contactPhone);

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
        navigate("/landlord/listings");
      }, 2000);
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
            onClick={() => navigate("/landlord/listings")}
            className="p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors"
          >
            <FiArrowLeft className="text-xl text-[#065A57]" />
          </button>

          <div>
            <h1 className="text-xl font-bold text-[#013E43]">Add New Listing</h1>
            <p className="text-sm text-[#065A57]">List your property for tenants to find</p>
          </div>
        </div>
      </div>

      {metaLoading ? (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1] text-[#065A57]">
          Loading listing options...
        </div>
      ) : null}

      {blocked ? (
        <div className="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-700 border border-amber-200">
          <div className="flex items-start gap-3">
            <FiInfo className="text-amber-500 mt-0.5" />
            <div>
              You cannot create a new listing right now. Please review your subscription status first.
            </div>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
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
                Specific Area (Optional)
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
                  PNG, JPG, GIF up to 5MB each (Max 5 images)
                </span>
              </label>
            </div>
            {errors.images && <p className="text-sm text-red-500 mt-1">{errors.images}</p>}
            <p className="text-xs text-[#065A57] mt-2">{images.length}/5 image(s) selected</p>
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
          <button
            type="button"
            onClick={() => navigate("/landlord/listings")}
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