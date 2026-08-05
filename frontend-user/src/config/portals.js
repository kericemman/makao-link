export const portalLinks = {
  main: {
    label: "Browse homes",
    href: import.meta.env.VITE_MAIN_URL || (import.meta.env.DEV ? "http://localhost:5173" : "https://rendahomes.com")
  },
  landlord: {
    label: "Landlord portal",
    href: import.meta.env.VITE_LANDLORD_URL || (import.meta.env.DEV ? "http://localhost:5174" : "https://landlord.rendahomes.com")
  }
};
