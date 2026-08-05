const AppAlert = require("../alerts/alert.model");
const Inquiry = require("./inquiry.model");

const userInquiryRoles = ["user", "tenant", "agent", "service_provider"];

exports.syncWebsiteInquiriesToAppAlertsForUser = async (user) => {
  if (!user?.email || !userInquiryRoles.includes(user.role)) {
    return [];
  }

  const websiteInquiries = await Inquiry.find({
    email: user.email.toLowerCase()
  }).sort({ createdAt: 1 });

  const synced = [];

  for (const inquiry of websiteInquiries) {
    const existing = await AppAlert.findOne({
      listing: inquiry.listing,
      landlord: inquiry.landlord,
      user: user._id,
      message: inquiry.message
    });

    if (existing) {
      synced.push(existing);
      continue;
    }

    const alert = await AppAlert.create({
      listing: inquiry.listing,
      landlord: inquiry.landlord,
      user: user._id,
      message: inquiry.message,
      readByUser: true,
      readByLandlord: false
    });

    synced.push(alert);
  }

  return synced;
};
