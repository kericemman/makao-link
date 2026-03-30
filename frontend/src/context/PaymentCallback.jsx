import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const PaymentCallbackPage = () => {
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyAndRedirect = async () => {
      try {
        await refreshAuth();
        navigate("/landlord/dashboard", { replace: true });
      } catch (err) {
        setError("Payment callback completed, but we could not refresh your account automatically. Please log in again.");
      }
    };

    verifyAndRedirect();
  }, [navigate, refreshAuth]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        {!error ? (
          <>
            <h1 className="text-2xl font-bold text-slate-900">Processing payment...</h1>
            <p className="mt-3 text-slate-600">
              We are updating your subscription and redirecting you to your dashboard.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
            <p className="mt-3 text-slate-600">{error}</p>
            <button
              onClick={() => navigate("/login")}
              className="mt-6 rounded-lg bg-slate-900 px-5 py-3 text-white"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCallbackPage;