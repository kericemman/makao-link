import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../api/api";
import LoadingScreen from "../../../components/common/LoadingScreen";

const PartnerPaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
      }
    };

    verifyPayment();
  }, [navigate, searchParams]);

  return (
    <>
      <main className="grid min-h-[55vh] place-items-center bg-[#F0F7F4] px-4">
        <div className="w-full max-w-lg rounded-xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-12 w-12 rounded-full bg-[#DCEBE3]" />
          <div className="mx-auto mt-5 h-5 w-48 rounded bg-[#F0F7F4]" />
          <div className="mx-auto mt-3 h-4 w-64 max-w-full rounded bg-[#F0F7F4]" />
        </div>
      </main>
      <LoadingScreen />
    </>
  );
};

export default PartnerPaymentCallback;
