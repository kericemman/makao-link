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
            lowercase: true
        },

        phone: {
            type: String,
            required: true,
            unique: true
        },

        password: {
            type: String,
            required: true,
            minlength: 6
        },

        role: {
            type: String,
            enum: ["admin", "landlord"],
            default: "landlord"
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        kycStatus: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },

        kycDocuments: [
            {
                documentType: String,
                documentUrl: String
            }
        ],

        subscription: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subscription"
        },

        isSuspended: {
            type: Boolean,
            default: false
        },

        passwordResetToken: String,

        passwordResetExpires: Date,
    },
    {
        timestamps: true
    } // Added closing parenthesis here
);

userSchema.pre("save", async function () {

    if (!this.isModified("password")) return;
  
    const salt = await bcrypt.genSalt(10);
  
    this.password = await bcrypt.hash(this.password, salt);
  
  });

    userSchema.methods.comparePassword = async function(password) {
        return await bcrypt.compare(password, this.password);
      };

      userSchema.methods.createPasswordResetToken = function () {

        const resetToken = crypto.randomBytes(32).toString("hex");
      
        this.passwordResetToken = crypto
          .createHash("sha256")
          .update(resetToken)
          .digest("hex");
      
        this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
      
        return resetToken;
      };

module.exports = mongoose.model("User", userSchema);
