const stats = [
  ["Verified", "approved listings"],
  ["Kenya-wide", "county and town search"],
  ["Direct", "landlord contact"]
];

export default function HeroStats() {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {stats.map(([value, label]) => (
        <div key={value} className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
          <p className="text-lg font-extrabold text-white">{value}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#A8D8C1]">{label}</p>
        </div>
      ))}
    </div>
  );
}
