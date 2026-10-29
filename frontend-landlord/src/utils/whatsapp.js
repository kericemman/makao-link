export const RENDAHOMES_WHATSAPP = "254738388000";

export const buildWhatsAppUrl = (message) =>
  `https://wa.me/${RENDAHOMES_WHATSAPP}?text=${encodeURIComponent(message)}`;

export const landlordOnboardingMessage = (user) =>
  [
    "Hello RendaHomes, I want to list my property directly on WhatsApp.",
    user?.name ? `Name: ${user.name}` : "",
    user?.phone ? `Phone: ${user.phone}` : "",
    user?.email ? `Email: ${user.email}` : "",
    "Please start the WhatsApp property-listing process for my account."
  ]
    .filter(Boolean)
    .join("\n");

export const listingDraftMessage = (user, formData = {}) =>
  [
    "Hello RendaHomes, I want to list this property directly on WhatsApp.",
    user?.name ? `Landlord: ${user.name}` : "",
    formData.title ? `Title: ${formData.title}` : "",
    formData.purpose ? `Purpose: ${formData.purpose}` : "",
    formData.type ? `Type: ${formData.type}` : "",
    formData.price ? `Price: KES ${formData.price}` : "",
    [formData.area, formData.town, formData.county].filter(Boolean).length
      ? `Location: ${[formData.area, formData.town, formData.county].filter(Boolean).join(", ")}`
      : "",
    formData.contactPhone ? `Contact phone: ${formData.contactPhone}` : "",
    "Please continue the WhatsApp listing process for this property."
  ]
    .filter(Boolean)
    .join("\n");
