import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../api/api";

const PartnerPaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const reference = searchParams.get("reference");
        const applicationId = searchParams.get("applicationId");

        if (!reference) {
          toast.error("Missing payment reference");
          navigate("/services");
          return;
        }

        await api.get(
          `/services/apply/payment/verify/${reference}`,
          {
            params: { applicationId }
          }
        );

        toast.success("Payment verified successfully");

        navigate("/services/apply/success");

      } catch (error) {

        console.error(error);

        toast.error(
          error.response?.data?.message ||
          "Payment verification failed"
        );

        navigate("/services");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-[#02BB31] border-t-transparent mx-auto mb-4"></div>

        <h2 className="text-xl font-semibold text-[#013E43]">
          Verifying Payment...
        </h2>

        <p className="text-[#065A57] mt-2">
          Please wait while we confirm your transaction.
        </p>
      </div>
    </div>
  );
};

export default PartnerPaymentCallback;