import { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { registerLandlord } from "../../../services/auth.service";
import { initializeSubscriptionPayment } from "../../../services/payment.service";
import { useAuth } from "../../../context/AuthContext";
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiLock, 
  FiEye, 
  FiEyeOff,
  FiCheckCircle,
  FiShield,
  FiArrowLeft,
  FiCreditCard,
  FiAlertCircle,
  FiUserPlus
} from "react-icons/fi";
import { FaBuilding, FaKey, FaHandshake } from "react-icons/fa";
import toast from "react-hot-toast";

const RegisterLandlordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const selectedPlan = useMemo(() => searchParams.get("plan") || "normal", [searchParams]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    plan: selectedPlan,
    agreeTerms: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const getPlanDetails = (plan) => {
    const plans = {
      normal: { name: "Normal", price: "Free", limit: "1 property", color: "text-gray-600", bgColor: "bg-gray-100" },
      basic: { name: "Basic", price: "KES 500", limit: "5 properties", color: "text-[#02BB31]", bgColor: "bg-[#02BB31]/10" },
      premium: { name: "Premium", price: "KES 1,500", limit: "15 properties", color: "text-purple-600", bgColor: "bg-purple-100" },
      pro: { name: "Pro", price: "KES 2,500", limit: "100+ properties", color: "text-[#013E43]", bgColor: "bg-[#013E43]/10" }
    };
    return plans[plan] || plans.normal;
  };

  const planDetails = getPlanDetails(selectedPlan);

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.match(/[a-z]+/)) strength += 1;
    if (password.match(/[A-Z]+/)) strength += 1;
    if (password.match(/[0-9]+/)) strength += 1;
    if (password.match(/[$@#&!]+/)) strength += 1;
    setPasswordStrength(strength);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }

    if (name === "password") {
      checkPasswordStrength(value);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Full name is required";
    else if (formData.name.trim().length < 2) newErrors.name = "Name must be at least 2 characters";

    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Please enter a valid email";

    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^(07|01)\d{8}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid Kenyan phone number";
    }

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    else if (passwordStrength < 3) newErrors.password = "Password is too weak";

    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    if (!formData.agreeTerms) newErrors.agreeTerms = "You must agree to the terms and conditions";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
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

      const data = await registerLandlord({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        plan: selectedPlan
      });

      login(data);

      toast.success("Account created successfully!", {
        style: { background: "#02BB31", color: "#fff" }
      });

      if (selectedPlan === "normal") {
        navigate("/landlord/dashboard");
        return;
      }

      const payment = await initializeSubscriptionPayment();
      window.location.href = payment.authorization_url;
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      toast.error(err.response?.data?.message || "Registration failed", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    const colors = {
      0: "bg-gray-200",
      1: "bg-red-500",
      2: "bg-orange-500",
      3: "bg-yellow-500",
      4: "bg-[#02BB31]",
      5: "bg-[#0D915C]",
    };
    return colors[passwordStrength] || colors[0];
  };

  const getStrengthText = () => {
    const texts = {
      0: "Very Weak",
      1: "Weak",
      2: "Fair",
      3: "Good",
      4: "Strong",
      5: "Very Strong",
    };
    return texts[passwordStrength] || texts[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F7F4] to-white">
      <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
        {/* Back Button */}
        <Link
          to="/pricing"
          className="inline-flex items-center text-[#065A57] hover:text-[#013E43] transition-colors mb-6"
        >
          <FiArrowLeft className="mr-2" />
          Back to Plans
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Plan Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-[#A8D8C1] p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-3 ${planDetails.bgColor} rounded-xl`}>
                  <FiCreditCard className={`text-2xl ${planDetails.color}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#013E43]">Selected Plan</h2>
                  <p className="text-sm text-[#065A57]">Your subscription details</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-[#A8D8C1]">
                  <span className="text-[#065A57]">Plan Name</span>
                  <span className="font-semibold text-[#013E43] capitalize">{planDetails.name}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-[#A8D8C1]">
                  <span className="text-[#065A57]">Price</span>
                  <span className="font-bold text-[#02BB31]">{planDetails.price}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#065A57]">Properties Limit</span>
                  <span className="font-semibold text-[#013E43]">{planDetails.limit}</span>
                </div>
              </div>

              {selectedPlan !== "normal" && (
                <div className="mt-4 p-3 bg-[#F0F7F4] rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FiCheckCircle className="text-[#02BB31]" />
                    <p className="text-xs text-[#065A57]">
                      You'll be redirected to complete payment after registration
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Benefits */}
            <div className="bg-white rounded-2xl shadow-xl border border-[#A8D8C1] p-6">
              <h3 className="font-semibold text-[#013E43] mb-3">What's included:</h3>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <FiCheckCircle className="text-[#02BB31]" />
                  <span className="text-sm text-[#065A57]">List {planDetails.limit.toLowerCase()}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <FiCheckCircle className="text-[#02BB31]" />
                  <span className="text-sm text-[#065A57]">Direct tenant contact</span>
                </li>
                <li className="flex items-center space-x-2">
                  <FiCheckCircle className="text-[#02BB31]" />
                  <span className="text-sm text-[#065A57]">Property analytics dashboard</span>
                </li>
                <li className="flex items-center space-x-2">
                  <FiCheckCircle className="text-[#02BB31]" />
                  <span className="text-sm text-[#065A57]">24/7 support</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Registration Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-[#A8D8C1] p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#013E43]">Create Account</h1>
              <p className="text-sm text-[#065A57] mt-1">
                Join MakaoLink as a landlord
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-[#013E43] mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                      errors.name
                        ? 'border-red-400 focus:border-red-500 bg-red-50'
                        : 'border-[#A8D8C1] focus:border-[#02BB31]'
                    }`}
                  />
                </div>
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[#013E43] mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                      errors.email
                        ? 'border-red-400 focus:border-red-500 bg-red-50'
                        : 'border-[#A8D8C1] focus:border-[#02BB31]'
                    }`}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-[#013E43] mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="0712345678"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                      errors.phone
                        ? 'border-red-400 focus:border-red-500 bg-red-50'
                        : 'border-[#A8D8C1] focus:border-[#02BB31]'
                    }`}
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-[#013E43] mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-12 py-3 border-2 rounded-lg outline-none transition-colors ${
                      errors.password
                        ? 'border-red-400 focus:border-red-500 bg-red-50'
                        : 'border-[#A8D8C1] focus:border-[#02BB31]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? (
                      <FiEyeOff className="text-[#0D915C] hover:text-[#02BB31]" />
                    ) : (
                      <FiEye className="text-[#0D915C] hover:text-[#02BB31]" />
                    )}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-[#065A57]">Password Strength</span>
                      <span className="text-xs font-medium text-[#013E43]">{getStrengthText()}</span>
                    </div>
                    <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getStrengthColor()} transition-all duration-300`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-[#013E43] mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#0D915C]" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-12 py-3 border-2 rounded-lg outline-none transition-colors ${
                      errors.confirmPassword
                        ? 'border-red-400 focus:border-red-500 bg-red-50'
                        : 'border-[#A8D8C1] focus:border-[#02BB31]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff className="text-[#0D915C] hover:text-[#02BB31]" />
                    ) : (
                      <FiEye className="text-[#0D915C] hover:text-[#02BB31]" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Terms Agreement */}
              <div className="space-y-2">
                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    className="mt-0.5 w-4 h-4 rounded border-[#A8D8C1] text-[#02BB31] focus:ring-[#02BB31]"
                  />
                  <span className="text-sm text-[#065A57]">
                    I agree to the{' '}
                    <Link to="/terms" className="font-semibold text-[#02BB31] hover:text-[#0D915C]">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="font-semibold text-[#02BB31] hover:text-[#0D915C]">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.agreeTerms && <p className="text-xs text-red-500">{errors.agreeTerms}</p>}
              </div>

              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <FiAlertCircle className="text-red-500" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <FiUserPlus className="mr-2" />
                    Create Account
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <p className="text-center text-sm text-[#065A57] mt-4">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[#02BB31] hover:text-[#0D915C]">
                Sign in
              </Link>
            </p>

            {/* Security Badge */}
            <div className="flex items-center justify-center space-x-2 text-xs text-[#065A57] mt-4 p-2 bg-[#F0F7F4] rounded-lg">
              <FiShield className="h-3 w-3 text-[#02BB31]" />
              <span>Your information is protected by 256-bit SSL encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterLandlordPage;