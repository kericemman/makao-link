import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import API from "../../../api/api"
import { 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiCheckCircle,
  FiXCircle,
  FiShield,
  FiArrowLeft
} from "react-icons/fi"
import toast from "react-hot-toast"

function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: ""
  })

  const checkPasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 8) strength += 1
    if (password.match(/[a-z]+/)) strength += 1
    if (password.match(/[A-Z]+/)) strength += 1
    if (password.match(/[0-9]+/)) strength += 1
    if (password.match(/[$@#&!]+/)) strength += 1
    setPasswordStrength(strength)
  }

  const handlePasswordChange = (e) => {
    const value = e.target.value
    setPassword(value)
    checkPasswordStrength(value)
    if (errors.password) setErrors({ ...errors, password: "" })
  }

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value)
    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" })
  }

  const validateForm = () => {
    let valid = true
    const newErrors = { password: "", confirmPassword: "" }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required"
      valid = false
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
      valid = false
    } else if (passwordStrength < 3) {
      newErrors.password = "Password is too weak"
      valid = false
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
      valid = false
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
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

      await API.post(`/auth/reset-password/${token}`, {
        password
      })

      setIsSuccess(true)
      toast.success("Password reset successful! You can now login.", {
        style: {
          background: "#02BB31",
          color: "#fff",
        },
        duration: 3000
      })

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login")
      }, 3000)

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Password reset failed. Please try again.",
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
          <h2 className="text-2xl font-bold text-center mb-6">
            Create a New Password
          </h2>

          {/* Password Tips */}
          <div className="w-full max-w-md space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <FiCheckCircle className="text-[#02BB31] text-xl flex-shrink-0" />
              <p className="text-sm">Choose a strong password you haven't used before</p>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <FiCheckCircle className="text-[#02BB31] text-xl flex-shrink-0" />
              <p className="text-sm">Use at least 8 characters with letters, numbers & symbols</p>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <FiCheckCircle className="text-[#02BB31] text-xl flex-shrink-0" />
              <p className="text-sm">Your password is encrypted and secure</p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-md">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#02BB31]">1,200+</p>
              <p className="text-xs text-[#A8D8C1]">Properties</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#02BB31]">850+</p>
              <p className="text-xs text-[#A8D8C1]">Landlords</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#02BB31]">5k+</p>
              <p className="text-xs text-[#A8D8C1]">Tenants</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Reset Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-white overflow-hidden">
        <div className="w-full max-w-md">
          {/* Mobile Logo (visible only on small screens) */}
          <div className="lg:hidden text-center mb-6">
            
            <h1 className="text-xl font-bold text-[#013E43]">Reset Password</h1>
            <p className="text-sm text-[#065A57]">Create a new password</p>
          </div>

          {/* Form Header (visible only on large screens) */}
          <div className="hidden lg:block mb-5">
            <h2 className="text-2xl font-bold text-[#013E43] mb-1">Create New Password</h2>
            <p className="text-sm text-[#065A57]">Enter your new password below</p>
          </div>

          {!isSuccess ? (
            <>
              {/* Reset Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Password Field */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#013E43] block">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className={`h-4 w-4 ${errors.password ? 'text-red-400' : 'text-[#0D915C]'}`} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
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
                  {password && (
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
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      placeholder="Confirm new password"
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

                {/* Password Requirements */}
                <div className="bg-[#F0F7F4] p-3 rounded-lg">
                  <p className="text-xs font-medium text-[#013E43] mb-2">Password must contain:</p>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="flex items-center space-x-1">
                      {password.length >= 8 ? (
                        <FiCheckCircle className="text-[#02BB31] h-3 w-3" />
                      ) : (
                        <FiXCircle className="text-gray-400 h-3 w-3" />
                      )}
                      <span className="text-xs text-[#065A57]">8+ characters</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {/[A-Z]/.test(password) ? (
                        <FiCheckCircle className="text-[#02BB31] h-3 w-3" />
                      ) : (
                        <FiXCircle className="text-gray-400 h-3 w-3" />
                      )}
                      <span className="text-xs text-[#065A57]">Uppercase</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {/[0-9]/.test(password) ? (
                        <FiCheckCircle className="text-[#02BB31] h-3 w-3" />
                      ) : (
                        <FiXCircle className="text-gray-400 h-3 w-3" />
                      )}
                      <span className="text-xs text-[#065A57]">Number</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {/[$@#&!]/.test(password) ? (
                        <FiCheckCircle className="text-[#02BB31] h-3 w-3" />
                      ) : (
                        <FiXCircle className="text-gray-400 h-3 w-3" />
                      )}
                      <span className="text-xs text-[#065A57]">Special character</span>
                    </div>
                  </div>
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
                        Resetting...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </span>
                </button>
              </form>

              {/* Back to Login Link */}
              <div className="mt-4 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs text-[#02BB31] hover:text-[#0D915C] transition-colors"
                >
                  <FiArrowLeft className="mr-1" />
                  Back to Login
                </Link>
              </div>
            </>
          ) : (
            /* Success Message - FIXED */
            <div className="text-center">
              <div className="w-16 h-16 bg-[#02BB31]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="text-3xl text-[#02BB31]" />
              </div>
              
              <h3 className="text-lg font-semibold text-[#013E43] mb-2">Password Reset Successful!</h3>
              
              <p className="text-sm text-[#065A57] mb-4">
                Your password has been reset successfully. You'll be redirected to the login page.
              </p>

              <div className="bg-[#F0F7F4] p-3 rounded-lg mb-4">
                <p className="text-xs text-[#065A57]">
                  Redirecting in 3 seconds...
                </p>
              </div>

              <Link
                to="/login"
                className="inline-flex items-center text-xs text-[#02BB31] hover:text-[#0D915C] transition-colors"
              >
                <FiArrowLeft className="mr-1" />
                Go to Login Now
              </Link>
            </div>
          )}

          {/* Security Info */}
          <div className="flex items-center justify-center space-x-2 text-xs text-[#065A57] mt-4 p-2 bg-[#F0F7F4] rounded-lg">
            <FiShield className="h-3 w-3 text-[#02BB31]" />
            <span>Your password is encrypted</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword