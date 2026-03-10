import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import API from "../../../api/api"
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiLock, 
  FiEye, 
  FiEyeOff,
  FiCheckCircle,
  FiXCircle,
  FiShield,
  FiUserPlus,
  FiHome,
  FiTrendingUp,
  FiStar
} from "react-icons/fi"
import { FaBuilding, FaKey, FaHandshake } from "react-icons/fa"
import toast from "react-hot-toast"

function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: ""
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    })
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }

    // Check password strength when password changes
    if (name === "password") {
      checkPasswordStrength(value)
    }
  }

  const checkPasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 8) strength += 1
    if (password.match(/[a-z]+/)) strength += 1
    if (password.match(/[A-Z]+/)) strength += 1
    if (password.match(/[0-9]+/)) strength += 1
    if (password.match(/[$@#&!]+/)) strength += 1
    setPasswordStrength(strength)
  }

  const validateForm = () => {
    let valid = true
    const newErrors = {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      agreeTerms: ""
    }

    // Name validation
    if (!form.name.trim()) {
      newErrors.name = "Full name is required"
      valid = false
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters"
      valid = false
    }

    // Email validation
    if (!form.email) {
      newErrors.email = "Email is required"
      valid = false
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Please enter a valid email"
      valid = false
    }

    // Phone validation (Kenyan format)
    if (!form.phone) {
      newErrors.phone = "Phone number is required"
      valid = false
    } else if (!/^(07|01)\d{8}$/.test(form.phone)) {
      newErrors.phone = "Please enter a valid Kenyan phone number"
      valid = false
    }

    // Password validation
    if (!form.password) {
      newErrors.password = "Password is required"
      valid = false
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
      valid = false
    } else if (passwordStrength < 3) {
      newErrors.password = "Password is too weak"
      valid = false
    }

    // Confirm password validation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
      valid = false
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
      valid = false
    }

    // Terms agreement
    if (!form.agreeTerms) {
      newErrors.agreeTerms = "You must agree to the terms and conditions"
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fix the errors in the form", {
        style: { background: "#013E43", color: "#fff" }
      })
      return
    }

    try {
      setIsLoading(true)

      // Remove confirmPassword and agreeTerms before sending
      const { confirmPassword, agreeTerms, ...registrationData } = form

      await API.post("/auth/register", registrationData)

      toast.success("Registration successful! Please login to continue.", {
        style: {
          background: "#02BB31",
          color: "#fff",
        },
        duration: 3000
      })

      // Redirect to login after successful registration
      setTimeout(() => {
        navigate("/login")
      }, 2000)

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Registration failed. Please try again.",
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

  // Password strength indicator
  const getStrengthColor = () => {
    const colors = {
      0: "bg-gray-200",
      1: "bg-red-500",
      2: "bg-orange-500",
      3: "bg-yellow-500",
      4: "bg-[#02BB31]",
      5: "bg-[#0D915C]",
    }
    return colors[passwordStrength] || colors[0]
  }

  const getStrengthText = () => {
    const texts = {
      0: "Very Weak",
      1: "Weak",
      2: "Fair",
      3: "Good",
      4: "Strong",
      5: "Very Strong",
    }
    return texts[passwordStrength] || texts[0]
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-[#013E43] to-[#005C57] overflow-hidden">
      {/* Left Column - Branding & Content */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#02BB31] opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#A8D8C1] opacity-10 rounded-full blur-3xl"></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}></div>
        </div>

        {/* Content - Centered vertically */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-12 text-white">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center space-x-3">
              
              <div>
                <h1 className="text-4xl font-bold">MakaoLink</h1>
                <p className="text-[#A8D8C1] text-lg">Property Management Platform</p>
              </div>
            </div>
          </div>

          {/* Tagline */}
          <h2 className="text-xl font-bold text-center mb-6">
            Join Kenya's Fastest Growing Property Platform
          </h2>

          {/* Single Combined Features Card */}
          <div className="w-full max-w-md bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-[#02BB31]/20 rounded-lg">
                <FiStar className="text-[#02BB31] text-xl" />
              </div>
              <h3 className="text-lg font-semibold">Why Join MakaoLink?</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <FiCheckCircle className="text-[#02BB31] flex-shrink-0" />
                <span className="text-sm">Reach 1000s of tenants</span>
              </div>
              <div className="flex items-center space-x-2">
                <FiCheckCircle className="text-[#02BB31] flex-shrink-0" />
                <span className="text-sm">Verified profile</span>
              </div>
              <div className="flex items-center space-x-2">
                <FiCheckCircle className="text-[#02BB31] flex-shrink-0" />
                <span className="text-sm">Direct communication</span>
              </div>
              <div className="flex items-center space-x-2">
                <FiCheckCircle className="text-[#02BB31] flex-shrink-0" />
                <span className="text-sm">Unlimited listings</span>
              </div>
              <div className="flex items-center space-x-2">
                <FiCheckCircle className="text-[#02BB31] flex-shrink-0" />
                <span className="text-sm">Analytics dashboard</span>
              </div>
              <div className="flex items-center space-x-2">
                <FiCheckCircle className="text-[#02BB31] flex-shrink-0" />
                <span className="text-sm">24/7 support</span>
              </div>
            </div>
          </div>

          
        </div>
      </div>

      {/* Right Column - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-white overflow-hidden">
        <div className="w-full max-w-md">
          {/* Mobile Logo (visible only on small screens) */}
          <div className="lg:hidden text-center mb-6">
            
            <h1 className="text-xl font-bold text-[#013E43]">Create Account</h1>
            <p className="text-sm text-[#065A57]">Join as a landlord</p>
          </div>

          {/* Form Header (visible only on large screens) */}
          <div className="hidden lg:block mb-5">
            <h2 className="text-2xl font-bold text-[#013E43] mb-1">Create Account</h2>
            <p className="text-sm text-[#065A57]">Fill in your details to get started</p>
          </div>

          {/* Register Form - Compact spacing */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Full Name Field */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#013E43] block">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className={`h-4 w-4 ${errors.name ? 'text-red-400' : 'text-[#0D915C]'}`} />
                </div>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={`
                    w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border-2 outline-none transition-all
                    ${errors.name 
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31] bg-white'
                    }
                  `}
                  disabled={isLoading}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#013E43] block">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className={`h-4 w-4 ${errors.email ? 'text-red-400' : 'text-[#0D915C]'}`} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={`
                    w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border-2 outline-none transition-all
                    ${errors.email 
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31] bg-white'
                    }
                  `}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>
              )}
            </div>

            {/* Phone Field */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#013E43] block">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiPhone className={`h-4 w-4 ${errors.phone ? 'text-red-400' : 'text-[#0D915C]'}`} />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="e.g., 0712345678"
                  className={`
                    w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border-2 outline-none transition-all
                    ${errors.phone 
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31] bg-white'
                    }
                  `}
                  disabled={isLoading}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-500 mt-0.5">{errors.phone}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#013E43] block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className={`h-4 w-4 ${errors.password ? 'text-red-400' : 'text-[#0D915C]'}`} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className={`
                    w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border-2 outline-none transition-all
                    ${errors.password 
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31] bg-white'
                    }
                  `}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <FiEyeOff className="h-4 w-4 text-[#0D915C] hover:text-[#02BB31] transition-colors" />
                  ) : (
                    <FiEye className="h-4 w-4 text-[#0D915C] hover:text-[#02BB31] transition-colors" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {form.password && (
                <div className="mt-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-[#065A57]">Password Strength</span>
                    <span className="text-xs font-medium text-[#013E43]">
                      {getStrengthText()}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getStrengthColor()} transition-all duration-300`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
              {errors.password && (
                <p className="text-xs text-red-500 mt-0.5">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#013E43] block">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className={`h-4 w-4 ${errors.confirmPassword ? 'text-red-400' : 'text-[#0D915C]'}`} />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={`
                    w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border-2 outline-none transition-all
                    ${errors.confirmPassword 
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31] bg-white'
                    }
                  `}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="h-4 w-4 text-[#0D915C] hover:text-[#02BB31] transition-colors" />
                  ) : (
                    <FiEye className="h-4 w-4 text-[#0D915C] hover:text-[#02BB31] transition-colors" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-0.5">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-1">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={form.agreeTerms}
                  onChange={handleChange}
                  className="mt-0.5 w-3.5 h-3.5 rounded border-[#A8D8C1] text-[#02BB31] focus:ring-[#02BB31]"
                />
                <span className="text-xs text-[#065A57]">
                  I agree to the{' '}
                  <Link
                    to="/terms"
                    className="font-semibold text-[#02BB31] hover:text-[#0D915C]"
                  >
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link
                    to="/privacy"
                    className="font-semibold text-[#02BB31] hover:text-[#0D915C]"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="text-xs text-red-500">{errors.agreeTerms}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative overflow-hidden group bg-gradient-to-r from-[#013E43] to-[#005C57] text-white py-2.5 rounded-lg font-semibold text-sm transition-all transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#02BB31] to-[#0D915C] opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <span className="relative flex items-center justify-center">
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <FiUserPlus className="mr-2" />
                    Create Account
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-xs text-[#065A57] mt-4">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-[#02BB31] hover:text-[#0D915C] transition-colors"
            >
              Sign in
            </Link>
          </p>

          {/* Security Info */}
          <div className="flex items-center justify-center space-x-2 text-xs text-[#065A57] mt-4 p-2 bg-[#F0F7F4] rounded-lg">
            <FiShield className="h-3 w-3 text-[#02BB31]" />
            <span>256-bit SSL encryption</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register