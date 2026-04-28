const crypto = require("crypto");
const User = require("../users/user.model");
const Listing = require("../listings/listings.model");
const sendEmail = require("../../utils/sendEmail");
const generateToken = require("../../utils/generateToken");
const {
  welcomeEmail,
  passwordResetEmail
} = require("../../utils/emailTemplates");
const plans = require("../payments/plan.config");
const { createInitialSubscription } = require("../subscriptions/subscription.service");

exports.registerLandlord = async (req, res, next) => {
  try {
    const { name, email, password, phone, plan } = req.body;

    if (!name || !email || !password || !phone || !plan) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!plans[plan]) {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: "landlord"
    });

    const subscription = await createInitialSubscription(user._id, plan);

    user.subscription = subscription._id;
    await user.save();

    const token = generateToken(user);

    await sendEmail({
        to: user.email,
        subject: "Welcome to RendaHomes",
        html: welcomeEmail({
          name: user.name,
          planName: plans[plan].name,
          isFreePlan: plan === "normal"
        })
      });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      subscription: {
        ...subscription.toObject()
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.loginLandlord = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate("subscription");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    const planConfig = user.subscription ? plans[user.subscription.plan] : null;

    const usedListings = await Listing.countDocuments({
      landlord: user._id,
      isActive: true,
      availability: "available"
    });

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      subscription: user.subscription,
      usage: {
        used: usedListings,
        limit: planConfig?.listingLimit || 0,
        remaining: Math.max((planConfig?.listingLimit || 0) - usedListings, 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const subscription = req.user.subscription;
    const planConfig = subscription ? plans[subscription.plan] : null;

    const usedListings = await Listing.countDocuments({
      landlord: req.user._id,
      isActive: true,
      availability: "available"
    });

    res.json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role
      },
      subscription,
      usage: {
        used: usedListings,
        limit: planConfig?.listingLimit || 0,
        remaining: Math.max((planConfig?.listingLimit || 0) - usedListings, 0)
      }
    });
  } catch (error) {
    next(error);
  }
};


//User account

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: "Name, email, phone and password are required"
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists"
      });
    }

    const allowedRoles = ["user", "landlord"];
    const safeRole = allowedRoles.includes(role) ? role : "user";

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: safeRole
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        businessName: user.businessName,
        avatar: user.avatar
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create account"
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        businessName: user.businessName,
        avatar: user.avatar
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to login"
    });
  }
};

exports.me = async (req, res) => {
  return res.status(200).json({
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      businessName: req.user.businessName,
      avatar: req.user.avatar
    }
  });
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    // Always return same response to avoid email enumeration
    const genericResponse = {
      success: true,
      message: "If an account exists for that email, a reset link has been sent."
    };

    if (!user) {
      return res.json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 1000 * 60 * 30; // 30 minutes
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset Your RendaHomes Password",
      html: passwordResetEmail({
        name: user.name,
        resetUrl
      })
    });

    res.json(genericResponse);
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long"
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        message: "Reset link is invalid or has expired"
      });
    }

    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await user.save();

    res.json({
      success: true,
      message: "Password reset successful. You can now log in."
    });
  } catch (error) {
    next(error);
  }
};