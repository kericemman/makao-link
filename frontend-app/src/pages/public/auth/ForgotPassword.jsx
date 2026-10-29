import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiMail } from "react-icons/fi";
import { forgotPassword } from "../../../services/auth.service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await forgotPassword({ email: email.trim() });
      setMessage(response.message || "If an account exists, a reset link has been sent.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We could not send the reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F3F7F4] px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-[#DCE8E1] bg-white p-6 sm:p-8">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-[#42635A] hover:text-[#0D684C]">
          <FiArrowLeft aria-hidden="true" /> Back to sign in
        </Link>
        <div className="mt-8 flex h-11 w-11 items-center justify-center rounded-lg bg-[#E8F3EC] text-[#0D684C]">
          <FiMail size={20} aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-[#183B32]">Forgot your password?</h1>
        <p className="mt-2 text-sm leading-6 text-[#61756C]">Enter the email address on your admin account and we’ll send you a reset link.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label htmlFor="reset-email" className="block text-sm font-medium text-[#29483E]">Email address</label>
          <input
            id="reset-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            className="w-full rounded-lg border border-[#CFDDD4] px-3.5 py-3 text-sm text-[#183B32] outline-none focus:border-[#0D915C] focus:ring-2 focus:ring-[#0D915C]/15"
          />
          {message && <p role="status" className="flex gap-2 rounded-lg bg-[#EAF5ED] p-3 text-sm text-[#17613D]"><FiCheckCircle className="mt-0.5 shrink-0" />{message}</p>}
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={loading} className="w-full rounded-lg bg-[#0D684C] px-4 py-3 text-sm font-semibold text-white hover:bg-[#09573E] disabled:cursor-wait disabled:opacity-60">
            {loading ? "Sending link..." : "Send reset link"}
          </button>
        </form>
      </section>
    </main>
  );
}
