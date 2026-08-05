import { FiArrowUpRight, FiBriefcase } from "react-icons/fi";

export default function ServicesPreview({ categories = [] }) {
  return (
    <section id="services" className="border-b border-[#A8D8C1] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#02BB31]">Move-in support</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#013E43] sm:text-3xl">
              Eveything you need to settle into your new home, all in one place.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#065A57]">
              Find trusted partners for moving, cleaning, repairs, furnishing, and internet setup.
            </p>
          </div>
        </div>

        {categories.length ? (
          <div className="listing-rail flex gap-5 overflow-x-auto scroll-smooth pb-2">
            {categories.map((category) => (
              <ServiceCard key={category.key} category={category} />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-[#02BB31] bg-[#F0F7F4] p-8 text-center">
            <p className="text-sm font-semibold text-[#065A57]">Service categories will appear here once the backend responds.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function ServiceCard({ category }) {
  return (
    <a
      href={`/services/${category.key}`}
      className="group w-[min(84vw,340px)] shrink-0 snap-start overflow-hidden rounded-[1.35rem] border border-[#A8D8C1] bg-white shadow-[0_18px_45px_rgba(22,33,31,0.06)] transition hover:-translate-y-1 hover:border-[#02BB31]"
      title={`Browse ${category.label}`}
    >
      <div className="relative aspect-[4/3] bg-[#F0F7F4]">
        {category.image ? (
          <img
            src={category.image}
            alt={category.label}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#065A57]">
            <FiBriefcase />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#013E43]/90 to-transparent p-4 pt-16">
          <h3 className="text-lg font-extrabold text-white">{category.label}</h3>
        </div>
      </div>
      <div className="p-4">
        <p className="line-clamp-2 text-sm leading-6 text-[#065A57]">{category.description}</p>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-[#013E43]">
          View providers
          <FiArrowUpRight />
        </span>
      </div>
    </a>
  );
}
