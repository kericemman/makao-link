export default function LoadingScreen({ label = "Loading" }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#F0F7F4] px-4">
      <div className="w-full max-w-xs text-center">
        <img src="/assets/rend.jpeg" alt="RendaHomes" className="mx-auto h-12 w-auto rounded bg-white" />
        <p className="mt-4 text-sm font-extrabold uppercase tracking-[0.18em] text-[#065A57]">{label}</p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#A8D8C1]/50">
          <div className="loading-bar h-full w-2/3 rounded-full bg-[#02BB31]" />
        </div>
      </div>
    </div>
  );
}
