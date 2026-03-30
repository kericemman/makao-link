const PlanCard = ({ name, price, limit, onSelect }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold text-slate-800">{name}</h3>
      <p className="mt-2 text-3xl font-bold text-slate-900">
        {price === 0 ? "Free" : `KES ${price}/mo`}
      </p>
      <p className="mt-3 text-sm text-slate-600">
        Up to {limit} active listing{limit > 1 ? "s" : ""}
      </p>

      <button
        onClick={onSelect}
        className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-3 text-white"
      >
        Select Plan
      </button>
    </div>
  );
};

export default PlanCard;