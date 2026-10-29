import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import { resetPassword } from "../../../services/auth.service";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const response = await resetPassword(token, { password });
      setMessage(response.message || "Password reset successful. You can now sign in.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We could not reset your password. The link may have expired.");
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
          <FiLock size={20} aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-[#183B32]">Set a new password</h1>
        <p className="mt-2 text-sm leading-6 text-[#61756C]">Choose a password with at least 8 characters.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <PasswordField id="new-password" label="New password" value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword((visible) => !visible)} />
          <PasswordField id="confirm-password" label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((visible) => !visible)} />
          {message && <p role="status" className="rounded-lg bg-[#EAF5ED] p-3 text-sm text-[#17613D]">{message} <Link to="/login" className="font-semibold underline">Sign in</Link></p>}
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={loading || Boolean(message)} className="w-full rounded-lg bg-[#0D684C] px-4 py-3 text-sm font-semibold text-white hover:bg-[#09573E] disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? "Updating password..." : "Update password"}
          </button>
        </form>
      </section>
    </main>
  );
}

function PasswordField({ id, label, value, onChange, visible, onToggle }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[#29483E]">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={8}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="At least 8 characters"
          className="w-full rounded-lg border border-[#CFDDD4] px-3.5 py-3 pr-11 text-sm text-[#183B32] outline-none focus:border-[#0D915C] focus:ring-2 focus:ring-[#0D915C]/15"
        />
        <button type="button" aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} onClick={onToggle} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#61756C] hover:text-[#0D684C]">
          {visible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
