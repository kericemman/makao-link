import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { createProperty } from "../../services/property.service"
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
  FiInfo,
  FiGrid,
  FiMap,
  FiCamera,
  FiUpload,
  FiTrash2
} from "react-icons/fi"
import { FaBed, FaBath, FaBuilding, FaCity } from "react-icons/fa"
import toast from "react-hot-toast"

function AddProperty() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    propertyType: "apartment",
    bedrooms: "",
    bathrooms: "",
    city: "",
    location: "",
    amenities: []
  })

  const [amenitiesInput, setAmenitiesInput] = useState("")
  const [images, setImages] = useState([])
  const [preview, setPreview] = useState([])
  const [errors, setErrors] = useState({})

  const propertyTypes = [
    { value: "apartment", label: "Apartment" },
    { value: "bedsitter", label: "Bedsitter" },
    { value: "studio", label: "Studio" },
    { value: "house", label: "House" },
    { value: "villa", label: "Villa" }
  ]

  const availableAmenities = [
    "wifi", "parking", "security", "gym", "pool", "laundry", 
    "elevator", "balcony", "furnished", "unfurnished", "tarraced", 
    "duplex", "penthouse", "school", "hospital", "market", "public_transport"
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({
      ...form,
      [name]: value
    })
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }
  }

  const handleAmenityToggle = (amenity) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }

  const handleAddAmenity = () => {
    if (amenitiesInput.trim() && !form.amenities.includes(amenitiesInput.trim())) {
      setForm({
        ...form,
        amenities: [...form.amenities, amenitiesInput.trim()]
      })
      setAmenitiesInput("")
    }
  }

  const handleRemoveAmenity = (amenity) => {
    setForm({
      ...form,
      amenities: form.amenities.filter(a => a !== amenity)
    })
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    
    // Validate file types
    const validFiles = files.filter(file => 
      file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024 // 5MB limit
    )

    if (validFiles.length !== files.length) {
      toast.error("Some files were skipped. Only images under 5MB are allowed.")
    }

    setImages(prev => [...prev, ...validFiles])

    const newPreviews = validFiles.map(file => URL.createObjectURL(file))
    setPreview(prev => [...prev, ...newPreviews])
  }

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setPreview(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!form.title.trim()) newErrors.title = "Title is required"
    if (!form.description.trim()) newErrors.description = "Description is required"
    if (!form.price) newErrors.price = "Price is required"
    if (form.price && form.price < 0) newErrors.price = "Price must be positive"
    if (!form.bedrooms) newErrors.bedrooms = "Number of bedrooms is required"
    if (!form.bathrooms) newErrors.bathrooms = "Number of bathrooms is required"
    if (!form.city.trim()) newErrors.city = "City is required"
    if (!form.location.trim()) newErrors.location = "Location is required"
    if (images.length === 0) newErrors.images = "At least one image is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fill in all required fields", {
        style: { background: "#013E43", color: "#fff" }
      })
      return
    }

    try {
      setIsLoading(true)

      const formData = new FormData()

      // Append all form fields
      Object.keys(form).forEach(key => {
        if (key === "amenities") {
          // Send amenities as JSON string
          formData.append(key, JSON.stringify(form[key]))
        } else {
          formData.append(key, form[key])
        }
      })

      // Append images
      images.forEach(image => {
        formData.append("images", image)
      })

      await createProperty(formData)

      toast.success("Property created successfully! Pending approval.", {
        style: {
          background: "#02BB31",
          color: "#fff",
        },
        duration: 3000
      })

      // Redirect to properties list
      setTimeout(() => {
        navigate("/dashboard/properties")
      }, 2000)

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create property",
        {
          style: {
            background: "#013E43",
            color: "#fff",
          }
        }
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-r from-[#013E43] to-[#005C57] rounded-xl">
            <FiHome className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#013E43]">Add New Property</h1>
            <p className="text-sm text-[#065A57]">Fill in the details to list your property</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
          <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
            <FiInfo className="mr-2 text-[#02BB31]" />
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Property Title <span className="text-red-500">*</span>
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
                  className={`
                    w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all
                    ${errors.title 
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31]'
                    }
                  `}
                  disabled={isLoading}
                />
              </div>
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            {/* Price */}
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
                  className={`
                    w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all
                    ${errors.price 
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31]'
                    }
                  `}
                  disabled={isLoading}
                />
              </div>
              {errors.price && (
                <p className="text-sm text-red-500 mt-1">{errors.price}</p>
              )}
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Property Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaBuilding className="h-5 w-5 text-[#0D915C]" />
                </div>
                <select
                  name="propertyType"
                  value={form.propertyType}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-[#A8D8C1] focus:border-[#02BB31] outline-none appearance-none bg-white"
                  disabled={isLoading}
                >
                  {propertyTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Description Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
          <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
            <FiFileText className="mr-2 text-[#02BB31]" />
            Description
          </h2>

          <div>
            <label className="block text-sm font-medium text-[#013E43] mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="4"
              placeholder="Describe your property in detail..."
              className={`
                w-full px-4 py-3 rounded-lg border-2 outline-none transition-all resize-none
                ${errors.description 
                  ? 'border-red-400 focus:border-red-500 bg-red-50' 
                  : 'border-[#A8D8C1] focus:border-[#02BB31]'
                }
              `}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description}</p>
            )}
          </div>
        </div>

        {/* Location Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
          <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
            <FiMapPin className="mr-2 text-[#02BB31]" />
            Location
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* City */}
            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCity className="h-5 w-5 text-[#0D915C]" />
                </div>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g., Nairobi"
                  className={`
                    w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all
                    ${errors.city 
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31]'
                    }
                  `}
                  disabled={isLoading}
                />
              </div>
              {errors.city && (
                <p className="text-sm text-red-500 mt-1">{errors.city}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-[#013E43] mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMap className="h-5 w-5 text-[#0D915C]" />
                </div>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g., Westlands, along Waiyaki Way"
                  className={`
                    w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all
                    ${errors.location 
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31]'
                    }
                  `}
                  disabled={isLoading}
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
            {/* Bedrooms */}
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
                  className={`
                    w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all
                    ${errors.bedrooms 
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31]'
                    }
                  `}
                  disabled={isLoading}
                />
              </div>
              {errors.bedrooms && (
                <p className="text-sm text-red-500 mt-1">{errors.bedrooms}</p>
              )}
            </div>

            {/* Bathrooms */}
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
                  className={`
                    w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all
                    ${errors.bathrooms 
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31]'
                    }
                  `}
                  disabled={isLoading}
                />
              </div>
              {errors.bathrooms && (
                <p className="text-sm text-red-500 mt-1">{errors.bathrooms}</p>
              )}
            </div>
          </div>
        </div>

        {/* Amenities Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
          <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
            <FiCheckCircle className="mr-2 text-[#02BB31]" />
            Amenities
          </h2>

          {/* Selected Amenities */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#013E43] mb-2">
              Selected Amenities
            </label>
            <div className="flex flex-wrap gap-2">
              {form.amenities.map(amenity => (
                <span
                  key={amenity}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#02BB31]/10 text-[#02BB31] border border-[#02BB31]/20"
                >
                  {amenity}
                  <button
                    type="button"
                    onClick={() => handleRemoveAmenity(amenity)}
                    className="ml-2 text-[#02BB31] hover:text-red-500"
                  >
                    <FiX size={14} />
                  </button>
                </span>
              ))}
              {form.amenities.length === 0 && (
                <p className="text-sm text-[#065A57]">No amenities selected</p>
              )}
            </div>
          </div>

          {/* Add Custom Amenity */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={amenitiesInput}
              onChange={(e) => setAmenitiesInput(e.target.value)}
              placeholder="Add custom amenity..."
              className="flex-1 px-4 py-2 rounded-lg border-2 border-[#A8D8C1] focus:border-[#02BB31] outline-none"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
            />
            <button
              type="button"
              onClick={handleAddAmenity}
              className="px-4 py-2 bg-[#02BB31] text-white rounded-lg hover:bg-[#0D915C] transition-colors flex items-center"
            >
              <FiPlus className="mr-1" />
              Add
            </button>
          </div>

          {/* Common Amenities Grid */}
          <div>
            <label className="block text-sm font-medium text-[#013E43] mb-2">
              Common Amenities
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {availableAmenities.map(amenity => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => handleAmenityToggle(amenity)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    form.amenities.includes(amenity)
                      ? 'bg-[#02BB31] text-white'
                      : 'bg-[#F0F7F4] text-[#065A57] hover:bg-[#A8D8C1]'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Images Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#A8D8C1]">
          <h2 className="text-lg font-semibold text-[#013E43] mb-4 flex items-center">
            <FiCamera className="mr-2 text-[#02BB31]" />
            Property Images <span className="text-red-500 ml-1">*</span>
          </h2>

          {/* Upload Area */}
          <div className="mb-4">
            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              errors.images ? 'border-red-300 bg-red-50' : 'border-[#A8D8C1] hover:border-[#02BB31]'
            }`}>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={isLoading}
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
                  PNG, JPG, GIF up to 5MB
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

          {/* Image Preview Grid */}
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
                    onClick={() => handleRemoveImage(index)}
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
            onClick={() => navigate("/dashboard/properties")}
            className="px-6 py-3 text-[#065A57] border border-[#A8D8C1] rounded-lg hover:bg-[#F0F7F4] transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              'Create Property'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddProperty