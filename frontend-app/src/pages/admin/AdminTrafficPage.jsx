import { useCallback, useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { BarElement, CategoryScale, Chart as ChartJS, Filler, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { FiActivity, FiRefreshCw } from "react-icons/fi";
import { getAdminTrafficSummary } from "../../services/admin.service";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip);

const sourceName = (source) => ({
  direct: "Direct / unknown", google: "Google", bing: "Bing", facebook: "Facebook", instagram: "Instagram",
  tiktok: "TikTok", linkedin: "LinkedIn", whatsapp: "WhatsApp", email: "Email", referral: "Other referral", other: "Other"
}[source] || "Other");
const formatNumber = (value) => new Intl.NumberFormat("en-KE").format(value || 0);

export default function AdminTrafficPage() {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const result = await getAdminTrafficSummary(range);
      setData(result);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Website traffic data could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const chartData = useMemo(() => ({
    labels: (data?.daily || []).map(({ day }) => new Date(`${day}T00:00:00`).toLocaleDateString("en-KE", { day: "numeric", month: "short" })),
    datasets: [{
      label: "Page views",
      data: (data?.daily || []).map(({ views }) => views),
      borderColor: "#13824E",
      backgroundColor: "rgba(19, 130, 78, 0.10)",
      fill: true,
      tension: 0.3,
      pointRadius: 2,
      pointHoverRadius: 4
    }]
  }), [data]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { intersect: false, mode: "index" } },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: range === "7d" ? 7 : 10, color: "#647C75" } },
      y: { beginAtZero: true, ticks: { precision: 0, color: "#647C75" }, grid: { color: "#E5EEE9" } }
    }
  }), [range]);

  return <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-semibold text-[#13824E]">Acquisition</p><h1 className="mt-1 text-2xl font-bold text-[#17352C]">Website traffic</h1><p className="mt-1 text-sm text-[#647C75]">Page views and the broad sources bringing people to RendaHomes.</p></div>
      <div className="flex items-center gap-2">
        <div role="group" aria-label="Traffic date range" className="flex rounded border border-[#D8E5DE] bg-white p-1">
          {["7d", "30d"].map((option) => <button key={option} type="button" aria-pressed={range === option} onClick={() => setRange(option)} className={`rounded px-3 py-1.5 text-sm font-medium ${range === option ? "bg-[#E8F4EC] text-[#087443]" : "text-[#536A61] hover:bg-[#F4F7F5]"}`}>{option === "7d" ? "7 days" : "30 days"}</button>)}
        </div>
        <button type="button" onClick={() => load(false)} disabled={refreshing || loading} aria-label="Refresh traffic" title="Refresh" className="grid h-9 w-9 place-items-center rounded border border-[#D8E5DE] text-[#41635A] hover:bg-[#F4F7F5] disabled:opacity-50"><FiRefreshCw className={refreshing ? "animate-spin" : ""} /></button>
      </div>
    </header>

    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800"><span>{error}</span><button type="button" onClick={() => load()} className="font-semibold underline">Retry</button></div>}

    <section className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.8fr)]">
      <div className="border border-[#E0E9E4] bg-white p-5">
        <div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-[#17352C]">Page views over time</h2><p className="mt-1 text-xs text-[#647C75]">Daily total for the selected period</p></div><FiActivity className="text-[#13824E]" /></div>
        {loading ? <div className="mt-5 h-64 animate-pulse bg-[#F0F5F2]" /> : <div className="mt-4 h-64">{data?.daily?.length ? <Line data={chartData} options={chartOptions} /> : <p className="grid h-full place-items-center text-sm text-[#647C75]">No page views recorded for this period.</p>}</div>}
      </div>
      <div className="flex flex-col justify-between border border-[#E0E9E4] bg-white p-5">
        <div><p className="text-sm font-medium text-[#647C75]">Total page views</p><p className="mt-2 text-4xl font-bold text-[#17352C]">{loading ? "—" : formatNumber(data?.summary?.pageViews)}</p></div>
        <p className="mt-6 border-t border-[#E6EEE9] pt-4 text-xs leading-5 text-[#647C75]">These are page views, not unique people. RendaHomes records daily totals, page categories, and broad referral categories; it does not store visitor IDs or full referring URLs.</p>
      </div>
    </section>

    <section className="grid gap-6 lg:grid-cols-2">
      <div className="border border-[#E0E9E4] bg-white">
        <div className="border-b border-[#E6EEE9] px-5 py-4"><h2 className="font-semibold text-[#17352C]">Where visitors came from</h2></div>
        {loading ? <div className="space-y-3 p-5">{[1, 2, 3].map((item) => <div key={item} className="h-8 animate-pulse bg-[#F0F5F2]" />)}</div> : data?.sources?.length ? <div className="divide-y divide-[#E6EEE9]">{data.sources.map((item) => <div key={`${item.source}-${item.medium}`} className="flex items-center justify-between gap-4 px-5 py-3 text-sm"><div><p className="font-medium text-[#263D35]">{sourceName(item.source)}</p><p className="text-xs capitalize text-[#647C75]">{item.medium}</p></div><span className="font-semibold tabular-nums text-[#17352C]">{formatNumber(item.views)}</span></div>)}</div> : <p className="px-5 py-8 text-sm text-[#647C75]">No source data yet.</p>}
      </div>
      <div className="border border-[#E0E9E4] bg-white">
        <div className="border-b border-[#E6EEE9] px-5 py-4"><h2 className="font-semibold text-[#17352C]">Most viewed page types</h2></div>
        {loading ? <div className="space-y-3 p-5">{[1, 2, 3].map((item) => <div key={item} className="h-8 animate-pulse bg-[#F0F5F2]" />)}</div> : data?.pages?.length ? <div className="divide-y divide-[#E6EEE9]">{data.pages.map((item) => <div key={item.path} className="flex items-center justify-between gap-4 px-5 py-3 text-sm"><span className="font-mono text-xs text-[#41635A]">{item.path}</span><span className="font-semibold tabular-nums text-[#17352C]">{formatNumber(item.views)}</span></div>)}</div> : <p className="px-5 py-8 text-sm text-[#647C75]">No page views yet.</p>}
      </div>
    </section>
  </main>;
}
