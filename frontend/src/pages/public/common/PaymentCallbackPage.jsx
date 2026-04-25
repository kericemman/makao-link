import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyPayment } from "../../services/payment.service";
import { useAuth } from "../../context/AuthContext";

const PaymentCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    const runVerification = async () => {
      const reference = searchParams.get("reference");

      if (!reference) {
        setMessage("Payment reference not found.");
        setLoading(false);
        return;
      }

      try {
        await verifyPayment(reference);
        await refreshAuth();

        setMessage("Payment verified successfully. Redirecting...");

        setTimeout(() => {
          navigate("/landlord/subscription");
        }, 1500);
      } catch (error) {
        setMessage(
          error.response?.data?.message ||
            "We could not verify your payment automatically yet. Please contact support if this continues."
        );
      } finally {
        setLoading(false);
      }
    };

    runVerification();
  }, [searchParams, navigate, refreshAuth]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Payment Status</h1>
        <p className="mt-4 text-slate-600">{message}</p>
        {loading ? <div className="mt-6">Please wait...</div> : null}
      </div>
    </div>
  );
};

export default PaymentCallbackPage;