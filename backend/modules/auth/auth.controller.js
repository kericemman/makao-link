const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../users/user.model");
const Listing = require("../listings/listings.model");
const sendEmail = require("../../utils/sendEmail");
const generateToken = require("../../utils/generateToken");
const {
  welcomeEmail,
  passwordResetEmail,
  emailVerificationOtpEmail
} = require("../../utils/emailTemplates");
const plans = require("../payments/plan.config");
const { createInitialSubscription } = require("../subscriptions/subscription.service");
const { syncWebsiteInquiriesToAppAlertsForUser } = require("../inquiries/inquiryBridge.service");
const verifySocialIdentity = require("./socialIdentity.service");
const { hasRole } = require("../authorization/authorization.service");
const { buildLegalAcceptance } = require("./legalAcceptance.service");
const { normalizeKenyanPhone, phoneUniquenessFilter } = require("../../utils/kenyanPhone");
const {
  clearSharedSessionCookie,
  getSharedSessionToken,
  setSharedSessionCookie
} = require("../../utils/sharedSession");

const buildAuthUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  roles: [...new Set([...(user.roles || []), user.role].filter(Boolean))],
  avatar: user.avatar,
  businessName: user.businessName,
  bio: user.bio,
  location: user.location,
  isEmailVerified: user.isEmailVerified,
  landlordOwner: user.landlordOwner || null,
  teamRole: user.teamRole || null,
  teamPermissions: user.teamPermissions || [],
  teamStatus: user.teamStatus || null,
  adminPermissions: user.adminPermissions || [],
  adminManagerStatus: user.adminManagerStatus || null
});

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(String(otp)).digest("hex");

const otpMatches = (enteredOtp, storedHash) => {
  const enteredHash = Buffer.from(hashOtp(enteredOtp), "hex");
  const savedHash = Buffer.from(storedHash || "", "hex");

  return enteredHash.length === savedHash.length && crypto.timingSafeEqual(enteredHash, savedHash);
};

const generateEmailOtp = () => String(crypto.randomInt(100000, 1000000));

const setEmailOtp = (user) => {
  const otp = generateEmailOtp();
  user.emailOtpHash = hashOtp(otp);
  user.emailOtpExpires = new Date(Date.now() + 1000 * 60 * 10);
  user.emailOtpAttempts = 0;
  return otp;
};

const sendEmailOtp = async (user, otp) => {
  await sendEmail({
    to: user.email,
    subject: "Verify your RendaHomes email",
    html: emailVerificationOtpEmail({
      name: user.name,
      otp
    })
  });
};

exports.registerLandlord = async (req, res, next) => {
  try {
    const { name, email, password, phone, plan, agentCode, acceptedLegalPolicies } = req.body;
    const normalizedEmail = String(email || "").toLowerCase().trim();
    const legalAcceptance = buildLegalAcceptance({ acceptedLegalPolicies });
    let normalizedPhone;
    try {
      normalizedPhone = normalizeKenyanPhone(phone);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    if (!name || !email || !password || !phone || !plan) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    if (!plans[plan]) {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    const [existingUser, existingPhone] = await Promise.all([
      User.findOne({ email: normalizedEmail }),
      User.exists(phoneUniquenessFilter(normalizedPhone))
    ]);

    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }
    if (existingPhone) return res.status(409).json({ message: "This phone number is already linked to an account." });

    const agent = agentCode
      ? await User.findOne({
          role: "agent",
          agentCode: String(agentCode).toUpperCase(),
          agentStatus: "active"
        })
      : null;

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      phone: normalizedPhone,
      role: "landlord",
      isEmailVerified: false,
      legalAcceptance,
      onboardedByAgent: agent?._id || null,
      onboardingSource: agent ? "agent" : "direct",
      agentCodeUsed: agent?.agentCode || ""
    });

    const subscription = await createInitialSubscription(user._id, plan);

    user.subscription = subscription._id;
    const otp = setEmailOtp(user);
    await user.save();
    await sendEmailOtp(user, otp);

    res.status(201).json({
      success: true,
      requiresVerification: true,
      email: user.email,
      message: "We sent a verification code to your email. Verify it to continue."
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account with this email or phone number already exists." });
    }
    next(error);
  }
};

