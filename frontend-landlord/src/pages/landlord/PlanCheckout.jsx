import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiCheckCircle, FiCreditCard, FiLock } from "react-icons/fi";
import toast from "react-hot-toast";
import { changeSubscriptionPlan, getPublicPlans, initializeSubscriptionPayment } from "../../services/payment.service";

const currency = (amount) => new Intl.NumberFormat("en-KE", {
  style: "currency", currency: "KES", minimumFractionDigits: 0
}).format(amount);

export default function PlanCheckout() {
  const { planKey } = useParams();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const selectedPlan = useMemo(() => plans.find((plan) => plan.key === planKey), [plans, planKey]);

  useEffect(() => {
    let active = true;
    getPublicPlans()
      .then((response) => { if (active) setPlans(response.plans || []); })
      .catch(() => { if (active) setError("Plan pricing is unavailable right now. Please try again."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const proceedToPayment = async () => {
    if (!selectedPlan || selectedPlan.key === "normal") return;
    setPaying(true);
    setError("");
    try {
      await changeSubscriptionPlan({ plan: selectedPlan.key });
      const payment = await initializeSubscriptionPayment();
      if (!payment.authorization_url) throw new Error("Paystack did not return a checkout link.");
      window.location.assign(payment.authorization_url);
    } catch (requestError) {
      const message = requestError.response?.data?.message || requestError.message || "We could not start checkout.";
      setError(message);
      toast.error(message);
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <main className="mx-auto max-w-3xl px-4 py-12"><p className="text-sm text-slate-600">Loading plan price…</p></main>;
  if (!selectedPlan || selectedPlan.key === "normal") return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <p role="alert" className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This plan does not have a paid checkout.</p>
      <Link to="/subscription" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-900"><FiArrowLeft /> Back to plans</Link>
    </main>
  );

  const base = Number(selectedPlan.price || 0);
  const vat = Number(selectedPlan.vatAmount ?? Math.round(base * Number(selectedPlan.vatRate || 16) / 100));
  const total = Number(selectedPlan.totalPrice ?? base + vat);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <Link to="/subscription" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-900 hover:text-emerald-700"><FiArrowLeft /> Back to plans</Link>
      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_340px]">
        <section>
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Monthly plan checkout</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">Review your {selectedPlan.name} plan</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Your subscription will renew monthly. The 16% VAT is included in the amount sent to Paystack.</p>
          <div className="mt-6 border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-950">Included</h2>
            <p className="mt-2 text-sm text-slate-600">Up to {selectedPlan.listingLimit} active listings</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500"><FiLock /> Payment is securely completed on Paystack.</div>
          </div>
        </section>

        <aside className="h-fit border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-slate-950">Price summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-slate-600">{selectedPlan.name} plan</dt><dd className="font-medium text-slate-950">{currency(base)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-slate-600">VAT ({selectedPlan.vatRate || 16}%)</dt><dd className="font-medium text-slate-950">{currency(vat)}</dd></div>
            <div className="border-t border-slate-200 pt-3 flex justify-between gap-3"><dt className="font-bold text-slate-950">Due monthly</dt><dd className="font-bold text-slate-950">{currency(total)}</dd></div>
          </dl>
          {error && <p role="alert" className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <button type="button" onClick={proceedToPayment} disabled={paying} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-60">
            {paying ? "Preparing secure payment…" : <><FiCreditCard /> Proceed to Paystack</>}
          </button>
          <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500"><FiCheckCircle className="mt-0.5 shrink-0 text-emerald-700" />You will confirm the final charge on Paystack before payment.</p>
        </aside>
      </div>
    </main>
  );
}
