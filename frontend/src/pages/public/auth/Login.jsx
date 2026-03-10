import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import API from "../../../api/api"
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn } from "react-icons/fi"
import { FaBuilding } from "react-icons/fa"
import toast from "react-hot-toast"

function Login() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: "",
    password: ""
  })

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({
    email: "",
    password: ""
  })

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

  const validateForm = () => {
    let valid = true
    const newErrors = { email: "", password: "" }

    if (!form.email) {
      newErrors.email = "Email is required"
      valid = false
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Please enter a valid email"
      valid = false
    }

    if (!form.password) {
      newErrors.password = "Password is required"
      valid = false
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setIsLoading(true)

      const res = await API.post("/auth/login", form)

      // Store token
      localStorage.setItem("token", res.data.token)
      
      // Store user data if needed
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user))
      }

      // Show success toast
      toast.success("Login successful! Redirecting...", {
        style: {
          background: "#02BB31",
          color: "#fff",
        },
        duration: 2000
      })

      // Redirect based on user role
      setTimeout(() => {
        if (res.data.user?.role === "admin") {
          navigate("/admin")
        } else if (res.data.user?.role === "landlord") {
          navigate("/dashboard")
        } else {
          navigate("/")
        }
      }, 1500)

    } catch (error) {
      // Show error toast
      toast.error(
        error.response?.data?.message || "Login failed. Please check your credentials.",
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#013E43] to-[#005C57] p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#02BB31] rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#A8D8C1] rounded-full opacity-20 blur-3xl animate-pulse delay-1000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }}></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 hidden lg:block animate-float">
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20">
          <div className="flex items-center space-x-2">
            <FaBuilding className="text-[#02BB31] text-xl" />
            <span className="text-white text-sm">MakaoLink</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-20 right-10 hidden lg:block animate-float-delayed">
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20">
          <div className="flex items-center space-x-2">
            <FiLogIn className="text-[#02BB31] text-xl" />
            <span className="text-white text-sm">Welcome Back!</span>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
         
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-[#A8D8C1]">Sign in to continue to your dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-[#A8D8C1]/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#013E43] block">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className={`h-5 w-5 ${errors.email ? 'text-red-400' : 'text-[#0D915C]'}`} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={`
                    w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all
                    ${errors.email 
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31] bg-white'
                    }
                  `}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#013E43] block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className={`h-5 w-5 ${errors.password ? 'text-red-400' : 'text-[#0D915C]'}`} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`
                    w-full pl-10 pr-12 py-3 rounded-lg border-2 outline-none transition-all
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
                    <FiEyeOff className="h-5 w-5 text-[#0D915C] hover:text-[#02BB31] transition-colors" />
                  ) : (
                    <FiEye className="h-5 w-5 text-[#0D915C] hover:text-[#02BB31] transition-colors" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-[#A8D8C1] text-[#02BB31] focus:ring-[#02BB31]"
                />
                <span className="text-sm text-[#065A57]">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-[#0D915C] hover:text-[#02BB31] transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative overflow-hidden group bg-gradient-to-r from-[#013E43] to-[#005C57] text-white py-3 rounded-lg font-semibold text-lg transition-all transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#02BB31] to-[#0D915C] opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <span className="relative flex items-center justify-center">
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <FiLogIn className="mr-2" />
                    Sign In
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center text-sm text-[#065A57] mt-6">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-[#02BB31] hover:text-[#0D915C] transition-colors"
            >
              Create an account
            </Link>
          </p>

        

          {/* Security Badge */}
          <div className="flex items-center justify-center space-x-2 text-xs text-[#065A57] mt-4">
            <span className="w-2 h-2 bg-[#02BB31] rounded-full"></span>
            <span>256-bit SSL Encrypted</span>
            <span className="w-2 h-2 bg-[#02BB31] rounded-full"></span>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 8s ease-in-out infinite;
          animation-delay: 2s;
        }
      `}</style>
    </div>
  )
}

export default Login