exports.loginLandlord = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (hasRole(user, "agent") && user.agentStatus === "suspended") {
      return res.status(403).json({ message: "Your agent account is suspended" });
    }

    if (hasRole(user, "landlord_staff") && user.teamStatus !== "active") {
      return res.status(403).json({ message: "Your company workspace access is suspended." });
    }

    if (user.isEmailVerified === false) {
      const otp = setEmailOtp(user);
      await user.save();
      await sendEmailOtp(user, otp);

      return res.status(403).json({
        requiresVerification: true,
        code: "EMAIL_NOT_VERIFIED",
        email: user.email,
        message: "Verify your email before signing in."
      });
    }

    const workspaceOwner = user.role === "landlord_staff"
      ? await User.findOne({ _id: user.landlordOwner, role: "landlord" }).populate("subscription")
      : await User.findById(user._id).populate("subscription");
    if (!workspaceOwner) return res.status(403).json({ message: "The company workspace is unavailable." });

    const token = generateToken(user);
    setSharedSessionCookie(res, user, token);
    const subscription = workspaceOwner.subscription;
    const planConfig = subscription ? plans[subscription.plan] : null;

    const usedListings = await Listing.countDocuments({
      landlord: workspaceOwner._id,
      isActive: true,
      availability: "available"
    });

    res.json({
      success: true,
      token,
      user: buildAuthUser(user),
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

exports.getMe = async (req, res, next) => {
  try {
    const workspaceOwner = req.user.role === "landlord_staff"
      ? await User.findOne({ _id: req.user.landlordOwner, role: "landlord" }).populate("subscription")
      : await User.findById(req.user._id).populate("subscription");
    if (!workspaceOwner) return res.status(403).json({ message: "The company workspace is unavailable." });
    const subscription = workspaceOwner.subscription;
    const planConfig = subscription ? plans[subscription.plan] : null;

    const usedListings = await Listing.countDocuments({
      landlord: workspaceOwner._id,
      isActive: true,
      availability: "available"
    });

    res.json({
      success: true,
      user: buildAuthUser(req.user),
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

exports.sharedSession = async (req, res) => {
  const token = getSharedSessionToken(req);
  if (!token) return res.json({ authenticated: false, user: null });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("name email role roles");
    if (!user || ![...new Set([...(user.roles || []), user.role])].some((role) => ["user", "tenant", "agent"].includes(role))) {
      clearSharedSessionCookie(res);
      return res.json({ authenticated: false, user: null });
    }

    return res.json({
      authenticated: true,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, roles: [...new Set([...(user.roles || []), user.role])] }
    });
  } catch {
    clearSharedSessionCookie(res);
    return res.json({ authenticated: false, user: null });
  }
};

exports.logout = async (req, res) => {
  clearSharedSessionCookie(res);
  return res.json({ success: true });
};

exports.syncSharedSession = async (req, res) => {
  const token = generateToken(req.user);
  setSharedSessionCookie(res, req.user, token);
  return res.json({ success: true });
};


//User account

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const normalizedEmail = String(email || "").toLowerCase().trim();
    let normalizedPhone;
    try {
      normalizedPhone = normalizeKenyanPhone(phone);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: "Name, email, phone and password are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long"
      });
    }

    const [existingUser, existingPhone] = await Promise.all([
      User.findOne({ email: normalizedEmail }),
      User.exists(phoneUniquenessFilter(normalizedPhone))
    ]);

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists"
      });
    }
    if (existingPhone) {
      return res.status(409).json({ message: "This phone number is already linked to an account." });
    }

    const allowedRoles = ["user", "landlord"];
    const safeRole = allowedRoles.includes(role) ? role : "user";

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone: normalizedPhone,
      password,
      role: safeRole,
      isEmailVerified: false
    });

    await syncWebsiteInquiriesToAppAlertsForUser(user);

    const otp = setEmailOtp(user);
    await user.save();
    await sendEmailOtp(user, otp);

    return res.status(201).json({
      success: true,
      requiresVerification: true,
      email: user.email,
      message: "We sent a verification code to your email."
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account with this email or phone number already exists." });
    }
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

    const user = await User.findOne({ email: email.toLowerCase().trim() });

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

    if (user.isEmailVerified === false) {
      const otp = setEmailOtp(user);
      await user.save();
      await sendEmailOtp(user, otp);

      return res.status(403).json({
        requiresVerification: true,
        code: "EMAIL_NOT_VERIFIED",
        email: user.email,
        message: "Verify your email before signing in."
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      token,
      user: buildAuthUser(user)
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to login"
    });
  }
};

