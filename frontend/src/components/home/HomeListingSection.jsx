import { Link } from "react-router-dom";
import ListingCard from "../common/ListingCard";

const HomeListingSection = ({ title, subtitle, listings = [], viewAllLink }) => {
  if (!listings.length) return null;

  return (
    <section className="py-2">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-2xl font-medium text-[#013E43]">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[#065A57]">{subtitle}</p>
        </div>

        <Link
          to={viewAllLink}
          className="shrink-0 text-sm font-light text-[#02BB31] hover:text-[#0D915C]"
        >
          View All
        </Link>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-3 snap-x">
        {listings.map((listing) => (
          <div
            key={listing._id}
            className="min-w-[280px] sm:min-w-[320px] lg:min-w-0 lg:flex-1 snap-start"
          >
            <ListingCard listing={listing} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default HomeListingSection;