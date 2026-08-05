export const RENDAHOMES_WHATSAPP = "254738388000";

export const buildWhatsAppUrl = (message) =>
  `https://wa.me/${RENDAHOMES_WHATSAPP}?text=${encodeURIComponent(message)}`;

export const landlordOnboardingMessage = (user) =>
  [
    "Hello RendaHomes, I need help listing my property.",
    user?.name ? `Name: ${user.name}` : "",
    user?.phone ? `Phone: ${user.phone}` : "",
    user?.email ? `Email: ${user.email}` : "",
    "I would like guidance on photos, price, location, and property details."
  ]
    .filter(Boolean)
    .join("\n");

export const listingDraftMessage = (user, formData = {}) =>
  [
    "Hello RendaHomes, please help me review this property listing draft.",
    user?.name ? `Landlord: ${user.name}` : "",
    formData.title ? `Title: ${formData.title}` : "",
    formData.purpose ? `Purpose: ${formData.purpose}` : "",
    formData.type ? `Type: ${formData.type}` : "",
    formData.price ? `Price: KES ${formData.price}` : "",
    [formData.area, formData.town, formData.county].filter(Boolean).length
      ? `Location: ${[formData.area, formData.town, formData.county].filter(Boolean).join(", ")}`
      : "",
    formData.contactPhone ? `Contact phone: ${formData.contactPhone}` : "",
    "I need help confirming if the details are ready to publish."
  ]
    .filter(Boolean)
    .join("\n");
