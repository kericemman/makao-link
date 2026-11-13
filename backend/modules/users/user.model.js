
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { COUNTIES, COUNTY_TOWNS } = require("../listings/listing.constants");
const { normalizeKenyanPhone } = require("../../utils/kenyanPhone");

const agentServiceAreaSchema = new mongoose.Schema({
  county: { type: String, enum: COUNTIES, required: true },
  towns: {
    type: [String],
    default: [],
    validate: {
      validator(towns) { return towns.every((town) => (COUNTY_TOWNS[this.county] || []).includes(town)); },
      message: "Service area contains a town outside its county."
    }
  }
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      required: false,
      trim: true,
      default: ""
    },

    phoneCanonical: {
      type: String,
      select: false
    },

    legalAcceptance: {
      termsUrl: { type: String, trim: true, default: "" },
      privacyUrl: { type: String, trim: true, default: "" },
      acceptedAt: { type: Date, default: null }
    },

    whatsappUpdatesOptIn: {
      type: Boolean,
      default: false
    },

    whatsappUpdatesPhone: {
      type: String,
      trim: true,
      default: ""
    },

    whatsappUpdatesSubscribedAt: {
      type: Date,
      default: null
    },

    role: {
      type: String,
      enum: ["user", "tenant", "landlord", "landlord_staff", "admin", "admin_manager", "service_provider", "agent", "app_manager"],
      default: "user"
    },

    // `role` remains the legacy primary role; `roles` supports additional, explicitly granted identities.
    roles: {
      type: [{ type: String, enum: ["user", "tenant", "landlord", "landlord_staff", "admin", "admin_manager", "service_provider", "agent", "app_manager"] }],
      default: []
    },

    adminPermissions: {
      type: [{ type: String, enum: require("../admin/adminPermissions").ADMIN_PERMISSION_KEYS }],
      default: []
    },

    adminManagerStatus: {
      type: String,
      enum: ["active", "revoked", null],
      default: null,
      index: true
    },

    agentCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true
    },

    agentStatus: {
      type: String,
      enum: ["active", "suspended"],
      default: "active"
    },

    agentMarketplaceStatus: {
      type: String,
      enum: ["not_enabled", "pending", "approved", "suspended"],
      default: "not_enabled",
      index: true
    },

    agentServiceAreas: {
      type: [agentServiceAreaSchema],
      default: []
    },

    commissionRate: {
      type: Number,
      default: 10,
      min: 0,
      max: 100
    },

    landlordOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    teamRole: {
      type: String,
      enum: ["manager", "agent", "viewer", null],
      default: null
    },

    teamPermissions: {
      type: [String],
      enum: ["listings", "inquiries", "team", "reports", "deals"],
      default: []
    },

    teamStatus: {
      type: String,
      enum: ["invited", "active", "suspended"],
      default: "active"
    },

    createdByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    onboardedByAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    onboardingSource: {
      type: String,
      enum: ["direct", "agent", "admin"],
      default: "direct",
      index: true
    },

    agentCodeUsed: {
      type: String,
      default: "",
      uppercase: true,
      trim: true
    },

    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null
    },

    savedListings: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Listing" }],
      default: []
    },

    businessName: {
      type: String,
      default: "",
      trim: true
    },

    bio: {
      type: String,
      default: "",
      trim: true
    },

    avatar: {
      type: String,
      default: ""
    },

    location: {
      type: String,
      default: "",
      trim: true
    },

    isEmailVerified: {
      type: Boolean,
      default: true
    },

    socialProvider: {
      type: String,
      enum: ["google", "apple", "facebook", null],
      default: null,
      index: true
    },

    socialProviderId: {
      type: String,
      default: "",
      select: false
    },

    emailOtpHash: {
      type: String,
      default: null,
      select: false
    },

    emailOtpExpires: {
      type: Date,
      default: null,
      select: false
    },

    emailOtpAttempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      select: false
    },

    passwordResetToken: {
      type: String,
      default: null,
      select: false
    },

    passwordResetExpires: {
      type: Date,
      default: null,
      select: false
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!Array.isArray(this.roles)) this.roles = [];
  if (this.role && !this.roles.includes(this.role)) this.roles.push(this.role);
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.pre("validate", function () {
  if (this.isNew || this.isModified("phone")) {
    if (!this.phone || this.phone === "N/A") {
      this.phoneCanonical = undefined;
      return;
    }
    try {
      this.phone = normalizeKenyanPhone(this.phone);
      this.phoneCanonical = this.phone;
    } catch (error) {
      this.invalidate("phone", error.message);
    }
  }
});

userSchema.index({ phoneCanonical: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, isEmailVerified: 1, createdAt: 1 });
userSchema.index({ roles: 1, isEmailVerified: 1, createdAt: 1 });

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
