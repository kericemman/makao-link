import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyPayment } from "../../services/payment.service";
import toast from "react-hot-toast";

const PaymentCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    const runVerification = async () => {
      const reference = searchParams.get("reference");

      if (!reference) {
        setMessage("Payment reference was not found.");
        toast.error("Payment reference missing");
        return;
      }

      try {
        await verifyPayment(reference);

        setMessage("Payment verified successfully. Redirecting...");
        toast.success("Payment verified successfully");

        setTimeout(() => {
          navigate("/landlord/subscription", { replace: true });
        }, 1200);
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          "Payment verification failed. Please contact support.";

        setMessage(errorMessage);
        toast.error(errorMessage);
      }
    };

    runVerification();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-[#F0F7F4] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#A8D8C1] shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-[#013E43]">Payment Status</h1>
        <p className="mt-4 text-sm text-[#065A57]">{message}</p>
      </div>
    </div>
  );
};

export default PaymentCallbackPage;