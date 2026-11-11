import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiCheckCircle, FiMail } from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { resendEmailOtp, verifyEmail } from "../../services/auth.service";

export default function VerifyLandlordEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login, refreshAuth } = useAuth();
  const email = params.get("email") || "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await verifyEmail({ email, otp });
      login(data);
      await refreshAuth();

      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "conversion", { send_to: "AW-18171252157/BjG5CJmRma8cEL2b3dhD" });
      }

      if (data.subscription && data.subscription.plan !== "normal" && data.subscription.status === "pending_payment") {
        navigate(`/subscription/checkout/${encodeURIComponent(data.subscription.pendingPlan || data.subscription.plan)}`, { replace: true });
        return;
      }

      navigate(getSafeNext(params.get("next")), { replace: true });
    } catch (verificationError) {
      setError(verificationError.response?.data?.message || "We could not verify your email. Check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError("");
    setMessage("");
    try {
      const data = await resendEmailOtp(email);
      setMessage(data.message || "A new verification code has been sent.");
    } catch (resendError) {
      setError(resendError.response?.data?.message || "We could not resend the code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[75vh] max-w-lg items-center px-4 py-10">
      <section className="w-full border border-[#A8D8C1] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-5 grid h-11 w-11 place-items-center rounded-full bg-[#F0F7F4] text-xl text-[#0D915C]"><FiMail /></div>
        <p className="text-sm font-bold text-[#0D915C]">Email verification</p>
        <h1 className="mt-2 text-2xl font-bold text-[#013E43]">Verify your email to continue</h1>
        <p className="mt-2 break-all text-sm leading-6 text-[#49645F]">Enter the 6-digit code we sent to <strong className="text-[#013E43]">{email || "your email address"}</strong>.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label htmlFor="email-otp" className="sr-only">6-digit verification code</label>
          <input
            id="email-otp"
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            required
            className="min-h-14 w-full border border-[#A8D8C1] bg-[#F0F7F4] px-4 text-center text-2xl font-bold tracking-[0.35em] text-[#013E43] outline-none focus:border-[#0D915C]"
          />
          {error && <p role="alert" className="bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="flex items-center gap-2 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"><FiCheckCircle />{message}</p>}
          <button disabled={loading || otp.length !== 6} className="min-h-12 w-full bg-[#013E43] px-4 text-sm font-semibold text-white disabled:opacity-60">
            {loading ? "Verifying..." : "Verify and continue"}
          </button>
        </form>
        <button type="button" disabled={resending || !email} onClick={resend} className="mt-4 text-sm font-semibold text-[#0D915C] underline disabled:opacity-60">
          {resending ? "Sending..." : "Resend code"}
        </button>
        <p className="mt-6 text-sm text-[#49645F]">Wrong email? <Link className="font-semibold text-[#013E43] underline" to={`/register?plan=${encodeURIComponent(params.get("plan") || "normal")}&next=${encodeURIComponent(getSafeNext(params.get("next")))}`}>Go back to registration</Link></p>
      </section>
    </main>
  );
}

function getSafeNext(next) {
  if (!next || typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  if (["/login", "/register", "/forgot-password", "/verify-email"].includes(next)) return "/dashboard";
  return next;
}
