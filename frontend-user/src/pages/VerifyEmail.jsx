import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { resendEmailOtp } from "../services/auth.service";
import { getApiErrorMessage } from "../utils/apiError";

export default function VerifyEmail() {
  const { verifyEmail } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email = params.get("email") || "";
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await verifyEmail({ email, otp });
      navigate("/", { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not verify your email."));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError("");
    setMessage("");
    try {
      const data = await resendEmailOtp(email);
      setMessage(data.message || "A new code has been sent.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not resend code."));
    }
  };

  return (
    <section className="rounded-[2rem] border border-[#A8D8C1] bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">Verify email</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#013E43]">Enter the 6-digit code sent to your email.</h1>
      <p className="mt-3 text-sm font-semibold text-[#065A57]">{email || "Your email address"}</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <input
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
          className="w-full rounded-2xl border border-[#A8D8C1] bg-[#F0F7F4] px-5 py-4 text-center text-2xl font-extrabold tracking-[0.5em] outline-none focus:border-[#02BB31]"
          placeholder="000000"
          required
        />
        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
        {message ? <p className="flex items-center gap-2 rounded-2xl bg-[#F0F7F4] px-4 py-3 text-sm font-semibold text-[#065A57]"><FiCheckCircle /> {message}</p> : null}
        <button disabled={loading || otp.length !== 6} className="w-full rounded-2xl bg-[#013E43] px-5 py-4 text-sm font-extrabold text-white disabled:opacity-70">
          {loading ? "Verifying..." : "Verify and continue"}
        </button>
      </form>
      <button onClick={resend} className="mt-4 text-sm font-extrabold text-[#065A57] hover:text-[#013E43]">Resend code</button>
      <p className="mt-5 text-sm font-bold text-[#065A57]">
        Wrong email? <Link to="/signup" className="text-[#013E43]">Create account again</Link>
      </p>
    </section>
  );
}
