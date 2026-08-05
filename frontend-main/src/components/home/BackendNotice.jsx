export default function BackendNotice({ message }) {
  if (!message) return null;

  return (
    <section className="border-b border-[#A8D8C1] bg-[#F0F7F4]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-white p-5 text-sm text-[#065A57]">
          <strong className="text-[#013E43]">Server request failed:</strong> {message}
        </div>
      </div>
    </section>
  );
}
