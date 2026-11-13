const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../users/user.model");
const sendEmail = require("../../utils/sendEmail");
const { adminManagerInvitationEmail } = require("../../utils/emailTemplates");
const { recordAuthorizationChange } = require("../authorization/audit.service");
const { effectiveRoles } = require("../authorization/authorization.service");
const { ADMIN_PERMISSION_CATALOG, ADMIN_PERMISSION_KEYS } = require("./adminPermissions");

const normalizePermissions = (value) => {
  if (!Array.isArray(value) || value.some((permission) => !ADMIN_PERMISSION_KEYS.includes(permission))) return null;
  return [...new Set(value)];
};

const serializeManager = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  status: user.adminManagerStatus,
  permissions: user.adminPermissions || [],
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const makeSetupToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  return {
    rawToken,
    tokenHash: crypto.createHash("sha256").update(rawToken).digest("hex"),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000)
  };
};

const setupUrlFor = (rawToken) => {
  const adminUrl = (process.env.ADMIN_CLIENT_URL || "https://app.rendahomes.com").replace(/\/+$/, "");
  return `${adminUrl}/reset-password/${rawToken}`;
};

const sendManagerEmail = async ({ user, permissions, setupUrl = "" }) => {
  const loginUrl = `${(process.env.ADMIN_CLIENT_URL || "https://app.rendahomes.com").replace(/\/+$/, "")}/login`;
  const result = await sendEmail({
    to: user.email,
    subject: "RendaHomes admin manager access",
    html: adminManagerInvitationEmail({ name: user.name, setupUrl, loginUrl, permissions })
  });
  if (result?.error) throw result.error;
};

exports.getAdminManagers = async (_req, res, next) => {
  try {
    const managers = await User.find({ adminManagerStatus: { $in: ["active", "revoked"] } })
      .select("name email phone adminPermissions adminManagerStatus createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ success: true, managers: managers.map(serializeManager), permissions: ADMIN_PERMISSION_CATALOG });
  } catch (error) { next(error); }
};

exports.createAdminManager = async (req, res, next) => {
  const name = String(req.body?.name || "").trim().slice(0, 120);
  const email = String(req.body?.email || "").trim().toLowerCase();
  const phone = String(req.body?.phone || "").trim().slice(0, 32);
  const permissions = normalizePermissions(req.body?.permissions);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ success: false, message: "Enter a valid manager name and email." });
  }
  if (!permissions || permissions.length === 0) {
    return res.status(400).json({ success: false, message: "Assign at least one valid admin permission." });
  }

  let session;
  let manager;
  let setupUrl = "";
  let isNewAccount = false;
  try {
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      let user = await User.findOne({ email }).session(session);
      if (user && effectiveRoles(user).includes("admin")) {
        throw Object.assign(new Error("A super admin account cannot be converted into an admin manager."), { status: 409 });
      }
      if (user?.adminManagerStatus === "active") {
        throw Object.assign(new Error("This account is already an active admin manager."), { status: 409 });
      }
      const wasRevoked = user?.adminManagerStatus === "revoked";
      const oldPermissions = user?.adminPermissions || [];
      if (!user) {
        isNewAccount = true;
        const token = makeSetupToken();
        user = new User({
          name,
          email,
          phone,
          password: crypto.randomBytes(32).toString("base64url"),
          role: "admin_manager",
          roles: ["admin_manager"],
          isEmailVerified: false,
          adminManagerStatus: "active",
          adminPermissions: permissions,
          passwordResetToken: token.tokenHash,
          passwordResetExpires: token.expiresAt
        });
        setupUrl = setupUrlFor(token.rawToken);
      } else {
        user.name = name;
        if (phone) user.phone = phone;
        user.roles = [...new Set([...(user.roles || []), user.role, "admin_manager"].filter(Boolean))];
        user.adminManagerStatus = "active";
        user.adminPermissions = permissions;
      }
      await user.save({ session });
      await recordAuthorizationChange(req, {
        action: wasRevoked ? "admin_manager.reactivated" : "admin_manager.created",
        resourceType: "admin_manager",
        resourceId: String(user._id),
        changes: { oldPermissions, newPermissions: permissions, reactivated: wasRevoked },
        session
      });
      manager = user;
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "An account with this email already exists." });
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    return next(error);
  } finally {
    if (session) await session.endSession();
  }

  let inviteSent = false;
  try {
    await sendManagerEmail({ user: manager, permissions, setupUrl });
    inviteSent = true;
  } catch {
    inviteSent = false;
  }
  res.status(201).json({
    success: true,
    manager: serializeManager(manager),
    inviteSent,
    message: inviteSent
      ? isNewAccount ? "Admin manager created. A secure password setup link has been emailed." : "Admin manager access granted. The account holder has been notified."
      : "Admin manager access was saved, but the email could not be sent. Use Resend invitation after checking email service configuration."
  });
};

