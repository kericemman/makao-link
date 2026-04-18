import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getMyListingById, updateListing } from "../../services/listings.service";
import { 
  FiHome, 
  FiMapPin, 
  FiDollarSign, 
  FiFileText,
  FiImage,
  FiPlus,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiGrid,
  FiMap,
  FiCamera,
  FiUpload,
  FiTrash2,
  FiArrowLeft,
  FiUser,
  FiPhone,
  FiInfo,
  FiChevronRight,
  FiSave,
  FiLoader
} from "react-icons/fi";
import { FaBed, FaBath, FaBuilding, FaRulerCombined, FaUtensilSpoon } from "react-icons/fa";
import toast from "react-hot-toast";

const propertyTypes = [
  { value: "apartment", label: "Apartment" },
  { value: "bedsitter", label: "Bedsitter" },
  { value: "maisonette", label: "Maisonette" },
  { value: "studio", label: "Studio" },
  { value: "bungalow", label: "Bungalow" },
  { value: "townhouse", label: "Townhouse" },
  { value: "office", label: "Office Space" },
  { value: "other", label: "Other" }
];

const initialAmenities = {
  garden: false,
  tarmacAccess: false,
  nearSchools: false,
  nearShoppingCentre: false,
  nearHospital: false,
  waterAvailable: true,
  electricityAvailable: true,
  parking: false,
  security: false,
  wifi: false,
  swimmingPool: false,
  gym: false
};

// Helper function to get image URL
const getImageUrl = (image) => {
  if (!image) return null;
  if (typeof image === 'object' && image.url) return image.url;
  if (typeof image === 'string') return image;
  return null;
};

const EditListingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    type: "",
    purpose: "rent",
    bedrooms: "",
    bathrooms: "",
    size: "",
    contactPhone: "",
    kitchen: true
  });

  const [amenities, setAmenities] = useState(initialAmenities);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  // fetch listing
  const fetchListing = async () => {
    try {
      const data = await getMyListingById(id);
      const listing = data.listing;

      setForm({
        title: listing.title || "",
        description: listing.description || "",
        price: listing.price || "",
        location: listing.location || "",
        type: listing.type || "",
        purpose: listing.purpose || "rent",
        bedrooms: listing.bedrooms ?? "",
        bathrooms: listing.bathrooms ?? "",
        size: listing.size ?? "",
        contactPhone: listing.contactPhone || "",
        kitchen: listing.kitchen !== undefined ? listing.kitchen : true
      });

      // Set amenities
      if (listing.amenities) {
        setAmenities({
          ...initialAmenities,
          ...listing.amenities
        });
      }

      // Set existing images
      if (listing.images && listing.images.length > 0) {
        setExistingImages(listing.images);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load listing");
      toast.error("Failed to load listing", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListing();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleAmenityChange = (e) => {
    const { name, checked } = e.target;
    setAmenities({
      ...amenities,
      [name]: checked
    });
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files || []);
    
    const validFiles = files.filter(file => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length + images.length > 10) {
      toast.error("Maximum 10 images allowed");
      return;
    }

    setImages(prev => [...prev, ...validFiles]);

    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreview(prev => [...prev, ...newPreviews]);
  };

  const removeNewImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreview(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!form.description.trim()) newErrors.description = "Description is required";
    if (!form.price) newErrors.price = "Price is required";
    if (form.price && form.price < 0) newErrors.price = "Price must be positive";
    if (!form.location.trim()) newErrors.location = "Location is required";
    if (!form.type) newErrors.type = "Property type is required";
    if (form.type !== "office" && !form.bedrooms) newErrors.bedrooms = "Number of bedrooms is required";
    if (form.type !== "office" && !form.bathrooms) newErrors.bathrooms = "Number of bathrooms is required";
    if (!form.contactPhone.trim()) newErrors.contactPhone = "Contact phone is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = new FormData();

      Object.keys(form).forEach((key) => {
        payload.append(key, form[key]);
      });

      payload.append("amenities", JSON.stringify(amenities));

      // Add existing image URLs to keep
      existingImages.forEach((img) => {
        const imageUrl = getImageUrl(img);
        if (imageUrl) {
          payload.append("existingImages", imageUrl);
        }
      });

      // Add new images
      images.forEach((img) => {
        payload.append("images", img);
      });

      await updateListing(id, payload);

      toast.success("Listing updated successfully!", {
        style: {
          background: "#02BB31",
          color: "#fff",
        },
        duration: 3000
      });

      // Clean up object URLs
      preview.forEach(url => URL.revokeObjectURL(url));

      navigate("/landlord/listings");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update listing");
      toast.error("Failed to update listing", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8D8C1] border-t-[#02BB31] mx-auto mb-4"></div>
          <p className="text-[#065A57]">Loading listing details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/landlord/listings")}
            className="p-2 hover:bg-[#F0F7F4] rounded-lg transition-colors"
          >
            <FiArrowLeft className="text-xl text-[#065A57]" />
          </button>
          <div className="p-3 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl">
            <FiHome className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#013E43]">Edit Listing</h1>
            <p className="text-sm text-[#065A57]">Update your property information</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Card */}
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
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g., 2 Bedroom Modern Apartment in Westlands"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all ${
                    errors.title 
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31]'
                  }`}
                  disabled={saving}
                />
              </div>
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="5"
                placeholder="Describe your property in detail..."
                className={`w-full px-4 py-3 rounded-lg border-2 outline-none transition-all resize-none ${
                  errors.description 
                    ? 'border-red-400 focus:border-red-500 bg-red-50' 
                    : 'border-[#A8D8C1] focus:border-[#02BB31]'
                }`}
                disabled={saving}
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">{errors.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Location & Price Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
          <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
            <FiMapPin className="mr-2 text-[#02BB31]" />
            Location & Price
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  value={form.price}
                  onChange={handleChange}
                  placeholder="e.g., 25000"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all ${
                    errors.price 
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31]'
                  }`}
                  disabled={saving}
                />
              </div>
              {errors.price && (
                <p className="text-sm text-red-500 mt-1">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMapPin className="h-5 w-5 text-[#0D915C]" />
                </div>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g., Westlands, Nairobi"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all ${
                    errors.location 
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31]'
                  }`}
                  disabled={saving}
                />
              </div>
              {errors.location && (
                <p className="text-sm text-red-500 mt-1">{errors.location}</p>
              )}
            </div>
          </div>
        </div>

        {/* Property Details Card */}
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
                  value={form.type}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-colors appearance-none bg-white ${
                    errors.type 
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31]'
                  }`}
                  disabled={saving}
                >
                  <option value="">Select Property Type</option>
                  {propertyTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.type && (
                <p className="text-sm text-red-500 mt-1">{errors.type}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Purpose
              </label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="purpose"
                    value="rent"
                    checked={form.purpose === "rent"}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#02BB31] border-[#A8D8C1] focus:ring-[#02BB31]"
                  />
                  <span className="text-sm text-[#065A57]">For Rent</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="purpose"
                    value="sale"
                    checked={form.purpose === "sale"}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#02BB31] border-[#A8D8C1] focus:ring-[#02BB31]"
                  />
                  <span className="text-sm text-[#065A57]">For Sale</span>
                </label>
              </div>
            </div>
          </div>

          {/* Residential Fields */}
          {form.type !== "office" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                    value={form.bedrooms}
                    onChange={handleChange}
                    placeholder="e.g., 2"
                    min="0"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all ${
                      errors.bedrooms 
                        ? 'border-red-400 focus:border-red-500 bg-red-50' 
                        : 'border-[#A8D8C1] focus:border-[#02BB31]'
                    }`}
                    disabled={saving}
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
                    value={form.bathrooms}
                    onChange={handleChange}
                    placeholder="e.g., 2"
                    min="0"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all ${
                      errors.bathrooms 
                        ? 'border-red-400 focus:border-red-500 bg-red-50' 
                        : 'border-[#A8D8C1] focus:border-[#02BB31]'
                    }`}
                    disabled={saving}
                  />
                </div>
                {errors.bathrooms && (
                  <p className="text-sm text-red-500 mt-1">{errors.bathrooms}</p>
                )}
              </div>
            </div>
          )}

          {/* Office Fields */}
          {form.type === "office" && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Size (sqft)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaRulerCombined className="h-5 w-5 text-[#0D915C]" />
                </div>
                <input
                  name="size"
                  value={form.size}
                  onChange={handleChange}
                  placeholder="e.g., 500"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-[#A8D8C1] focus:border-[#02BB31] outline-none transition-colors"
                  disabled={saving}
                />
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="kitchen"
                checked={form.kitchen}
                onChange={handleChange}
                className="w-5 h-5 text-[#02BB31] border-[#A8D8C1] rounded focus:ring-[#02BB31]"
              />
              <span className="text-sm text-[#065A57] flex items-center">
                <FaUtensilSpoon className="mr-2" />
                Kitchen available
              </span>
            </label>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[#013E43] mb-1">
              Contact Phone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiPhone className="h-5 w-5 text-[#0D915C]" />
              </div>
              <input
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
                placeholder="e.g., 0712345678"
                className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all ${
                  errors.contactPhone 
                    ? 'border-red-400 focus:border-red-500 bg-red-50' 
                    : 'border-[#A8D8C1] focus:border-[#02BB31]'
                }`}
                disabled={saving}
              />
            </div>
            {errors.contactPhone && (
              <p className="text-sm text-red-500 mt-1">{errors.contactPhone}</p>
            )}
          </div>
        </div>

        {/* Amenities Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
          <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
            <FiCheckCircle className="mr-2 text-[#02BB31]" />
            Amenities
          </h2>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(amenities).map(([key, value]) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name={key}
                  checked={value}
                  onChange={handleAmenityChange}
                  className="w-5 h-5 text-[#02BB31] border-[#A8D8C1] rounded focus:ring-[#02BB31]"
                />
                <span className="text-sm text-[#065A57] capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Images Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
          <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
            <FiCamera className="mr-2 text-[#02BB31]" />
            Property Images
          </h2>

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#013E43] mb-2">
                Current Images
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {existingImages.map((img, index) => {
                  const imageUrl = getImageUrl(img);
                  return (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Property ${index + 1}`}
                        className="h-24 w-full object-cover rounded-lg border border-[#A8D8C1]"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upload New Images */}
          <div>
            <label className="block text-sm font-medium text-[#013E43] mb-2">
              Add New Images
            </label>
            <div className="border-2 border-dashed border-[#A8D8C1] rounded-xl p-6 text-center hover:border-[#02BB31] transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImages}
                className="hidden"
                id="image-upload"
                disabled={saving}
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <FiUpload className="text-3xl text-[#065A57] mb-2" />
                <span className="text-sm text-[#065A57]">
                  Click to upload new images
                </span>
                <span className="text-xs text-[#065A57] mt-1">
                  PNG, JPG, GIF up to 5MB (Max 10 images total)
                </span>
              </label>
            </div>
            <p className="text-xs text-[#065A57] mt-2">
              {existingImages.length + images.length}/10 images used
            </p>
          </div>

          {/* New Image Previews */}
          {preview.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#013E43] mb-2">
                New Images Preview
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {preview.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`Preview ${index + 1}`}
                      className="h-24 w-full object-cover rounded-lg border border-[#A8D8C1]"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 p-4 rounded-xl text-sm text-red-600 flex items-center gap-2 border border-red-200">
            <FiAlertCircle className="text-red-500" />
            {error}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate("/landlord/listings")}
            className="px-6 py-3 text-[#065A57] border border-[#A8D8C1] rounded-lg hover:bg-[#F0F7F4] transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <FiSave className="mr-2" />
                Update Listing
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditListingPage;