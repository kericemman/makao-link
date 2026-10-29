export default function LoadingScreen({ label = "Loading" }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#F0F7F4] px-4" role="status" aria-live="polite">
      <div className="text-center">
        <span
          aria-hidden="true"
          className="mx-auto block h-9 w-9 animate-spin rounded-full border-[3px] border-[#A8D8C1] border-t-[#02BB31]"
        />
        <p className="mt-4 text-sm font-semibold text-[#065A57]">{label}...</p>
      </div>
    </div>
  );
}
