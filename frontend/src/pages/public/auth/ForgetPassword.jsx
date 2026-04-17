import { useState } from "react"
import { Link } from "react-router-dom"
import API from "../../../api/api"
import { 
  FiMail, 
  FiArrowLeft, 
  FiCheckCircle,
  FiShield,
  FiHome,
  FiUsers,
  FiTrendingUp
} from "react-icons/fi"
import { FaBuilding } from "react-icons/fa"
import toast from "react-hot-toast"

function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState({ email: "" })

  const validateEmail = () => {
    if (!email) {
      setErrors({ email: "Email is required" })
      return false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: "Please enter a valid email" })
      return false
    }
    setErrors({ email: "" })
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateEmail()) return

    try {
      setIsLoading(true)

      await API.post("/auth/forgot-password", { email })

      setIsSubmitted(true)
      toast.success("Reset link sent to your email!", {
        style: {
          background: "#02BB31",
          color: "#fff",
        }
      })

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send reset link. Please try again.",
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
                                        <h1 className="text-4xl font-bold">RendaHomes</h1>
                                        <p className="text-[#A8D8C1] text-lg">Property Management Platform</p>
                                    </div>
                                </div>
                            </div>

                         

                            {/* Trust Indicators */}
                            <div className="w-full max-w-md space-y-3">
                                <div className="flex items-center space-x-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                                    <FiCheckCircle className="text-[#02BB31] text-xl flex-shrink-0" />
                                    <p className="text-sm">We'll send a secure reset link to your email</p>
                                </div>
                                <div className="flex items-center space-x-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                                    <FiCheckCircle className="text-[#02BB31] text-xl flex-shrink-0" />
                                    <p className="text-sm">Link expires in 1 hour for security</p>
                                </div>
                                <div className="flex items-center space-x-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                                    <FiCheckCircle className="text-[#02BB31] text-xl flex-shrink-0" />
                                    <p className="text-sm">No account? Create one in minutes</p>
                                </div>
                            </div>

                            
                        </div>
                    </div>

                    {/* Right Column - Forgot Password Form */}
                    <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-white overflow-hidden">
                        <div className="w-full max-w-md">
                            {/* Mobile Logo (visible only on small screens) */}
                            <div className="lg:hidden text-center mb-6">
                               
                                <h1 className="text-xl font-bold text-[#013E43]">Forgot Password</h1>
                                <p className="text-sm text-[#065A57]">Reset your account password</p>
                            </div>

                            {/* Form Header (visible only on large screens) */}
                            <div className="hidden lg:block mb-5">
                                <h2 className="text-2xl font-bold text-[#013E43] mb-1">Forgot Password</h2>
                                <p className="text-sm text-[#065A57]">Enter your email to reset your password</p>
                            </div>

                            {!isSubmitted ? (
                                <>
                                    {/* Forgot Password Form */}
                                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                                    value={email}
                                                    onChange={(e) => {
                                                        setEmail(e.target.value)
                                                        if (errors.email) setErrors({ email: "" })
                                                    }}
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
                                                        Sending...
                                                    </>
                                                ) : (
                                                    'Send Reset Link'
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
                                // Success Message
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-[#02BB31]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FiCheckCircle className="text-3xl text-[#02BB31]" />
                                    </div>
                                    
                                    <h3 className="text-lg font-semibold text-[#013E43] mb-2">Check Your Email</h3>
                                    
                                    <p className="text-sm text-[#065A57] mb-4">
                                        We've sent a password reset link to:
                                    </p>
                                    
                                    <div className="bg-[#F0F7F4] p-3 rounded-lg mb-4">
                                        <p className="text-sm font-medium text-[#013E43]">{email}</p>
                                    </div>
                                    
                                    <p className="text-xs text-[#065A57] mb-4">
                                        The link will expire in 1 hour. If you don't see the email, check your spam folder.
                                    </p>

                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setIsSubmitted(false)}
                                            className="text-sm text-[#02BB31] hover:text-[#0D915C] transition-colors"
                                        >
                                            Try a different email
                                        </button>
                                        
                                        <div>
                                            <Link
                                                to="/login"
                                                className="inline-flex items-center text-xs text-[#02BB31] hover:text-[#0D915C] transition-colors"
                                            >
                                                <FiArrowLeft className="mr-1" />
                                                Back to Login
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Security Info */}
                            <div className="flex items-center justify-center space-x-2 text-xs text-[#065A57] mt-4 p-2 bg-[#F0F7F4] rounded-lg">
                                <FiShield className="h-3 w-3 text-[#02BB31]" />
                                <span>Your information is secure</span>
                            </div>

                            {/* Register Link */}
                            <p className="text-center text-xs text-[#065A57] mt-4">
                                Don't have an account?{' '}
                                <Link
                                    to="/register"
                                    className="font-semibold text-[#02BB31] hover:text-[#0D915C] transition-colors"
                                >
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            )
        }

        export default ForgotPassword
