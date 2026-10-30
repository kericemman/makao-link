const Kyc = require("./kyc.model");
const Subscription = require("../subscriptions/subscription.model");
const { recordAdminActivity } = require("../admin/adminActivity.service");
const { queueStatusNotificationSafely } = require("../renda-assistant/notifications.service");
const cloudinary = require("../../config/cloudinary");
const {
  FILE_FIELDS,
  toLandlordKyc,
  createAdminKycView,
  assetMetadataFromFile
} = require("./kycFiles.service");

const paidPlans = ["basic", "premium", "pro"];

// Landlord - get my KYC
const getMyKyc = async (req, res, next) => {
  try {
    const kyc = await Kyc.findOne({ landlord: req.user._id });

    res.json({
      success: true,
      kyc: toLandlordKyc(kyc)
    });
  } catch (error) {
    next(error);
  }
};

// Landlord - submit or update KYC
const submitKyc = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user._id });

    const isPaid =
      subscription &&
      paidPlans.includes(subscription.plan) &&
      subscription.status === "active";

    if (!isPaid) {
      return res.status(403).json({
        success: false,
        message: "KYC is only required for paid landlords."
      });
    }

    const { idType, idNumber, fullName } = req.body;

    const documentFront = req.files?.documentFront?.[0]?.path;
    const documentBack = req.files?.documentBack?.[0]?.path || "";
    const selfiePhoto = req.files?.selfiePhoto?.[0]?.path;
    const proofOfOwnership = req.files?.proofOfOwnership?.[0]?.path || "";
    const documentAssets = Object.fromEntries(
      FILE_FIELDS.map((field) => [field, assetMetadataFromFile(req.files?.[field]?.[0])])
        .filter(([, asset]) => asset)
    );

    let existingKyc = await Kyc.findOne({ landlord: req.user._id });

    if ((!documentFront && !existingKyc?.documentFront) || (!selfiePhoto && !existingKyc?.selfiePhoto)) {
      return res.status(400).json({
        success: false,
        message: "Document front and selfie photo are required"
      });
    }

    if (existingKyc) {
      existingKyc.idType = idType;
      existingKyc.idNumber = idNumber;
      existingKyc.fullName = fullName;
      existingKyc.documentFront = documentFront || existingKyc.documentFront;
      existingKyc.documentBack = documentBack || existingKyc.documentBack;
      existingKyc.selfiePhoto = selfiePhoto || existingKyc.selfiePhoto;
      existingKyc.proofOfOwnership = proofOfOwnership || existingKyc.proofOfOwnership;
      existingKyc.documentAssets = {
        ...(existingKyc.documentAssets?.toObject?.() || existingKyc.documentAssets || {}),
        ...documentAssets
      };
      existingKyc.status = "pending";
      existingKyc.rejectionReason = "";
      existingKyc.reviewedBy = undefined;
      existingKyc.reviewedAt = undefined;

      await existingKyc.save();
      await recordAdminActivity({
        eventType: "kyc_submission",
        description: "Landlord verification resubmitted",
        details: `${existingKyc.fullName} sent updated documents`,
        path: "/admin/kyc",
        actor: req.user._id,
        actorName: req.user.name,
        entityType: "kyc",
        entityId: String(existingKyc._id),
        dedupeKey: `kyc_submission:${existingKyc._id}:${existingKyc.updatedAt.getTime()}`
      });

      return res.json({
        success: true,
        message: "KYC updated and sent for review",
        kyc: toLandlordKyc(existingKyc)
      });
    }

    const kyc = await Kyc.create({
      landlord: req.user._id,
      idType,
      idNumber,
      fullName,
      documentFront,
      documentBack,
      selfiePhoto,
      proofOfOwnership,
      documentAssets,
      status: "pending"
    });

    await recordAdminActivity({
      eventType: "kyc_submission",
      description: "Landlord verification submitted",
      details: `${kyc.fullName} submitted verification documents`,
      path: "/admin/kyc",
      actor: req.user._id,
      actorName: req.user.name,
      entityType: "kyc",
      entityId: String(kyc._id)
    });

    res.status(201).json({
      success: true,
      message: "KYC submitted successfully",
      kyc: toLandlordKyc(kyc)
    });
  } catch (error) {
    next(error);
  }
};

const getAdminKycs = async (req, res, next) => {
  try {
    const { status = "", page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const [kycs, total] = await Promise.all([
      Kyc.find(query)
        .populate("landlord", "name email phone businessName location avatar")
        .populate("reviewedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Kyc.countDocuments(query)
    ]);

    res.json({
      success: true,
      kycs: kycs.map((item) => createAdminKycView(item, cloudinary)),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAdminKycById = async (req, res, next) => {
  try {
    const kyc = await Kyc.findById(req.params.id)
      .populate("landlord", "name email phone businessName location avatar")
      .populate("reviewedBy", "name email");

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC record not found"
      });
    }

    res.json({
      success: true,
      kyc: createAdminKycView(kyc, cloudinary)
    });
  } catch (error) {
    next(error);
  }
};

const reviewKyc = async (req, res, next) => {
  try {
    const { status, rejectionReason = "" } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be approved or rejected"
      });
    }

    if (status === "rejected" && !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required"
      });
    }

    const kyc = await Kyc.findById(req.params.id);

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC record not found"
      });
    }

    kyc.status = status;
    kyc.rejectionReason = status === "rejected" ? rejectionReason.trim() : "";
    kyc.reviewedBy = req.user._id;
    kyc.reviewedAt = new Date();

    await kyc.save();
    await kyc.populate("landlord", "_id");
    await queueStatusNotificationSafely({ userId: kyc.landlord?._id, eventType: `kyc_${status}`, entityId: kyc._id, eventVersion: kyc.reviewedAt.getTime() });
    await recordAdminActivity({
      eventType: `kyc_${status}`,
      description: `Landlord KYC ${status}`,
      details: `${kyc.fullName} • ${status}`,
      path: "/admin/kyc",
      actor: req.user._id,
      actorName: req.user.name,
      readBy: [req.user._id],
      entityType: "kyc",
      entityId: String(kyc._id),
      dedupeKey: `kyc_${status}:${kyc._id}:${kyc.reviewedAt.getTime()}`
    });
    await kyc.populate("landlord", "name email phone businessName location avatar");

    res.json({
      success: true,
      message: `KYC ${status}`,
      kyc: createAdminKycView(kyc, cloudinary)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyKyc,
  submitKyc,
  getAdminKycs,
  getAdminKycById,
  reviewKyc
};
