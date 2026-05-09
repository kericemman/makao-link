
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginLandlord } from "../../../services/auth.service";
import { useAuth } from "../../../context/AuthContext";
import { 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiLogIn,
  FiHome,
  FiUsers,
  FiShield,
  FiCheckCircle,
  FiArrowRight
} from "react-icons/fi";
import { FaBuilding, FaKey, FaHandshake } from "react-icons/fa";
import toast from "react-hot-toast";

const LoginPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await loginLandlord(formData);
      login(data);

      toast.success("Login successful! Redirecting...", {
        style: {
          background: "#02BB31",
          color: "#fff",
        },
        duration: 2000
      });

      if (data.user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/landlord/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      toast.error(err.response?.data?.message || "Login failed", {
        style: {
          background: "#013E43",
          color: "#fff",
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: FiHome, text: "Verified Properties" },
    { icon: FiUsers, text: "Happy Landlords" },
    { icon: FiShield, text: "100% Secure Platform" },
    { icon: FaHandshake, text: "Direct Landlord Contact" }
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#F0F7F4] to-white">
      {/* Left Column - Branding & Content */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#013E43] to-[#005C57]">
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

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          {/* Logo */}
          {/* <div className="mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-2xl flex items-center justify-center">
                <img src="/assets/logo.png" alt="Renda Homes Logo" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Renda Homes</h1>
                <p className="text-[#A8D8C1] text-lg">Connecting You to Your Perfect Home</p>
              </div>
            </div>
          </div> */}

          {/* Tagline */}
          <h2 className="text-3xl font-bold text-center mb-6">
            Welcome Back!
          </h2>
          <p className="text-center text-[#A8D8C1] mb-8 max-w-md">
            Sign in to manage your properties, connect with tenants, and grow your rental business.
          </p>

          {/* Features */}
          <div className="space-y-4 w-full max-w-md">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-center space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <div className="p-2 bg-[#02BB31]/20 rounded-lg">
                    <Icon className="text-[#02BB31] text-xl" />
                  </div>
                  <span className="text-sm">{feature.text}</span>
                </div>
              );
            })}
          </div>

          {/* Testimonial */}
          
          
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo (visible only on small screens) */}
          <div className="lg:hidden text-center mb-8">
            
            <h1 className="text-xl md:text-2xl font-bold text-[#013E43]">Welcome Back</h1>
            <p className="text-[#065A57]">Sign in to continue</p>
          </div>

          {/* Form Header */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-3xl font-bold text-[#013E43] mb-2">Welcome Back</h2>
            <p className="text-[#065A57]">Please sign in to your account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#013E43]">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className={`h-5 w-5 ${errors.email ? 'text-red-400' : 'text-[#0D915C]'}`} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-all ${
                    errors.email 
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31] bg-white'
                  }`}
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#013E43]">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className={`h-5 w-5 ${errors.password ? 'text-red-400' : 'text-[#0D915C]'}`} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-12 py-3 rounded-lg border-2 outline-none transition-all ${
                    errors.password 
                      ? 'border-red-400 focus:border-red-500 bg-red-50' 
                      : 'border-[#A8D8C1] focus:border-[#02BB31] bg-white'
                  }`}
                  disabled={loading}
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

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <FiShield className="text-red-500" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative overflow-hidden group bg-gradient-to-r from-[#013E43] to-[#005C57] text-white py-3 rounded-lg font-semibold text-lg transition-all transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#02BB31] to-[#0D915C] opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <span className="relative flex items-center justify-center">
                {loading ? (
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
              to="/pricing"
              className="font-semibold text-[#02BB31] hover:text-[#0D915C] transition-colors"
            >
              Create an account
            </Link>
          </p>

          {/* Security Badge */}
          <div className="flex items-center justify-center space-x-2 text-xs text-[#065A57] mt-4 p-2 bg-[#F0F7F4] rounded-lg">
            <FiShield className="h-3 w-3 text-[#02BB31]" />
            <span>256-bit SSL Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;