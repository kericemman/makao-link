import { Link } from "react-router-dom";
import { listingCategories } from "../../config/listingCategories";

export default function CategoryStrip() {
  return (
    <section className="border-b border-[#A8D8C1] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="category-strip flex gap-3 overflow-x-auto scroll-smooth pb-1">
          {listingCategories.map((category) => (
            <Link
              key={category.slug}
              to={`/categories/${category.slug}`}
              className="shrink-0 rounded-full border border-[#A8D8C1] bg-[#F0F7F4] px-4 py-2 text-sm font-extrabold text-[#013E43] transition hover:border-[#02BB31] hover:bg-white"
            >
              {category.title}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
