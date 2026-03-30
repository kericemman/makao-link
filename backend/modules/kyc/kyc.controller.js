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

    if (!documentFront || !selfiePhoto) {
      return res.status(400).json({
        success: false,
        message: "Document front and selfie photo are required"
      });
    }

    let existingKyc = await Kyc.findOne({ landlord: req.user._id });

    if (existingKyc) {
      existingKyc.idType = idType;
      existingKyc.idNumber = idNumber;
      existingKyc.fullName = fullName;
      existingKyc.documentFront = documentFront;
      existingKyc.documentBack = documentBack || existingKyc.documentBack;
      existingKyc.selfiePhoto = selfiePhoto;
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

module.exports = {
  getMyKyc,
  submitKyc
};