exports.me = async (req, res) => {
  return res.status(200).json({
    user: buildAuthUser(req.user)
  });
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

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

    const mainClientUrl = process.env.CLIENT_URL || "https://rendahomes.com";
    const configuredPortalUrl =
      user.role === "landlord" || user.role === "landlord_staff"
        ? process.env.LANDLORD_CLIENT_URL || mainClientUrl
        : user.role === "admin" || user.role === "app_manager"
          ? process.env.ADMIN_CLIENT_URL || mainClientUrl
          : process.env.USER_CLIENT_URL || mainClientUrl;
    const portalUrl = configuredPortalUrl.replace(/\/+$/, "");
    const resetUrl = `${portalUrl}/reset-password/${rawToken}`;

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

    if (!password || password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long"
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
    user.isEmailVerified = true;

    await user.save();

    res.json({
      success: true,
      message: "Password reset successful. You can now log in."
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and verification code are required"
      });
    }

    if (!/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({ message: "Enter the 6-digit verification code." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select("+emailOtpHash +emailOtpExpires +emailOtpAttempts");

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    if (
      !user.emailOtpHash ||
      !user.emailOtpExpires ||
      user.emailOtpExpires < new Date()
    ) {
      return res.status(400).json({
        message: "Verification code has expired. Please request a new one."
      });
    }

    if (user.emailOtpAttempts >= 5) {
      return res.status(429).json({ message: "Too many incorrect codes. Request a new verification code." });
    }

    if (!otpMatches(otp, user.emailOtpHash)) {
      const attempt = await User.updateOne(
        { _id: user._id, emailOtpHash: user.emailOtpHash, emailOtpAttempts: { $lt: 5 } },
        { $inc: { emailOtpAttempts: 1 } }
      );
      if (!attempt.modifiedCount) {
        return res.status(429).json({ message: "Too many incorrect codes. Request a new verification code." });
      }
      return res.status(400).json({
        message: "Invalid verification code"
      });
    }

    user.isEmailVerified = true;
    user.emailOtpHash = null;
    user.emailOtpExpires = null;
    user.emailOtpAttempts = 0;
    await user.save();

    const token = generateToken(user);
    setSharedSessionCookie(res, user, token);

    let subscription = null;
    if (user.role === "landlord") {
      try {
        const verifiedUser = await User.findById(user._id).populate("subscription");
        subscription = verifiedUser?.subscription || null;
        if (subscription) {
          await sendEmail({
            to: user.email,
            subject: "Welcome to RendaHomes",
            html: welcomeEmail({
              name: user.name,
              planName: plans[subscription.plan]?.name || "Free",
              isFreePlan: subscription.plan === "normal"
            })
          });
        }
      } catch (error) {
        console.error("Verified landlord welcome email failed:", error.message);
      }
    }

    return res.json({
      success: true,
      token,
      user: buildAuthUser(user),
      ...(subscription ? { subscription } : {})
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to verify email"
    });
  }
};

exports.resendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.json({
        success: true,
        message: "If the account exists and is not verified, a new verification code has been sent."
      });
    }

    if (user.isEmailVerified) {
      return res.json({
        success: true,
        message: "Email is already verified."
      });
    }

    const otp = setEmailOtp(user);
    await user.save();
    await sendEmailOtp(user, otp);

    return res.json({
      success: true,
      message: "A new verification code has been sent."
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to resend verification code"
    });
  }
};

