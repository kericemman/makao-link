const crypto = require("crypto");
const paystack = require("../../config/paystack");
const User = require("../users/user.model");
const Payment = require("./payment.model");
const Subscription = require("../subscriptions/subscription.model");
const Listing = require("../listings/listings.model");
const PartnerApplication = require("../services/partnerApplication.model");
const plans = require("./plan.config");
const sendEmail = require("../../utils/sendEmail");
const {
  restoreListingsAfterRenewal,
  markExpiredAndUnlist
} = require("../subscriptions/subscription.service");
const partnerApplicationModel = require("../services/partnerApplication.model");

exports.initializeSubscriptionPayment = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("subscription");

    if (!user || !user.subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    const selectedPlan = plans[user.subscription.plan];

    if (!selectedPlan) {
      return res.status(400).json({ message: "Invalid subscription plan" });
    }

    if (selectedPlan.price <= 0) {
      return res.status(400).json({ message: "This plan does not require payment" });
    }

    console.log("Initializing payment with:", {
      email: user.email,
      plan: user.subscription.plan,
      amount: selectedPlan.price * 100,
      callback_url: `${process.env.CALLBACK_URL}/payment/callback`
    });

    const response = await paystack.post("/transaction/initialize", {
      email: user.email,
      amount: selectedPlan.price * 100,
      callback_url: `${process.env.CALLBACK_URL}/payment/callback`,
      metadata: {
        userId: user._id.toString(),
        plan: user.subscription.plan
      }
    });

    res.json({
      success: true,
      authorization_url: response.data.data.authorization_url
    });
  } catch (error) {
    console.error(
      "Paystack initialize error:",
      error.response?.data || error.message
    );
    next(error);
  }
};

exports.getMySubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("subscription");

    if (!user || !user.subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    const subscription = user.subscription;
    const planConfig = plans[subscription.plan];

    const usedListings = await Listing.countDocuments({
      landlord: req.user._id,
      isActive: true,
      availability: "available"
    });

    res.json({
      success: true,
      subscription,
      usage: {
        used: usedListings,
        limit: planConfig?.listingLimit || 0,
        remaining: Math.max((planConfig?.listingLimit || 0) - usedListings, 0)
      },
      planDetails: planConfig
    });
  } catch (error) {
    next(error);
  }
};

