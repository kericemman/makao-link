const PHONE_PATTERN = /^\+254[17]\d{8}$/;
const SEPARATORS = /[\s().-]/g;

const normalizeKenyanPhone = (value) => {
  const input = String(value || "").trim();
  const compact = input.replace(SEPARATORS, "");
  if (!PHONE_PATTERN.test(compact)) {
    throw new Error("Enter a Kenyan mobile number starting with +254, for example +254 712 345 678.");
  }
  return compact;
};

const legacyPhonePatterns = (canonical) => {
  const digits = canonical.slice(1);
  const spaced = (value) => value.split("").join("[\\s().-]*");
  return [
    new RegExp(`^\\+?${spaced(digits)}$`),
    new RegExp(`^${spaced(`0${digits.slice(3)}`)}$`)
  ];
};

const phoneUniquenessFilter = (canonical) => ({
  $or: [
    { phoneCanonical: canonical },
    { phone: { $in: [canonical, canonical.slice(1), `0${canonical.slice(4)}`] } },
    ...legacyPhonePatterns(canonical).map((pattern) => ({ phone: { $regex: pattern } }))
  ]
});

module.exports = { PHONE_PATTERN, normalizeKenyanPhone, phoneUniquenessFilter };
