import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { resetPassword } from "../services/auth.service";
import { getApiErrorMessage } from "../utils/apiError";

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const data = await resetPassword(token, password);
      setMessage(data.message);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not reset password."));
    }
  };

  return (
    <section className="rounded-[2rem] border border-[#A8D8C1] bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">New password</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#013E43]">Choose a new password.</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" className="w-full rounded-2xl border border-[#A8D8C1] bg-[#F0F7F4] px-4 py-4 text-sm font-semibold outline-none" />
        {message ? <p className="rounded-2xl bg-[#F0F7F4] px-4 py-3 text-sm font-semibold text-[#065A57]">{message} <Link to="/login" className="font-extrabold text-[#013E43]">Sign in</Link></p> : null}
        {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
        <button className="w-full rounded-2xl bg-[#013E43] px-5 py-4 text-sm font-extrabold text-white">Reset password</button>
      </form>
    </section>
  );
}
