const mongoose = require("mongoose");

const whatsappListingAddonSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ["pending_payment", "active", "past_due", "non_renewing", "cancelled"],
      default: "pending_payment",
      required: true
    },
    pendingReference: { type: String, default: null },
    lastPaymentReference: { type: String, default: null },
    paystackSubscriptionCode: { type: String, default: null },
    paystackEmailToken: { type: String, default: null },
    paystackCustomerCode: { type: String, default: null },
    currentPeriodEnd: { type: Date, default: null },
    lastPaymentDate: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("WhatsAppListingAddon", whatsappListingAddonSchema);
