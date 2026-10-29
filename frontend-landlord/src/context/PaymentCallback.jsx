import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { verifyPayment } from "../services/payment.service";

const PaymentCallbackPage = () => {
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyAndRedirect = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const reference = params.get("reference") || params.get("trxref");
        if (!reference) throw new Error("Missing payment reference");
        await verifyPayment(reference);
        await refreshAuth();
        navigate("/dashboard", { replace: true });
      } catch (err) {
        setError("We could not verify this payment. No plan changes were applied. Return to subscriptions or contact support with your payment reference.");
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
