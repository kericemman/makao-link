const sourceFilter = (source) => ({
  isActive: true,
  $or: [{ source }, { sources: source }]
});

const getServiceUpdateRecipients = async ({ audience, SubscriberModel, UserModel }) => {
  const includeWebsite = audience === "website" || audience === "all";
  const includeMobile = audience === "mobile_app" || audience === "all";
  const queries = [];

  if (includeWebsite) queries.push(SubscriberModel.find(sourceFilter("website")).select("email").lean());
  if (includeMobile) queries.push(SubscriberModel.find(sourceFilter("mobile_app")).select("email").lean());

  const groups = await Promise.all(queries);
  const recipients = new Set(groups.flat().map((item) => item.email?.trim().toLowerCase()).filter(Boolean));

  if (includeWebsite) {
    const landlords = await UserModel.find({
      isEmailVerified: true,
      $or: [{ role: "landlord" }, { roles: "landlord" }]
    }).select("email").lean();
    const emails = [...new Set(landlords.map((item) => item.email?.trim().toLowerCase()).filter(Boolean))];

    if (emails.length) {
      const preferences = await SubscriberModel.find({ email: { $in: emails } }).select("email isActive").lean();
      const statusByEmail = new Map(preferences.map((item) => [item.email.trim().toLowerCase(), item.isActive]));
      emails.forEach((email) => {
        if (statusByEmail.get(email) !== false) recipients.add(email);
      });
    }
  }

  return [...recipients];
};

const mergeServiceUpdateSubscribers = ({ subscribers = [], landlords = [] }) => {
  const byEmail = new Map();
  const add = (record, sources, landlord = false) => {
    const email = record.email?.trim().toLowerCase();
    if (!email) return;
    let entry = byEmail.get(email);
    if (!entry) {
      entry = {
        _id: email,
        email,
        sources: [],
        isActive: typeof record.isActive === "boolean" ? record.isActive : landlord,
        createdAt: record.subscribedAt || record.createdAt,
        landlordAccounts: false
      };
    } else if (record.isActive === true) {
      entry.isActive = true;
    }
    sources.forEach((source) => {
      if (source && !entry.sources.includes(source)) entry.sources.push(source);
    });
    entry.landlordAccounts ||= landlord;
    const createdAt = record.subscribedAt || record.createdAt;
    if (createdAt && (!entry.createdAt || new Date(createdAt) < new Date(entry.createdAt))) entry.createdAt = createdAt;
    byEmail.set(email, entry);
  };

  subscribers.forEach((subscriber) => {
    const sources = [...new Set([...(subscriber.sources || []), subscriber.source].filter(Boolean))];
    add(subscriber, sources);
  });
  landlords.forEach((landlord) => add(landlord, ["website"], true));

  return [...byEmail.values()].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
};

module.exports = { getServiceUpdateRecipients, mergeServiceUpdateSubscribers, sourceFilter };
