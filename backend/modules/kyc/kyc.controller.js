const Kyc = require("./kyc.model");
const Subscription = require("../subscriptions/subscription.model");

const paidPlans = ["basic", "premium", "pro"];

// Landlord - get my KYC
const getMyKyc = async (req, res, next) => {
  try {
    const kyc = await Kyc.findOne({ landlord: req.user._id });

    res.json({
      success: true,
      kyc
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
      existingKyc.status = "pending";
      existingKyc.rejectionReason = "";
      existingKyc.reviewedBy = undefined;
      existingKyc.reviewedAt = undefined;

      await existingKyc.save();

      return res.json({
        success: true,
        message: "KYC updated and sent for review",
        kyc: existingKyc
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
      status: "pending"
    });

    res.status(201).json({
      success: true,
      message: "KYC submitted successfully",
      kyc
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
      kycs,
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
      kyc
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
    await kyc.populate("landlord", "name email phone businessName location avatar");

    res.json({
      success: true,
      message: `KYC ${status}`,
      kyc
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
