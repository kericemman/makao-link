export default function LoadingScreen({ label = "Loading RendaHomes" }) {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#F6FAF8] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between border-b border-[#DDEBE4] pb-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-20 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-[#DDEBE4]">
              <img src="/assets/rend.jpeg" alt="RendaHomes" className="h-8 w-auto object-contain" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-[#013E43]">{label}</p>
              <p className="mt-0.5 text-xs font-semibold text-[#647C75]">Preparing verified homes...</p>
            </div>
          </div>
          <div className="hidden h-2 w-28 overflow-hidden rounded-full bg-[#DDEBE4] sm:block">
            <div className="loading-bar h-full rounded-full bg-[#02BB31]" />
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="hidden rounded-2xl border border-[#DDEBE4] bg-white p-5 shadow-sm lg:block">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-5 h-11 w-full rounded-xl" />
            <Skeleton className="mt-3 h-11 w-full rounded-xl" />
            <Skeleton className="mt-3 h-11 w-3/4 rounded-xl" />
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Skeleton className="h-10 rounded-xl" />
              <Skeleton className="h-10 rounded-xl" />
            </div>
          </aside>

          <main>
            <div className="mb-5 flex items-end justify-between">
              <div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-8 w-56" />
              </div>
              <Skeleton className="hidden h-10 w-32 rounded-full sm:block" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <article key={item} className="overflow-hidden rounded-2xl border border-[#DDEBE4] bg-white shadow-sm">
                  <Skeleton className="aspect-[1.35] w-full rounded-none" />
                  <div className="p-5">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="mt-3 h-4 w-4/5" />
                    <Skeleton className="mt-3 h-4 w-2/3" />
                    <div className="mt-5 flex gap-2">
                      <Skeleton className="h-7 w-16 rounded-full" />
                      <Skeleton className="h-7 w-20 rounded-full" />
                      <Skeleton className="h-7 w-14 rounded-full" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Skeleton({ className = "" }) {
  return <div className={`loading-shimmer rounded-lg bg-[#E7F0EA] ${className}`} />;
}