exports.paystackWebhook = async (req, res, next) => {
  try {
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).send("Invalid signature");
    }

    const event = req.body;

    switch (event.event) {
      case "charge.success":
        await handleChargeSuccess(event.data);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailure(event.data);
        break;

      default:
        break;
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

const handleChargeSuccess = async (data) => {
  const existingPayment = await Payment.findOne({ reference: data.reference });
  if (existingPayment) return;

  const userId = data.metadata?.userId;
  const plan = data.metadata?.plan;

  if (!userId || !plan) return;

  await Payment.create({
    user: userId,
    reference: data.reference,
    amount: data.amount / 100,
    currency: data.currency || "KES",
    plan,
    status: "success",
    paidAt: new Date()
  });

  const subscription = await Subscription.findOne({ user: userId });
  if (!subscription) return;

  const parnerApplicationId = data.metadata?.applicationId;

  if (parnerApplicationId) {
    const application = await PartnerApplication.findById(parnerApplicationId);
    if (application) {
      application.paymentStatus = "success";
      await application.save();
    }
  }


  const sendEmailPromise = sendEmail({
    to: partnerApplicationModel.email,
    subject: "Payment Successful",
    html: `
      <h2>Payment Successful</h2>
      <p>Hello ${partnerApplicationModel.name}, your payment has been processed successfully. Your application is under review, upon approval your company will be activated.</p>
    `
  });

  const now = new Date();
  const nextBilling = new Date();
  nextBilling.setMonth(nextBilling.getMonth() + 1);

  subscription.plan = plan;
  subscription.status = "active";
  subscription.currentPeriodStart = now;
  subscription.currentPeriodEnd = nextBilling;
  subscription.gracePeriodEnd = null;
  subscription.lastPaymentDate = now;
  subscription.paystackCustomerCode = data.customer?.customer_code || subscription.paystackCustomerCode;
  subscription.paystackSubscriptionCode =
    data.subscription?.subscription_code || subscription.paystackSubscriptionCode;
  subscription.paystackEmailToken =
    data.subscription?.email_token || subscription.paystackEmailToken;

  await subscription.save();

  await restoreListingsAfterRenewal(userId, plan);

  const user = await User.findById(userId);

  if (user) {
    await sendEmail({
      to: user.email,
      subject: "Subscription Activated",
      html: `
        <h2>Subscription Activated</h2>
        <p>Hello ${user.name}, your ${plan.toUpperCase()} plan is now active.</p>
        <p>Your billing period ends on <strong>${nextBilling.toDateString()}</strong>.</p>
      `
    });
  }
};

const handlePaymentFailure = async (data) => {
  const subscriptionCode = data.subscription?.subscription_code;
  if (!subscriptionCode) return;

  const subscription = await Subscription.findOne({
    paystackSubscriptionCode: subscriptionCode
  }).populate("user");

  if (!subscription) return;

  const graceEnd = new Date();
  graceEnd.setDate(graceEnd.getDate() + 7);

  subscription.status = "grace";
  subscription.gracePeriodEnd = graceEnd;
  await subscription.save();

  if (subscription.user) {
    await sendEmail({
      to: subscription.user.email,
      subject: "Payment Failed - Grace Period Started",
      html: `
        <h2>Payment Failed</h2>
        <p>Hello ${subscription.user.name}, we could not process your subscription payment.</p>
        <p>You have a grace period until <strong>${graceEnd.toDateString()}</strong>.</p>
        <p>Your current listings remain visible for now, but you cannot add new ones until you renew.</p>
      `
    });
  }
};

exports.runExpiryCheck = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({
      status: "grace",
      gracePeriodEnd: { $lt: new Date() }
    });

    for (const subscription of subscriptions) {
      await markExpiredAndUnlist(subscription);

      const user = await User.findById(subscription.user);

      if (user) {
        await sendEmail({
          to: user.email,
          subject: "Subscription Expired - Listings Unlisted",
          html: `
            <h2>Subscription Expired</h2>
            <p>Hello ${user.name}, your subscription grace period has ended.</p>
            <p>Your public listings have been temporarily removed until you renew your plan.</p>
          `
        });
      }
    }

    res.json({
      success: true,
      message: "Expiry check completed"
    });
  } catch (error) {
    next(error);
  }
};


exports.changeSubscriptionPlan = async (req, res, next) => {
  try {
    const { plan } = req.body;

    if (!plan || !plans[plan]) {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    const user = await User.findById(req.user._id).populate("subscription");

    if (!user || !user.subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    const currentPlan = user.subscription.plan;

    const planOrder = ["normal", "basic", "premium", "pro"];

    const currentIndex = planOrder.indexOf(currentPlan);
    const nextIndex = planOrder.indexOf(plan);

    if (currentIndex === -1 || nextIndex === -1) {
      return res.status(400).json({ message: "Invalid subscription plan flow" });
    }

    if (plan === currentPlan) {
      return res.status(400).json({ message: "You are already on this plan" });
    }

    if (nextIndex < currentIndex) {
      return res.status(400).json({ message: "Downgrades are not supported yet" });
    }

    user.subscription.plan = plan;

    if (plan === "normal") {
      user.subscription.status = "free";
    } else {
      user.subscription.status = "pending_payment";
    }

    await user.subscription.save();

    res.json({
      success: true,
      message: `Plan updated to ${plan.toUpperCase()}. Complete payment to activate it.`,
      subscription: user.subscription
    });
  } catch (error) {
    next(error);
  }
};



