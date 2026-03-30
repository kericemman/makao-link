import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createListing } from "../../services/listings.service";
import { useAuth } from "../../context/AuthContext";
import { 
  FiHome, 
  FiMapPin, 
  FiDollarSign, 
  FiFileText,
  FiImage,
  FiX,
  FiCheckCircle,
  FiGrid,
  FiCamera,
  FiUpload,
  FiTrash2,
  FiArrowLeft
} from "react-icons/fi";
import { FaBed, FaBath, FaBuilding, FaPhone } from "react-icons/fa";
import toast from "react-hot-toast";

const CreateListingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState({});
  const { subscription, usage } = useAuth();

  const blocked =
    !subscription ||
    ["pending_payment", "grace", "expired", "cancelled"].includes(subscription.status) ||
    usage.used >= usage.limit;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    bedrooms: "",
    bathrooms: "",
    type: "apartment",
    contactPhone: ""
  });

  const propertyTypes = [
    { value: "apartment", label: "Apartment" },
    { value: "bedsitter", label: "Bedsitter" },
    { value: "maisonette", label: "Maisonette" },
    { value: "studio", label: "Studio" },
    { value: "bungalow", label: "Bungalow" },
    { value: "townhouse", label: "Townhouse" },
    { value: "other", label: "Other" }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    
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

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreview(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.price) newErrors.price = "Price is required";
    if (formData.price && formData.price < 0) newErrors.price = "Price must be positive";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.bedrooms) newErrors.bedrooms = "Number of bedrooms is required";
    if (!formData.bathrooms) newErrors.bathrooms = "Number of bathrooms is required";
    if (!formData.contactPhone.trim()) newErrors.contactPhone = "Contact phone is required";
    if (images.length === 0) newErrors.images = "At least one image is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (blocked) {
      navigate("/landlord/subscription", {
        state: {
          reason: usage.used >= usage.limit
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

      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value);
      });

      images.forEach((image) => {
        payload.append("images", image);
      });

      await createListing(payload);

      toast.success("Property listed successfully! Pending approval.", {
        style: {
          background: "#02BB31",
          color: "#fff",
        },
        duration: 3000
      });

      preview.forEach(url => URL.revokeObjectURL(url));

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
            <h1 className="text-2xl font-bold text-[#013E43]">Add New Listing</h1>
            <p className="text-sm text-[#065A57]">List your property for tenants to find</p>
          </div>
        </div>
      </div>

      {blocked ? (
        <div className="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
          You cannot create a new listing right now. Please review your subscription status first.
        </div>
      ) : null}

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
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., 2 Bedroom Modern Apartment in Westlands"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all ${
                    errors.title 
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31]'
                  }`}
                  disabled={loading}
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
                value={formData.description}
                onChange={handleChange}
                rows="5"
                placeholder="Describe your property in detail..."
                className={`w-full px-4 py-3 rounded-lg border-2 outline-none transition-all resize-none ${
                  errors.description 
                    ? 'border-red-400 focus:border-red-500 bg-red-50' 
                    : 'border-[#A8D8C1] focus:border-[#02BB31]'
                }`}
                disabled={loading}
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
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g., 25000"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all ${
                    errors.price 
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31]'
                  }`}
                  disabled={loading}
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
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Westlands, Nairobi"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all ${
                    errors.location 
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31]'
                  }`}
                  disabled={loading}
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
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31]'
                  }`}
                  disabled={loading}
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
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31]'
                  }`}
                  disabled={loading}
                />
              </div>
              {errors.bathrooms && (
                <p className="text-sm text-red-500 mt-1">{errors.bathrooms}</p>
              )}
            </div>

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
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-[#A8D8C1] focus:border-[#02BB31] outline-none appearance-none bg-white"
                  disabled={loading}
                >
                  {propertyTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31]'
                  }`}
                  disabled={loading}
                />
              </div>
              {errors.contactPhone && (
                <p className="text-sm text-red-500 mt-1">{errors.contactPhone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Images Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
          <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
            <FiCamera className="mr-2 text-[#02BB31]" />
            Property Images <span className="text-red-500 ml-1">*</span>
          </h2>

          <div className="mb-4">
            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              errors.images ? 'border-red-300 bg-red-50' : 'border-[#A8D8C1] hover:border-[#02BB31]'
            }`}>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImages}
                className="hidden"
                id="image-upload"
                disabled={loading}
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <FiUpload className="text-3xl text-[#065A57] mb-2" />
                <span className="text-sm text-[#065A57]">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-[#065A57] mt-1">
                  PNG, JPG, GIF up to 5MB (Max 10 images)
                </span>
              </label>
            </div>
            {errors.images && (
              <p className="text-sm text-red-500 mt-1">{errors.images}</p>
            )}
            <p className="text-xs text-[#065A57] mt-2">
              {images.length} image(s) selected
            </p>
          </div>

          {preview.length > 0 && (
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

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate("/landlord/listings")}
            className="px-6 py-3 text-[#065A57] border border-[#A8D8C1] rounded-lg hover:bg-[#F0F7F4] transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            disabled={loading || blocked}
            className="px-6 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Listing"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateListingPage;