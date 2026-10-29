// const User = require("./user.model");

// exports.updateProfile = async (req, res) => {

//   try {

//     const { name, phone, email } = req.body;

//     const user = await User.findById(req.user._id);

//     if (!user) {
//       return res.status(404).json({
//         message: "User not found"
//       });
//     }

//     if (name) user.name = name;
//     if (phone) user.phone = phone;
//     if (email) user.email = email;

//     await user.save();

//     res.json({
//       message: "Profile updated",
//       user
//     });

//   } catch (error) {

//     res.status(500).json({
//       message: "Profile update failed"
//     });

//   }

// };


const User = require("./user.model");
const Listing = require("../listings/listings.model");
const mongoose = require("mongoose");

const savedListingsForUser = async (userId) => {
  const user = await User.findById(userId).populate({
    path: "savedListings",
    match: { status: "approved", isActive: true, availability: "available" },
    select: "title description price purpose type county town area bedrooms bathrooms size sizeUnit images amenities availability status isActive landlord contactPhone"
  }).select("savedListings");
  return (user?.savedListings || []).filter(Boolean);
};

exports.getSavedListings = async (req, res, next) => {
  try {
    const savedListings = await savedListingsForUser(req.user._id);
    res.json({ success: true, savedListings });
  } catch (error) {
    next(error);
  }
};

exports.saveListing = async (req, res, next) => {
  try {
    const { listingId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ message: "Invalid listing" });
    }

    const listing = await Listing.findOne({
      _id: listingId,
      status: "approved",
      isActive: true,
      availability: "available"
    }).select("_id");
    if (!listing) return res.status(404).json({ message: "Listing is not available to save" });

    await User.updateOne(
      { _id: req.user._id },
      { $addToSet: { savedListings: listing._id } }
    );
    res.json({ success: true, savedListings: await savedListingsForUser(req.user._id) });
  } catch (error) {
    next(error);
  }
};

exports.removeSavedListing = async (req, res, next) => {
  try {
    const { listingId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ message: "Invalid listing" });
    }

    await User.updateOne(
      { _id: req.user._id },
      { $pull: { savedListings: listingId } }
    );
    res.json({ success: true, savedListings: await savedListingsForUser(req.user._id) });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, phone, businessName, bio, location } = req.body;

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (businessName !== undefined) user.businessName = businessName;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;

    if (req.file) {
      user.avatar = req.file.path || req.file.originalname;
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

exports.getWhatsAppUpdatePreference = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      "whatsappUpdatesOptIn whatsappUpdatesPhone whatsappUpdatesSubscribedAt"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      success: true,
      preference: {
        enabled: user.whatsappUpdatesOptIn,
        phone: user.whatsappUpdatesPhone || "",
        subscribedAt: user.whatsappUpdatesSubscribedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateWhatsAppUpdatePreference = async (req, res, next) => {
  try {
    const { enabled, phone } = req.body;
    if (typeof enabled !== "boolean") {
      return res.status(400).json({ message: "Choose whether to enable WhatsApp updates." });
    }

    const cleanPhone = typeof phone === "string" ? phone.trim() : "";
    const digits = cleanPhone.replace(/\D/g, "");
    if (enabled && (cleanPhone.length > 30 || digits.length < 7 || digits.length > 15)) {
      return res.status(400).json({ message: "Enter a valid WhatsApp phone number." });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.whatsappUpdatesOptIn = enabled;
    user.whatsappUpdatesPhone = enabled ? cleanPhone : user.whatsappUpdatesPhone;
    user.whatsappUpdatesSubscribedAt = enabled
      ? user.whatsappUpdatesSubscribedAt || new Date()
      : null;
    await user.save();

    res.json({
      success: true,
      message: enabled ? "WhatsApp updates preference saved." : "WhatsApp updates turned off.",
      preference: {
        enabled: user.whatsappUpdatesOptIn,
        phone: user.whatsappUpdatesPhone || "",
        subscribedAt: user.whatsappUpdatesSubscribedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "All password fields are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New passwords do not match"
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect"
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    next(error);
  }
};
