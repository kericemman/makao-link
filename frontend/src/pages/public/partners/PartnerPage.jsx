import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

const PartnerApplicationCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [statusMessage, setStatusMessage] = useState("Processing your payment...");
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    const reference = searchParams.get("reference");

    if (reference) {
      setStatusMessage(
        "Your payment attempt has been received. Your application is now pending confirmation and admin review."
      );
    } else {
      setStatusMessage(
        "Your application has been submitted. If your payment was successful, your status will be updated shortly."
      );
    }

    setShowActions(true);
  }, [searchParams]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Application Received</h1>
        <p className="mt-4 text-slate-600">{statusMessage}</p>

        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          We will review your application after payment confirmation. Approved partners
          will be published in their selected service category.
        </div>

        {showActions ? (
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/services"
              className="rounded-lg bg-slate-900 px-5 py-3 text-white"
            >
              Back to Services
            </Link>

            <button
              onClick={() => navigate("/")}
              className="rounded-lg border border-slate-300 px-5 py-3 text-slate-800"
            >
              Go Home
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PartnerApplicationCallbackPage;