// Social logins

exports.socialLogin = async (req, res) => {
  try {
    const { provider, providerId: requestedProviderId, idToken, identityToken, credential, phone } = req.body;
    const allowedProviders = ["google"];

    if (!provider || !allowedProviders.includes(provider)) {
      return res.status(400).json({
        message: "A supported provider is required"
      });
    }

    const identity = await verifySocialIdentity({
      provider,
      idToken: idToken || identityToken || credential
    });
    if (requestedProviderId && String(requestedProviderId) !== identity.providerId) {
      return res.status(401).json({ message: "Provider identity did not match the verified token" });
    }

    const { providerId, name, email, avatar } = identity;
    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      let normalizedPhone;
      try {
        normalizedPhone = normalizeKenyanPhone(phone);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
      if (await User.exists(phoneUniquenessFilter(normalizedPhone))) {
        return res.status(409).json({ message: "This phone number is already linked to an account." });
      }

      user = await User.create({
        name: name || "RendaHomes User",
        email: email.toLowerCase().trim(),
        phone: normalizedPhone,
        password: `${provider}-${providerId}-${Date.now()}`,
        role: "user",
        avatar: avatar || "",
        socialProvider: provider,
        socialProviderId: String(providerId),
        isEmailVerified: false
      });

      const otp = setEmailOtp(user);
      await user.save();
      await sendEmailOtp(user, otp);

      return res.status(201).json({
        success: true,
        requiresVerification: true,
        email: user.email,
        message: "We sent a verification code to your email."
      });
    }

    const fullUser = await User.findById(user._id).select("+socialProviderId");

    if (!fullUser.isEmailVerified) {
      if (!fullUser.phone) {
        let normalizedPhone;
        try {
          normalizedPhone = normalizeKenyanPhone(phone);
        } catch (error) {
          return res.status(400).json({ message: error.message });
        }
        if (await User.exists({ ...phoneUniquenessFilter(normalizedPhone), _id: { $ne: fullUser._id } })) {
          return res.status(409).json({ message: "This phone number is already linked to an account." });
        }
        fullUser.phone = normalizedPhone;
      }
      const otp = setEmailOtp(fullUser);
      await fullUser.save();
      await sendEmailOtp(fullUser, otp);

      return res.status(403).json({
        requiresVerification: true,
        code: "EMAIL_NOT_VERIFIED",
        email: fullUser.email,
        message: "Verify your email before signing in."
      });
    }

    if (!fullUser.socialProvider || !fullUser.socialProviderId) {
      return res.status(409).json({
        message: "This email already uses password login. Please sign in with your password."
      });
    }

    if (fullUser.socialProvider !== provider || fullUser.socialProviderId !== String(providerId)) {
      return res.status(401).json({
        message: "Invalid social login"
      });
    }

    const otp = setEmailOtp(fullUser);
    await fullUser.save();
    await sendEmailOtp(fullUser, otp);

    return res.status(202).json({
      success: true,
      requiresVerification: true,
      email: fullUser.email,
      message: "We sent a verification code to your email."
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "This phone number is already linked to an account." });
    }
    if (error.statusCode && error.statusCode < 500) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    if (error.statusCode === 503) {
      return res.status(503).json({ message: error.message });
    }
    return res.status(500).json({
      message: "Social login failed"
    });
  }
};
