import { useState } from "react";
import { forgotPassword } from "../services/auth.service";
import { getApiErrorMessage } from "../utils/apiError";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const data = await forgotPassword(email);
      setMessage(data.message);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not send reset link."));
    }
  };

  return (
    <section className="rounded-[2rem] border border-[#A8D8C1] bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">Reset password</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#013E43]">Send a reset link to your email.</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-2xl border border-[#A8D8C1] bg-[#F0F7F4] px-4 py-4 text-sm font-semibold outline-none" />
        {message ? <p className="rounded-2xl bg-[#F0F7F4] px-4 py-3 text-sm font-semibold text-[#065A57]">{message}</p> : null}
        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
        <button className="w-full rounded-2xl bg-[#013E43] px-5 py-4 text-sm font-extrabold text-white">Send reset link</button>
      </form>
    </section>
  );
}