exports.updateAdminManagerPermissions = async (req, res, next) => {
  const permissions = normalizePermissions(req.body?.permissions);
  if (!permissions || permissions.length === 0) return res.status(400).json({ success: false, message: "Assign at least one valid admin permission." });
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid admin manager ID." });
  try {
    const session = await mongoose.startSession();
    let manager;
    try {
      await session.withTransaction(async () => {
        manager = await User.findOne({ _id: req.params.id, adminManagerStatus: "active" }).session(session);
        if (!manager || !effectiveRoles(manager).includes("admin_manager")) {
          throw Object.assign(new Error("Active admin manager not found."), { status: 404 });
        }
        const previousPermissions = manager.adminPermissions || [];
        manager.adminPermissions = permissions;
        await manager.save({ session });
        await recordAuthorizationChange(req, {
          action: "admin_manager.permissions_updated",
          resourceType: "admin_manager",
          resourceId: String(manager._id),
          changes: { oldPermissions: previousPermissions, newPermissions: permissions },
          session
        });
      });
    } finally { await session.endSession(); }
    res.json({ success: true, manager: serializeManager(manager) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
};

exports.revokeAdminManager = async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid admin manager ID." });
  if (String(req.params.id) === String(req.user._id)) return res.status(400).json({ success: false, message: "You cannot revoke your own super admin access." });
  try {
    const session = await mongoose.startSession();
    let manager;
    try {
      await session.withTransaction(async () => {
        manager = await User.findOne({ _id: req.params.id, adminManagerStatus: "active" }).session(session);
        if (!manager || !effectiveRoles(manager).includes("admin_manager")) {
          throw Object.assign(new Error("Active admin manager not found."), { status: 404 });
        }
        const previousPermissions = manager.adminPermissions || [];
        manager.roles = (manager.roles || []).filter((role) => role !== "admin_manager");
        if (manager.role === "admin_manager") manager.role = "user";
        manager.adminPermissions = [];
        manager.adminManagerStatus = "revoked";
        await manager.save({ session });
        await recordAuthorizationChange(req, {
          action: "admin_manager.revoked",
          resourceType: "admin_manager",
          resourceId: String(manager._id),
          changes: { oldPermissions: previousPermissions, newPermissions: [], status: "revoked" },
          session
        });
      });
    } finally { await session.endSession(); }
    res.json({ success: true, manager: serializeManager(manager), message: "Admin manager access revoked." });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
};

exports.resendAdminManagerInvitation = async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid admin manager ID." });
  try {
    const user = await User.findOne({ _id: req.params.id, adminManagerStatus: "active" });
    if (!user || !effectiveRoles(user).includes("admin_manager")) return res.status(404).json({ success: false, message: "Active admin manager not found." });
    const token = makeSetupToken();
    user.passwordResetToken = token.tokenHash;
    user.passwordResetExpires = token.expiresAt;
    await user.save();
    await sendManagerEmail({ user, permissions: user.adminPermissions || [], setupUrl: setupUrlFor(token.rawToken) });
    await recordAuthorizationChange(req, {
      action: "admin_manager.invitation_resent",
      resourceType: "admin_manager",
      resourceId: String(user._id),
      changes: { setupLinkExpiresAt: token.expiresAt }
    });
    res.json({ success: true, message: "A new single-use setup link has been emailed." });
  } catch (error) {
    next(error);
  }
};

exports.normalizePermissions = normalizePermissions;
