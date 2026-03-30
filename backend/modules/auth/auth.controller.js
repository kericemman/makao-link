const User = require("../users/user.model");
const Listing = require("../listings/listings.model");
const generateToken = require("../../utils/generateToken");
const sendEmail = require("../../utils/sendEmail");
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
      subject: "Welcome to Makao",
      html: `
        <h2>Welcome to Makao</h2>
        <p>Hello ${user.name}, your landlord account has been created successfully.</p>
        <p>Selected plan: <strong>${plans[plan].name}</strong></p>
        ${
          plan === "normal"
            ? "<p>You can now log in and list your first property immediately.</p>"
            : "<p>Your account is ready. Complete payment to activate your plan and begin listing properties.</p>"
        }
      `
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