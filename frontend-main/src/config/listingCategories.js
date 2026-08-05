export const listingCategories = [
  {
    slug: "rentals",
    title: "Homes for rent",
    eyebrow: "Available rentals",
    description: "Apartments, bedsitters, studios, and houses currently available for rent.",
    params: { purpose: "rent" }
  },
  {
    slug: "for-sale",
    title: "Homes for sale",
    eyebrow: "Buy a home",
    description: "Approved homes and residential properties listed for purchase.",
    params: { purpose: "sale" }
  },
  {
    slug: "apartments",
    title: "Apartments",
    eyebrow: "Popular property type",
    description: "Browse approved apartment listings across supported towns and counties.",
    params: { type: "apartment" }
  },
  {
    slug: "bedsitters",
    title: "Bedsitters",
    eyebrow: "Compact living",
    description: "Affordable bedsitter listings for students and first homes.",
    params: { type: "bedsitter" }
  },
  {
    slug: "student",
    title: "Student-friendly homes",
    eyebrow: "Budget rentals",
    description: "Lower-budget rentals suitable for students and single occupants.",
    params: { category: "student" }
  },
  {
    slug: "office",
    title: "Office spaces",
    eyebrow: "Work spaces",
    description: "Office listings for businesses, teams, and solo operators.",
    params: { category: "office" }
  },
  {
    slug: "family",
    title: "Family homes",
    eyebrow: "Larger homes",
    description: "Homes with more bedrooms for families and long-term moves.",
    params: { category: "family" }
  },
  {
    slug: "luxury",
    title: "Luxury rentals",
    eyebrow: "Premium areas",
    description: "Selected rentals in premium neighborhoods and higher-end property types.",
    params: { category: "luxury" }
  },
  {
    slug: "maisonettes",
    title: "Maisonettes",
    eyebrow: "Spacious homes",
    description: "Maisonette listings for renters and buyers who need more space.",
    params: { category: "maisonette" }
  },
  {
    slug: "villas",
    title: "Villas",
    eyebrow: "Premium homes",
    description: "Villa listings from approved active properties.",
    params: { category: "villa" }
  }
];

export const categoryBySlug = Object.fromEntries(
  listingCategories.map((category) => [category.slug, category])
);
