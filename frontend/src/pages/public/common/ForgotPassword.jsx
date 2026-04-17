import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../../services/auth.service";
import { 
  FiMail, 
  FiArrowLeft, 
  FiCheckCircle, 
  FiAlertCircle,
  FiShield,
  FiHome,
  FiUsers,
  FiTrendingUp,
  FiLock
} from "react-icons/fi";
import { FaBuilding, FaKey } from "react-icons/fa";
import toast from "react-hot-toast";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address", {
        style: { background: "#013E43", color: "#fff" }
      });
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const data = await forgotPassword({ email });
      setMessage(data.message);
      setIsSubmitted(true);
      
      toast.success("Reset link sent to your email!", {
        style: {
          background: "#02BB31",
          color: "#fff",
        }
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset email");
      toast.error(err.response?.data?.message || "Failed to send reset email", {
        style: { background: "#013E43", color: "#fff" }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#013E43] to-[#005C57]">
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

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-12 text-white">
          

          {/* Tagline */}
          <h2 className="text-3xl font-bold text-center mb-6">
            Reset Your Password
          </h2>

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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo (visible only on small screens) */}
          <div className="lg:hidden text-center mb-8">
            
            <h1 className="text-2xl font-bold text-[#013E43]">Forgot Password</h1>
            <p className="text-sm text-[#065A57]">Reset your account password</p>
          </div>

          {/* Form Header (visible only on large screens) */}
          <div className="hidden lg:block mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <FiLock className="text-[#02BB31] text-xl" />
              <h2 className="text-2xl font-bold text-[#013E43]">Forgot Password</h2>
            </div>
            <p className="text-sm text-[#065A57]">Enter your email to reset your password</p>
          </div>

          {!isSubmitted ? (
            <>
              {/* Forgot Password Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-[#013E43] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-[#0D915C]" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full pl-10 pr-4 py-3 border-2 border-[#A8D8C1] rounded-lg focus:border-[#02BB31] outline-none transition-colors"
                    />
                  </div>
                  <p className="text-xs text-[#065A57] mt-1">
                    We'll send a password reset link to this email
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 p-3 rounded-lg text-sm text-red-600 flex items-center gap-2 border border-red-200">
                    <FiAlertCircle className="text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-[#02BB31] to-[#0D915C] text-white rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              {/* Back to Login Link */}
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm text-[#02BB31] hover:text-[#0D915C] transition-colors"
                >
                  <FiArrowLeft className="mr-1" />
                  Back to Login
                </Link>
              </div>
            </>
          ) : (
            /* Success Message */
            <div className="text-center">
              <div className="w-16 h-16 bg-[#02BB31]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="text-3xl text-[#02BB31]" />
              </div>
              
              <h3 className="text-xl font-semibold text-[#013E43] mb-2">Check Your Email</h3>
              
              <p className="text-sm text-[#065A57] mb-4">
                We've sent a password reset link to:
              </p>
              
              <div className="bg-[#F0F7F4] p-3 rounded-lg mb-4">
                <p className="text-sm font-medium text-[#013E43] break-all">{email}</p>
              </div>
              
              <p className="text-xs text-[#065A57] mb-6">
                The link will expire in 1 hour. If you don't see the email, check your spam folder.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail("");
                  }}
                  className="text-sm text-[#02BB31] hover:text-[#0D915C] transition-colors"
                >
                  Use a different email
                </button>
                
                <div>
                  <Link
                    to="/login"
                    className="inline-flex items-center text-sm text-[#02BB31] hover:text-[#0D915C] transition-colors"
                  >
                    <FiArrowLeft className="mr-1" />
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Security Info */}
          <div className="flex items-center justify-center space-x-2 text-xs text-[#065A57] mt-6 p-3 bg-[#F0F7F4] rounded-lg">
            <FiShield className="h-3 w-3 text-[#02BB31]" />
            <span>Your information is secure</span>
          </div>

          {/* Register Link */}
          <p className="text-center text-xs text-[#065A57] mt-4">
            Don't have an account?{' '}
            <Link
              to="/pricing"
              className="font-semibold text-[#02BB31] hover:text-[#0D915C] transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;