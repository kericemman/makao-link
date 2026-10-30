
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
      required: true,
      trim: true
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
      enum: ["user", "tenant", "landlord", "landlord_staff", "admin", "service_provider", "agent", "app_manager"],
      default: "user"
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
      default: null
    },

    emailOtpExpires: {
      type: Date,
      default: null
    },

    passwordResetToken: {
      type: String,
      default: null
    },

    passwordResetExpires: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
