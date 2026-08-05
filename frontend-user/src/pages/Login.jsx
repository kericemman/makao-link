import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../utils/apiError";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await login(form);
      const fallbackPath = data.user?.role === "agent" ? "/agent/dashboard" : "/";
      navigate(params.get("next") || fallbackPath, { replace: true });
    } catch (err) {
      const data = err?.response?.data;
      if (data?.requiresVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(data.email || form.email)}`);
        return;
      }
      setError(getApiErrorMessage(err, "Could not sign in."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-[#A8D8C1] bg-white/95 p-6 shadow-[0_24px_70px_rgba(22,33,31,0.08)] backdrop-blur sm:p-8">
      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">Welcome back</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#013E43]">Sign in to manage your home search.</h1>
      <p className="mt-3 text-sm font-semibold leading-6 text-[#065A57]">Continue to your inquiries, saved homes, support tickets, and viewing plans.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Input icon={FiMail} label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={(email) => setForm((f) => ({ ...f, email }))} />
        <Input
          icon={FiLock}
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={form.password}
          onChange={(password) => setForm((f) => ({ ...f, password }))}
          trailing={
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-[#065A57] transition hover:text-[#013E43]" aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          }
        />
        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#013E43] px-5 py-4 text-sm font-extrabold text-white disabled:opacity-70">
          {loading ? "Signing in..." : "Sign in"}
          <FiArrowRight />
        </button>
      </form>
      <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm font-bold text-[#065A57]">
        <Link to="/signup" className="hover:text-[#013E43]">Create account</Link>
        <Link to="/forgot-password" className="hover:text-[#013E43]">Forgot password?</Link>
      </div>
    </section>
  );
}

function Input({ icon: Icon, label, value, onChange, trailing, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-[0.14em] text-[#065A57]">{label}</span>
      <div className="flex items-center rounded-2xl border border-[#A8D8C1] bg-[#F0F7F4] px-4 py-3 transition focus-within:border-[#02BB31] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(2,187,49,0.08)]">
        <Icon className="text-[#02BB31]" />
        <input {...props} required value={value} onChange={(e) => onChange(e.target.value)} className="ml-3 w-full bg-transparent text-sm font-semibold text-[#013E43] outline-none placeholder:text-[#065A57]/60" />
        {trailing ? <span className="ml-3 shrink-0">{trailing}</span> : null}
      </div>
    </label>
  );
}
